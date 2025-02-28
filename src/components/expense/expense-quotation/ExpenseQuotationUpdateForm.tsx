import React from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import {
  ArticleExpenseQuotationEntry,
  EXPENSE_QUOTATION_STATUS,
  ExpenseQuotation,
  ExpenseQuotationUploadedFile,
  UpdateExpenseQuotationDto
} from '@/types';
import { Spinner } from '@/components/common';
import { Card, CardContent } from '@/components/ui/card';
import useTax from '@/hooks/content/useTax';
import useFirmChoice from '@/hooks/content/useFirmChoice';
import useBankAccount from '@/hooks/content/useBankAccount';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getErrorMessage } from '@/utils/errors';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { useDebounce } from '@/hooks/other/useDebounce';
import { useExpenseQuotationManager } from './hooks/useExpenseQuotationManager';
import { useExpenseQuotationArticleManager } from './hooks/useExpenseQuotationArticleManager';
import { useExpenseQuotationControlManager } from './hooks/useExpenseQuotationControlManager';
import _ from 'lodash';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExpenseQuotationExtraOptions } from './form/ExpenseQuotationExtraOptions';
import { ExpenseQuotationGeneralConditions } from './form/ExpenseQuotationGeneralConditions';
import useDefaultCondition from '@/hooks/content/useDefaultCondition';
import { ACTIVITY_TYPE } from '@/types/enums/activity-type';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { useRouter } from 'next/router';
import { useBreadcrumb } from '@/components/layout/BreadcrumbContext';
import useInitializedState from '@/hooks/use-initialized-state';
import { ExpenseQuotationGeneralInformation } from './form/ExpenseQuotationGeneralInformation';
import { ExpenseQuotationArticleManagement } from './form/ExpenseQuotationArticleManagement';
import { ExpenseQuotationFinancialInformation } from './form/ExpenseQuotationFinancialInformation';
import { ExpenseQuotationControlSection } from './form/ExpenseQuotationControlSection';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';

interface ExpenseQuotationFormProps {
  className?: string;
  expenseQuotationId: string;
}

