import { useRouter } from 'next/router';
import { Invoice } from '@/types';
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
import { Download, Settings2, Telescope, Trash2 } from 'lucide-react';
import { useExpensePaymentActions } from './ActionsContext';
import { useExpensePaymentManager } from '../hooks/useExpensePaymentManager';

interface DataTableRowActionsProps {
  row: Row<Invoice>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const expensePayment = row.original;
  const { t: tCommon } = useTranslation('common');
  const router = useRouter();
  const expensePaymentManager = useExpensePaymentManager();
  const { openDeleteDialog, openDownloadDialog } = useExpensePaymentActions();

  const targetInvoice = () => {
    expensePaymentManager.set('id', expensePayment?.id);
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
          onClick={() => router.push('/expense/expense-payment/' + expensePayment.id)}>
          <Telescope className="h-5 w-5 mr-2" /> {tCommon('commands.inspect')}
        </DropdownMenuItem>
        {/* Print */}
        <DropdownMenuItem
          onClick={() => {
            targetInvoice();
            openDownloadDialog();
          }}>
          <Download className="h-5 w-5 mr-2" /> {tCommon('commands.download')}
        </DropdownMenuItem>
        {/* Duplicate */}
        {/* <DropdownMenuItem
          onClick={() => {
            targetInvoice();
            openDuplicateDialog();
          }}>
          <Copy className="h-5 w-5 mr-2" /> {tCommon('commands.duplicate')}
        </DropdownMenuItem> */}
        <DropdownMenuItem
          onClick={() => router.push('/expense/expense-payment/' + expensePayment.id)}>
          <Settings2 className="h-5 w-5 mr-2" /> {tCommon('commands.modify')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            targetInvoice();
            openDeleteDialog();
          }}>
          <Trash2 className="h-5 w-5 mr-2" /> {tCommon('commands.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
