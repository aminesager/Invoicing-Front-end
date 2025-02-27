import React from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import {
  ArticleExpenseInvoiceEntry,
  ExpenseInvoice,
  ExpenseInvoiceUploadedFile,
  EXPENSE_QUOTATION_STATUS,
  UpdateExpenseInvoiceDto,
  EXPENSE_INVOICE_STATUS
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
import { useExpenseInvoiceManager } from './hooks/useExpenseInvoiceManager';
import { useExpenseInvoiceArticleManager } from './hooks/useExpenseInvoiceArticleManager';
import { useExpenseInvoiceControlManager } from './hooks/useExpenseInvoiceControlManager';
import _ from 'lodash';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExpenseInvoiceExtraOptions } from './form/ExpenseInvoiceExtraOptions';
import { ExpenseInvoiceGeneralConditions } from './form/ExpenseInvoiceGeneralConditions';
import useDefaultCondition from '@/hooks/content/useDefaultCondition';
import { ACTIVITY_TYPE } from '@/types/enums/activity-type';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { useRouter } from 'next/router';
import { useBreadcrumb } from '@/components/layout/BreadcrumbContext';
import useInitializedState from '@/hooks/use-initialized-state';
import { useExpenseQuotationManager } from '../expense-quotation/hooks/useExpenseQuotationManager';
import { ExpenseInvoiceGeneralInformation } from './form/ExpenseInvoiceGeneralInformation';
import { ExpenseInvoiceArticleManagement } from './form/ExpenseInvoiceArticleManagement';
import { ExpenseInvoiceFinancialInformation } from './form/ExpenseInvoiceFinancialInformation';
import { ExpenseInvoiceControlSection } from './form/ExpenseInvoiceControlSection';
import useTaxWithholding from '@/hooks/content/useTaxWitholding';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';
import useExpenseQuotationChoices from '@/hooks/content/useExpenseQuotationChoise';
import useExpenseInvoiceRangeDates from '@/hooks/content/useExpenseInvoiceRangeDates';

interface ExpenseInvoiceFormProps {
  className?: string;
  expenseInvoiceId: string;
}

