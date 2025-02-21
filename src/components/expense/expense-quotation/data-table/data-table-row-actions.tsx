import { useRouter } from 'next/router';
import { EXPENSE_QUOTATION_STATUS, ExpenseQuotation } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { Copy, Download, FileCheck, Settings2, Telescope, Trash2 } from 'lucide-react';
import { useExpenseQuotationManager } from '../hooks/useExpenseQuotationManager';
import { useExpenseQuotationActions } from './ActionsContext';

interface DataTableRowActionsProps {
  row: Row<ExpenseQuotation>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const expenseQuotation = row.original;
  const { t: tCommon } = useTranslation('common');
  const router = useRouter();
  const expenseQuotationManager = useExpenseQuotationManager();
  const { openDeleteDialog, openDownloadDialog, openDuplicateDialog, openExpenseInvoiceDialog } =
    useExpenseQuotationActions();

  const targetExpenseQuotation = () => {
    expenseQuotationManager.set('id', expenseQuotation?.id);
    expenseQuotationManager.set('sequential', expenseQuotation?.sequential);
    expenseQuotationManager.set('status', expenseQuotation?.status);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <DotsHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-[160px]">
        <DropdownMenuLabel className="text-center">{tCommon('commands.actions')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Inspect */}
        <DropdownMenuItem
          onClick={() => router.push('/selling/expense-quotation/' + expenseQuotation.id)}>
          <Telescope className="h-5 w-5 mr-2" /> {tCommon('commands.inspect')}
        </DropdownMenuItem>
        {/* Print */}
        <DropdownMenuItem
          onClick={() => {
            targetExpenseQuotation();
            openDownloadDialog?.();
          }}>
          <Download className="h-5 w-5 mr-2" /> {tCommon('commands.download')}
        </DropdownMenuItem>
        {/* Duplicate */}
        <DropdownMenuItem
          onClick={() => {
            targetExpenseQuotation();
            openDuplicateDialog?.();
          }}>
          <Copy className="h-5 w-5 mr-2" /> {tCommon('commands.duplicate')}
        </DropdownMenuItem>
        {(expenseQuotation.status == EXPENSE_QUOTATION_STATUS.Draft ||
          expenseQuotation.status == EXPENSE_QUOTATION_STATUS.Validated ||
          expenseQuotation.status == EXPENSE_QUOTATION_STATUS.Sent) && (
          <DropdownMenuItem
            onClick={() => router.push('/selling/quotation/' + expenseQuotation.id)}>
            <Settings2 className="h-5 w-5 mr-2" /> {tCommon('commands.modify')}
          </DropdownMenuItem>
        )}
        {(expenseQuotation.status == EXPENSE_QUOTATION_STATUS.Accepted ||
          expenseQuotation.status == EXPENSE_QUOTATION_STATUS.Invoiced) && (
          <DropdownMenuItem
            onClick={() => {
              targetExpenseQuotation();
              openExpenseInvoiceDialog?.();
            }}>
            <FileCheck className="h-5 w-5 mr-2" /> {tCommon('commands.to_invoice')}
          </DropdownMenuItem>
        )}
        {expenseQuotation.status != EXPENSE_QUOTATION_STATUS.Sent && (
          <DropdownMenuItem
            onClick={() => {
              targetExpenseQuotation();
              openDeleteDialog?.();
            }}>
            <Trash2 className="h-5 w-5 mr-2" /> {tCommon('commands.delete')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
