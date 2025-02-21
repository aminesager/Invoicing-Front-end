import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ExpenseInvoice } from '@/types';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface ExpenseQuotationInvoiceListProps {
  className?: string;
  expenseInvoices: ExpenseInvoice[];
}

export const ExpenseQuotationInvoiceList = ({
  className,
  expenseInvoices
}: ExpenseQuotationInvoiceListProps) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  return (
    <Accordion type="multiple" className={cn(className)}>
      <AccordionItem value="invoice-list">
        <AccordionTrigger>
          <h1 className="font-bold">{tInvoicing('invoice.invoice_list')}</h1>
        </AccordionTrigger>
        <AccordionContent>
          <ul className="list-disc list-inside space-y-0.5">
            {expenseInvoices
              .sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
              .map((expenseInvoice, index) => (
                <li key={expenseInvoice.id} className="font-medium">
                  <Label>
                    <span>{`${tInvoicing('invoice.singular')} ${(index + 1).toString().padStart(2, '0')} : `}</span>
                  </Label>
                  <Link
                    className="underline cursor-pointer"
                    href={`/expense/expense-invoice/${expenseInvoice.id}`}>
                    {expenseInvoice.sequential}
                  </Link>
                </li>
              ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
