import React from 'react';
import { Currency, Tax } from '@/types';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useExpensePaymentInvoiceManager } from '../hooks/useExpensePaymentInvoiceManager';
import { useExpensePaymentManager } from '../hooks/useExpensePaymentManager';
import { ciel } from '@/utils/number.utils';

interface ExpensePaymentFinancialInformationProps {
  className?: string;
  currency?: Currency;
  loading?: boolean;
}

export const ExpensePaymentFinancialInformation = ({
  className,
  currency,
  loading
}: ExpensePaymentFinancialInformationProps) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const expensePaymentManager = useExpensePaymentManager();
  const expenseInvoiceManager = useExpensePaymentInvoiceManager();

  //get currency symbol
  const currencySymbol = React.useMemo(() => currency?.symbol || '$', [currency]);

  const currencyDigitAfterComma = React.useMemo(() => currency?.digitAfterComma || 0, [currency]);
  const customCiel = React.useCallback(
    (n: number) => ciel(n, currencyDigitAfterComma + 1),
    [currencyDigitAfterComma]
  );

  const amountPaid = React.useMemo(() => {
    return expensePaymentManager.amount || 0;
  }, [expensePaymentManager.amount]);

  const fee = React.useMemo(() => {
    return expensePaymentManager.fee || 0;
  }, [expensePaymentManager.fee]);

  const available = React.useMemo(() => {
    return customCiel(amountPaid + fee);
  }, [customCiel, amountPaid, fee]);

  const used = React.useMemo(() => {
    return expenseInvoiceManager.calculateUsedAmount();
  }, [expenseInvoiceManager, currencyDigitAfterComma]);

  const remaining_amount = React.useMemo(() => {
    return customCiel(available - used);
  }, [customCiel, available, used]);

  return (
    <div className={cn(className)}>
      <div className="flex flex-col w-full">
        <div className="flex my-2">
          <Label className="mr-auto">
            {tInvoicing('expense-payment.financial_status.received')}
          </Label>
          <Label className="ml-auto" isPending={loading || false}>
            {available?.toFixed(currencyDigitAfterComma)} {currencySymbol}
          </Label>
        </div>
      </div>
      <div className="flex flex-col w-full mt-1">
        <div className="flex my-2">
          <Label className="mr-auto">{tInvoicing('expense-payment.financial_status.used')}</Label>
          <Label className="ml-auto" isPending={loading || false}>
            {used?.toFixed(currencyDigitAfterComma)} {currencySymbol}
          </Label>
        </div>
      </div>
      <div className="flex flex-col w-full border-t pt-1">
        <div className="flex my-2">
          <Label className="mr-auto">
            {tInvoicing('expense-payment.financial_status.available')}
          </Label>
          <Label className="ml-auto" isPending={loading || false}>
            {remaining_amount?.toFixed(currencyDigitAfterComma)} {currencySymbol}
          </Label>
        </div>
      </div>
    </div>
  );
};
