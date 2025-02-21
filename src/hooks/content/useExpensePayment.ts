import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const useExpensePayment = (id: number, enabled: boolean = true) => {
  const { isPending: isFetchExpensePaymentPending, data: expensePaymentResp } = useQuery({
    queryKey: [`expense-payment-${id}`],
    queryFn: () => api.expensePayment.findOne(id),
    enabled: !!id && enabled
  });

  const expensePayment = React.useMemo(() => {
    if (!expensePaymentResp) return null;
    return expensePaymentResp;
  }, [expensePaymentResp]);

  return {
    expensePayment,
    isFetchExpensePaymentPending
  };
};

export default useExpensePayment;
