import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const useExpensePaymentCondition = (enabled: boolean = true) => {
  const { isPending: isFetchExpensePaymentConditionsPending, data: expensePaymentConditionsResp } =
    useQuery({
      queryKey: ['expense-payment-conditions'],
      queryFn: () => api.expensePaymentCondition.find(),
      enabled
    });

  const expensePaymentConditions = React.useMemo(() => {
    if (!expensePaymentConditionsResp) return [];
    return expensePaymentConditionsResp;
  }, [expensePaymentConditionsResp]);

  return {
    expensePaymentConditions,
    isFetchExpensePaymentConditionsPending
  };
};

export default useExpensePaymentCondition;
