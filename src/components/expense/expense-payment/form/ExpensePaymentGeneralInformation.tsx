import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useExpensePaymentManager } from '../hooks/useExpensePaymentManager';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectShimmer,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Currency, Firm, EXPENSE_INVOICE_STATUS, EXPENSE_PAYMENT_MODE } from '@/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import React from 'react';
import { CalendarDatePicker } from '@/components/ui/calendar-day-picker';
import { useExpensePaymentInvoiceManager } from '../hooks/useExpensePaymentInvoiceManager';

interface ExpensePaymentGeneralInformationProps {
  className?: string;
  firms: Firm[];
  currencies: Currency[];
  loading?: boolean;
}

export const ExpensePaymentGeneralInformation = ({
  className,
  firms,
  currencies,
  loading
}: ExpensePaymentGeneralInformationProps) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const { t: tCurrency } = useTranslation('currency');

  const expensePaymentManager = useExpensePaymentManager();
  const expenseInvoiceManager = useExpensePaymentInvoiceManager();

  return (
    <div className={cn('flex flex-col gap-8', className)}>
      <div className="flex flex-row gap-2">
        {/* Date */}
        <div className="flex flex-col gap-2 w-1/2">
          <Label>{tInvoicing('invoice.attributes.date')} (*)</Label>
          <CalendarDatePicker
            label={tCommon('pick_date')}
            date={
              expensePaymentManager?.date
                ? { from: expensePaymentManager?.date, to: undefined }
                : { from: undefined, to: undefined }
            }
            onDateSelect={({ from, to }) => {
              expensePaymentManager.set('date', from);
            }}
            variant="outline"
            numberOfMonths={1}
            className="w-full py-4 mt-1"
            isPending={loading}
          />
        </div>
        {/* Firm */}
        <div className="flex flex-col gap-2 w-1/2">
          <Label>{tCommon('submenu.firms')} (*)</Label>
          <SelectShimmer isPending={loading}>
            <Select
              onValueChange={(e) => {
                const firm = firms?.find((firm) => firm.id === parseInt(e));
                expensePaymentManager.set('firmId', firm?.id);
                expensePaymentManager.set('firm', firm);
                expensePaymentManager.set('currencyId', firm?.currency?.id);
                expensePaymentManager.set('currency', firm?.currency);
                expenseInvoiceManager.reset();
                firm?.expenseInvoices?.forEach((expenseInvoice) => {
                  if (
                    expenseInvoice?.status &&
                    [
                      EXPENSE_INVOICE_STATUS.PartiallyPaid,
                      EXPENSE_INVOICE_STATUS.Sent,
                      EXPENSE_INVOICE_STATUS.Unpaid
                    ].includes(expenseInvoice?.status)
                  )
                    expenseInvoiceManager.add({
                      amount: 0,
                      expenseInvoiceId: expenseInvoice.id,
                      expenseInvoice: expenseInvoice
                    });
                });
              }}
              value={expensePaymentManager.firmId?.toString()}>
              <SelectTrigger>
                <SelectValue placeholder={tInvoicing('invoice.associate_firm')} />
              </SelectTrigger>
              <SelectContent>
                {firms?.map((firm: Partial<Firm>) => (
                  <SelectItem key={firm.id} value={firm.id?.toString() || ''} className="mx-1">
                    {firm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SelectShimmer>
        </div>
      </div>
      <div className="flex flex-row gap-2">
        {/* Currency */}
        <div className="flex flex-col gap-2 w-1/3">
          <Label>{tInvoicing('payment.attributes.currency')}</Label>
          <SelectShimmer isPending={loading}>
            <Select
              key={expensePaymentManager.currencyId || 'currency'}
              onValueChange={(e) => {
                const currency = currencies.find((currency) => currency.id == parseInt(e));
                expensePaymentManager.set('currencyId', currency?.id);
                expensePaymentManager.set('currency', currency);
                expenseInvoiceManager.init();
              }}
              disabled={currencies.length == 1}
              defaultValue={
                expensePaymentManager?.currencyId
                  ? expensePaymentManager?.currencyId?.toString()
                  : undefined
              }>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tInvoicing('controls.currency_select_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {currencies?.map((currency: Currency) => {
                  return (
                    <SelectItem key={currency.id} value={currency?.id?.toString() || ''}>
                      {currency?.code && tCurrency(currency?.code)} ({currency.symbol})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </SelectShimmer>
        </div>
        {/* Convertion Rate */}
        <div className="flex flex-col gap-2 w-1/3">
          <Label>{tInvoicing('payment.attributes.convertion_rate')}</Label>
          <Input
            type="number"
            placeholder="1"
            value={expensePaymentManager.convertionRate}
            onChange={(e) => {
              expensePaymentManager.set('convertionRate', parseFloat(e.target.value));
            }}
          />
        </div>
        {/* Mode */}
        <div className="flex flex-col gap-2 w-1/3">
          <Label>{tInvoicing('payment.attributes.mode')} (*)</Label>
          <SelectShimmer isPending={loading || false}>
            <Select
              onValueChange={(e) => {
                expensePaymentManager.set('mode', e);
              }}
              value={expensePaymentManager?.mode || ''}>
              <SelectTrigger>
                <SelectValue placeholder={tInvoicing('payment.attributes.mode')} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(EXPENSE_PAYMENT_MODE).map((title) => (
                  <SelectItem key={title} value={title}>
                    {tInvoicing(title)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SelectShimmer>
        </div>
      </div>
      <div className="flex flex-row gap-2 ">
        {/* Amount */}
        <div className="flex flex-col gap-2 w-1/3">
          <Label>{tInvoicing('payment.attributes.amount')}</Label>
          <Input
            type="number"
            placeholder="0"
            value={expensePaymentManager.amount}
            onChange={(e) => {
              expensePaymentManager.set('amount', parseFloat(e.target.value));
            }}
          />
        </div>
        {/* Fee */}
        <div className="flex flex-col gap-2 w-1/3">
          <Label>{tInvoicing('payment.attributes.fee')}</Label>
          <Input
            type="number"
            placeholder="0"
            value={expensePaymentManager.fee}
            onChange={(e) => {
              expensePaymentManager.set('fee', parseFloat(e.target.value));
            }}
          />
        </div>
      </div>
    </div>
  );
};
