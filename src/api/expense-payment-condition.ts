import axios from './axios';
import { isAlphabeticOrSpace } from '@/utils/validations/string.validations';
import {
  CreateExpensePaymentConditionDto,
  PagedExpensePaymentCondition,
  ExpensePaymentCondition,
  ToastValidation,
  UpdateExpensePaymentConditionDto
} from '@/types';
import { EXPENSE_PAYMENT_CONDITION_FILTER_ATTRIBUTES } from '@/constants/expense-payment-condition.filter-attributes';

const findPaginated = async (
  page: number = 1,
  size: number = 5,
  order: 'ASC' | 'DESC' = 'ASC',
  sortKey: string = 'id',
  search: string = ''
): Promise<PagedExpensePaymentCondition> => {
  const generalFilter = search
    ? Object.values(EXPENSE_PAYMENT_CONDITION_FILTER_ATTRIBUTES)
        .map((key) => `${key}||$cont||${search}`)
        .join('||$or||')
    : '';
  const response = await axios.get<PagedExpensePaymentCondition>(
    `public/expense-payment-condition/list?sort=${sortKey},${order}&filter=${generalFilter}&limit=${size}&page=${page}`
  );
  return response.data;
};

const find = async (): Promise<ExpensePaymentCondition[]> => {
  const response = await axios.get<ExpensePaymentCondition[]>(
    'public/expense-payment-condition/all'
  );
  return response.data;
};

const create = async (
  expensePaymentMethod: CreateExpensePaymentConditionDto
): Promise<ExpensePaymentCondition> => {
  const response = await axios.post<ExpensePaymentCondition>(
    'public/expense-payment-condition',
    expensePaymentMethod
  );
  return response.data;
};

const update = async (
  expensePaymentMethod: UpdateExpensePaymentConditionDto
): Promise<ExpensePaymentCondition> => {
  const response = await axios.put<ExpensePaymentCondition>(
    `public/expense-payment-condition/${expensePaymentMethod.id}`,
    expensePaymentMethod
  );
  return response.data;
};

const validate = (
  expensePaymentCondition: CreateExpensePaymentConditionDto | UpdateExpensePaymentConditionDto
): ToastValidation => {
  if (
    expensePaymentCondition &&
    expensePaymentCondition?.label &&
    expensePaymentCondition?.label?.length > 3 &&
    isAlphabeticOrSpace(expensePaymentCondition?.label)
  ) {
    return { message: '' };
  }
  return { message: 'Veuillez entrer un titre valide' };
};

const remove = async (id: number) => {
  const { data, status } = await axios.delete<ExpensePaymentCondition>(
    `public/expense-payment-condition/${id}`
  );
  return { data, status };
};

export const expensePaymentCondition = { find, findPaginated, create, update, validate, remove };
