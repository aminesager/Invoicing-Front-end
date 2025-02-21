import React from 'react';
import { api } from '@/api';
import { useQuery } from '@tanstack/react-query';

const useExpenseInvoiceRangeDates = (id?: number, enabled: boolean = true) => {
  const { isLoading: isFetchExpenseInvoiceRangePending, data: expenseInvoiceRangeResp } = useQuery({
    queryKey: [`expense-invoice-range-${id}`],
    queryFn: () => api.expenseInvoice.findByRange(id),
    enabled: !!id && enabled
  });

  const dateRange = React.useMemo(() => {
    if (!expenseInvoiceRangeResp) return {};
    //previous date
    const previousDate = expenseInvoiceRangeResp.previous?.date
      ? new Date(expenseInvoiceRangeResp.previous.date)
      : undefined;

    //next date
    const nextDate = expenseInvoiceRangeResp.next?.date
      ? new Date(expenseInvoiceRangeResp.next.date)
      : undefined;

    return {
      from: previousDate,
      to: nextDate
    };
  }, [expenseInvoiceRangeResp]);

  return {
    dateRange,
    isFetchExpenseInvoiceRangePending
  };
};

export default useExpenseInvoiceRangeDates;
