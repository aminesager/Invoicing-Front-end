import React from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import {
  ArticleExpenseQuotationEntry,
  CreateExpenseQuotationDto,
  EXPENSE_QUOTATION_STATUS
} from '@/types';
import { Spinner } from '@/components/common';
import { Card, CardContent } from '@/components/ui/card';
import useTax from '@/hooks/content/useTax';
import useFirmChoice from '@/hooks/content/useFirmChoice';
import useBankAccount from '@/hooks/content/useBankAccount';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { getErrorMessage } from '@/utils/errors';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { useExpenseQuotationManager } from '@/components/expense/expense-quotation/hooks/useExpenseQuotationManager';
import { useExpenseQuotationArticleManager } from './hooks/useExpenseQuotationArticleManager';
// import useExpenseQuotationSocket from './hooks/useExpenseQuotationSocket';
import { useDebounce } from '@/hooks/other/useDebounce';
import { useExpenseQuotationControlManager } from './hooks/useExpenseQuotationControlManager';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import useCabinet from '@/hooks/content/useCabinet';
import { ExpenseQuotationExtraOptions } from './form/ExpenseQuotationExtraOptions';
import useDefaultCondition from '@/hooks/content/useDefaultCondition';
import { ACTIVITY_TYPE } from '@/types/enums/activity-type';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { ExpenseQuotationGeneralConditions } from './form/ExpenseQuotationGeneralConditions';
import { useBreadcrumb } from '@/components/layout/BreadcrumbContext';
import { ExpenseQuotationGeneralInformation } from './form/ExpenseQuotationGeneralInformation';
import { ExpenseQuotationArticleManagement } from './form/ExpenseQuotationArticleManagement';
import { ExpenseQuotationFinancialInformation } from './form/ExpenseQuotationFinancialInformation';
import { ExpenseQuotationControlSection } from './form/ExpenseQuotationControlSection';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';
import { ExpenseQuotationUpload } from './form/ExpenseQuotationUpload';

interface ExpenseQuotationFormProps {
  className?: string;
  firmId?: string;
}