export const ExpenseQuotationUpdateForm = ({
  className,
  expenseQuotationId
}: ExpenseQuotationFormProps) => {
  //next-router
  const router = useRouter();

  //translations
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');

  // Stores
  const expenseQuotationManager = useExpenseQuotationManager();
  const controlManager = useExpenseQuotationControlManager();
  const articleManager = useExpenseQuotationArticleManager();

  //Fetch options
  const {
    isPending: isFetchPending,
    data: expenseQuotationResp,
    refetch: refetchExpenseQuotation
  } = useQuery({
    queryKey: ['quotation', expenseQuotationId],
    queryFn: () => api.expenseQuotation.findOne(parseInt(expenseQuotationId))
  });
  const expenseQuotation = React.useMemo(() => {
    return expenseQuotationResp || null;
  }, [expenseQuotationResp]);

  //set page title in the breadcrumb
  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    if (expenseQuotation?.sequential)
      setRoutes([
        { title: tCommon('menu.buying'), href: '/expense' },
        { title: tInvoicing('quotation.plural'), href: '/expense/expense-quotations' },
        { title: tInvoicing('quotation.singular') + ' N° ' + expenseQuotation?.sequential }
      ]);
  }, [router.locale, expenseQuotation?.sequential]);

  //recognize if the form can be edited
  const editMode = React.useMemo(() => {
    const editModeStatuses = [EXPENSE_QUOTATION_STATUS.Validated, EXPENSE_QUOTATION_STATUS.Draft];
    return expenseQuotation?.status && editModeStatuses.includes(expenseQuotation?.status);
  }, [expenseQuotation]);

  // Fetch options
  const { firms, isFetchFirmsPending } = useFirmChoice([
    'interlocutorsToFirm',
    'interlocutorsToFirm.interlocutor',
    // 'invoicingAddress',
    // 'deliveryAddress',
    'currency'
  ]);
  const { taxes, isFetchTaxesPending } = useTax();
  const { currencies, isFetchCurrenciesPending } = useCurrency();
  const { bankAccounts, isFetchBankAccountsPending } = useBankAccount();
  const { defaultCondition, isFetchDefaultConditionPending } = useDefaultCondition(
    ACTIVITY_TYPE.EXPENSE,
    DOCUMENT_TYPE.EXPENSE_QUOTATION
  );
  const fetching =
    isFetchPending ||
    isFetchFirmsPending ||
    isFetchTaxesPending ||
    isFetchCurrenciesPending ||
    isFetchBankAccountsPending ||
    isFetchDefaultConditionPending ||
    !commonReady ||
    !invoicingReady;
  const { value: debounceFetching } = useDebounce<boolean>(fetching, 500);

  const digitAfterComma = React.useMemo(() => {
    return expenseQuotationManager.currency?.digitAfterComma || 3;
  }, [expenseQuotationManager.currency]);

  // perform calculations when the financialy Information are changed
  React.useEffect(() => {
    const zero = dinero({ amount: 0, precision: digitAfterComma });
    // Calculate subTotal
    const subTotal = articleManager.getArticles()?.reduce((acc, article) => {
      return acc.add(
        dinero({
          amount: createDineroAmountFromFloatWithDynamicCurrency(
            article?.subTotal || 0,
            digitAfterComma
          ),
          precision: digitAfterComma
        })
      );
    }, zero);
    expenseQuotationManager.set('subTotal', subTotal.toUnit());
    // Calculate total
    const total = articleManager.getArticles()?.reduce(
      (acc, article) =>
        acc.add(
          dinero({
            amount: createDineroAmountFromFloatWithDynamicCurrency(
              article?.total || 0,
              digitAfterComma
            ),
            precision: digitAfterComma
          })
        ),
      zero
    );
    let finalTotal = total;
    // Apply discount
    if (expenseQuotationManager.discountType === DISCOUNT_TYPE.PERCENTAGE) {
      const discountAmount = total.multiply(expenseQuotationManager.discount / 100);
      finalTotal = total.subtract(discountAmount);
    } else {
      const discountAmount = dinero({
        amount: createDineroAmountFromFloatWithDynamicCurrency(
          expenseQuotationManager?.discount || 0,
          digitAfterComma
        ),
        precision: digitAfterComma
      });
      finalTotal = total.subtract(discountAmount);
    }
    expenseQuotationManager.set('total', finalTotal.toUnit());
  }, [
    articleManager.articles,
    expenseQuotationManager.discount,
    expenseQuotationManager.discountType
  ]);

  //full quotation setter across multiple stores
  const setExpenseQuotationData = (
    data: Partial<ExpenseQuotation & { files: ExpenseQuotationUploadedFile[] }>
  ) => {
    //quotation infos
    data && expenseQuotationManager.setExpenseQuotation(data, firms, bankAccounts);

    //quotation meta infos
    controlManager.setControls({
      isBankAccountDetailsHidden: !data?.expenseQuotationMetaData?.hasBankingDetails,
      // isExpenseInvoiceAddressHidden: !data?.expenseQuotationMetaData?.showExpenseInvoiceAddress,
      // isDeliveryAddressHidden: !data?.expenseQuotationMetaData?.showDeliveryAddress,
      isArticleDescriptionHidden: !data?.expenseQuotationMetaData?.showArticleDescription,
      isGeneralConditionsHidden: !data?.expenseQuotationMetaData?.hasGeneralConditions
    });
    //quotation article infos
    articleManager.setArticles(data?.articleExpenseQuotationEntries || []);
  };

  //initialized value to detect changement whiie modifying the quotation
  const { isDisabled, globalReset } = useInitializedState({
    data:
      expenseQuotation ||
      ({} as Partial<ExpenseQuotation & { files: ExpenseQuotationUploadedFile[] }>),
    getCurrentData: () => {
      return {
        expenseQuotation: expenseQuotationManager.getExpenseQuotation(),
        articles: articleManager.getArticles(),
        controls: controlManager.getControls()
      };
    },
    setFormData: (data: Partial<ExpenseQuotation & { files: ExpenseQuotationUploadedFile[] }>) => {
      setExpenseQuotationData(data);
    },
    resetData: () => {
      expenseQuotationManager.reset();
      articleManager.reset();
      controlManager.reset();
    },
    loading: fetching
  });

  //update quotation mutator
  const { mutate: updateExpenseQuotation, isPending: isUpdatingPending } = useMutation({
    mutationFn: (data: { expenseQuotation: UpdateExpenseQuotationDto; files: File[] }) =>
      api.expenseQuotation.update(data.expenseQuotation, data.files),
    onSuccess: (data) => {
      if (data.status == EXPENSE_QUOTATION_STATUS.Invoiced) {
        toast.success('Devis facturé avec succès');
        // router.push(`/expense/invoice/${data.invoiceId}`);
      } else {
        toast.success('Devis modifié avec succès');
      }
      refetchExpenseQuotation();
    },
    onError: (error) => {
      const message = getErrorMessage('contacts', error, 'Erreur lors de la modification de devis');
      toast.error(message);
    }
  });

  //update handler
  const onSubmit = (status: EXPENSE_QUOTATION_STATUS) => {
    const articlesDto: ArticleExpenseQuotationEntry[] = articleManager
      .getArticles()
      ?.map((article) => ({
        article: {
          title: article?.article?.title,
          description: controlManager.isArticleDescriptionHidden
            ? ''
            : article?.article?.description
        },
        quantity: article?.quantity || 0,
        unit_price: article?.unit_price || 0,
        discount: article?.discount || 0,
        discount_type:
          article?.discount_type === 'PERCENTAGE' ? DISCOUNT_TYPE.PERCENTAGE : DISCOUNT_TYPE.AMOUNT,
        taxes: article?.articleExpenseQuotationEntryTaxes?.map((entry) => entry?.tax?.id) || []
      }));

    const expenseQuotation: UpdateExpenseQuotationDto = {
      id: expenseQuotationManager?.id,
      sequential: expenseQuotationManager?.sequential,
      date: expenseQuotationManager?.date?.toString(),
      dueDate: expenseQuotationManager?.dueDate?.toString(),
      object: expenseQuotationManager?.object,
      cabinetId: expenseQuotationManager?.firm?.cabinetId,
      firmId: expenseQuotationManager?.firm?.id,
      interlocutorId: expenseQuotationManager?.interlocutor?.id,
      currencyId: expenseQuotationManager?.currency?.id,
      bankAccountId: !controlManager?.isBankAccountDetailsHidden
        ? expenseQuotationManager?.bankAccount?.id
        : null,
      status,
      generalConditions: !controlManager.isGeneralConditionsHidden
        ? expenseQuotationManager?.generalConditions
        : '',
      notes: expenseQuotationManager?.notes,
      articleExpenseQuotationEntries: articlesDto,
      discount: expenseQuotationManager?.discount,
      discount_type:
        expenseQuotationManager?.discountType === 'PERCENTAGE'
          ? DISCOUNT_TYPE.PERCENTAGE
          : DISCOUNT_TYPE.AMOUNT,
      expenseQuotationMetaData: {
        // showDeliveryAddress: !controlManager?.isDeliveryAddressHidden,
        // showExpenseInvoiceAddress: !controlManager?.isExpenseInvoiceAddressHidden,
        showArticleDescription: !controlManager?.isArticleDescriptionHidden,
        hasBankingDetails: !controlManager.isBankAccountDetailsHidden,
        hasGeneralConditions: !controlManager.isGeneralConditionsHidden
      },
      uploads: expenseQuotationManager.uploadedFiles.filter((u) => !!u.upload).map((u) => u.upload)
    };
    const validation = api.expenseQuotation.validate(expenseQuotation);
    if (validation.message) {
      toast.error(validation.message, { position: validation.position || 'bottom-right' });
    } else {
      updateExpenseQuotation({
        expenseQuotation,
        files: expenseQuotationManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
      });
    }
  };

  //component representation
  if (debounceFetching) return <Spinner className="h-screen" />;
  return (
    <div className={cn('overflow-auto px-10 py-6', className)}>
      {/* Main Container */}
      <div className={cn('block xl:flex gap-4', isUpdatingPending ? 'pointer-events-none' : '')}>
        {/* First Card */}
        <div className="w-full h-auto flex flex-col xl:w-9/12">
          <ScrollArea className=" max-h-[calc(100vh-120px)] border rounded-lg">
            <Card className="border-0">
              <CardContent className="p-5">
                <ExpenseQuotationGeneralInformation
                  className="my-5"
                  firms={firms}
                  // isInvoicingAddressHidden={controlManager.isExpenseInvoiceAddressHidden}
                  // isDeliveryAddressHidden={controlManager.isDeliveryAddressHidden}
                  edit={editMode}
                  loading={debounceFetching}
                />
                {/* Article Management */}
                <ExpenseQuotationArticleManagement
                  className="my-5"
                  taxes={taxes}
                  edit={editMode}
                  isArticleDescriptionHidden={controlManager.isArticleDescriptionHidden}
                  loading={debounceFetching}
                />
                {/* File Upload & Notes */}
                <ExpenseQuotationExtraOptions />
                {/* Other Information */}
                <div className="flex gap-10 m-5">
                  <ExpenseQuotationGeneralConditions
                    className="flex flex-col w-2/3 my-auto"
                    isPending={debounceFetching}
                    hidden={controlManager.isGeneralConditionsHidden}
                    defaultCondition={defaultCondition}
                    edit={editMode}
                  />
                  <div className="w-1/3 my-auto">
                    {/* Final Financial Information */}
                    <ExpenseQuotationFinancialInformation
                      subTotal={expenseQuotationManager.subTotal}
                      total={expenseQuotationManager.total}
                      currency={expenseQuotationManager.currency}
                      loading={debounceFetching}
                      edit={editMode}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollArea>
        </div>
        {/* Second Card */}
        <div className="w-full xl:mt-0 xl:w-3/12 ">
          <ScrollArea className=" max-h-[calc(100vh-120px)] border rounded-lg">
            <Card className="border-0 ">
              <CardContent className="p-5">
                <ExpenseQuotationControlSection
                  status={expenseQuotationManager.status}
                  isDataAltered={isDisabled}
                  bankAccounts={bankAccounts}
                  currencies={currencies}
                  expenseInvoices={expenseQuotation?.expenseInvoices || []}
                  handleSubmit={() => onSubmit(expenseQuotationManager.status)}
                  handleSubmitDraft={() => onSubmit(EXPENSE_QUOTATION_STATUS.Draft)}
                  handleSubmitValidated={() => onSubmit(EXPENSE_QUOTATION_STATUS.Validated)}
                  handleSubmitSent={() => onSubmit(EXPENSE_QUOTATION_STATUS.Sent)}
                  handleSubmitAccepted={() => onSubmit(EXPENSE_QUOTATION_STATUS.Accepted)}
                  handleSubmitRejected={() => onSubmit(EXPENSE_QUOTATION_STATUS.Rejected)}
                  loading={debounceFetching}
                  refetch={refetchExpenseQuotation}
                  reset={globalReset}
                  edit={editMode}
                />
              </CardContent>
            </Card>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
