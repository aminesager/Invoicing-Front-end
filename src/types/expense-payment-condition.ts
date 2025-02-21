import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';

export interface ExpensePaymentCondition extends DatabaseEntity {
  id?: number;
  label?: string;
  description?: string;
}
export interface CreateExpensePaymentConditionDto
  extends Pick<ExpensePaymentCondition, 'label' | 'description'> {}
export interface UpdateExpensePaymentConditionDto
  extends Pick<ExpensePaymentCondition, 'label' | 'description' | 'id'> {}
export interface PagedExpensePaymentCondition extends PagedResponse<ExpensePaymentCondition> {}
