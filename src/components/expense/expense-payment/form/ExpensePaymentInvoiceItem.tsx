import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Currency, ExpensePaymentInvoiceEntry } from '@/types';
import { transformDate } from '@/utils/date.utils';
import { useRouter } from 'next/router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';

interface ExpensePaymentInvoiceItemProps {
  className?: string;
  expenseInvoiceEntry: ExpensePaymentInvoiceEntry;
  currency?: Currency;
  convertionRate: number;
  onChange: (item: ExpensePaymentInvoiceEntry) => void;
}

export const ExpensePaymentInvoiceItem: React.FC<ExpensePaymentInvoiceItemProps> = ({
  className,
  expenseInvoiceEntry,
  convertionRate,
  currency,
  onChange
}) => {
  const router = useRouter();
  const { t: tInvoicing } = useTranslation('invoicing');

  const expenseInvoiceCurrency = expenseInvoiceEntry.expenseInvoice?.currency;
  const digitAfterComma = expenseInvoiceCurrency?.digitAfterComma || 2;

  const total = React.useMemo(() => {
    return dinero({
      amount: createDineroAmountFromFloatWithDynamicCurrency(
        expenseInvoiceEntry?.expenseInvoice?.total || 0,
        digitAfterComma
      ),
      precision: digitAfterComma
    });
  }, [expenseInvoiceEntry, digitAfterComma]);

  const amountPaid = React.useMemo(() => {
    return dinero({
      amount: createDineroAmountFromFloatWithDynamicCurrency(
        expenseInvoiceEntry?.expenseInvoice?.amountPaid || 0,
        digitAfterComma
      ),
      precision: digitAfterComma
    });
  }, [expenseInvoiceEntry, digitAfterComma]);

  const taxWithholdingAmount = React.useMemo(() => {
    return dinero({
      amount: createDineroAmountFromFloatWithDynamicCurrency(
        expenseInvoiceEntry?.expenseInvoice?.taxWithholdingAmount || 0,
        digitAfterComma
      ),
      precision: digitAfterComma
    });
  }, [expenseInvoiceEntry, digitAfterComma]);

  const remainingAmount = React.useMemo(() => {
    return total.subtract(amountPaid.add(taxWithholdingAmount));
  }, [total, amountPaid, taxWithholdingAmount]);

  const currentRemainingAmount = React.useMemo(() => {
    const amount = dinero({
      amount: createDineroAmountFromFloatWithDynamicCurrency(
        expenseInvoiceEntry.amount || 0,
        digitAfterComma
      ),
      precision: digitAfterComma
    });

    const convertedAmount = amount.multiply(
      expenseInvoiceCurrency?.id === currency?.id ? 1 : convertionRate || 1
    );

    return remainingAmount.subtract(convertedAmount);
  }, [
    remainingAmount,
    expenseInvoiceEntry.amount,
    convertionRate,
    digitAfterComma,
    expenseInvoiceCurrency
  ]);

  const handleAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(!!e.target.value);
    if (e.target.value) {
      const inputValue = parseFloat(e.target.value);
      const rawValue = createDineroAmountFromFloatWithDynamicCurrency(
        inputValue,
        currency?.digitAfterComma || 3
      );

      const newAmount = dinero({
        amount: rawValue,
        precision: currency?.digitAfterComma || 3
      }).toUnit();
      onChange({ ...expenseInvoiceEntry, amount: newAmount });
    } else onChange({ ...expenseInvoiceEntry, amount: undefined });
  };

  return (
    <div className={cn('flex flex-row items-center justify-between', className)}>
      {/* Invoice Sequential */}
      <div className="w-2/12 flex flex-col gap-2">
        <Label className="font-thin">{tInvoicing('expense-invoice.singular')} N°</Label>
        <Label
          className="underline cursor-pointer"
          onClick={() => {
            router.push(`/expense/expense-invoice/${expenseInvoiceEntry.expenseInvoice?.id}`);
          }}>
          {expenseInvoiceEntry.expenseInvoice?.sequential || 'N/A'}
        </Label>
      </div>
      {/* Invoice Due Date */}
      <div className="w-2/12 flex flex-col gap-2">
        <Label className="font-thin">{tInvoicing('expense-invoice.attributes.due_date')}</Label>
        <Label>
          {expenseInvoiceEntry.expenseInvoice?.dueDate ? (
            transformDate(expenseInvoiceEntry.expenseInvoice.dueDate)
          ) : (
            <span>Sans date</span>
          )}
        </Label>
      </div>
      {/* Total */}
      <div className="w-1/12 flex flex-col gap-2">
        <Label className="font-thin">{tInvoicing('expense-invoice.attributes.total')}</Label>
        <Label>
          {total.toUnit()} {expenseInvoiceCurrency?.symbol || '$'}
        </Label>
      </div>
      {/* Amount Paid */}
      <div className="w-2/12 flex flex-col gap-2">
        <Label className="font-thin">
          {tInvoicing('expense-invoice.attributes.expense-payment')}
        </Label>
        <Input type="number" onChange={handleAmountPaidChange} value={expenseInvoiceEntry.amount} />
      </div>
      {/* Remaining Amount */}
      <div className="w-2/12 flex flex-col gap-2">
        <Label className="font-thin">
          {tInvoicing('expense-invoice.attributes.remaining_amount')}
        </Label>
        <Label>
          {currentRemainingAmount.toUnit().toFixed(digitAfterComma)}{' '}
          {expenseInvoiceCurrency?.symbol}
        </Label>
      </div>
    </div>
  );
};
