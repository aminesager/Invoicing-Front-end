import { Firm, Interlocutor } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectShimmer,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import React from 'react';
import { AddressDetails } from '../../../invoicing-commons/AddressDetails';
import { cn } from '@/lib/utils';
import { useExpenseQuotationManager } from '@/components/expense/expense-quotation/hooks/useExpenseQuotationManager';
import { SequenceInput } from '@/components/invoicing-commons/SequenceInput';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { UneditableCalendarDayPicker } from '@/components/ui/uneditable/uneditable-calendar-day-picker';
import { UneditableInput } from '@/components/ui/uneditable/uneditable-input';
import { DatePicker } from '@/components/ui/date-picker';

interface ExpenseQuotationGeneralInformationProps {
  className?: string;
  firms: Firm[];
  isInvoicingAddressHidden?: boolean;
  isDeliveryAddressHidden?: boolean;
  loading?: boolean;
  edit?: boolean;
}

export const ExpenseQuotationGeneralInformation = ({
  className,
  firms,
  isInvoicingAddressHidden,
  isDeliveryAddressHidden,
  edit = true,
  loading
}: ExpenseQuotationGeneralInformationProps) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const router = useRouter();
  const expenseQuotationManager = useExpenseQuotationManager();
  const mainInterlocutor = expenseQuotationManager.firm?.interlocutorsToFirm?.find(
    (entry) => entry?.isMain
  );

  return (
    <div className={cn(className)}>
      <div className="flex gap-4 pb-5 border-b">
        {/* Date */}
        <div className="w-full">
          <Label>{tInvoicing('quotation.attributes.date')} (*)</Label>

          {edit ? (
            <DatePicker
              className="w-full mt-2"
              value={expenseQuotationManager?.date || new Date()}
              onChange={(value: Date) => {
                expenseQuotationManager.set('date', value);
              }}
              isPending={loading}
            />
          ) : (
            <UneditableCalendarDayPicker value={expenseQuotationManager?.date} />
          )}
        </div>
        {/* Due Date */}
        <div className="w-full">
          <Label>{tInvoicing('quotation.attributes.due_date')} (*)</Label>
          {edit ? (
            <DatePicker
              className="w-full mt-2"
              value={expenseQuotationManager?.dueDate || new Date()}
              onChange={(value: Date) => {
                expenseQuotationManager.set('dueDate', value);
              }}
              isPending={loading}
            />
          ) : (
            <UneditableCalendarDayPicker value={expenseQuotationManager?.dueDate} />
          )}
        </div>
      </div>
      {/* Object */}
      <div className="flex gap-4 pb-5 border-b mt-5">
        <div className="w-4/6">
          <Label>{tInvoicing('quotation.attributes.object')} (*)</Label>
          {edit ? (
            <Input
              className="mt-1"
              placeholder="Ex. Devis pour le 1er trimestre 2024"
              value={expenseQuotationManager.object || ''}
              onChange={(e) => {
                expenseQuotationManager.set('object', e.target.value);
              }}
              isPending={loading}
            />
          ) : (
            <UneditableInput value={expenseQuotationManager.object} />
          )}
        </div>
        {/* Sequential */}
        <div className="w-2/6">
          <Label>{tInvoicing('quotation.singular')} N°</Label>
          <SequenceInput
            prefix={expenseQuotationManager.sequentialNumber?.prefix}
            dateFormat={expenseQuotationManager.sequentialNumber?.dynamicSequence}
            value={expenseQuotationManager.sequentialNumber?.next}
            loading={loading}
          />
        </div>
      </div>
      <div>
        <div className="flex gap-4 pb-5 border-b mt-5">
          {/* Firm */}
          <div className="flex flex-col gap-4 w-1/2">
            <div>
              <Label>{tInvoicing('quotation.attributes.firm')} (*)</Label>
              {edit ? (
                <SelectShimmer isPending={loading}>
                  <Select
                    onValueChange={(e) => {
                      const firm = firms?.find((firm) => firm.id === parseInt(e));
                      expenseQuotationManager.setFirm(firm);
                      expenseQuotationManager.set('currency', firm?.currency);
                    }}
                    value={expenseQuotationManager.firm?.id?.toString()}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={tInvoicing('quotation.associate_firm')} />
                    </SelectTrigger>
                    <SelectContent>
                      {firms?.map((firm: Partial<Firm>) => (
                        <SelectItem
                          key={firm.id}
                          value={firm.id?.toString() || ''}
                          className="mx-1">
                          {firm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SelectShimmer>
              ) : (
                <UneditableInput value={expenseQuotationManager?.firm?.name} />
              )}
            </div>

            {/* Shortcut to access firm form */}
            {edit && (
              <Label
                className="mx-1 underline cursor-pointer"
                onClick={() => router.push('/contacts/new-firm')}>
                {tInvoicing('common.firm_not_there')}
              </Label>
            )}
          </div>
          <div className="w-1/2">
            <Label>{tInvoicing('quotation.attributes.interlocutor')} (*)</Label>
            {edit ? (
              <SelectShimmer isPending={loading}>
                <Select
                  disabled={!expenseQuotationManager?.firm?.id}
                  onValueChange={(e) => {
                    expenseQuotationManager.setInterlocutor({ id: parseInt(e) } as Interlocutor);
                  }}
                  value={expenseQuotationManager.interlocutor?.id?.toString()}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={tInvoicing('quotation.associate_interlocutor')} />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseQuotationManager.firm?.interlocutorsToFirm?.map((entry: any) => (
                      <SelectItem
                        key={entry.interlocutor?.id || 'interlocutor'}
                        value={entry.interlocutor?.id?.toString()}
                        className="mx-1">
                        {entry.interlocutor?.name} {entry.interlocutor?.surname}{' '}
                        {entry.isMain && (
                          <span className="font-bold">({tCommon('words.main_m')})</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SelectShimmer>
            ) : (
              <UneditableInput
                value={
                  <div>
                    {expenseQuotationManager?.interlocutor?.name}{' '}
                    {expenseQuotationManager.interlocutor?.surname}{' '}
                    {expenseQuotationManager?.interlocutor?.id ==
                      mainInterlocutor?.interlocutor?.id && (
                      <span className="font-bold mx-1"> ({tCommon('words.main_m')})</span>
                    )}
                  </div>
                }
              />
            )}
          </div>
        </div>
        {/* {!(
          (isInvoicingAddressHidden && isDeliveryAddressHidden) ||
          expenseQuotationManager.firm?.id == undefined
        ) && (
          <div className="flex gap-4 pb-5 border-b mt-5">
            {!isInvoicingAddressHidden && (
              <div className="w-1/2">
                <AddressDetails
                  addressType={tInvoicing('quotation.attributes.invoicing_address')}
                  address={expenseQuotationManager.firm?.invoicingAddress}
                  loading={loading}
                />
              </div>
            )}
            {!isDeliveryAddressHidden && (
              <div className="w-1/2">
                <AddressDetails
                  addressType={tInvoicing('quotation.attributes.delivery_address')}
                  address={expenseQuotationManager.firm?.deliveryAddress}
                  loading={loading}
                />
              </div>
            )}
          </div>
        )} */}
      </div>
    </div>
  );
};
