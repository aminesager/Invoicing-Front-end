import React from 'react';
import { ExpensePaymentCreateForm } from '@/components/expense/expense-payment/ExpensePaymentCreateForm';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const params = useSearchParams();
  const firmId = params.get('firmId') || undefined;
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ExpensePaymentCreateForm firmId={firmId} />
    </div>
  );
}
