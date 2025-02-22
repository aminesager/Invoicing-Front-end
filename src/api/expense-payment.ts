import { EXPENSE_PAYMENT_CONDITION_FILTER_ATTRIBUTES } from '@/constants/expense-payment-condition.filter-attributes';
import {
  CreateExpensePaymentDto,
  PagedExpensePayment,
  ExpensePayment,
  ExpensePaymentUploadedFile,
  ToastValidation,
  UpdateExpensePaymentDto
} from '@/types';
import axios from './axios';
import { upload } from './upload';
import { api } from '.';
import { EXPENSE_PAYMENT_FILTER_ATTRIBUTES } from '@/constants/expense-payment-filter.attributes';

const findOne = async (
  id: number,
  relations: string[] = [
    'currency',
    'expenseInvoices',
    'expenseInvoices.invoice',
    'expenseInvoices.invoice.currency',
    'uploads',
    'uploads.upload'
  ]
): Promise<ExpensePayment & { files: ExpensePaymentUploadedFile[] }> => {
  const response = await axios.get<ExpensePayment>(
    `public/expense-payment/${id}?join=${relations.join(',')}`
  );
  return { ...response.data, files: await getExpensePaymentUploads(response.data) };
};

const findPaginated = async (
  page: number = 1,
  size: number = 5,
  order: 'ASC' | 'DESC' = 'ASC',
  sortKey: string,
  search: string = '',
  relations: string[] = [],
  firmId?: number,
  interlocutorId?: number
): Promise<PagedExpensePayment> => {
  const generalFilter = search
    ? Object.values(EXPENSE_PAYMENT_FILTER_ATTRIBUTES)
        .map((key) => `${key}||$cont||${search}`)
        .join('||$or||')
    : '';
  const firmCondition = firmId ? `firmId||$eq||${firmId}` : '';
  const interlocutorCondition = interlocutorId ? `interlocutorId||$cont||${interlocutorId}` : '';
  const filters = [generalFilter, firmCondition, interlocutorCondition].filter(Boolean).join(',');

  const response = await axios.get<PagedExpensePayment>(
    new String().concat(
      'public/expense-payment/list?',
      `sort=${sortKey},${order}&`,
      `filter=${filters}&`,
      `limit=${size}&page=${page}&`,
      `join=${relations.join(',')}`
    )
  );
  return response.data;
};

const uploadExpensePaymentFiles = async (files: File[]): Promise<number[]> => {
  return files && files?.length > 0 ? await upload.uploadFiles(files) : [];
};

const create = async (
  expensePayment: CreateExpensePaymentDto,
  files: File[] = []
): Promise<ExpensePayment> => {
  const uploadIds = await uploadExpensePaymentFiles(files);
  const response = await axios.post<CreateExpensePaymentDto>('public/expense-payment', {
    ...expensePayment,
    uploads: uploadIds.map((id) => {
      return { uploadId: id };
    })
  });
  return response.data;
};

const getExpensePaymentUploads = async (
  expensePayment: ExpensePayment
): Promise<ExpensePaymentUploadedFile[]> => {
  if (!expensePayment?.uploads) return [];

  const uploads = await Promise.all(
    expensePayment.uploads.map(async (u) => {
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
    ) as ExpensePaymentUploadedFile[];
};

const update = async (
  expensePayment: UpdateExpensePaymentDto,
  files: File[] = []
): Promise<ExpensePayment> => {
  const uploadIds = await uploadExpensePaymentFiles(files);
  const response = await axios.put<ExpensePayment>(`public/expense-payment/${expensePayment.id}`, {
    ...expensePayment,
    uploads: [
      ...(expensePayment.uploads || []),
      ...uploadIds.map((id) => {
        return { uploadId: id };
      })
    ]
  });
  return response.data;
};

const remove = async (id: number): Promise<ExpensePayment> => {
  const response = await axios.delete<ExpensePayment>(`public/expense-payment/${id}`);
  return response.data;
};

const validate = (
  expensePayment: Partial<ExpensePayment>,
  used: number,
  paid: number
): ToastValidation => {
  if (!expensePayment.date) return { message: 'La date doit être définie' };
  if (!expensePayment?.amount || expensePayment?.amount <= 0)
    return { message: 'Le montant doit être supérieur à 0' };
  if (expensePayment?.fee == null || expensePayment?.fee < 0)
    return { message: 'Le frais doit être supérieur ou égal à 0' };
  if (expensePayment?.fee > expensePayment?.amount)
    return { message: 'Le frais doit être inférieur au montant' };
  if (paid !== used)
    return { message: 'Le montant total doit être égal à la somme des montants des factures' };
  return { message: '', position: 'bottom-right' };
};

export const expensePayment = { findOne, findPaginated, create, update, remove, validate };