export const ExpenseQuotationCreateForm = ({ className, firmId }: ExpenseQuotationFormProps) => {
  //next-router
  const router = useRouter();

  //translations
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');

  // Stores
  const expenseQuotationManager = useExpenseQuotationManager();
  const articleManager = useExpenseQuotationArticleManager();
  const controlManager = useExpenseQuotationControlManager();

  //set page title in the breadcrumb
  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    setRoutes(
      !firmId
        ? [
            { title: tCommon('menu.buying'), href: '/expense' },
            { title: tInvoicing('quotation.plural'), href: '/expense/expense-quotations' },
            { title: tInvoicing('quotation.new') }
          ]
        : [
            { title: tCommon('menu.contacts'), href: '/contacts' },
            { title: 'Entreprises', href: '/contacts/firms' },
            {
              title: `Entreprise N°${firmId}`,
              href: `/contacts/firm/${firmId}?tab=entreprise`
            },
            { title: 'Nouveau Devis' }
          ]
    );
  }, [router.locale, firmId]);

  // Fetch options
  const { firms, isFetchFirmsPending } = useFirmChoice([
    'interlocutorsToFirm',
    'interlocutorsToFirm.interlocutor',
    'paymentCondition',
    // 'invoicingAddress',
    // 'deliveryAddress',
    'currency'
  ]);
  const { cabinet, isFetchCabinetPending } = useCabinet();
  const { taxes, isFetchTaxesPending } = useTax();
  const { currencies, isFetchCurrenciesPending } = useCurrency();
  const { bankAccounts, isFetchBankAccountsPending } = useBankAccount();
  const { defaultCondition, isFetchDefaultConditionPending } = useDefaultCondition(
    ACTIVITY_TYPE.EXPENSE,
    DOCUMENT_TYPE.EXPENSE_QUOTATION
  );

  //websocket to listen for server changes related to sequence number
  // const { currentSequence, isExpenseQuotationSequencePending } = useExpenseQuotationSocket();
  // //handle Sequential Number
  // React.useEffect(() => {
  //   expenseQuotationManager.set('sequentialNumber', currentSequence);
  //   expenseQuotationManager.set(
  //     'bankAccount',
  //     bankAccounts.find((a) => a.isMain)
  //   );
  //   expenseQuotationManager.set('currency', cabinet?.currency);
  // }, [currentSequence]);

  // perform calculations when the financialy Information are changed
  const digitAfterComma = React.useMemo(() => {
    return expenseQuotationManager.currency?.digitAfterComma || 3;
  }, [expenseQuotationManager.currency]);

  React.useEffect(() => {
    const zero = dinero({ amount: 0, precision: digitAfterComma });
    const articles = articleManager.getArticles() || [];
    // Calculate subTotal
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
    expenseQuotationManager.set('subTotal', subTotal.toUnit());
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

  //create quotation mutator
  const { mutate: createExpenseQuotation, isPending: isCreatePending } = useMutation({
    mutationFn: (data: { expenseQuotation: CreateExpenseQuotationDto; files: File[] }) =>
      api.expenseQuotation.create(data.expenseQuotation, data.files),
    onSuccess: () => {
      if (!firmId) router.push('/expense/expense-quotations');
      else router.push(`/contacts/firm/${firmId}/?tab=expense-quotations`);
      toast.success('Devis crée avec succès');
    },
    onError: (error) => {
      const message = getErrorMessage('invoicing', error, 'Erreur lors de la création de devis');
      toast.error(message);
    }
  });
  const loading =
    isFetchFirmsPending ||
    isFetchTaxesPending ||
    isFetchCabinetPending ||
    isFetchBankAccountsPending ||
    isFetchCurrenciesPending ||
    isFetchDefaultConditionPending ||
    // isExpenseQuotationSequencePending;
    !commonReady ||
    !invoicingReady ||
    isCreatePending;
  const { value: debounceLoading } = useDebounce<boolean>(loading, 500);

  //Reset Form
  const globalReset = () => {
    expenseQuotationManager.reset();
    articleManager.reset();
    controlManager.reset();
  };
  //side effect to reset the form when the component is mounted
  React.useEffect(() => {
    globalReset();
    articleManager.add();
  }, []);

  //create handler
  const onSubmit = (status: EXPENSE_QUOTATION_STATUS) => {
    const articlesDto: ArticleExpenseQuotationEntry[] = articleManager
      .getArticles()
      ?.map((article) => ({
        id: article?.id,
        article: {
          title: article?.article?.title,
          description: !controlManager.isArticleDescriptionHidden
            ? article?.article?.description
            : ''
        },
        quantity: article?.quantity,
        unit_price: article?.unit_price,
        discount: article?.discount,
        discount_type:
          article?.discount_type === 'PERCENTAGE' ? DISCOUNT_TYPE.PERCENTAGE : DISCOUNT_TYPE.AMOUNT,
        taxes: article?.articleExpenseQuotationEntryTaxes?.map((entry) => {
          return entry?.tax?.id;
        })
      }));
    const expenseQuotation: CreateExpenseQuotationDto = {
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
        : undefined,
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
      }
    };
    const validation = api.expenseQuotation.validate(expenseQuotation);
    if (validation.message) {
      toast.error(validation.message);
    } else {
      if (controlManager.isGeneralConditionsHidden) delete expenseQuotation.generalConditions;
      createExpenseQuotation({
        expenseQuotation,
        files: expenseQuotationManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
      });
      globalReset();
    }
  };

  //component representation
  if (debounceLoading) return <Spinner className="h-screen" show={debounceLoading} />;
  return (
    <div className={cn('overflow-auto px-10 py-6', className)}>
      {/* Main Container */}
      <div className={cn('block xl:flex gap-4', isCreatePending ? 'pointer-events-none' : '')}>
        {/* First Card */}
        <div className="w-full h-auto flex flex-col xl:w-9/12">
          <ScrollArea className=" max-h-[calc(100vh-120px)] border rounded-lg">
            <Card className="border-0">
              <CardContent className="p-5">
                {/* General Information */}
                <ExpenseQuotationUpload />
                <ExpenseQuotationGeneralInformation
                  className="my-5"
                  firms={firms}
                  // isInvoicingAddressHidden={controlManager.isExpenseInvoiceAddressHidden}
                  // isDeliveryAddressHidden={controlManager.isDeliveryAddressHidden}
                  loading={debounceLoading}
                />
                {/* Article Management */}
                <ExpenseQuotationArticleManagement
                  className="my-5"
                  taxes={taxes}
                  isArticleDescriptionHidden={controlManager.isArticleDescriptionHidden}
                />
                {/* File Upload & Notes */}

                <ExpenseQuotationExtraOptions />
                {/* Other Information */}
                <div className="flex gap-10 mt-5">
                  <ExpenseQuotationGeneralConditions
                    className="flex flex-col w-2/3 my-auto"
                    isPending={debounceLoading}
                    hidden={controlManager.isGeneralConditionsHidden}
                    defaultCondition={defaultCondition}
                  />
                  <div className="w-1/3 my-auto">
                    {/* Final Financial Information */}
                    <ExpenseQuotationFinancialInformation
                      subTotal={expenseQuotationManager.subTotal}
                      total={expenseQuotationManager.total}
                      currency={expenseQuotationManager.currency}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollArea>
        </div>
        {/* Second Card */}
        <div className="w-full xl:mt-0 xl:w-3/12">
          <ScrollArea className=" max-h-[calc(100vh-120px)] border rounded-lg">
            <Card className="border-0">
              <CardContent className="p-5">
                {/* Control Section */}
                <ExpenseQuotationControlSection
                  bankAccounts={bankAccounts}
                  currencies={currencies}
                  expenseInvoices={[]}
                  handleSubmitDraft={() => onSubmit(EXPENSE_QUOTATION_STATUS.Draft)}
                  handleSubmitValidated={() => onSubmit(EXPENSE_QUOTATION_STATUS.Validated)}
                  handleSubmitSent={() => onSubmit(EXPENSE_QUOTATION_STATUS.Sent)}
                  reset={globalReset}
                  loading={debounceLoading}
                />
              </CardContent>
            </Card>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
