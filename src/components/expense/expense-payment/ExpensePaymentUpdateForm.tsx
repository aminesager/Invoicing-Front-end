import React from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/api';
import { ExpensePayment, ExpensePaymentInvoiceEntry, UpdateExpensePaymentDto } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getErrorMessage } from '@/utils/errors';
import _ from 'lodash';
import useCurrency from '@/hooks/content/useCurrency';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/router';
import { useBreadcrumb } from '@/components/layout/BreadcrumbContext';
import useInitializedState from '@/hooks/use-initialized-state';
import { useExpensePaymentManager } from './hooks/useExpensePaymentManager';
import { useExpensePaymentInvoiceManager } from './hooks/useExpensePaymentInvoiceManager';
import useFirmChoices from '@/hooks/content/useFirmChoice';
import { ExpensePaymentGeneralInformation } from './form/ExpensePaymentGeneralInformation';
import { ExpensePaymentInvoiceManagement } from './form/ExpensePaymentInvoiceManagement';
import { Textarea } from '@/components/ui/textarea';
import { ExpensePaymentFinancialInformation } from './form/ExpensePaymentFinancialInformation';
import { ExpensePaymentControlSection } from './form/ExpensePaymentControlSection';
import useCabinet from '@/hooks/content/useCabinet';
import { ExpensePaymentExtraOptions } from './form/ExpensePaymentExtraOptions';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';

interface ExpensePaymentFormProps {
  className?: string;
  expensePaymentId: string;
}

export const ExpensePaymentUpdateForm = ({
  className,
  expensePaymentId
}: ExpensePaymentFormProps) => {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const { setRoutes } = useBreadcrumb();
  const expensePaymentManager = useExpensePaymentManager();
  const expenseInvoiceManager = useExpensePaymentInvoiceManager();

  //Fetch options
  const {
    isPending: isFetchPending,
    data: expensePaymentResp,
    refetch: refetchInvoice
  } = useQuery({
    queryKey: ['expenseInvoice', expensePaymentId],
    queryFn: () => api.expensePayment.findOne(parseInt(expensePaymentId))
  });

  const expensePayment = React.useMemo(() => {
    return expensePaymentResp || null;
  }, [expensePaymentResp]);

  React.useEffect(() => {
    if (expensePayment?.id)
      setRoutes([
        { title: tCommon('menu.expense'), href: '/expense' },
        { title: tInvoicing('payment.plural'), href: '/expense/expense-payments' },
        { title: tInvoicing('payment.singular') + ' N° ' + expensePayment?.id }
      ]);
  }, [router.locale, expensePayment?.id]);

  // Fetch options
  const { currencies, isFetchCurrenciesPending } = useCurrency();
  const { cabinet, isFetchCabinetPending } = useCabinet();

  React.useEffect(() => {
    expensePaymentManager.set('currencyId', cabinet?.currency?.id);
  }, [cabinet]);

  const { firms, isFetchFirmsPending } = useFirmChoices([
    'currency',
    'expenseInvoices',
    'expenseInvoices.currency'
  ]);
  const fetching =
    isFetchPending || isFetchFirmsPending || isFetchCurrenciesPending || isFetchCabinetPending;

  const setExpensePaymentData = (data: Partial<ExpensePayment>) => {
    //invoice infos
    expensePaymentManager.setExpensePayment({
      ...data,
      firm: firms.find((firm) => firm.id === data.firmId)
    });
    //invoice article infos
    data?.expenseInvoices &&
      data.convertionRate &&
      data.currency &&
      expenseInvoiceManager.setInvoices(
        data?.expenseInvoices,
        data.currency,
        data.convertionRate,
        'EDIT'
      );
  };

  const { isDisabled, globalReset } = useInitializedState({
    data: expensePayment || ({} as Partial<ExpensePayment>),
    getCurrentData: () => {
      return {
        expensePayment: expensePaymentManager.getExpensePayment(),
        expenseInvoices: expenseInvoiceManager.getInvoices()
      };
    },
    setFormData: (data: Partial<ExpensePayment>) => {
      setExpensePaymentData(data);
    },
    resetData: () => {
      expensePaymentManager.reset();
      expenseInvoiceManager.reset();
    },
    loading: fetching
  });

  const currency = React.useMemo(() => {
    return currencies.find((c) => c.id === expensePaymentManager.currencyId);
  }, [expensePaymentManager.currencyId, currencies]);

  const { mutate: updateExpensePayment, isPending: isUpdatePending } = useMutation({
    mutationFn: (data: { expensePayment: UpdateExpensePaymentDto; files: File[] }) =>
      api.expensePayment.update(data.expensePayment, data.files),
    onSuccess: () => {
      toast.success('Paiement modifié avec succès');
      router.push('/expense/expense-payments');
    },
    onError: (error) => {
      const message = getErrorMessage('', error, 'Erreur lors de la mise à jour de paiement');
      toast.error(message);
    }
  });

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

    const expensePayment: UpdateExpensePaymentDto = {
      id: expensePaymentManager.id,
      amount: expensePaymentManager.amount,
      fee: expensePaymentManager.fee,
      convertionRate: expensePaymentManager.convertionRate,
      date: expensePaymentManager.date?.toString(),
      mode: expensePaymentManager.mode,
      notes: expensePaymentManager.notes,
      currencyId: expensePaymentManager.currencyId,
      firmId: expensePaymentManager.firmId,
      expenseInvoices,
      uploads: expensePaymentManager.uploadedFiles.filter((u) => !!u.upload).map((u) => u.upload)
    };
    const validation = api.expensePayment.validate(expensePayment, used, paid);
    if (validation.message) {
      toast.error(validation.message);
    } else {
      updateExpensePayment({
        expensePayment,
        files: expensePaymentManager.uploadedFiles.filter((u) => !u.upload).map((u) => u.file)
      });
    }
  };

  return (
    <div className={cn('overflow-auto px-10 py-6', className)}>
      {/* Main Container */}
      <div className={cn('block xl:flex gap-4', false ? 'pointer-events-none' : '')}>
        {/* First Card */}
        <div className="w-full h-auto flex flex-col xl:w-9/12">
          <ScrollArea className=" max-h-[calc(100vh-120px)] border rounded-lg">
            <Card className="border-0 p-2">
              <CardContent className="p-5">
                <ExpensePaymentGeneralInformation
                  className="pb-5 border-b"
                  firms={firms}
                  currencies={currencies.filter(
                    (c) =>
                      c.id == cabinet?.currencyId || c.id == expensePaymentManager?.firm?.currencyId
                  )}
                  loading={fetching}
                />
                {expensePaymentManager.firmId && (
                  <ExpensePaymentInvoiceManagement className="pb-5 border-b" loading={fetching} />
                )}
                {/* Extra Options (files) */}
                <div>
                  <ExpensePaymentExtraOptions loading={fetching} />
                </div>
                <div className="flex gap-10 mt-5">
                  <Textarea
                    placeholder={tInvoicing('payment.attributes.notes')}
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
