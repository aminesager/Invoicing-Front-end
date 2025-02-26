import React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/other/useDebounce';
import { api } from '@/api';
import { getErrorMessage } from '@/utils/errors';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { DataTable } from './data-table/data-table';
import { DuplicateExpenseInvoiceDto } from '@/types';
import ContentSection from '@/components/common/ContentSection';
import { cn } from '@/lib/utils';
import { BreadcrumbRoute, useBreadcrumb } from '@/components/layout/BreadcrumbContext';
import { useExpenseInvoiceManager } from './hooks/useExpenseInvoiceManager';
import { ExpenseInvoiceDeleteDialog } from './dialogs/ExpenseInvoiceDeleteDialog';
import { ExpenseInvoiceDuplicateDialog } from './dialogs/ExpenseInvoiceDuplicateDialog';
import { ExpenseInvoiceDownloadDialog } from './dialogs/ExpenseInvoiceDownloadDialog';
import { ExpenseInvoiceActionsContext } from './data-table/ActionsContext';
import { getExpenseInvoiceColumns } from './data-table/columns';

interface ExpenseInvoiceEmbeddedMainProps {
  className?: string;
  firmId?: number;
  interlocutorId?: number;
  routes?: BreadcrumbRoute[];
}

export const ExpenseInvoiceEmbeddedMain: React.FC<ExpenseInvoiceEmbeddedMainProps> = ({
  className,
  firmId,
  interlocutorId,
  routes
}) => {
  const router = useRouter();
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');

  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    if (routes && (firmId || interlocutorId))
      setRoutes([...routes, { title: tCommon('submenu.Invoices') }]);
  }, [router.locale, firmId, interlocutorId, routes]);

  const expenseInvoiceManager = useExpenseInvoiceManager();

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
  const [duplicateDialog, setDuplicateDialog] = React.useState(false);
  const [downloadDialog, setDownloadDialog] = React.useState(false);

  const {
    isPending: isFetchPending,
    error,
    data: expenseInvoicesResp,
    refetch: refetchExpenseInvoices
  } = useQuery({
    queryKey: [
      'expense-invoices',
      debouncedPage,
      debouncedSize,
      debouncedSortDetails.order,
      debouncedSortDetails.sortKey,
      debouncedSearchTerm
    ],
    queryFn: () =>
      api.expenseInvoice.findPaginated(
        debouncedPage,
        debouncedSize,
        debouncedSortDetails.order ? 'ASC' : 'DESC',
        debouncedSortDetails.sortKey,
        debouncedSearchTerm,
        ['firm', 'interlocutor', 'currency', 'expensePayments'],
        firmId,
        interlocutorId
      )
  });

  const expenseInvoices = React.useMemo(() => {
    return expenseInvoicesResp?.data || [];
  }, [expenseInvoicesResp]);

  const context = {
    //dialogs
    openDeleteDialog: () => setDeleteDialog(true),
    openDuplicateDialog: () => setDuplicateDialog(true),
    openDownloadDialog: () => setDownloadDialog(true),
    //search, filtering, sorting & paging
    searchTerm,
    setSearchTerm,
    page,
    totalPageCount: expenseInvoicesResp?.meta.pageCount || 1,
    setPage,
    size,
    setSize,
    order: sortDetails.order,
    sortKey: sortDetails.sortKey,
    setSortDetails: (order: boolean, sortKey: string) => setSortDetails({ order, sortKey })
  };

  //Remove ExpenseInvoice
  const { mutate: removeExpenseInvoice, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.expenseInvoice.remove(id),
    onSuccess: () => {
      if (expenseInvoices?.length == 1 && page > 1) setPage(page - 1);
      toast.success(tInvoicing('invoice.action_remove_success'));
      refetchExpenseInvoices();
      setDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage('invoicing', error, tInvoicing('invoice.action_remove_failure')));
    }
  });

  //Duplicate ExpenseInvoice
  const { mutate: duplicateExpenseInvoice, isPending: isDuplicationPending } = useMutation({
    mutationFn: (duplicateExpenseInvoiceDto: DuplicateExpenseInvoiceDto) =>
      api.expenseInvoice.duplicate(duplicateExpenseInvoiceDto),
    onSuccess: async (data) => {
      toast.success(tInvoicing('invoice.action_duplicate_success'));
      await router.push('/expense/expense-invoice/' + data.id);
      setDuplicateDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('invoice.action_duplicate_failure'))
      );
    }
  });

  //Download ExpenseInvoice
  const { mutate: downloadExpenseInvoice, isPending: isDownloadPending } = useMutation({
    mutationFn: (data: { id: number; template: string }) =>
      api.expenseInvoice.download(data.id, data.template),
    onSuccess: () => {
      toast.success(tInvoicing('invoice.action_download_success'));
      setDownloadDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('invoice.action_download_failure'))
      );
    }
  });

  const isPending = isFetchPending || isDeletePending || paging || resizing || searching || sorting;

  if (error) return 'An error has occurred: ' + error.message;
  return (
    <ContentSection
      title={tInvoicing('invoice.singular')}
      desc={tInvoicing('invoice.card_description')}
      className="w-full"
      childrenClassName={cn('overflow-hidden', className)}>
      <>
        <ExpenseInvoiceDeleteDialog
          id={expenseInvoiceManager?.id}
          sequential={expenseInvoiceManager?.sequential || ''}
          open={deleteDialog}
          deleteExpenseInvoice={() => {
            expenseInvoiceManager?.id && removeExpenseInvoice(expenseInvoiceManager?.id);
          }}
          isDeletionPending={isDeletePending}
          onClose={() => setDeleteDialog(false)}
        />
        <ExpenseInvoiceDuplicateDialog
          id={expenseInvoiceManager?.id || 0}
          sequential={expenseInvoiceManager?.sequential || ''}
          open={duplicateDialog}
          duplicateExpenseInvoice={(includeFiles: boolean) => {
            expenseInvoiceManager?.id &&
              duplicateExpenseInvoice({
                id: expenseInvoiceManager?.id,
                includeFiles: includeFiles
              });
          }}
          isDuplicationPending={isDuplicationPending}
          onClose={() => setDuplicateDialog(false)}
        />
        <ExpenseInvoiceDownloadDialog
          id={expenseInvoiceManager?.id || 0}
          open={downloadDialog}
          downloadExpenseInvoice={(template: string) => {
            expenseInvoiceManager?.id &&
              downloadExpenseInvoice({ id: expenseInvoiceManager?.id, template });
          }}
          isDownloadPending={isDownloadPending}
          onClose={() => setDownloadDialog(false)}
        />
        <ExpenseInvoiceActionsContext.Provider value={context}>
          <DataTable
            className="flex flex-col flex-1 overflow-hidden p-1"
            containerClassName="overflow-auto"
            data={expenseInvoices}
            columns={getExpenseInvoiceColumns(tInvoicing, router, firmId, interlocutorId)}
            isPending={isPending}
          />
        </ExpenseInvoiceActionsContext.Provider>
      </>
    </ContentSection>
  );
};
