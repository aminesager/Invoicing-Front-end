import { api } from '@/api';
import {
  BankAccount,
  Currency,
  Firm,
  EXPENSE_INVOICE_STATUS,
  Interlocutor,
  ExpenseInvoice,
  ExpenseInvoiceUploadedFile,
  PaymentCondition
} from '@/types';
import { DATE_FORMAT } from '@/types/enums/date-formats';
import { DISCOUNT_TYPE } from '@/types/enums/discount-types';
import { fromStringToSequentialObject } from '@/utils/string.utils';
import { create } from 'zustand';

type ExpenseInvoiceManager = {
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
  amountPaid: number;
  discount: number;
  discountType: DISCOUNT_TYPE;
  bankAccount?: BankAccount;
  currency?: Currency;
  notes: string;
  status: EXPENSE_INVOICE_STATUS;
  generalConditions: string;
  uploadedFiles: ExpenseInvoiceUploadedFile[];
  expenseQuotationId?: number;
  taxStampId?: number;
  taxWithholdingId?: number;
  // utility data
  isInterlocutorInFirm: boolean;
  // methods
  setFirm: (firm?: Firm) => void;
  setInterlocutor: (interlocutor?: Interlocutor) => void;
  set: (name: keyof ExpenseInvoiceManager, value: any) => void;
  getExpenseInvoice: () => Partial<ExpenseInvoiceManager>;
  setExpenseInvoice: (
    expenseInvoice: Partial<ExpenseInvoice & { files: ExpenseInvoiceUploadedFile[] }>,
    firms: Firm[],
    bankAccounts: BankAccount[]
  ) => void;
  reset: () => void;
};

const getDateRangeAccordingToExpensePaymentConditions = (PaymentCondition: PaymentCondition) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  if (!PaymentCondition) return { date: undefined, dueDate: undefined };

  switch (PaymentCondition.id) {
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
  ExpenseInvoiceManager,
  'set' | 'reset' | 'setFirm' | 'setInterlocutor' | 'getExpenseInvoice' | 'setExpenseInvoice'
> = {
  id: undefined,
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
  amountPaid: 0,
  discount: 0,
  discountType: DISCOUNT_TYPE.PERCENTAGE,
  bankAccount: api?.bankAccount?.factory() || undefined,
  currency: api?.currency?.factory() || undefined,
  notes: '',
  status: EXPENSE_INVOICE_STATUS.Nonexistent,
  generalConditions: '',
  isInterlocutorInFirm: false,
  uploadedFiles: [],
  expenseQuotationId: undefined,
  taxStampId: undefined,
  taxWithholdingId: undefined
};

export const useExpenseInvoiceManager = create<ExpenseInvoiceManager>((set, get) => ({
  ...initialState,
  setFirm: (firm?: Firm) => {
    const dateRange = firm?.paymentCondition
      ? getDateRangeAccordingToExpensePaymentConditions(firm.paymentCondition)
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
  set: (name: keyof ExpenseInvoiceManager, value: any) => {
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
  getExpenseInvoice: () => {
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
      taxStampId,
      taxWithholdingId,
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
      uploadedFiles,
      taxStampId,
      taxWithholdingId
    };
  },
  setExpenseInvoice: (
    expenseInvoice: Partial<ExpenseInvoice & { files: ExpenseInvoiceUploadedFile[] }>,
    firms: Firm[],
    bankAccounts: BankAccount[]
  ) => {
    set((state) => ({
      ...state,
      id: expenseInvoice?.id,
      sequentialNumber: fromStringToSequentialObject(expenseInvoice?.sequential || ''),
      date: expenseInvoice?.date ? new Date(expenseInvoice?.date) : undefined,
      dueDate: expenseInvoice?.dueDate ? new Date(expenseInvoice?.dueDate) : undefined,
      object: expenseInvoice?.object,
      firm: firms.find((firm) => expenseInvoice?.firm?.id === firm.id),
      interlocutor: expenseInvoice?.interlocutor,
      discount: expenseInvoice?.discount,
      discountType: expenseInvoice?.discount_type,
      bankAccount: expenseInvoice?.bankAccount || bankAccounts.find((a) => a.isMain),
      currency: expenseInvoice?.currency || expenseInvoice?.firm?.currency,
      notes: expenseInvoice?.notes,
      generalConditions: expenseInvoice?.generalConditions,
      status: expenseInvoice?.status,
      uploadedFiles: expenseInvoice?.files || [],
      expenseQuotationId: expenseInvoice?.expenseQuotationId,
      taxStampId: expenseInvoice?.taxStampId,
      amountPaid: expenseInvoice?.amountPaid,
      taxWithholdingId: expenseInvoice?.taxWithholdingId,
      taxWithholdingAmount: expenseInvoice?.taxWithholdingAmount
    }));
  },
  reset: () => set({ ...initialState })
}));
