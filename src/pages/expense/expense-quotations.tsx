import React from 'react';
import { ExpenseQuotationMain } from '@/components/expense/expense-quotation/ExpenseQuotationMain';

export default function QuotationsPage() {
  return (
    <div className="flex-1 flex flex-col overflow-auto p-8">
      <ExpenseQuotationMain className="p-5 my-10" />
    </div>
  );
}
