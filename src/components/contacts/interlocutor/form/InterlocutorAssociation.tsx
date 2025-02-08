import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectShimmer,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { useInterlocutorManager } from '../hooks/useInterlocutorManager';
import { cn } from '@/lib/utils';
import { Interlocutor } from '@/types';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combo-box';

interface InterlocutorAssociationProps {
  className?: string;
  interlocutors?: Interlocutor[];
  loading?: boolean;
}

export const InterlocutorAssociation: React.FC<InterlocutorAssociationProps> = ({
  className,
  interlocutors,
  loading
}) => {
  const { t: tCommon } = useTranslation('contacts');
  const { t: tInvoicing } = useTranslation('invoicing');

  const interlocutorManager = useInterlocutorManager();
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* interlocutor */}
      <div className="mx-1 w-full">
        <Label>{tCommon('interlocutor.singular')} (*)</Label>
        <Combobox
          value={
            interlocutorManager?.id
              ? `${interlocutorManager?.name}|${interlocutorManager?.surname}|${interlocutorManager?.id}`
              : undefined
          }
          onValueChange={(e) => {
            const [name, surname, id] = e.split('|');
            interlocutorManager.set('id', id);
            interlocutorManager.set('name', name);
            interlocutorManager.set('surname', surname);
          }}
          data={interlocutors?.map((i) => ({
            label: `${i.name} ${i.surname} (${i.email})`,
            value: `${i.name}|${i.surname}|${i.id}`
          }))}
          className={'my-4'}
          containerClassName="max-h-52"
          placeholder={tInvoicing('invoice.associate_interlocutor')}
        />
      </div>

      <div className="mx-1 w-full">
        <Label>{tCommon('interlocutor.attributes.position')}</Label>
        <Input
          isPending={loading || false}
          className="mt-1"
          placeholder="Ex. CEO"
          value={interlocutorManager && interlocutorManager.position}
          onChange={(e) => {
            interlocutorManager.set('position', e.target.value);
          }}
        />
      </div>
    </div>
  );
};
