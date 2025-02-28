import axios from './axios';
import { differenceInDays } from 'date-fns';
import { DISCOUNT_TYPE } from '../types/enums/discount-types';
import { upload } from './upload';
import { api } from '.';
import {
  ArticleExpenseQuotationEntry,
  CreateExpenseQuotationDto,
  DuplicateExpenseQuotationDto,
  PagedExpenseQuotation,
  EXPENSE_QUOTATION_STATUS,
  ExpenseQuotation,
  ExpenseQuotationUploadedFile,
  ToastValidation,
  UpdateExpenseQuotationDto,
  UpdateExpenseQuotationSequentialNumber
} from '@/types';
import { EXPENSE_QUOTATION_FILTER_ATTRIBUTES } from '@/constants/expense-quotation.filter-attributes';

const factory = (): CreateExpenseQuotationDto => {
  return {
    date: '',
    dueDate: '',
    status: EXPENSE_QUOTATION_STATUS.Draft,
    generalConditions: '',
    total: 0,
    subTotal: 0,
    discount: 0,
    discount_type: DISCOUNT_TYPE.AMOUNT,
    currencyId: 0,
    firmId: 0,
    interlocutorId: 0,
    notes: '',
    articleExpenseQuotationEntries: [],
    expenseQuotationMetaData: {
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
): Promise<PagedExpenseQuotation> => {
  const generalFilter = search
    ? Object.values(EXPENSE_QUOTATION_FILTER_ATTRIBUTES)
        .map((key) => `${key}||$cont||${search}`)
        .join('||$or||')
    : '';
  const firmCondition = firmId ? `firmId||$eq||${firmId}` : '';
  const interlocutorCondition = interlocutorId ? `interlocutorId||$cont||${interlocutorId}` : '';
  const filters = [generalFilter, firmCondition, interlocutorCondition].filter(Boolean).join(',');

  const response = await axios.get<PagedExpenseQuotation>(
    new String().concat(
      'public/expense-quotation/list?',
      `sort=${sortKey},${order}&`,
      `filter=${filters}&`,
      `limit=${size}&page=${page}&`,
      `join=${relations.join(',')}`
    )
  );
  return response.data;
};

const findChoices = async (status: EXPENSE_QUOTATION_STATUS): Promise<ExpenseQuotation[]> => {
  const response = await axios.get<ExpenseQuotation[]>(
    `public/expense-quotation/all?filter=status||$eq||${status}`
  );
  return response.data;
};

const findOne = async (
  id: number,
  relations: string[] = [
    'firm',
    'currency',
    'bankAccount',
    'interlocutor',
    'firm.currency',
    'expenseQuotationMetaData',
    'uploads',
    'invoices',
    'uploads.upload',

    'articleExpenseQuotationEntries',
    'firm.interlocutorsToFirm',
    'articleExpenseQuotationEntries.article',
    'articleExpenseQuotationEntries.articleExpenseQuotationEntryTaxes',
    'articleExpenseQuotationEntries.articleExpenseQuotationEntryTaxes.tax'
  ]
): Promise<ExpenseQuotation & { files: ExpenseQuotationUploadedFile[] }> => {
  const response = await axios.get<ExpenseQuotation>(
    `public/expense-quotation/${id}?join=${relations.join(',')}`
  );
  return { ...response.data, files: await getExpenseQuotationUploads(response.data) };
};

const uploadExpenseQuotationFiles = async (files: File[]): Promise<number[]> => {
  return files && files?.length > 0 ? await upload.uploadFiles(files) : [];
};

const create = async (
  expenseQuotation: CreateExpenseQuotationDto,
  files: File[]
): Promise<ExpenseQuotation> => {
  const uploadIds = await uploadExpenseQuotationFiles(files);
  const response = await axios.post<ExpenseQuotation>('public/expense-quotation', {
    ...expenseQuotation,
    uploads: uploadIds.map((id) => {
      return { uploadId: id };
    })
  });
  return response.data;
};

const getExpenseQuotationUploads = async (
  expenseQuotation: ExpenseQuotation
): Promise<ExpenseQuotationUploadedFile[]> => {
  if (!expenseQuotation?.uploads) return [];

  const uploads = await Promise.all(
    expenseQuotation.uploads.map(async (u) => {
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
    ) as ExpenseQuotationUploadedFile[];
};

const download = async (id: number, template: string): Promise<any> => {
  const expenseQuotation = await findOne(id, []);
  const response = await axios.get<string>(
    `public/expense-quotation/${id}/download?template=${template}`,
    {
      responseType: 'blob'
    }
  );
  const blob = new Blob([response.data], { type: response.headers['content-type'] });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = `${expenseQuotation.sequential}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return response;
};

const duplicate = async (
  duplicateExpenseQuotationDto: DuplicateExpenseQuotationDto
): Promise<ExpenseQuotation> => {
  const response = await axios.post<ExpenseQuotation>(
    '/public/expense-quotation/duplicate',
    duplicateExpenseQuotationDto
  );
  return response.data;
};

const update = async (
  expenseQuotation: UpdateExpenseQuotationDto,
  files: File[]
): Promise<ExpenseQuotation> => {
  const uploadIds = await uploadExpenseQuotationFiles(files);
  const response = await axios.put<ExpenseQuotation>(
    `public/expense-quotation/${expenseQuotation.id}`,
    {
      ...expenseQuotation,
      uploads: [
        ...(expenseQuotation.uploads || []),
        ...uploadIds.map((id) => {
          return { uploadId: id };
        })
      ]
    }
  );
  return response.data;
};
const expenseInvoice = async (
  id?: number,
  createExpenseInvoice?: boolean
): Promise<ExpenseQuotation> => {
  const response = await axios.put<ExpenseQuotation>(
    `public/expense-quotation/expense-invoice/${id}/${createExpenseInvoice}`
  );
  return response.data;
};

const remove = async (id: number): Promise<ExpenseQuotation> => {
  const response = await axios.delete<ExpenseQuotation>(`public/expense-quotation/${id}`);
  return response.data;
};

const validate = (expenseQuotation: Partial<ExpenseQuotation>): ToastValidation => {
  if (!expenseQuotation.date) return { message: 'La date est obligatoire' };
  if (!expenseQuotation.dueDate) return { message: "L'échéance est obligatoire" };
  if (!expenseQuotation.object) return { message: "L'objet est obligatoire" };
  if (!expenseQuotation.sequential) return { message: 'Le numero sequentiel est obligatoire' };
  if (differenceInDays(new Date(expenseQuotation.date), new Date(expenseQuotation.dueDate)) >= 0)
    return { message: "L'échéance doit être supérieure à la date" };
  if (!expenseQuotation.firmId || !expenseQuotation.interlocutorId)
    return { message: 'Entreprise et interlocuteur sont obligatoire' };
  return { message: '' };
};

const updateExpenseQuotationsSequentials = async (
  updatedSequenceDto: UpdateExpenseQuotationSequentialNumber
) => {
  const response = await axios.put<ExpenseQuotation>(
    `/public/expense-quotation/update-expense-quotation-sequences`,
    updatedSequenceDto
  );
  return response.data;
};

export const expenseQuotation = {
  factory,
  findPaginated,
  findOne,
  findChoices,
  create,
  download,
  expenseInvoice,
  duplicate,
  update,
  updateExpenseQuotationsSequentials,
  remove,
  validate
};
