import { Article } from './article';
import { Cabinet } from './cabinet';
import { Currency } from './currency';
import { DISCOUNT_TYPE } from './enums/discount-types';
import { Firm } from './firm';
import { Interlocutor } from './interlocutor';
import { ExpensePaymentInvoiceEntry } from './expense-payment';
import { ExpenseQuotation } from './expense-quotation';
import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';
import { Tax } from './tax';
import { TaxWithholding } from './tax-withholding';
import { Upload } from './upload';

export enum EXPENSE_INVOICE_STATUS {
  Nonexistent = 'expense-invoice.status.non_existent',
  Draft = 'expense-invoice.status.draft',
  Validated = 'expense-invoice.status.validated',
  Sent = 'expense-invoice.status.sent',
  Paid = 'expense-invoice.status.paid',
  PartiallyPaid = 'expense-invoice.status.partially_paid',
  Unpaid = 'expense-invoice.status.unpaid',
  Expired = 'expense-invoice.status.expired'
}

export interface ExpenseInvoiceTaxEntry extends DatabaseEntity {
  id?: number;
  articleExpenseInvoiceEntryId?: number;
  tax?: Tax;
  taxId?: number;
}

export interface ArticleExpenseInvoiceEntry extends DatabaseEntity {
  id?: number;
  expenseInvoiceId?: number;
  article?: Article;
  articleId?: number;
  unit_price?: number;
  quantity?: number;
  discount?: number;
  discount_type?: DISCOUNT_TYPE;
  articleExpenseInvoiceEntryTaxes?: ExpenseInvoiceTaxEntry[];
  subTotal?: number;
  total?: number;
}

export interface CreateArticleExpenseInvoiceEntry
  extends Omit<
    ArticleExpenseInvoiceEntry,
    | 'id'
    | 'expenseInvoiceId'
    | 'subTotal'
    | 'total'
    | 'updatedAt'
    | 'createdAt'
    | 'deletedAt'
    | 'isDeletionRestricted'
    | 'articleExpenseInvoiceEntryTaxes'
  > {
  taxes?: number[];
}

export interface ExpenseInvoiceMetaData extends DatabaseEntity {
  id?: number;
  showExpenseInvoiceAddress?: boolean;
  showDeliveryAddress?: boolean;
  showArticleDescription?: boolean;
  hasBankingDetails?: boolean;
  hasGeneralConditions?: boolean;
  hasTaxStamp?: boolean;
  taxSummary?: { taxId: number; amount: number }[];
  hasTaxWithholding?: boolean;
}

export interface ExpenseInvoiceUpload extends DatabaseEntity {
  id?: number;
  expenseInvoiceId?: number;
  expenseInvoice?: ExpenseInvoice;
  uploadId?: number;
  upload?: Upload;
}

export interface ExpenseInvoice extends DatabaseEntity {
  id?: number;
  sequential?: string;
  object?: string;
  date?: string;
  dueDate?: string;
  status?: EXPENSE_INVOICE_STATUS;
  generalConditions?: string;
  defaultCondition?: boolean;
  total?: number;
  amountPaid?: number;
  subTotal?: number;
  discount?: number;
  discount_type?: DISCOUNT_TYPE;
  currencyId?: number;
  currency?: Currency;
  bankAccountId?: number;
  bankAccount?: Currency;
  firmId?: number;
  firm?: Firm;
  cabinet?: Cabinet;
  cabinetId?: number;
  interlocutorId?: number;
  interlocutor?: Interlocutor;
  notes?: string;
  expenseQuotationId?: number;
  expenseQuotation?: ExpenseQuotation;
  articleExpenseInvoiceEntries?: ArticleExpenseInvoiceEntry[];
  expenseInvoiceMetaData?: ExpenseInvoiceMetaData;
  uploads?: ExpenseInvoiceUpload[];
  expensePayments?: ExpensePaymentInvoiceEntry[];
  taxStamp?: Tax;
  taxStampId?: number;
  taxWithholding?: TaxWithholding;
  taxWithholdingId?: number;
  taxWithholdingAmount?: number;
}

export interface CreateExpenseInvoiceDto
  extends Omit<
    ExpenseInvoice,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
    | 'isDeletionRestricted'
    | 'articles'
    | 'firm'
    | 'interlocutor'
    | 'sequential'
    | 'bankAccount'
  > {
  articleExpenseInvoiceEntries?: CreateArticleExpenseInvoiceEntry[];
  files?: File[];
}

export interface UpdateExpenseInvoiceDto extends CreateExpenseInvoiceDto {
  id?: number;
}

export interface DuplicateExpenseInvoiceDto {
  id?: number;
  includeFiles?: boolean;
}

export interface PagedExpenseInvoice extends PagedResponse<ExpenseInvoice> {}

export interface ExpenseInvoiceUploadedFile {
  upload: ExpenseInvoiceUpload;
  file: File;
}

export interface ResponseExpenseInvoiceRangeDto {
  next?: ExpenseInvoice;
  previous?: ExpenseInvoice;
}
