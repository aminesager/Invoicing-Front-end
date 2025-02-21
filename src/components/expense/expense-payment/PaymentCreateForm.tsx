import { useBreadcrumb } from '@/components/layout/BreadcrumbContext';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { PaymentGeneralInformation } from './form/PaymentGeneralInformation';
import useFirmChoices from '@/hooks/content/useFirmChoice';
import useCurrency from '@/hooks/content/useCurrency';
import { PaymentInvoiceManagement } from './form/PaymentInvoiceManagement';
import { PaymentFinancialInformation } from './form/PaymentFinancialInformation';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/api';
import { usePaymentManager } from './hooks/usePaymentManager';
import { useMutation } from '@tanstack/react-query';
import { getErrorMessage } from '@/utils/errors';
import { toast } from 'sonner';
import { CreatePaymentDto, PaymentInvoiceEntry } from '@/types';
import { usePaymentInvoiceManager } from './hooks/usePaymentInvoiceManager';
import { PaymentControlSection } from './form/PaymentControlSection';
import useCabinet from '@/hooks/content/useCabinet';
import { PaymentExtraOptions } from './form/PaymentExtraOptions';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';

interface PaymentFormProps {
  className?: string;
  firmId?: string;
}

export const PaymentCreateForm = ({ className, firmId }: PaymentFormProps) => {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const { setRoutes } = useBreadcrumb();
  const paymentManager = usePaymentManager();
  const invoiceManager = usePaymentInvoiceManager();

  React.useEffect(() => {
    setRoutes(
      !firmId
        ? [
            { title: tCommon('menu.selling'), href: '/selling' },
            { title: tInvoicing('payment.plural'), href: '/selling/payments' },
            { title: tInvoicing('payment.new') }
          ]
        : []
    );
  }, [router.locale, firmId]);

  // Fetch options
  const { currencies, isFetchCurrenciesPending } = useCurrency();
  const { cabinet, isFetchCabinetPending } = useCabinet();

  React.useEffect(() => {
    paymentManager.set('currencyId', cabinet?.currency?.id);
  }, [cabinet]);

  const { firms, isFetchFirmsPending } = useFirmChoices([
    'currency',
    'invoices',
    'invoices.currency'
  ]);

  const currency = React.useMemo(() => {
    return currencies.find((c) => c.id === paymentManager.currencyId);
  }, [paymentManager.currencyId, currencies]);

  const { mutate: createPayment, isPending: isCreatePending } = useMutation({
    mutationFn: (data: { payment: CreatePaymentDto; files: File[] }) =>
      api.payment.create(data.payment, data.files),
    onSuccess: () => {
      toast.success('Paiement crée avec succès');
      router.push('/selling/payments');
    },
    onError: (error) => {
      const message = getErrorMessage('', error, 'Erreur lors de la création de paiement');
      toast.error(message);
    }
  });

  //Reset Form
  const globalReset = () => {
    paymentManager.reset();
    invoiceManager.reset();
  };

  React.useEffect(() => {
    globalReset();
  }, []);

  const onSubmit = () => {
    const invoices: PaymentInvoiceEntry[] = invoiceManager
      .getInvoices()
      .map((invoice: PaymentInvoiceEntry) => ({
        invoiceId: invoice.invoice?.id,
        amount: invoice.amount
      }));

    const used = invoiceManager.calculateUsedAmount();
    const paid = dinero({
      amount: createDineroAmountFromFloatWithDynamicCurrency(
        (paymentManager.amount || 0) + (paymentManager.fee || 0),
        currency?.digitAfterComma || 3
      ),
      precision: currency?.digitAfterComma || 3
    }).toUnit();

    const payment: CreatePaymentDto = {
      amount: paymentManager.amount,
      fee: paymentManager.fee,
      convertionRate: paymentManager.convertionRate,
      date: paymentManager.date?.toString(),
      mode: paymentManager.mode,
      notes: paymentManager.notes,
      currencyId: paymentManager.currencyId,
      firmId: paymentManager.firmId,
      invoices
    };
    const validation = api.payment.validate(payment, used, paid);
    if (validation.message) {
      toast.error(validation.message);
    } else {
      createPayment({
        payment,
        files: paymentManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
      });
      globalReset();
    }
  };

  const loading = isFetchFirmsPending || isFetchCurrenciesPending || isFetchCabinetPending;
  return (
    <div className={cn('overflow-auto px-10 py-6', className)}>
      {/* Main Container */}
      <div className={cn('block xl:flex gap-4', false ? 'pointer-events-none' : '')}>
        {/* First Card */}
        <div className="w-full h-auto flex flex-col xl:w-9/12">
          <ScrollArea className=" max-h-[calc(100vh-120px)] border rounded-lg">
            <Card className="border-0 p-2">
              <CardContent className="p-5">
                {/* General Information */}
                <PaymentGeneralInformation
                  className="pb-5 border-b"
                  firms={firms}
                  currencies={currencies.filter(
                    (c) => c.id == cabinet?.currencyId || c.id == paymentManager?.firm?.currencyId
                  )}
                  loading={loading}
                />
                {/* Invoice Management */}
                {paymentManager.firmId && (
                  <PaymentInvoiceManagement className="pb-5 border-b" loading={loading} />
                )}
                {/* Extra Options (files) */}
                <div>
                  <PaymentExtraOptions loading={loading} />
                </div>
                <div className="flex gap-10 mt-5">
                  <Textarea
                    placeholder={tInvoicing('payment.attributes.notes')}
                    className="resize-none w-2/3"
                    rows={7}
                  />
                  <div className="w-1/3 my-auto">
                    {/* Final Financial Information */}
                    <PaymentFinancialInformation currency={currency} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollArea>
        </div>
        {/* Second Card */}
        <div className="w-full xl:mt-0 xl:w-3/12">
          <ScrollArea className=" h-fit border rounded-lg">
            <Card className="border-0">
              <CardContent className="p-5 ">
                <PaymentControlSection
                  handleSubmit={onSubmit}
                  reset={globalReset}
                  loading={false}
                />
              </CardContent>
            </Card>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
