import { api } from '@/api';
import { BreadcrumbRoute, useBreadcrumb } from '@/components/layout/BreadcrumbContext';
import { useDebounce } from '@/hooks/other/useDebounce';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExpensePaymentActionsContext } from './data-table/ActionsContext';
import { DataTable } from './data-table/data-table';
import { getExpensePaymentColumns } from './data-table/columns';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errors';
import { useExpensePaymentManager } from './hooks/useExpensePaymentManager';
import { ExpensePaymentDeleteDialog } from './dialogs/ExpensePaymentDeleteDialog';
import ContentSection from '@/components/common/ContentSection';
import { cn } from '@/lib/utils';

interface ExpensePaymentEmbeddedMainProps {
  className?: string;
  firmId?: number;
  interlocutorId?: number;
  routes?: BreadcrumbRoute[];
}

export const ExpensePaymentEmbeddedMain: React.FC<ExpensePaymentEmbeddedMainProps> = ({
  className,
  firmId,
  interlocutorId,
  routes
}) => {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const { t: tCurrency } = useTranslation('currency');

  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    if (routes && (firmId || interlocutorId))
      setRoutes([...routes, { title: tCommon('submenu.payments') }]);
  }, [router.locale, firmId, interlocutorId, routes]);

  const expensePaymentManager = useExpensePaymentManager();

  const [page, setPage] = React.useState(1);
  const { value: debouncedPage, loading: paging } = useDebounce<number>(page, 500);

  const [size, setSize] = React.useState(5);
  const { value: debouncedSize, loading: resizing } = useDebounce<number>(size, 500);

  const [sortDetails, setSortDetails] = React.useState({ order: true, sortKey: 'id' });
  const { value: debouncedSortDetails, loading: sorting } = useDebounce<typeof sortDetails>(
    sortDetails,
    500
  );

  const [searchTerm, setSearchTerm] = React.useState('');
  const { value: debouncedSearchTerm, loading: searching } = useDebounce<string>(searchTerm, 500);

  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [downloadDialog, setDownloadDialog] = React.useState(false);

  const {
    isPending: isFetchPending,
    error,
    data: expensePaymentsResp,
    refetch: refetchExpensePayments
  } = useQuery({
    queryKey: [
      'expense-payments',
      debouncedPage,
      debouncedSize,
      debouncedSortDetails.order,
      debouncedSortDetails.sortKey,
      debouncedSearchTerm
    ],
    queryFn: () =>
      api.expensePayment.findPaginated(
        debouncedPage,
        debouncedSize,
        debouncedSortDetails.order ? 'ASC' : 'DESC',
        debouncedSortDetails.sortKey,
        debouncedSearchTerm,
        ['currency'],
        firmId,
        interlocutorId
      )
  });

  const expensePayments = React.useMemo(() => {
    return expensePaymentsResp?.data || [];
  }, [expensePaymentsResp]);

  const context = {
    //dialogs
    openDeleteDialog: () => setDeleteDialog(true),
    openDownloadDialog: () => setDownloadDialog(true),
    //search, filtering, sorting & paging
    searchTerm,
    setSearchTerm,
    page,
    totalPageCount: expensePaymentsResp?.meta.pageCount || 1,
    setPage,
    size,
    setSize,
    order: sortDetails.order,
    sortKey: sortDetails.sortKey,
    setSortDetails: (order: boolean, sortKey: string) => setSortDetails({ order, sortKey })
  };

  //Remove Invoice
  const { mutate: removeExpensePayment, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.expensePayment.remove(id),
    onSuccess: () => {
      if (expensePayments?.length == 1 && page > 1) setPage(page - 1);
      toast.success(tInvoicing('payment.action_remove_success'));
      refetchExpensePayments();
      setDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage('invoicing', error, tInvoicing('payment.action_remove_failure')));
    }
  });

  const isPending = isFetchPending || paging || resizing || searching || sorting;

  if (error) return 'An error has occurred: ' + error.message;
  return (
    <ContentSection
      title={tInvoicing('payment.singular')}
      desc={tInvoicing('payment.card_description')}
      className="w-full"
      childrenClassName={cn('overflow-hidden', className)}>
      <>
        <ExpensePaymentDeleteDialog
          id={expensePaymentManager?.id}
          open={deleteDialog}
          deleteExpensePayment={() => {
            expensePaymentManager?.id && removeExpensePayment(expensePaymentManager?.id);
          }}
          isDeletionPending={isDeletePending}
          onClose={() => setDeleteDialog(false)}
        />
        <ExpensePaymentActionsContext.Provider value={context}>
          <DataTable
            className="flex flex-col flex-1 overflow-hidden p-1"
            containerClassName="overflow-auto"
            data={expensePayments}
            columns={getExpensePaymentColumns(tInvoicing, tCurrency)}
            isPending={isPending}
          />
        </ExpensePaymentActionsContext.Provider>
      </>
    </ContentSection>
  );
};
