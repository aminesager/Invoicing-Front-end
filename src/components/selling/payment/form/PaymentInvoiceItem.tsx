import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Currency, PaymentInvoiceEntry } from '@/types';
import { transformDate } from '@/utils/date.utils';
import { useRouter } from 'next/router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';

interface PaymentInvoiceItemProps {
  className?: string;
  invoiceEntry: PaymentInvoiceEntry;
  currency?: Currency;
  convertionRate: number;
  onChange: (item: PaymentInvoiceEntry) => void;
}

export const PaymentInvoiceItem: React.FC<PaymentInvoiceItemProps> = ({
  className,
  invoiceEntry,
  convertionRate,
  currency,
  onChange
}) => {
  const router = useRouter();
  const { t: tInvoicing } = useTranslation('invoicing');

  const invoiceCurrency = invoiceEntry.invoice?.currency;
  const digitAfterComma = invoiceCurrency?.digitAfterComma || 2;

  const total = React.useMemo(() => {
    return dinero({
      amount: createDineroAmountFromFloatWithDynamicCurrency(
        invoiceEntry?.invoice?.total || 0,
        digitAfterComma
      ),
      precision: digitAfterComma
    });
  }, [invoiceEntry, digitAfterComma]);

  const amountPaid = React.useMemo(() => {
    return dinero({
      amount: createDineroAmountFromFloatWithDynamicCurrency(
        invoiceEntry?.invoice?.amountPaid || 0,
        digitAfterComma
      ),
      precision: digitAfterComma
    });
  }, [invoiceEntry, digitAfterComma]);

  const taxWithholdingAmount = React.useMemo(() => {
    return dinero({
      amount: createDineroAmountFromFloatWithDynamicCurrency(
        invoiceEntry?.invoice?.taxWithholdingAmount || 0,
        digitAfterComma
      ),
      precision: digitAfterComma
    });
  }, [invoiceEntry, digitAfterComma]);

  const remainingAmount = React.useMemo(() => {
    return total.subtract(amountPaid.add(taxWithholdingAmount));
  }, [total, amountPaid, taxWithholdingAmount]);

  const currentRemainingAmount = React.useMemo(() => {
    const amount = dinero({
      amount: createDineroAmountFromFloatWithDynamicCurrency(
        invoiceEntry.amount || 0,
        digitAfterComma
      ),
      precision: digitAfterComma
    });

    const convertedAmount = amount.multiply(
      invoiceCurrency?.id === currency?.id ? 1 : convertionRate || 1
    );

    return remainingAmount.subtract(convertedAmount);
  }, [remainingAmount, invoiceEntry.amount, convertionRate, digitAfterComma, invoiceCurrency]);

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
      onChange({ ...invoiceEntry, amount: newAmount });
    } else onChange({ ...invoiceEntry, amount: undefined });
  };

  return (
    <div className={cn('flex flex-row items-center justify-between', className)}>
      {/* Invoice Sequential */}
      <div className="w-2/12 flex flex-col gap-2">
        <Label className="font-thin">{tInvoicing('invoice.singular')} N°</Label>
        <Label
          className="underline cursor-pointer"
          onClick={() => {
            router.push(`/selling/invoice/${invoiceEntry.invoice?.id}`);
          }}>
          {invoiceEntry.invoice?.sequential || 'N/A'}
        </Label>
      </div>
      {/* Invoice Due Date */}
      <div className="w-2/12 flex flex-col gap-2">
        <Label className="font-thin">{tInvoicing('invoice.attributes.due_date')}</Label>
        <Label>
          {invoiceEntry.invoice?.dueDate ? (
            transformDate(invoiceEntry.invoice.dueDate)
          ) : (
            <span>Sans date</span>
          )}
        </Label>
      </div>
      {/* Total */}
      <div className="w-1/12 flex flex-col gap-2">
        <Label className="font-thin">{tInvoicing('invoice.attributes.total')}</Label>
        <Label>
          {total.toUnit()} {invoiceCurrency?.symbol || '$'}
        </Label>
      </div>
      {/* Amount Paid */}
      <div className="w-2/12 flex flex-col gap-2">
        <Label className="font-thin">{tInvoicing('invoice.attributes.payment')}</Label>
        <Input type="number" onChange={handleAmountPaidChange} value={invoiceEntry.amount} />
      </div>
      {/* Remaining Amount */}
      <div className="w-2/12 flex flex-col gap-2">
        <Label className="font-thin">{tInvoicing('invoice.attributes.remaining_amount')}</Label>
        <Label>
          {currentRemainingAmount.toUnit().toFixed(digitAfterComma)} {invoiceCurrency?.symbol}
        </Label>
      </div>
    </div>
  );
};
