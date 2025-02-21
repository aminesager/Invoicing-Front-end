import { ExpensePayment } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableRowActions } from './data-table-row-actions';
import { DataTableColumnHeader } from './data-table-column-header';
import { transformDate, transformDateTime } from '@/utils/date.utils';
import { EXPENSE_PAYMENT_FILTER_ATTRIBUTES } from '@/constants/expense-payment-filter.attributes';

export const getExpensePaymentColumns = (
  t: Function,
  tCurrency: Function
): ColumnDef<ExpensePayment>[] => {
  const translationNamespace = 'invoicing';
  const translate = (value: string, namespace: string = '') => {
    return t(value, { ns: namespace || translationNamespace });
  };

  return [
    {
      accessorKey: 'number',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('expense-payment.attributes.number')}
          attribute={EXPENSE_PAYMENT_FILTER_ATTRIBUTES.ID}
        />
      ),
      cell: ({ row }) => <div>PAY-{row.original.id}</div>,
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'date',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('expense-payment.attributes.date')}
          attribute={EXPENSE_PAYMENT_FILTER_ATTRIBUTES.DATE}
        />
      ),
      cell: ({ row }) => (
        <div>{row.original.date ? transformDate(row.original.date) : <span>Sans date</span>}</div>
      ),
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'mode',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('expense-payment.attributes.mode')}
          attribute={EXPENSE_PAYMENT_FILTER_ATTRIBUTES.MODE}
        />
      ),
      cell: ({ row }) => (
        <div>
          <Badge className="px-4 py-1">{t(row.original?.mode || '')}</Badge>
        </div>
      ),
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('expense-payment.attributes.amount')}
          attribute={EXPENSE_PAYMENT_FILTER_ATTRIBUTES.AMOUNT}
        />
      ),
      cell: ({ row }) => (
        <div>
          {row.original?.amount?.toFixed(row.original?.currency?.digitAfterComma)}{' '}
          {row.original?.currency?.symbol}
        </div>
      ),
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'fee',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('expense-payment.attributes.fee')}
          attribute={EXPENSE_PAYMENT_FILTER_ATTRIBUTES.FEE}
        />
      ),
      cell: ({ row }) => (
        <div>
          {row.original?.fee?.toFixed(row.original?.currency?.digitAfterComma)}{' '}
          {row.original?.currency?.symbol}
        </div>
      ),
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'currency',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('expense-payment.attributes.currency')}
          attribute={EXPENSE_PAYMENT_FILTER_ATTRIBUTES.CURRENCY}
        />
      ),
      cell: ({ row }) => (
        <div>
          {row.original?.currency ? (
            <span>
              {row.original?.currency?.code && tCurrency(row.original?.currency?.code)} (
              {row.original?.currency?.symbol})
            </span>
          ) : (
            <span className="text-slate-400">
              {translate('expense-payment.empty_cells.currency')}
            </span>
          )}
        </div>
      ),
      enableSorting: true,
      enableHiding: true
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={translate('expense-invoice.attributes.created_at')}
          attribute={EXPENSE_PAYMENT_FILTER_ATTRIBUTES.CREATEDAT}
        />
      ),
      cell: ({ row }) => <div>{transformDateTime(row.original?.createdAt || '')}</div>,
      enableSorting: true,
      enableHiding: true
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DataTableRowActions row={row} />
        </div>
      )
    }
  ];
};
