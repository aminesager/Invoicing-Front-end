import { api } from '@/api';
import {
  BankAccount,
  Currency,
  Firm,
  Interlocutor,
  PaymentCondition,
  EXPENSE_QUOTATION_STATUS,
  ExpenseQuotation,
  ExpenseQuotationUploadedFile
} from '@/types';
import { DATE_FORMAT } from '@/types/enums/date-formats';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { fromStringToSequentialObject } from '@/utils/string.utils';
import { create } from 'zustand';

type ExpenseQuotationManager = {
  // data
  id?: number;
  sequentialNumber: {
    dynamicSequence: DATE_FORMAT;
    next: number;
    prefix: string;
  };
  sequential: string;
  date: Date | undefined;
  dueDate: Date | undefined;
  object: string;
  firm?: Firm;
  interlocutor?: Interlocutor;
  subTotal: number;
  total: number;
  discount: number;
  discountType: DISCOUNT_TYPE;
  bankAccount?: BankAccount;
  currency?: Currency;
  notes: string;
  status: EXPENSE_QUOTATION_STATUS;
  generalConditions: string;
  uploadedFiles: ExpenseQuotationUploadedFile[];
  // utility data
  isInterlocutorInFirm: boolean;
  // methods
  setFirm: (firm?: Firm) => void;
  setInterlocutor: (interlocutor?: Interlocutor) => void;
  set: (name: keyof ExpenseQuotationManager, value: any) => void;
  getExpenseQuotation: () => Partial<ExpenseQuotationManager>;
  setExpenseQuotation: (
    expenseQuotation: Partial<ExpenseQuotation & { files: ExpenseQuotationUploadedFile[] }>,
    firms?: Firm[],
    bankAccounts?: BankAccount[]
  ) => void;
  reset: () => void;
};

const getDateRangeAccordingToPaymentConditions = (paymentCondition: PaymentCondition) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  if (!paymentCondition) return { date: undefined, dueDate: undefined };

  switch (paymentCondition.id) {
    case 1:
      return { date: today, dueDate: today };
    case 2:
      return { date: today, dueDate: new Date(year, month + 1, 0) }; // End of current month
    case 3:
      return { date: today, dueDate: new Date(year, month + 2, 0) }; // End of next month
    case 4:
      return { date: today, dueDate: undefined };
    default:
      return { date: undefined, dueDate: undefined };
  }
};

const initialState: Omit<
  ExpenseQuotationManager,
  'set' | 'reset' | 'setFirm' | 'setInterlocutor' | 'getExpenseQuotation' | 'setExpenseQuotation'
> = {
  id: -1,
  sequentialNumber: {
    prefix: '',
    dynamicSequence: DATE_FORMAT.yy_MM,
    next: 0
  },
  sequential: '',
  date: undefined,
  dueDate: undefined,
  object: '',
  firm: api?.firm?.factory() || undefined,
  interlocutor: api?.interlocutor?.factory() || undefined,
  subTotal: 0,
  total: 0,
  discount: 0,
  discountType: DISCOUNT_TYPE.PERCENTAGE,
  bankAccount: api?.bankAccount?.factory() || undefined,
  currency: api?.currency?.factory() || undefined,
  notes: '',
  status: EXPENSE_QUOTATION_STATUS.Nonexistent,
  generalConditions: '',
  isInterlocutorInFirm: false,
  uploadedFiles: []
};

export const useExpenseQuotationManager = create<ExpenseQuotationManager>((set, get) => ({
  ...initialState,
  setFirm: (firm?: Firm) => {
    const dateRange = firm?.paymentCondition
      ? getDateRangeAccordingToPaymentConditions(firm.paymentCondition)
      : { date: undefined, dueDate: undefined };

    set((state) => ({
      ...state,
      firm,
      interlocutor:
        firm?.interlocutorsToFirm?.length === 1
          ? firm.interlocutorsToFirm[0]
          : api?.interlocutor?.factory() || undefined,
      isInterlocutorInFirm: !!firm?.interlocutorsToFirm?.length,
      date: dateRange.date,
      dueDate: dateRange.dueDate
    }));
  },
  setInterlocutor: (interlocutor?: Interlocutor) =>
    set((state) => ({
      ...state,
      interlocutor,
      isInterlocutorInFirm: true
    })),
  set: (name: keyof ExpenseQuotationManager, value: any) => {
    if (name === 'date' || name === 'dueDate') {
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
  getExpenseQuotation: () => {
    const {
      id,
      sequentialNumber,
      date,
      dueDate,
      object,
      firm,
      interlocutor,
      discount,
      discountType,
      notes,
      generalConditions,
      bankAccount,
      currency,
      uploadedFiles,
      ...rest
    } = get();

    return {
      id,
      sequentialNumber,
      date,
      dueDate,
      object,
      firmId: firm?.id,
      interlocutorId: interlocutor?.id,
      discount,
      discountType,
      notes,
      generalConditions,
      bankAccountId: bankAccount?.id,
      currencyId: currency?.id,
      uploadedFiles
    };
  },
  setExpenseQuotation: (
    expenseQuotation: Partial<ExpenseQuotation & { files: ExpenseQuotationUploadedFile[] }>,
    firms?: Firm[],
    bankAccounts?: BankAccount[]
  ) => {
    set((state) => ({
      ...state,
      id: expenseQuotation?.id,
      sequentialNumber: fromStringToSequentialObject(expenseQuotation?.sequential || ''),
      date: expenseQuotation?.date ? new Date(expenseQuotation?.date) : undefined,
      dueDate: expenseQuotation?.dueDate ? new Date(expenseQuotation?.dueDate) : undefined,
      object: expenseQuotation?.object,
      firm: firms?.find((firm) => expenseQuotation?.firm?.id === firm.id),
      interlocutor: expenseQuotation?.interlocutor,
      discount: expenseQuotation?.discount,
      discountType: expenseQuotation?.discount_type,
      bankAccount: expenseQuotation?.bankAccount,
      currency: expenseQuotation?.currency || expenseQuotation?.firm?.currency,
      notes: expenseQuotation?.notes,
      generalConditions: expenseQuotation?.generalConditions,
      status: expenseQuotation?.status,
      uploadedFiles: expenseQuotation?.files || []
    }));
  },
  reset: () => set({ ...initialState })
}));
