import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Currency, ExpensePaymentInvoiceEntry } from '@/types';
import { ciel } from '@/utils/number.utils';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface ExpenseInvoicePaymentListProps {
  className?: string;
  expensePayments?: ExpensePaymentInvoiceEntry[];
  currencies?: Currency[];
}

export const ExpenseInvoicePaymentList = ({
  className,
  expensePayments,
  currencies
}: ExpenseInvoicePaymentListProps) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  return (
    <Accordion type="multiple" className={cn(className)}>
      <AccordionItem value="expense-invoice-list">
        <AccordionTrigger>
          <h1 className="font-bold">Liste des paiements</h1>
        </AccordionTrigger>
        <AccordionContent>
          <ul className="list-disc list-inside space-y-0.5">
            {expensePayments
              ?.sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
              .map((entry, index) => {
                const currency = currencies?.find(
                  (currency) => currency.id === entry?.expensePayment?.currencyId
                );
                const convertedAmount = ciel(
                  (entry?.amount || 0) / (entry?.expensePayment?.convertionRate || 0),
                  currency?.digitAfterComma
                );
                return (
                  <li key={entry.id} className="font-medium">
                    <Label>
                      <span>{`${tInvoicing('payment.singular')} ${(index + 1).toString().padStart(2, '0')} : `}</span>
                    </Label>
                    <Link
                      className="underline cursor-pointer"
                      href={`/expense/expense-payment/${entry?.expensePayment?.id}`}>
                      PAY-{entry.id} : {convertedAmount.toFixed(currency?.digitAfterComma)}
                      {currency?.symbol}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
