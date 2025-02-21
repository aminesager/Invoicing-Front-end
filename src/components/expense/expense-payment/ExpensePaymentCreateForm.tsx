import { useBreadcrumb } from '@/components/layout/BreadcrumbContext';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExpensePaymentGeneralInformation } from './form/ExpensePaymentGeneralInformation';
import useFirmChoices from '@/hooks/content/useFirmChoice';
import useCurrency from '@/hooks/content/useCurrency';
import { ExpensePaymentInvoiceManagement } from './form/ExpensePaymentInvoiceManagement';
import { ExpensePaymentFinancialInformation } from './form/ExpensePaymentFinancialInformation';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/api';
import { useExpensePaymentManager } from './hooks/useExpensePaymentManager';
import { useMutation } from '@tanstack/react-query';
import { getErrorMessage } from '@/utils/errors';
import { toast } from 'sonner';
import { CreateExpensePaymentDto, ExpensePaymentInvoiceEntry } from '@/types';
import { useExpensePaymentInvoiceManager } from './hooks/useExpensePaymentInvoiceManager';
import { ExpensePaymentControlSection } from './form/ExpensePaymentControlSection';
import useCabinet from '@/hooks/content/useCabinet';
import { ExpensePaymentExtraOptions } from './form/ExpensePaymentExtraOptions';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';

interface ExpensePaymentFormProps {
  className?: string;
  firmId?: string;
}

export const ExpensePaymentCreateForm = ({ className, firmId }: ExpensePaymentFormProps) => {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const { setRoutes } = useBreadcrumb();
  const expensePaymentManager = useExpensePaymentManager();
  const expenseInvoiceManager = useExpensePaymentInvoiceManager();

  React.useEffect(() => {
    setRoutes(
      !firmId
        ? [
            { title: tCommon('menu.selling'), href: '/selling' },
            { title: tInvoicing('expensepayment.plural'), href: '/expense/expense-payments' },
            { title: tInvoicing('expense-payment.new') }
          ]
        : []
    );
  }, [router.locale, firmId]);

  // Fetch options
  const { currencies, isFetchCurrenciesPending } = useCurrency();
  const { cabinet, isFetchCabinetPending } = useCabinet();

  React.useEffect(() => {
    expensePaymentManager.set('currencyId', cabinet?.currency?.id);
  }, [cabinet]);

  const { firms, isFetchFirmsPending } = useFirmChoices([
    'currency',
    'expense-invoices',
    'expense-invoices.currency'
  ]);

  const currency = React.useMemo(() => {
    return currencies.find((c) => c.id === expensePaymentManager.currencyId);
  }, [expensePaymentManager.currencyId, currencies]);

  const { mutate: ExpensecreatePayment, isPending: isCreatePending } = useMutation({
    mutationFn: (data: { expensePayment: ExpenseCreatePaymentDto; files: File[] }) =>
      api.expensePayment.create(data.expensePayment, data.files),
    onSuccess: () => {
      toast.success('Paiement crée avec succès');
      router.push('/expense/expense-payments');
    },
    onError: (error) => {
      const message = getErrorMessage('', error, 'Erreur lors de la création de paiement');
      toast.error(message);
    }
  });

  //Reset Form
  const globalReset = () => {
    expensePaymentManager.reset();
    expenseInvoiceManager.reset();
  };

  React.useEffect(() => {
    globalReset();
  }, []);

  const onSubmit = () => {
    const expenseInvoices: ExpensePaymentInvoiceEntry[] = expenseInvoiceManager
      .getInvoices()
      .map((expenseInvoice: ExpensePaymentInvoiceEntry) => ({
        expenseInvoiceId: expenseInvoice.expenseInvoice?.id,
        amount: expenseInvoice.amount
      }));

    const used = expenseInvoiceManager.calculateUsedAmount();
    const paid = dinero({
      amount: createDineroAmountFromFloatWithDynamicCurrency(
        (expensePaymentManager.amount || 0) + (expensePaymentManager.fee || 0),
        currency?.digitAfterComma || 3
      ),
      precision: currency?.digitAfterComma || 3
    }).toUnit();

    const expensePayment: CreateExpensePaymentDto = {
      amount: expensePaymentManager.amount,
      fee: expensePaymentManager.fee,
      convertionRate: expensePaymentManager.convertionRate,
      date: expensePaymentManager.date?.toString(),
      mode: expensePaymentManager.mode,
      notes: expensePaymentManager.notes,
      currencyId: expensePaymentManager.currencyId,
      firmId: expensePaymentManager.firmId,
      expenseInvoices
    };
    const validation = api.expensePayment.validate(expensePayment, used, paid);
    if (validation.message) {
      toast.error(validation.message);
    } else {
      ExpensecreatePayment({
        expensePayment,
        files: expensePaymentManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
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
                <ExpensePaymentGeneralInformation
                  className="pb-5 border-b"
                  firms={firms}
                  currencies={currencies.filter(
                    (c) =>
                      c.id == cabinet?.currencyId || c.id == expensePaymentManager?.firm?.currencyId
                  )}
                  loading={loading}
                />
                {/* Invoice Management */}
                {expensePaymentManager.firmId && (
                  <ExpensePaymentInvoiceManagement className="pb-5 border-b" loading={loading} />
                )}
                {/* Extra Options (files) */}
                <div>
                  <ExpensePaymentExtraOptions loading={loading} />
                </div>
                <div className="flex gap-10 mt-5">
                  <Textarea
                    placeholder={tInvoicing('expense-payment.attributes.notes')}
                    className="resize-none w-2/3"
                    rows={7}
                  />
                  <div className="w-1/3 my-auto">
                    {/* Final Financial Information */}
                    <ExpensePaymentFinancialInformation currency={currency} />
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
                <ExpensePaymentControlSection
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
