import React from 'react';

interface ExpenseInvoiceActionsContextProps {
  openDeleteDialog?: () => void;
  openDuplicateDialog?: () => void;
  openDownloadDialog?: () => void;
  openExpenseInvoiceDialog?: () => void;
  searchTerm?: string;
  setSearchTerm?: (value: string) => void;
  page?: number;
  totalPageCount?: number;
  setPage?: (value: number) => void;
  size?: number;
  setSize?: (value: number) => void;
  order?: boolean;
  sortKey?: string;
  setSortDetails?: (order: boolean, sortKey: string) => void;
  firmId?: number;
  interlocutorId?: number;
}

export const ExpenseInvoiceActionsContext = React.createContext<ExpenseInvoiceActionsContextProps>(
  {}
);

export const useExpenseInvoiceActions = () => React.useContext(ExpenseInvoiceActionsContext);
