import { Article } from './article';
import { BankAccount } from './bank-account';
import { Cabinet } from './cabinet';
import { Currency } from './currency';
import { DISCOUNT_TYPE } from './enums/discount-types';
import { Firm } from './firm';
import { Interlocutor } from './interlocutor';
import { ExpenseInvoice } from './expense-invoice';
import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';
import { Tax } from './tax';
import { Upload } from './upload';

export enum EXPENSE_QUOTATION_STATUS {
  Nonexistent = 'expense-quotation.status.non_existent',
  Expired = 'expense-quotation.status.expired',
  Draft = 'expense-quotation.status.draft',
  Validated = 'expense-quotation.status.validated',
  Sent = 'expense-quotation.status.sent',
  Accepted = 'expense-quotation.status.accepted',
  Rejected = 'expense-quotation.status.rejected',
  Invoiced = 'expense-quotation.status.expense-invoiced'
}

export interface ExpenseQuotationTaxEntry extends DatabaseEntity {
  id?: number;
  articleExpenseQuotationEntryId?: number;
  tax?: Tax;
  taxId?: number;
}

export interface ArticleExpenseQuotationEntry extends DatabaseEntity {
  id?: number;
  expenseQuotationId?: number;
  article?: Article;
  articleId?: number;
  unit_price?: number;
  quantity?: number;
  discount?: number;
  discount_type?: DISCOUNT_TYPE;
  articleExpenseQuotationEntryTaxes?: ExpenseQuotationTaxEntry[];
  subTotal?: number;
  total?: number;
}

export interface CreateArticleExpenseQuotationEntry
  extends Omit<
    ArticleExpenseQuotationEntry,
    | 'id'
    | 'expenseQuotationId'
    | 'subTotal'
    | 'total'
    | 'updatedAt'
    | 'createdAt'
    | 'deletedAt'
    | 'isDeletionRestricted'
    | 'articleExpenseQuotationEntryTaxes'
  > {
  taxes?: number[];
}

export interface ExpenseQuotationMetaData extends DatabaseEntity {
  id?: number;
  showExpenseInvoiceAddress?: boolean;
  showDeliveryAddress?: boolean;
  showArticleDescription?: boolean;
  hasBankingDetails?: boolean;
  hasGeneralConditions?: boolean;
  taxSummary?: { taxId: number; amount: number }[];
}

export interface ExpenseQuotationUpload extends DatabaseEntity {
  id?: number;
  expenseQuotationId?: number;
  expenseQuotation?: ExpenseQuotation;
  uploadId?: number;
  upload?: Upload;
}

export interface ExpenseQuotation extends DatabaseEntity {
  id?: number;
  sequential?: string;
  object?: string;
  date?: string;
  dueDate?: string;
  status?: EXPENSE_QUOTATION_STATUS;
  generalConditions?: string;
  defaultCondition?: boolean;
  total?: number;
  subTotal?: number;
  discount?: number;
  discount_type?: DISCOUNT_TYPE;
  currencyId?: number | null;
  currency?: Currency;
  bankAccountId?: number | null;
  bankAccount?: BankAccount;
  firmId?: number;
  firm?: Firm;
  cabinet?: Cabinet;
  cabinetId?: number;
  interlocutorId?: number;
  interlocutor?: Interlocutor;
  notes?: string;
  articleExpenseQuotationEntries?: ArticleExpenseQuotationEntry[];
  expenseQuotationMetaData?: ExpenseQuotationMetaData;
  uploads?: ExpenseQuotationUpload[];
  expenseInvoices: ExpenseInvoice[];
}

export interface CreateExpenseQuotationDto
  extends Omit<
    ExpenseQuotation,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
    | 'isDeletionRestricted'
    | 'articles'
    | 'firm'
    | 'interlocutor'
    // | 'sequential'
    // | 'sequentialNumber'
    | 'bankAccount'
    | 'expenseInvoices'
  > {
  articleExpenseQuotationEntries?: CreateArticleExpenseQuotationEntry[];
  files?: File[];
}

export interface UpdateExpenseQuotationDto extends CreateExpenseQuotationDto {
  id?: number;
  createExpenseInvoice?: boolean;
}

export interface DuplicateExpenseQuotationDto {
  id?: number;
  includeFiles?: boolean;
}

export interface PagedExpenseQuotation extends PagedResponse<ExpenseQuotation> {}

export interface ExpenseQuotationUploadedFile {
  upload: ExpenseQuotationUpload;
  file: File;
}
