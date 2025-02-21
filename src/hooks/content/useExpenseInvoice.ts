import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const useExpenseInvoice = (id: number, enabled: boolean = true) => {
  const { isPending: isFetchExpenseInvoicePending, data: expenseInvoiceResp } = useQuery({
    queryKey: [`invoice-${id}`],
    queryFn: () => api.expenseInvoice.findOne(id),
    enabled: !!id && enabled
  });

  const expenseInvoice = React.useMemo(() => {
    if (!expenseInvoiceResp) return null;
    return expenseInvoiceResp;
  }, [expenseInvoiceResp]);

  return {
    expenseInvoice,
    isFetchExpenseInvoicePending
  };
};

export default useExpenseInvoice;
