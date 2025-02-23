import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { useExpenseInvoiceManager } from '../hooks/useExpenseInvoiceManager';

interface ExpenseInvoiceGeneralConditionsProps {
  className?: string;
  hidden?: boolean;
  isPending?: boolean;
  defaultCondition?: string;
  edit?: boolean;
}

export const ExpenseInvoiceGeneralConditions = ({
  className,
  hidden,
  isPending,
  defaultCondition,
  edit = true
}: ExpenseInvoiceGeneralConditionsProps) => {
  const router = useRouter();
  const { t: tInvoicing } = useTranslation('invoicing');
  const { t: tSettings } = useTranslation('settings');

  const expenseInvoiceManager = useExpenseInvoiceManager();

  return (
    <div className={cn(className)}>
      {!hidden && (
        <div className="flex flex-col gap-4">
          <Textarea
            disabled={!edit}
            placeholder={tInvoicing('invoice.attributes.general_condition')}
            className="resize-none"
            value={expenseInvoiceManager.generalConditions}
            onChange={(e) => expenseInvoiceManager.set('generalConditions', e.target.value)}
            isPending={isPending}
            rows={7}
          />
          {edit && defaultCondition && (
            <div className="flex items-center gap-4">
              <div className="flex gap-2 items-center">
                <Button
                  disabled={expenseInvoiceManager.generalConditions == defaultCondition}
                  onClick={() => {
                    expenseInvoiceManager.set('generalConditions', defaultCondition);
                  }}>
                  {tInvoicing('invoice.use_default_condition')}
                </Button>
                <Button
                  variant={'secondary'}
                  onClick={() => {
                    expenseInvoiceManager.set('generalConditions', '');
                  }}>
                  Clear
                </Button>
              </div>
            </div>
          )}
          {edit && !defaultCondition && (
            <Label
              className="font-bold underline cursor-pointer"
              onClick={() => router.push('/settings/system/conditions')}>
              {tSettings('default_condition.not_set')}
            </Label>
          )}
        </div>
      )}
    </div>
  );
};
