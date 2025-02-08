import React from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import { ArticleQuotationEntry, CreateQuotationDto, QUOTATION_STATUS } from '@/types';
import { Spinner } from '@/components/common';
import { Card, CardContent } from '@/components/ui/card';
import useTax from '@/hooks/content/useTax';
import useFirmChoice from '@/hooks/content/useFirmChoice';
import useBankAccount from '@/hooks/content/useBankAccount';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { getErrorMessage } from '@/utils/errors';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { useQuotationManager } from '@/components/selling/quotation/hooks/useQuotationManager';
import { useQuotationArticleManager } from './hooks/useQuotationArticleManager';
import useQuotationSocket from './hooks/useQuotationSocket';
import { useDebounce } from '@/hooks/other/useDebounce';
import { useQuotationControlManager } from './hooks/useQuotationControlManager';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import useCabinet from '@/hooks/content/useCabinet';
import { QuotationExtraOptions } from './form/QuotationExtraOptions';
import useDefaultCondition from '@/hooks/content/useDefaultCondition';
import { ACTIVITY_TYPE } from '@/types/enums/activity-type';
import { DOCUMENT_TYPE } from '@/types/enums/document-type';
import { QuotationGeneralConditions } from './form/QuotationGeneralConditions';
import { useBreadcrumb } from '@/components/layout/BreadcrumbContext';
import { QuotationGeneralInformation } from './form/QuotationGeneralInformation';
import { QuotationArticleManagement } from './form/QuotationArticleManagement';
import { QuotationFinancialInformation } from './form/QuotationFinancialInformation';
import { QuotationControlSection } from './form/QuotationControlSection';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';

interface QuotationFormProps {
  className?: string;
  firmId?: string;
}

