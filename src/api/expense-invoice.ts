import axios from './axios';
import { differenceInDays, isAfter } from 'date-fns';
import { DISCOUNT_TYPE } from '../types/enums/discount-types';
import { upload } from './upload';
import { api } from '.';
import {
  CreateExpenseInvoiceDto,
  DateRange,
  DuplicateExpenseInvoiceDto,
  EXPENSE_INVOICE_STATUS,
  ExpenseInvoice,
  ExpenseInvoiceUploadedFile,
  PagedExpenseInvoice,
  ResponseExpenseInvoiceRangeDto,
  ToastValidation,
  UpdateExpenseInvoiceDto,
  UpdateExpenseInvoiceSequentialNumber
} from '@/types';
import { EXPENSE_INVOICE_FILTER_ATTRIBUTES } from '@/constants/expense-invoice.filter-attributes';

const factory = (): CreateExpenseInvoiceDto => {
  return {
    date: '',
    dueDate: '',
    status: EXPENSE_INVOICE_STATUS.Unpaid,
    generalConditions: '',
    total: 0,
    subTotal: 0,
    discount: 0,
    discount_type: DISCOUNT_TYPE.AMOUNT,
    currencyId: 0,
    firmId: 0,
    interlocutorId: 0,
    notes: '',
    articleExpenseInvoiceEntries: [],
    expenseInvoiceMetaData: {
      showDeliveryAddress: true,
      showExpenseInvoiceAddress: true,
      hasBankingDetails: true,
      hasGeneralConditions: true,
      showArticleDescription: true,
      taxSummary: []
    },
    files: []
  };
};

const findPaginated = async (
  page: number = 1,
  size: number = 5,
  order: 'ASC' | 'DESC' = 'ASC',
  sortKey: string,
  search: string = '',
  relations: string[] = ['firm', 'interlocutor'],
  firmId?: number,
  interlocutorId?: number
): Promise<PagedExpenseInvoice> => {
  const generalFilter = search
    ? Object.values(EXPENSE_INVOICE_FILTER_ATTRIBUTES)
        .map((key) => `${key}||$cont||${search}`)
        .join('||$or||')
    : '';
  const firmCondition = firmId ? `firmId||$eq||${firmId}` : '';
  const interlocutorCondition = interlocutorId ? `interlocutorId||$cont||${interlocutorId}` : '';
  const filters = [generalFilter, firmCondition, interlocutorCondition].filter(Boolean).join(',');

  const response = await axios.get<PagedExpenseInvoice>(
    new String().concat(
      'public/expense-invoice/list?',
      `sort=${sortKey},${order}&`,
      `filter=${filters}&`,
      `limit=${size}&page=${page}&`,
      `join=${relations.join(',')}`
    )
  );
  return response.data;
};

const findOne = async (
  id: number,
  relations: string[] = [
    'firm',
    'currency',
    'bankAccount',
    'expenseQuotation',
    'interlocutor',
    'firm.currency',
    'invoiceMetaData',
    'uploads',
    'uploads.upload',
    'expensePayments',
    'expensePayments.expensePayment',
    'taxWithholding',
    'firm.deliveryAddress',
    'firm.invoicingAddress',
    'articleExpenseInvoiceEntries',
    'firm.interlocutorsToFirm',
    'articleExpenseInvoiceEntries.article',
    'articleExpenseInvoiceEntries.articleExpenseInvoiceEntryTaxes',
    'articleExpenseInvoiceEntries.articleExpenseInvoiceEntryTaxes.tax'
  ]
): Promise<ExpenseInvoice & { files: ExpenseInvoiceUploadedFile[] }> => {
  const response = await axios.get<ExpenseInvoice>(
    `public/expense-invoice/${id}?join=${relations.join(',')}`
  );
  return { ...response.data, files: await getExpenseInvoiceUploads(response.data) };
};

const findByRange = async (id?: number): Promise<ResponseExpenseInvoiceRangeDto> => {
  const response = await axios.get<ResponseExpenseInvoiceRangeDto>(
    `public/expense-invoice/sequential-range/${id}`
  );
  return response.data;
};

const uploadExpenseInvoiceFiles = async (files: File[]): Promise<number[]> => {
  return files && files?.length > 0 ? await upload.uploadFiles(files) : [];
};

const create = async (
  expenseInvoice: CreateExpenseInvoiceDto,
  files: File[]
): Promise<ExpenseInvoice> => {
  const uploadIds = await uploadExpenseInvoiceFiles(files);
  const response = await axios.post<ExpenseInvoice>('public/expense-invoice', {
    ...expenseInvoice,
    uploads: uploadIds.map((id) => {
      return { uploadId: id };
    })
  });
  return response.data;
};

