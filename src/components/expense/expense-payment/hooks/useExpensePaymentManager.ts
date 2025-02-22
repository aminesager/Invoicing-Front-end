import {
  Currency,
  Firm,
  EXPENSE_PAYMENT_MODE,
  ExpensePayment,
  ExpensePaymentUploadedFile
} from '@/types';
import { create } from 'zustand';

type ExpensePaymentManager = {
  // data
  id?: number;
  date?: Date | undefined;
  amount?: number;
  fee?: number;
  convertionRate: number;
  currency?: Currency;
  currencyId?: number;
  notes?: string;
  mode?: EXPENSE_PAYMENT_MODE;
  uploadedFiles: ExpensePaymentUploadedFile[];
  firm?: Firm;
  firmId?: number;
  // methods
  set: (name: keyof ExpensePaymentManager, value: any) => void;
  getExpensePayment: () => Partial<ExpensePaymentManager>;
  setExpensePayment: (
    expensePayment: Partial<ExpensePayment & { files: ExpensePaymentUploadedFile[] }>
  ) => void;
  reset: () => void;
};

const initialState: Omit<
  ExpensePaymentManager,
  'set' | 'reset' | 'getExpensePayment' | 'setExpensePayment'
> = {
  id: -1,
  date: undefined,
  amount: 0,
  fee: 0,
  convertionRate: 1,
  currencyId: undefined,
  notes: '',
  mode: EXPENSE_PAYMENT_MODE.Cash,
  uploadedFiles: [],
  firmId: undefined
};

export const useExpensePaymentManager = create<ExpensePaymentManager>((set, get) => ({
  ...initialState,
  set: (name: keyof ExpensePaymentManager, value: any) => {
    if (name === 'date') {
      const dateValue = typeof value === 'string' ? new Date(value) : value;
      set((state) => ({
        ...state,
        [name]: dateValue
      }));
    } else {
      set((state) => ({
        ...state,
        [name]: value
      }));
    }
  },
  getExpensePayment: () => {
    const { id, date, amount, fee, convertionRate, mode, notes, uploadedFiles, ...rest } = get();

    return {
      id,
      date,
      amount,
      fee,
      convertionRate,
      notes,
      uploadedFiles
    };
  },
  setExpensePayment: (
    expensePayment: Partial<ExpensePayment & { files: ExpensePaymentUploadedFile[] }>
  ) => {
    set((state) => ({
      ...state,
      id: expensePayment?.id,
      date: expensePayment?.date ? new Date(expensePayment?.date) : undefined,
      amount: expensePayment?.amount,
      fee: expensePayment?.fee,
      convertionRate: expensePayment?.convertionRate,
      notes: expensePayment?.notes,
      mode: expensePayment?.mode,
      firmId: expensePayment?.firmId,
      firm: expensePayment?.firm,
      currencyId: expensePayment?.currencyId,
      currency: expensePayment?.currency,
      uploadedFiles: expensePayment?.files || []
    }));
  },
  reset: () => set({ ...initialState })
}));
