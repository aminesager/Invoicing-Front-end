import React from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/other/useDebounce';
import { api } from '@/api';
import { getErrorMessage } from '@/utils/errors';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ExpenseQuotationDuplicateDialog } from './dialogs/ExpenseQuotationDuplicateDialog';
import { useTranslation } from 'react-i18next';
import { ExpenseQuotationDeleteDialog } from './dialogs/ExpenseQuotationDeleteDialog';
import { ExpenseQuotationDownloadDialog } from './dialogs/ExpenseQuotationDownloadDialog';
import { DataTable } from './data-table/data-table';
import { getExpenseQuotationColumns } from './data-table/columns';
import { useExpenseQuotationManager } from './hooks/useExpenseQuotationManager';
import { ExpenseQuotationActionsContext } from './data-table/ActionsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBreadcrumb } from '@/components/layout/BreadcrumbContext';
import { DuplicateExpenseQuotationDto } from '@/types';
import { ExpenseQuotationInvoiceDialog } from './dialogs/ExpenseQuotationInvoiceDialog';

interface ExpenseQuotationMainProps {
  className?: string;
}

export const ExpenseQuotationMain: React.FC<ExpenseQuotationMainProps> = ({ className }) => {
  const router = useRouter();
  const { t: tCommon, ready: commonReady } = useTranslation('common');
  const { t: tInvoicing, ready: invoicingReady } = useTranslation('invoicing');
  const { setRoutes } = useBreadcrumb();
  React.useEffect(() => {
    setRoutes([
      { title: tCommon('menu.expense'), href: '/expense' },
      { title: tCommon('submenu.quotations') }
    ]);
  }, [router.locale]);

  const expenseQuotationManager = useExpenseQuotationManager();

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
  const [expenseInvoiceDialog, setExpenseInvoiceDialog] = React.useState(false);

  const {
    isPending: isFetchPending,
    error,
    data: expenseQuotationsResp,
    refetch: refetchExpenseQuotations
  } = useQuery({
    queryKey: [
      'expenseQuotations',
      debouncedPage,
      debouncedSize,
      debouncedSortDetails.order,
      debouncedSortDetails.sortKey,
      debouncedSearchTerm
    ],
    queryFn: () =>
      api.expenseQuotation.findPaginated(
        debouncedPage,
        debouncedSize,
        debouncedSortDetails.order ? 'ASC' : 'DESC',
        debouncedSortDetails.sortKey,
        debouncedSearchTerm,
        ['firm', 'interlocutor', 'currency', 'invoices']
      )
  });

  const expenseQuotations = React.useMemo(() => {
    return expenseQuotationsResp?.data || [];
  }, [expenseQuotationsResp]);

  const context = {
    //dialogs
    openDeleteDialog: () => setDeleteDialog(true),
    openDuplicateDialog: () => setDuplicateDialog(true),
    openDownloadDialog: () => setDownloadDialog(true),
    openExpenseInvoiceDialog: () => setExpenseInvoiceDialog(true),
    //search, filtering, sorting & paging
    searchTerm,
    setSearchTerm,
    page,
    totalPageCount: expenseQuotationsResp?.meta.pageCount || 1,
    setPage,
    size,
    setSize,
    order: sortDetails.order,
    sortKey: sortDetails.sortKey,
    setSortDetails: (order: boolean, sortKey: string) => setSortDetails({ order, sortKey })
  };

  //Remove ExpenseQuotation
  const { mutate: removeExpenseQuotation, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.expenseQuotation.remove(id),
    onSuccess: () => {
      if (expenseQuotations?.length == 1 && page > 1) setPage(page - 1);
      toast.success(tInvoicing('quotation.action_remove_success'));
      refetchExpenseQuotations();
      setDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('quotation.action_remove_failure'))
      );
    }
  });

  //Duplicate Quotation
  const { mutate: duplicateExpenseQuotation, isPending: isDuplicationPending } = useMutation({
    mutationFn: (duplicateExpenseQuotationDto: DuplicateExpenseQuotationDto) =>
      api.expenseQuotation.duplicate(duplicateExpenseQuotationDto),
    onSuccess: async (data) => {
      toast.success(tInvoicing('quotation.action_duplicate_success'));
      await router.push('/expense/expense-quotation/' + data.id);
      setDuplicateDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('quotation.action_duplicate_failure'))
      );
    }
  });

  //Download Quotation
  const { mutate: downloadExpenseQuotation, isPending: isDownloadPending } = useMutation({
    mutationFn: (data: { id: number; template: string }) =>
      api.expenseQuotation.download(data.id, data.template),
    onSuccess: () => {
      toast.success(tInvoicing('quotation.action_download_success'));
      setDownloadDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('quotation.action_download_failure'))
      );
    }
  });

  //Invoice quotation
  const { mutate: invoiceExpenseQuotation, isPending: isInvoicingPending } = useMutation({
    mutationFn: (data: { id?: number; createExpenseInvoice: boolean }) =>
      api.expenseQuotation.expenseInvoice(data.id, data.createExpenseInvoice),
    onSuccess: (data) => {
      toast.success('Devis facturé avec succès');
      refetchExpenseQuotations();
      router.push(
        `/expense/expense-invoice/${data.expenseInvoices[data?.expenseInvoices?.length - 1].id}`
      );
    },
    onError: (error) => {
      const message = getErrorMessage('contacts', error, 'Erreur lors de la facturation de devis');
      toast.error(message);
    }
  });

  const isPending =
    isFetchPending ||
    isDeletePending ||
    paging ||
    resizing ||
    searching ||
    sorting ||
    !commonReady ||
    !invoicingReady;

  if (error) return 'An error has occurred: ' + error.message;
  return (
    <>
      <ExpenseQuotationDeleteDialog
        id={expenseQuotationManager?.id}
        sequential={expenseQuotationManager?.sequential || ''}
        open={deleteDialog}
        deleteExpenseQuotation={() => {
          expenseQuotationManager?.id && removeExpenseQuotation(expenseQuotationManager?.id);
        }}
        isDeletionPending={isDeletePending}
        onClose={() => setDeleteDialog(false)}
      />
      <ExpenseQuotationDuplicateDialog
        id={expenseQuotationManager?.id || 0}
        sequential={expenseQuotationManager?.sequential || ''}
        open={duplicateDialog}
        duplicateExpenseQuotation={(includeFiles: boolean) => {
          expenseQuotationManager?.id &&
            duplicateExpenseQuotation({
              id: expenseQuotationManager?.id,
              includeFiles: includeFiles
            });
        }}
        isDuplicationPending={isDuplicationPending}
        onClose={() => setDuplicateDialog(false)}
      />
      <ExpenseQuotationDownloadDialog
        id={expenseQuotationManager?.id || 0}
        open={downloadDialog}
        downloadExpenseQuotation={(template: string) => {
          expenseQuotationManager?.id &&
            downloadExpenseQuotation({ id: expenseQuotationManager?.id, template });
        }}
        isDownloadPending={isDownloadPending}
        onClose={() => setDownloadDialog(false)}
      />
      <ExpenseQuotationInvoiceDialog
        id={expenseQuotationManager?.id || 0}
        status={expenseQuotationManager?.status}
        sequential={expenseQuotationManager?.sequential}
        open={expenseInvoiceDialog}
        isExpenseInvoicePending={isInvoicingPending}
        expenseInvoice={(id: number, createExpenseInvoice: boolean) => {
          invoiceExpenseQuotation({ id, createExpenseInvoice });
        }}
        onClose={() => setExpenseInvoiceDialog(false)}
      />
      <ExpenseQuotationActionsContext.Provider value={context}>
        <Card className={className}>
          <CardHeader>
            <CardTitle>{tInvoicing('quotation.singular')}</CardTitle>
            <CardDescription>{tInvoicing('quotation.card_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              className="flex flex-col flex-1 overflow-hidden p-1"
              containerClassName="overflow-auto"
              data={expenseQuotations}
              columns={getExpenseQuotationColumns(tInvoicing, router)}
              isPending={isPending}
            />
          </CardContent>
        </Card>
      </ExpenseQuotationActionsContext.Provider>
    </>
  );
};
