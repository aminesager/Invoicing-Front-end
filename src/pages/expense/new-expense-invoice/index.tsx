import React from 'react';
import { ExpenseInvoiceCreateForm } from '@/components/expense/expense-invoice/ExpenseInvoiceCreateForm';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const params = useSearchParams();
  const firmId = params.get('firmId') || undefined;
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ExpenseInvoiceCreateForm firmId={firmId} />
    </div>
  );
}
