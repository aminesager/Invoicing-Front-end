import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon
} from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useExpenseInvoiceActions } from './ActionsContext';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  const {
    page: contextPage,
    totalPageCount: contextTotalPageCount,
    setPage,
    size,
    setSize
  } = useExpenseInvoiceActions();
  const { t: tCommon } = useTranslation('common');
  const page = contextPage || 0;
  const totalPageCount = contextTotalPageCount || 0;
  return (
    <div className="flex items-center justify-between pt-4">
      <div className="flex items-center space-x-2 ">
        <Select
          value={size?.toString()}
          onValueChange={(value) => {
            setPage?.(1);
            setSize?.(Number(value));
          }}>
          <SelectTrigger className="h-8 w-[100px] -mt-1">
            <SelectValue placeholder={table.getState().pagination.pageSize} />
          </SelectTrigger>
          <SelectContent side="bottom" align="center">
            {[5, 10, 20].map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm font-medium">{tCommon('pagination.rows_per')}</p>
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          {tCommon('pagination.enumerate', { page, totalPageCount })}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => setPage?.(1)}
            disabled={page == 1}>
            <DoubleArrowLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setPage?.(page - 1)}
            disabled={page <= 1}>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setPage?.(page + 1)}
            disabled={page >= totalPageCount}>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => setPage?.(totalPageCount)}
            disabled={page == totalPageCount}>
            <DoubleArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
