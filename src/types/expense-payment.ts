import { Currency } from './currency';
import { Firm } from './firm';
import { ExpenseInvoice } from './expense-invoice';
import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';
import { Upload } from './upload';

export enum EXPENSE_PAYMENT_MODE {
  Cash = 'payment.payment_mode.cash',
  CreditCard = 'payment.payment_mode.credit_card',
  Check = 'payment.payment_mode.check',
  BankTransfer = 'payment.payment_mode.bank_transfer',
  WireTransfer = 'payment.payment_mode.wire_transfer'
}

export interface ExpensePaymentUpload extends DatabaseEntity {
  id?: number;
  expensePaymentId?: number;
  expensePayment?: ExpensePayment;
  uploadId?: number;
  upload?: Upload;
}

export interface ExpensePaymentInvoiceEntry extends DatabaseEntity {
  id?: number;
  expenseInvoiceId?: number;
  expenseInvoice?: ExpenseInvoice;
  expenseIaymentId?: number;
  expensePayment?: ExpensePayment;
  amount?: number;
}

export interface ExpensePayment extends DatabaseEntity {
  id?: number;
  amount?: number;
  fee?: number;
  convertionRate?: number;
  date?: string;
  mode?: EXPENSE_PAYMENT_MODE;
  notes?: string;
  uploads?: ExpensePaymentUpload[];
  invoices?: ExpensePaymentInvoiceEntry[];
  currency?: Currency;
  currencyId?: number;
  firm?: Firm;
  firmId?: number;
}

export interface CreateExpensePaymentDto
  extends Omit<
    ExpensePayment,
    'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'isDeletionRestricted'
  > {
  files?: File[];
}

export interface UpdateExpensePaymentDto extends CreateExpensePaymentDto {
  id?: number;
}

export interface PagedExpensePayment extends PagedResponse<ExpensePayment> {}

export interface ExpensePaymentUploadedFile {
  upload: ExpensePaymentUpload;
  file: File;
}
