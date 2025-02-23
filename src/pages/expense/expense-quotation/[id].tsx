import React from 'react';
import { ExpenseQuotationUpdateForm } from '@/components/expense/expense-quotation/ExpenseQuotationUpdateForm';
import { useRouter } from 'next/router';

export default function Page() {
  const router = useRouter();
  const id = router.query.id as string;
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ExpenseQuotationUpdateForm expenseQuotationId={id} />
    </div>
  );
}
