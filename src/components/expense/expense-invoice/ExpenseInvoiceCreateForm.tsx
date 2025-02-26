import React from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import {
  ArticleExpenseInvoiceEntry,
  CreateExpenseInvoiceDto,
  EXPENSE_INVOICE_STATUS,
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
import { useExpenseInvoiceManager } from '@/components/expense/expense-invoice/hooks/useExpenseInvoiceManager';
import { useExpenseInvoiceArticleManager } from './hooks/useExpenseInvoiceArticleManager';
import useExpenseInvoiceSocket from './hooks/useExpenseInvoiceSocket';
import { useDebounce } from '@/hooks/other/useDebounce';
import { useExpenseInvoiceControlManager } from './hooks/useExpenseInvoiceControlManager';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import useCabinet from '@/hooks/content/useCabinet';
import useDefaultCondition from '@/hooks/content/useDefaultCondition';
import { ACTIVITY_TYPE } from '@/types/enums/activity-type';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { useBreadcrumb } from '@/components/layout/BreadcrumbContext';
import useTaxWithholding from '@/hooks/content/useTaxWitholding';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';
import { ExpenseInvoiceGeneralInformation } from './form/ExpenseInvoiceGeneralInformation';
import { ExpenseInvoiceArticleManagement } from './form/ExpenseInvoiceArticleManagement';
import { ExpenseInvoiceFinancialInformation } from './form/ExpenseInvoiceFinancialInformation';
import { ExpenseInvoiceControlSection } from './form/ExpenseInvoiceControlSection';
import { ExpenseInvoiceExtraOptions } from './form/ExpenseInvoiceExtraOptions';
import { ExpenseInvoiceGeneralConditions } from './form/ExpenseInvoiceGeneralConditions';
import useExpenseQuotationChoices from '@/hooks/content/useExpenseQuotationChoise';
import useExpenseInvoiceRangeDates from '@/hooks/content/useExpenseInvoiceRangeDates';

interface ExpenseInvoiceFormProps {
  className?: string;
  firmId?: string;
}

export const ExpenseInvoiceCreateForm = ({ className, firmId }: ExpenseInvoiceFormProps) => {
  //next-router
  const router = useRouter();

  //translations
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');

  // Stores
  const expenseInvoiceManager = useExpenseInvoiceManager();
  const articleManager = useExpenseInvoiceArticleManager();
  const controlManager = useExpenseInvoiceControlManager();

  //set page title in the breadcrumb
  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    setRoutes(
      !firmId
        ? [
            { title: tCommon('menu.buying'), href: '/expense' },
            { title: tInvoicing('invoice.plural'), href: '/expense/expense-invoices' },
            { title: tInvoicing('invoice.new') }
          ]
        : [
            { title: tCommon('menu.contacts'), href: '/contacts' },
            { title: 'Entreprises', href: '/contacts/firms' },
            {
              title: `Entreprise N°${firmId}`,
              href: `/contacts/firm/${firmId}?tab=entreprise`
            },
            { title: 'Nouvelle Facture' }
          ]
    );
  }, [router.locale, firmId]);

  // Fetch options
  const { firms, isFetchFirmsPending } = useFirmChoice([
    'interlocutorsToFirm',
    'interlocutorsToFirm.interlocutor',
    'paymentCondition',
    'invoicingAddress',
    'deliveryAddress',
    'currency'
  ]);
  const { expenseQuotations, isFetchExpenseQuotationPending } = useExpenseQuotationChoices(
    EXPENSE_QUOTATION_STATUS.Invoiced
  );
  const { cabinet, isFetchCabinetPending } = useCabinet();
  const { taxes, isFetchTaxesPending } = useTax();
  const { currencies, isFetchCurrenciesPending } = useCurrency();
  const { bankAccounts, isFetchBankAccountsPending } = useBankAccount();
  const { defaultCondition, isFetchDefaultConditionPending } = useDefaultCondition(
    ACTIVITY_TYPE.EXPENSE,
    DOCUMENT_TYPE.EXPENSE_INVOICE
  );
  const { taxWithholdings, isFetchTaxWithholdingsPending } = useTaxWithholding();
  const { dateRange, isFetchExpenseInvoiceRangePending } = useExpenseInvoiceRangeDates(
    expenseInvoiceManager.id
  );
  //websocket to listen for server changes related to sequence number
  const { currentSequence, isExpenseInvoiceSequencePending } = useExpenseInvoiceSocket();

  //handle Sequential Number
  React.useEffect(() => {
    expenseInvoiceManager.set('sequentialNumber', currentSequence);
    expenseInvoiceManager.set(
      'bankAccount',
      bankAccounts.find((a) => a.isMain)
    );
    expenseInvoiceManager.set('currency', cabinet?.currency);
  }, [currentSequence]);

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

  //create expenseInvoice mutator
  const { mutate: createExpenseInvoice, isPending: isCreatePending } = useMutation({
    mutationFn: (data: { expenseInvoice: CreateExpenseInvoiceDto; files: File[] }) =>
      api.expenseInvoice.create(data.expenseInvoice, data.files),
    onSuccess: () => {
      if (!firmId) router.push('/expense/expense-invoices');
      else router.push(`/contacts/firm/${firmId}/?tab=expenseInvoices`);
      toast.success('Facture crée avec succès');
    },
    onError: (error) => {
      const message = getErrorMessage('invoicing', error, 'Erreur lors de la création de facture');
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
    isCreatePending ||
    isFetchExpenseQuotationPending ||
    isFetchTaxWithholdingsPending ||
    isFetchExpenseInvoiceRangePending ||
    !commonReady ||
    !invoicingReady;
  const { value: debounceLoading } = useDebounce<boolean>(loading, 500);

  //Reset Form
  const globalReset = () => {
    expenseInvoiceManager.reset();
    articleManager.reset();
    controlManager.reset();
  };
  //side effect to reset the form when the component is mounted
  React.useEffect(() => {
    globalReset();
    articleManager.add();
  }, []);

  //create handler
  const onSubmit = (status: EXPENSE_INVOICE_STATUS) => {
    const articlesDto: ArticleExpenseInvoiceEntry[] = articleManager
      .getArticles()
      ?.map((article) => ({
        id: article?.id,
        article: {
          title: article?.article?.title || '',
          description: !controlManager.isArticleDescriptionHidden
            ? article?.article?.description || ''
            : ''
        },
        quantity: article?.quantity || 0,
        unit_price: article?.unit_price || 0,
        discount: article?.discount || 0,
        discount_type:
          article?.discount_type === 'PERCENTAGE' ? DISCOUNT_TYPE.PERCENTAGE : DISCOUNT_TYPE.AMOUNT,
        taxes: article?.articleExpenseInvoiceEntryTaxes?.map((entry) => {
          return entry?.tax?.id;
        })
      }));
    const expenseInvoice: CreateExpenseInvoiceDto = {
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
        showDeliveryAddress: !controlManager?.isDeliveryAddressHidden,
        showExpenseInvoiceAddress: !controlManager?.isExpenseInvoiceAddressHidden,
        showArticleDescription: !controlManager?.isArticleDescriptionHidden,
        hasBankingDetails: !controlManager.isBankAccountDetailsHidden,
        hasGeneralConditions: !controlManager.isGeneralConditionsHidden,
        hasTaxWithholding: !controlManager.isTaxWithholdingHidden
      }
    };
    const validation = api.expenseInvoice.validate(expenseInvoice, dateRange);
    if (validation.message) {
      toast.error(validation.message);
    } else {
      if (controlManager.isGeneralConditionsHidden) delete expenseInvoice.generalConditions;
      createExpenseInvoice({
        expenseInvoice,
        files: expenseInvoiceManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
      });
      globalReset();
    }
  };

  //component representation
  if (debounceLoading) return <Spinner className="h-screen" show={loading} />;
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
                <ExpenseInvoiceGeneralInformation
                  className="my-5"
                  firms={firms}
                  isInvoicingAddressHidden={controlManager.isExpenseInvoiceAddressHidden}
                  isDeliveryAddressHidden={controlManager.isDeliveryAddressHidden}
                  loading={isFetchFirmsPending || isExpenseInvoiceSequencePending}
                />
                {/* Article Management */}
                <ExpenseInvoiceArticleManagement
                  className="my-5"
                  taxes={taxes}
                  isArticleDescriptionHidden={controlManager.isArticleDescriptionHidden}
                />
                {/* File Upload & Notes */}
                <ExpenseInvoiceExtraOptions />
                {/* Other Information */}
                <div className="flex gap-10 mt-5">
                  <ExpenseInvoiceGeneralConditions
                    className="flex flex-col w-2/3 my-auto"
                    isPending={debounceLoading}
                    hidden={controlManager.isGeneralConditionsHidden}
                    defaultCondition={defaultCondition}
                  />
                  <div className="w-1/3 my-auto">
                    {/* Final Financial Information */}
                    <ExpenseInvoiceFinancialInformation
                      subTotal={expenseInvoiceManager.subTotal}
                      status={EXPENSE_INVOICE_STATUS.Nonexistent}
                      currency={expenseInvoiceManager.currency}
                      taxes={taxes.filter((tax) => !tax.isRate)}
                      taxWithholdings={taxWithholdings}
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
                <ExpenseInvoiceControlSection
                  bankAccounts={bankAccounts}
                  currencies={currencies}
                  expenseQuotations={expenseQuotations}
                  taxWithholdings={taxWithholdings}
                  handleSubmitDraft={() => onSubmit(EXPENSE_INVOICE_STATUS.Draft)}
                  handleSubmitValidated={() => onSubmit(EXPENSE_INVOICE_STATUS.Validated)}
                  handleSubmitSent={() => onSubmit(EXPENSE_INVOICE_STATUS.Sent)}
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