export const QuotationCreateForm = ({ className, firmId }: QuotationFormProps) => {
  //next-router
  const router = useRouter();

  //translations
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');

  // Stores
  const quotationManager = useQuotationManager();
  const articleManager = useQuotationArticleManager();
  const controlManager = useQuotationControlManager();

  //set page title in the breadcrumb
  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    setRoutes(
      !firmId
        ? [
            { title: tCommon('menu.selling'), href: '/selling' },
            { title: tInvoicing('quotation.plural'), href: '/selling/quotations' },
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
    'invoicingAddress',
    'deliveryAddress',
    'currency'
  ]);
  const { cabinet, isFetchCabinetPending } = useCabinet();
  const { taxes, isFetchTaxesPending } = useTax();
  const { currencies, isFetchCurrenciesPending } = useCurrency();
  const { bankAccounts, isFetchBankAccountsPending } = useBankAccount();
  const { defaultCondition, isFetchDefaultConditionPending } = useDefaultCondition(
    ACTIVITY_TYPE.SELLING,
    DOCUMENT_TYPE.QUOTATION
  );

  //websocket to listen for server changes related to sequence number
  const { currentSequence, isQuotationSequencePending } = useQuotationSocket();
  //handle Sequential Number
  React.useEffect(() => {
    quotationManager.set('sequentialNumber', currentSequence);
    quotationManager.set(
      'bankAccount',
      bankAccounts.find((a) => a.isMain)
    );
    quotationManager.set('currency', cabinet?.currency);
  }, [currentSequence]);

  // perform calculations when the financialy Information are changed
  const digitAfterComma = React.useMemo(() => {
    return quotationManager.currency?.digitAfterComma || 3;
  }, [quotationManager.currency]);

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
    quotationManager.set('subTotal', subTotal.toUnit());
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
    if (quotationManager.discountType === DISCOUNT_TYPE.PERCENTAGE) {
      const discountAmount = total.multiply(quotationManager.discount / 100);
      finalTotal = total.subtract(discountAmount);
    } else {
      const discountAmount = dinero({
        amount: createDineroAmountFromFloatWithDynamicCurrency(
          quotationManager?.discount || 0,
          digitAfterComma
        ),
        precision: digitAfterComma
      });
      finalTotal = total.subtract(discountAmount);
    }
    quotationManager.set('total', finalTotal.toUnit());
  }, [articleManager.articles, quotationManager.discount, quotationManager.discountType]);

  //create quotation mutator
  const { mutate: createQuotation, isPending: isCreatePending } = useMutation({
    mutationFn: (data: { quotation: CreateQuotationDto; files: File[] }) =>
      api.quotation.create(data.quotation, data.files),
    onSuccess: () => {
      if (!firmId) router.push('/selling/quotations');
      else router.push(`/contacts/firm/${firmId}/?tab=quotations`);
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
    isQuotationSequencePending;
  !commonReady || !invoicingReady || isCreatePending;
  const { value: debounceLoading } = useDebounce<boolean>(loading, 500);

  //Reset Form
  const globalReset = () => {
    quotationManager.reset();
    articleManager.reset();
    controlManager.reset();
  };
  //side effect to reset the form when the component is mounted
  React.useEffect(() => {
    globalReset();
    articleManager.add();
  }, []);

  //create handler
  const onSubmit = (status: QUOTATION_STATUS) => {
    const articlesDto: ArticleQuotationEntry[] = articleManager.getArticles()?.map((article) => ({
      id: article?.id,
      article: {
        title: article?.article?.title,
        description: !controlManager.isArticleDescriptionHidden ? article?.article?.description : ''
      },
      quantity: article?.quantity,
      unit_price: article?.unit_price,
      discount: article?.discount,
      discount_type:
        article?.discount_type === 'PERCENTAGE' ? DISCOUNT_TYPE.PERCENTAGE : DISCOUNT_TYPE.AMOUNT,
      taxes: article?.articleQuotationEntryTaxes?.map((entry) => {
        return entry?.tax?.id;
      })
    }));
    const quotation: CreateQuotationDto = {
      date: quotationManager?.date?.toString(),
      dueDate: quotationManager?.dueDate?.toString(),
      object: quotationManager?.object,
      cabinetId: quotationManager?.firm?.cabinetId,
      firmId: quotationManager?.firm?.id,
      interlocutorId: quotationManager?.interlocutor?.id,
      currencyId: quotationManager?.currency?.id,
      bankAccountId: !controlManager?.isBankAccountDetailsHidden
        ? quotationManager?.bankAccount?.id
        : undefined,
      status,
      generalConditions: !controlManager.isGeneralConditionsHidden
        ? quotationManager?.generalConditions
        : '',
      notes: quotationManager?.notes,
      articleQuotationEntries: articlesDto,
      discount: quotationManager?.discount,
      discount_type:
        quotationManager?.discountType === 'PERCENTAGE'
          ? DISCOUNT_TYPE.PERCENTAGE
          : DISCOUNT_TYPE.AMOUNT,
      quotationMetaData: {
        showDeliveryAddress: !controlManager?.isDeliveryAddressHidden,
        showInvoiceAddress: !controlManager?.isInvoiceAddressHidden,
        showArticleDescription: !controlManager?.isArticleDescriptionHidden,
        hasBankingDetails: !controlManager.isBankAccountDetailsHidden,
        hasGeneralConditions: !controlManager.isGeneralConditionsHidden
      }
    };
    const validation = api.quotation.validate(quotation);
    if (validation.message) {
      toast.error(validation.message);
    } else {
      if (controlManager.isGeneralConditionsHidden) delete quotation.generalConditions;
      createQuotation({
        quotation,
        files: quotationManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
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
                <QuotationGeneralInformation
                  className="my-5"
                  firms={firms}
                  isInvoicingAddressHidden={controlManager.isInvoiceAddressHidden}
                  isDeliveryAddressHidden={controlManager.isDeliveryAddressHidden}
                  loading={debounceLoading}
                />
                {/* Article Management */}
                <QuotationArticleManagement
                  className="my-5"
                  taxes={taxes}
                  isArticleDescriptionHidden={controlManager.isArticleDescriptionHidden}
                />
                {/* File Upload & Notes */}
                <QuotationExtraOptions />
                {/* Other Information */}
                <div className="flex gap-10 mt-5">
                  <QuotationGeneralConditions
                    className="flex flex-col w-2/3 my-auto"
                    isPending={debounceLoading}
                    hidden={controlManager.isGeneralConditionsHidden}
                    defaultCondition={defaultCondition}
                  />
                  <div className="w-1/3 my-auto">
                    {/* Final Financial Information */}
                    <QuotationFinancialInformation
                      subTotal={quotationManager.subTotal}
                      total={quotationManager.total}
                      currency={quotationManager.currency}
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
                <QuotationControlSection
                  bankAccounts={bankAccounts}
                  currencies={currencies}
                  invoices={[]}
                  handleSubmitDraft={() => onSubmit(QUOTATION_STATUS.Draft)}
                  handleSubmitValidated={() => onSubmit(QUOTATION_STATUS.Validated)}
                  handleSubmitSent={() => onSubmit(QUOTATION_STATUS.Sent)}
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
