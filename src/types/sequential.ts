import { AppConfig } from './app-config';
import { DATE_FORMAT } from './enums';

export interface Sequential {
  dynamicSequence?: DATE_FORMAT;
  next?: number;
  prefix?: string;
}

export interface UpdateSequentialDto {
  dynamicSequence?: DATE_FORMAT;
  next?: number;
  prefix?: string;
}

export interface QuotationSequentialNumber extends AppConfig<Sequential> {}
export interface InvoiceSequentialNumber extends AppConfig<Sequential> {}

export interface ExpenseQuotationSequentialNumber extends AppConfig<Sequential> {}
export interface ExpenseInvoiceSequentialNumber extends AppConfig<Sequential> {}

export interface UpdateQuotationSequentialNumber extends UpdateSequentialDto {}
export interface UpdateInvoiceSequentialNumber extends UpdateSequentialDto {}

export interface UpdateExpenseQuotationSequentialNumber extends UpdateSequentialDto {}
export interface UpdateExpenseInvoiceSequentialNumber extends UpdateSequentialDto {}