export const ExpenseInvoiceUpdateForm = ({
  className,
  expenseInvoiceId
}: ExpenseInvoiceFormProps) => {
  //next-router
  const router = useRouter();

  //translations
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');

  // Stores
  const expenseInvoiceManager = useExpenseInvoiceManager();
  const expenseQuotationManager = useExpenseQuotationManager();
  const controlManager = useExpenseInvoiceControlManager();
  const articleManager = useExpenseInvoiceArticleManager();

  //Fetch options
  const {
    isPending: isFetchPending,
    data: expenseInvoiceResp,
    refetch: refetchExpenseInvoice
  } = useQuery({
    queryKey: ['expense-invoice', expenseInvoiceId],
    queryFn: () => api.expenseInvoice.findOne(parseInt(expenseInvoiceId))
  });
  const expenseInvoice = React.useMemo(() => {
    return expenseInvoiceResp || null;
  }, [expenseInvoiceResp]);

  //set page title in the breadcrumb
  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    if (expenseInvoice?.sequential)
      setRoutes([
        { title: tCommon('menu.buying'), href: '/expense' },
        { title: tInvoicing('invoice.plural'), href: '/expense/expense-invoices' },
        { title: tInvoicing('invoice.singular') + ' N° ' + expenseInvoice?.sequential }
      ]);
  }, [router.locale, expenseInvoice?.sequential]);

  //recognize if the form can be edited
  const editMode = React.useMemo(() => {
    const editModeStatuses = [EXPENSE_INVOICE_STATUS.Validated, EXPENSE_INVOICE_STATUS.Draft];
    return expenseInvoice?.status && editModeStatuses.includes(expenseInvoice?.status);
  }, [expenseInvoice]);

  // Fetch options
  const { firms, isFetchFirmsPending } = useFirmChoice([
    'interlocutorsToFirm',
    'interlocutorsToFirm.interlocutor',
    // 'invoicingAddress',
    // 'deliveryAddress',
    'currency'
  ]);
  const { expenseQuotations, isFetchExpenseQuotationPending } = useExpenseQuotationChoices(
    EXPENSE_QUOTATION_STATUS.Invoiced
  );
  const { taxes, isFetchTaxesPending } = useTax();
  const { currencies, isFetchCurrenciesPending } = useCurrency();
  const { bankAccounts, isFetchBankAccountsPending } = useBankAccount();
  const { taxWithholdings, isFetchTaxWithholdingsPending } = useTaxWithholding();
  const { defaultCondition, isFetchDefaultConditionPending } = useDefaultCondition(
    ACTIVITY_TYPE.EXPENSE,
    DOCUMENT_TYPE.INVOICE
  );
  const { dateRange, isFetchExpenseInvoiceRangePending } = useExpenseInvoiceRangeDates(
    expenseInvoiceManager.id
  );
  console.log(dateRange);
  const fetching =
    isFetchPending ||
    isFetchFirmsPending ||
    isFetchTaxesPending ||
    isFetchCurrenciesPending ||
    isFetchBankAccountsPending ||
    isFetchDefaultConditionPending ||
    isFetchExpenseQuotationPending ||
    isFetchTaxWithholdingsPending ||
    isFetchExpenseInvoiceRangePending ||
    !commonReady ||
    !invoicingReady;
  const { value: debounceFetching } = useDebounce<boolean>(fetching, 500);

  // perform calculations when the financialy Information are changed
  const digitAfterComma = React.useMemo(() => {
    return expenseInvoiceManager.currency?.digitAfterComma || 3;
  }, [expenseInvoiceManager.currency]);
  React.useEffect(() => {
    const zero = dinero({ amount: 0, precision: digitAfterComma });
    const articles = articleManager.getArticles() || [];
    const subTotal = articles?.reduce((acc, article) => {
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
    expenseInvoiceManager.set('subTotal', subTotal.toUnit());
    // Calculate total
    const total = articles?.reduce(
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
    if (expenseInvoiceManager.discountType === DISCOUNT_TYPE.PERCENTAGE) {
      const discountAmount = total.multiply(expenseInvoiceManager.discount / 100);
      finalTotal = total.subtract(discountAmount);
    } else {
      const discountAmount = dinero({
        amount: createDineroAmountFromFloatWithDynamicCurrency(
          expenseInvoiceManager?.discount || 0,
          digitAfterComma
        ),
        precision: digitAfterComma
      });
      finalTotal = total.subtract(discountAmount);
    }
    // Apply tax stamp if applicable
    if (expenseInvoiceManager.taxStampId) {
      const tax = taxes.find((t) => t.id === expenseInvoiceManager.taxStampId);
      if (tax) {
        const taxAmount = dinero({
          amount: createDineroAmountFromFloatWithDynamicCurrency(tax.value || 0, digitAfterComma),
          precision: digitAfterComma
        });
        finalTotal = finalTotal.add(taxAmount);
      }
    }
    expenseInvoiceManager.set('total', finalTotal.toUnit());
  }, [
    articleManager.articles,
    expenseInvoiceManager.discount,
    expenseInvoiceManager.discountType,
    expenseInvoiceManager.taxStampId
  ]);

  //full invoice setter across multiple stores
  const setExpenseInvoiceData = (
    data: Partial<ExpenseInvoice & { files: ExpenseInvoiceUploadedFile[] }>
  ) => {
    //invoice infos
    data && expenseInvoiceManager.setExpenseInvoice(data, firms, bankAccounts);
    data?.expenseQuotation &&
      expenseQuotationManager.set('sequential', data?.expenseQuotation?.sequential);
    //invoice meta infos
    controlManager.setControls({
      isBankAccountDetailsHidden: !data?.expenseInvoiceMetaData?.hasBankingDetails,
      // isExpenseInvoiceAddressHidden: !data?.expenseInvoiceMetaData?.showExpenseInvoiceAddress,
      // isDeliveryAddressHidden: !data?.expenseInvoiceMetaData?.showDeliveryAddress,
      isArticleDescriptionHidden: !data?.expenseInvoiceMetaData?.showArticleDescription,
      isGeneralConditionsHidden: !data?.expenseInvoiceMetaData?.hasGeneralConditions,
      isTaxStampHidden: !data?.expenseInvoiceMetaData?.hasTaxStamp,
      isTaxWithholdingHidden: !data?.expenseInvoiceMetaData?.hasTaxWithholding
    });
    //invoice article infos
    articleManager.setArticles(data?.articleExpenseInvoiceEntries || []);
  };

  //initialized value to detect changement whiie modifying the invoice
  const { isDisabled, globalReset } = useInitializedState({
    data:
      expenseInvoice || ({} as Partial<ExpenseInvoice & { files: ExpenseInvoiceUploadedFile[] }>),
    getCurrentData: () => {
      return {
        expenseInvoice: expenseInvoiceManager.getExpenseInvoice(),
        articles: articleManager.getArticles(),
        controls: controlManager.getControls()
      };
    },
    setFormData: (data: Partial<ExpenseInvoice & { files: ExpenseInvoiceUploadedFile[] }>) => {
      setExpenseInvoiceData(data);
    },
    resetData: () => {
      expenseInvoiceManager.reset();
      articleManager.reset();
      controlManager.reset();
    },
    loading: fetching
  });

  //update invoice mutator
  const { mutate: updateExpenseInvoice, isPending: isUpdatingPending } = useMutation({
    mutationFn: (data: { expenseInvoice: UpdateExpenseInvoiceDto; files: File[] }) =>
      api.expenseInvoice.update(data.expenseInvoice, data.files),
    onSuccess: () => {
      refetchExpenseInvoice();
      toast.success('Facture modifié avec succès');
    },
    onError: (error) => {
      const message = getErrorMessage(
        'invoicing',
        error,
        'Erreur lors de la modification de Facture'
      );
      toast.error(message);
    }
  });

  //update handler
  const onSubmit = (status: EXPENSE_INVOICE_STATUS) => {
    const articlesDto: ArticleExpenseInvoiceEntry[] = articleManager
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
        taxes: article?.articleExpenseInvoiceEntryTaxes?.map((entry) => entry?.tax?.id) || []
      }));
    const expenseInvoice: UpdateExpenseInvoiceDto = {
      id: expenseInvoiceManager?.id,
      date: expenseInvoiceManager?.date?.toString(),
      dueDate: expenseInvoiceManager?.dueDate?.toString(),
      object: expenseInvoiceManager?.object,
      cabinetId: expenseInvoiceManager?.firm?.cabinetId,
      firmId: expenseInvoiceManager?.firm?.id,
      interlocutorId: expenseInvoiceManager?.interlocutor?.id,
      currencyId: expenseInvoiceManager?.currency?.id,
      bankAccountId: !controlManager?.isBankAccountDetailsHidden
        ? expenseInvoiceManager?.bankAccount?.id
        : undefined,
      status,
      generalConditions: !controlManager.isGeneralConditionsHidden
        ? expenseInvoiceManager?.generalConditions
        : '',
      notes: expenseInvoiceManager?.notes,
      articleExpenseInvoiceEntries: articlesDto,
      discount: expenseInvoiceManager?.discount,
      discount_type:
        expenseInvoiceManager?.discountType === 'PERCENTAGE'
          ? DISCOUNT_TYPE.PERCENTAGE
          : DISCOUNT_TYPE.AMOUNT,
      expenseQuotationId: expenseInvoiceManager?.expenseQuotationId,
      taxStampId: expenseInvoiceManager?.taxStampId,
      taxWithholdingId: expenseInvoiceManager?.taxWithholdingId,
      expenseInvoiceMetaData: {
        // showDeliveryAddress: !controlManager?.isDeliveryAddressHidden,
        // showExpenseInvoiceAddress: !controlManager?.isExpenseInvoiceAddressHidden,
        showArticleDescription: !controlManager?.isArticleDescriptionHidden,
        hasBankingDetails: !controlManager.isBankAccountDetailsHidden,
        hasGeneralConditions: !controlManager.isGeneralConditionsHidden,
        hasTaxStamp: !controlManager.isTaxStampHidden,
        hasTaxWithholding: !controlManager.isTaxWithholdingHidden
      },
      uploads: expenseInvoiceManager.uploadedFiles.filter((u) => !!u.upload).map((u) => u.upload)
    };
    const validation = api.expenseInvoice.validate(expenseInvoice, dateRange);
    if (validation.message) {
      toast.error(validation.message, { position: validation.position || 'bottom-right' });
    } else {
      updateExpenseInvoice({
        expenseInvoice,
        files: expenseInvoiceManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
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
                <ExpenseInvoiceGeneralInformation
                  className="my-5"
                  firms={firms}
                  // isInvoicingAddressHidden={controlManager.isExpenseInvoiceAddressHidden}
                  // isDeliveryAddressHidden={controlManager.isDeliveryAddressHidden}
                  edit={editMode}
                  loading={debounceFetching}
                />
                {/* Article Management */}
                <ExpenseInvoiceArticleManagement
                  className="my-5"
                  taxes={taxes}
                  edit={editMode}
                  isArticleDescriptionHidden={controlManager.isArticleDescriptionHidden}
                  loading={debounceFetching}
                />
                {/* File Upload & Notes */}
                <ExpenseInvoiceExtraOptions />
                {/* Other Information */}
                <div className="flex gap-10 m-5">
                  <ExpenseInvoiceGeneralConditions
                    className="flex flex-col w-2/3 my-auto"
                    isPending={debounceFetching}
                    hidden={controlManager.isGeneralConditionsHidden}
                    defaultCondition={defaultCondition}
                    edit={editMode}
                  />
                  <div className="w-1/3 my-auto">
                    {/* Final Financial Information */}
                    <ExpenseInvoiceFinancialInformation
                      subTotal={expenseInvoiceManager.subTotal}
                      status={expenseInvoiceManager.status}
                      currency={expenseInvoiceManager.currency}
                      taxes={taxes.filter((tax) => !tax.isRate)}
                      taxWithholdings={taxWithholdings}
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
            <Card className="border-0">
              <CardContent className="p-5">
                <ExpenseInvoiceControlSection
                  status={expenseInvoiceManager.status}
                  isDataAltered={isDisabled}
                  bankAccounts={bankAccounts}
                  currencies={currencies}
                  expenseQuotations={expenseQuotations}
                  expensePayments={expenseInvoice?.expensePayments || []}
                  taxWithholdings={taxWithholdings}
                  handleSubmit={() => onSubmit(expenseInvoiceManager.status)}
                  handleSubmitDraft={() => onSubmit(EXPENSE_INVOICE_STATUS.Draft)}
                  handleSubmitValidated={() => onSubmit(EXPENSE_INVOICE_STATUS.Validated)}
                  handleSubmitSent={() => onSubmit(EXPENSE_INVOICE_STATUS.Sent)}
                  loading={debounceFetching}
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