const getExpenseInvoiceUploads = async (
  expenseInvoice: ExpenseInvoice
): Promise<ExpenseInvoiceUploadedFile[]> => {
  if (!expenseInvoice?.uploads) return [];

  const uploads = await Promise.all(
    expenseInvoice.uploads.map(async (u) => {
      if (u?.upload?.slug) {
        const blob = await api.upload.fetchBlobBySlug(u.upload.slug);
        const filename = u.upload.filename || '';
        if (blob)
          return { upload: u, file: new File([blob], filename, { type: u.upload.mimetype }) };
      }
      return { upload: u, file: undefined };
    })
  );
  return uploads
    .filter((u) => !!u.file)
    .sort(
      (a, b) =>
        new Date(a.upload.createdAt ?? 0).getTime() - new Date(b.upload.createdAt ?? 0).getTime()
    ) as ExpenseInvoiceUploadedFile[];
};

const download = async (id: number, template: string): Promise<any> => {
  const expenseInvoice = await findOne(id, []);
  const response = await axios.get<string>(
    `public/expense-invoice/${id}/download?template=${template}`,
    {
      responseType: 'blob'
    }
  );
  const blob = new Blob([response.data], { type: response.headers['content-type'] });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = `${expenseInvoice.sequential}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return response;
};

const duplicate = async (
  duplicateExpenseInvoiceDto: DuplicateExpenseInvoiceDto
): Promise<ExpenseInvoice> => {
  const response = await axios.post<ExpenseInvoice>(
    '/public/expense-invoice/duplicate',
    duplicateExpenseInvoiceDto
  );
  return response.data;
};

const update = async (
  expenseInvoice: UpdateExpenseInvoiceDto,
  files: File[]
): Promise<ExpenseInvoice> => {
  const uploadIds = await uploadExpenseInvoiceFiles(files);
  const response = await axios.put<ExpenseInvoice>(`public/expense-invoice/${expenseInvoice.id}`, {
    ...expenseInvoice,
    uploads: [
      ...(expenseInvoice.uploads || []),
      ...uploadIds.map((id) => {
        return { uploadId: id };
      })
    ]
  });
  return response.data;
};

const remove = async (id: number): Promise<ExpenseInvoice> => {
  const response = await axios.delete<ExpenseInvoice>(`public/expense-invoice/${id}`);
  return response.data;
};

const validate = (
  expenseInvoice: Partial<ExpenseInvoice>,
  dateRange?: DateRange
): ToastValidation => {
  if (!expenseInvoice.date) return { message: 'La date est obligatoire' };
  const expenseInvoiceDate = new Date(expenseInvoice.date);
  if (
    dateRange?.from &&
    !isAfter(expenseInvoiceDate, dateRange.from) &&
    expenseInvoiceDate.getTime() !== dateRange.from.getTime()
  ) {
    return { message: `La date doit être après ou égale à ${dateRange.from.toLocaleDateString()}` };
  }
  if (
    dateRange?.to &&
    isAfter(expenseInvoiceDate, dateRange.to) &&
    expenseInvoiceDate.getTime() !== dateRange.to.getTime()
  ) {
    return { message: `La date doit être avant ou égale à ${dateRange.to.toLocaleDateString()}` };
  }
  if (!expenseInvoice.dueDate) return { message: "L'échéance est obligatoire" };
  if (!expenseInvoice.object) return { message: "L'objet est obligatoire" };
  const dueDate = new Date(expenseInvoice.dueDate);
  if (differenceInDays(expenseInvoiceDate, dueDate) > 0) {
    return { message: "L'échéance doit être supérieure ou égale à la date" };
  }
  if (!expenseInvoice.firmId || !expenseInvoice.interlocutorId) {
    return { message: 'Entreprise et interlocuteur sont obligatoire' };
  }
  return { message: '' };
};

const updateExpenseInvoicesSequentials = async (
  updatedSequenceDto: UpdateExpenseInvoiceSequentialNumber
) => {
  const response = await axios.put<ExpenseInvoice>(
    `/public/expense-invoice/update-invoice-sequences`,
    updatedSequenceDto
  );
  return response.data;
};

export const expenseInvoice = {
  factory,
  findPaginated,
  findOne,
  findByRange,
  create,
  download,
  duplicate,
  update,
  updateExpenseInvoicesSequentials,
  remove,
  validate
};
