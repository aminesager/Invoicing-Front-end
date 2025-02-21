import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const useExpenseQuotation = (id: number, enabled: boolean = true) => {
  const { isPending: isFetchExpenseQuotationPending, data: expenseQuotationResp } = useQuery({
    queryKey: [`expenseQuotation-${id}`],
    queryFn: () => api.expenseQuotation.findOne(id),
    enabled: !!id && enabled
  });

  const expenseQuotation = React.useMemo(() => {
    if (!expenseQuotationResp) return null;
    return expenseQuotationResp;
  }, [expenseQuotationResp]);

  return {
    expenseQuotation,
    isFetchExpenseQuotationPending
  };
};

export default useExpenseQuotation;
