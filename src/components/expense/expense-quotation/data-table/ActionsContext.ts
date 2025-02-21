import React from 'react';

interface ExpenseQuotationActionsContextProps {
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

export const ExpenseQuotationActionsContext =
  React.createContext<ExpenseQuotationActionsContextProps>({});

export const useExpenseQuotationActions = () => React.useContext(ExpenseQuotationActionsContext);
