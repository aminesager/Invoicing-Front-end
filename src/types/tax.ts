import { PagedResponse } from './response';
import { DatabaseEntity } from './response/DatabaseEntity';

export interface Tax extends DatabaseEntity {
  id?: number;
  label?: string;
  value?: number;
  isRate?: boolean;
  isSpecial?: boolean;
}

export interface CreateTaxDto
  extends Omit<Tax, 'createdAt' | 'updatedAt' | 'deletedAt' | 'isDeletionRestricted'> {}
export interface UpdateTaxDto extends CreateTaxDto {
  id?: number;
}
export interface PagedTax extends PagedResponse<Tax> {}
