import React from 'react';
import { ExpenseQuotationCreateForm } from '@/components/expense/expense-quotation/ExpenseQuotationCreateForm';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const params = useSearchParams();
  const firmId = params.get('firmId') || undefined;
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ExpenseQuotationCreateForm firmId={firmId} />
    </div>
  );
}
