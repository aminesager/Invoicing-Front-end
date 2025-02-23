import React from 'react';
import { useRouter } from 'next/router';
import { ExpensePaymentUpdateForm } from '@/components/expense/expense-payment/ExpensePaymentUpdateForm';

export default function Page() {
  const router = useRouter();
  const id = router.query.id as string;
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ExpensePaymentUpdateForm expensePaymentId={id} />
    </div>
  );
}
