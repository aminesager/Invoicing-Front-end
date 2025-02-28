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
// import { AddressDetails } from '../../../invoicing-commons/AddressDetails';
import { cn } from '@/lib/utils';
import { SequenceInput } from '@/components/invoicing-commons/SequenceInput';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useExpenseInvoiceManager } from '../hooks/useExpenseInvoiceManager';
import { UneditableCalendarDayPicker } from '@/components/ui/uneditable/uneditable-calendar-day-picker';
import { UneditableInput } from '@/components/ui/uneditable/uneditable-input';
import { DatePicker } from '@/components/ui/date-picker';

interface ExpenseInvoiceGeneralInformationProps {
  className?: string;
  firms: Firm[];
  // isInvoicingAddressHidden?: boolean;
  // isDeliveryAddressHidden?: boolean;
  edit?: boolean;
  loading?: boolean;
}

export const ExpenseInvoiceGeneralInformation = ({
  className,
  firms,
  // isInvoicingAddressHidden,
  // isDeliveryAddressHidden,
  edit = true,
  loading
}: ExpenseInvoiceGeneralInformationProps) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');
  const router = useRouter();
  const expenseInvoiceManager = useExpenseInvoiceManager();
  const mainInterlocutor = expenseInvoiceManager.firm?.interlocutorsToFirm?.find(
    (entry) => entry?.isMain
  );

  return (
    <div className={cn(className)}>
      <div className="flex gap-4 pb-5 border-b">
        <div className="w-full">
          <Label>{tInvoicing('invoice.attributes.date')} (*)</Label>
          {edit ? (
            <DatePicker
              className="w-full mt-2"
              value={expenseInvoiceManager?.date || new Date()}
              onChange={(value: Date) => {
                expenseInvoiceManager.set('date', value);
              }}
              isPending={loading}
            />
          ) : (
            <UneditableCalendarDayPicker value={expenseInvoiceManager?.date} />
          )}
        </div>
        <div className="w-full">
          <Label>{tInvoicing('invoice.attributes.due_date')} (*)</Label>
          {edit ? (
            <DatePicker
              className="w-full mt-2"
              value={expenseInvoiceManager?.dueDate || undefined}
              onChange={(value: Date) => {
                expenseInvoiceManager.set('dueDate', value);
              }}
              isPending={loading}
            />
          ) : (
            <UneditableCalendarDayPicker value={expenseInvoiceManager?.date} />
          )}
        </div>
      </div>

      <div className="flex gap-4 pb-5 border-b mt-5">
        <div className="w-4/6">
          <Label>{tInvoicing('invoice.attributes.object')} (*)</Label>
          {edit ? (
            <Input
              className="mt-1"
              placeholder="Ex. Facture pour le 1er trimestre 2024"
              value={expenseInvoiceManager.object || ''}
              onChange={(e) => {
                expenseInvoiceManager.set('object', e.target.value);
              }}
              isPending={loading}
            />
          ) : (
            <UneditableInput value={expenseInvoiceManager.object} />
          )}
        </div>
        <div className="w-2/6">
          <Label>{tInvoicing('invoice.singular')} N°</Label>
          <SequenceInput
            prefix={expenseInvoiceManager.sequentialNumber?.prefix}
            dateFormat={expenseInvoiceManager.sequentialNumber?.dynamicSequence}
            value={expenseInvoiceManager.sequentialNumber?.next}
            loading={loading}
          />
        </div>
      </div>
      <div>
        <div className="flex gap-4 pb-5 border-b mt-5">
          <div className="flex flex-col gap-4 w-1/2">
            <div>
              <Label>{tInvoicing('invoice.attributes.firm')} (*)</Label>
              {edit ? (
                <SelectShimmer isPending={loading}>
                  <Select
                    onValueChange={(e) => {
                      const firm = firms?.find((firm) => firm.id === parseInt(e));
                      expenseInvoiceManager.setFirm(firm);
                      expenseInvoiceManager.set('currency', firm?.currency);
                    }}
                    value={expenseInvoiceManager.firm?.id?.toString()}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={tInvoicing('invoice.associate_firm')} />
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
                <UneditableInput value={expenseInvoiceManager?.firm?.name} />
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
            <Label>{tInvoicing('invoice.attributes.interlocutor')} (*)</Label>
            {edit ? (
              <SelectShimmer isPending={loading}>
                <Select
                  disabled={!expenseInvoiceManager?.firm?.id}
                  onValueChange={(e) => {
                    expenseInvoiceManager.setInterlocutor({ id: parseInt(e) } as Interlocutor);
                  }}
                  value={expenseInvoiceManager.interlocutor?.id?.toString()}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={tInvoicing('invoice.associate_interlocutor')} />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseInvoiceManager.firm?.interlocutorsToFirm?.map((entry: any) => (
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
                    {expenseInvoiceManager?.interlocutor?.name}{' '}
                    {expenseInvoiceManager.interlocutor?.surname}
                    {expenseInvoiceManager?.interlocutor?.id ==
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
          expenseInvoiceManager.firm?.id == undefined
        ) && (
          <div className="flex gap-4 pb-5 border-b mt-5">
            {!isInvoicingAddressHidden && (
              <div className="w-1/2">
                <AddressDetails
                  addressType={tInvoicing('invoice.attributes.invoicing_address')}
                  address={expenseInvoiceManager.firm?.invoicingAddress}
                  loading={loading}
                />
              </div>
            )}
            {!isDeliveryAddressHidden && (
              <div className="w-1/2">
                <AddressDetails
                  addressType={tInvoicing('invoice.attributes.delivery_address')}
                  address={expenseInvoiceManager.firm?.deliveryAddress}
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
