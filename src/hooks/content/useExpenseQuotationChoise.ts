import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';
import { EXPENSE_QUOTATION_STATUS } from '@/types';

const useExpenseQuotationChoices = (status: EXPENSE_QUOTATION_STATUS, enabled: boolean = true) => {
  const { isPending: isFetchExpenseQuotationPending, data: expenseQuotationsResp } = useQuery({
    queryKey: ['expense-quotation-choices', status],
    queryFn: () => api.expenseQuotation.findChoices(status),
    enabled: enabled
  });

  const expenseQuotations = React.useMemo(() => {
    if (!expenseQuotationsResp) return [];
    return expenseQuotationsResp;
  }, [expenseQuotationsResp]);

  return {
    expenseQuotations,
    isFetchExpenseQuotationPending
  };
};

export default useExpenseQuotationChoices;
