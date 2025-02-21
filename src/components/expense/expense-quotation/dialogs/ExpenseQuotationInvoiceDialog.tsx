import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/common';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/other/useMediaQuery';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { EXPENSE_QUOTATION_STATUS } from '@/types';

interface ExpenseQuotationInvoiceDialogProps {
  className?: string;
  id?: number;
  status: EXPENSE_QUOTATION_STATUS;
  sequential: string;
  open: boolean;
  expenseInvoice: (id: number, createExpenseInvoice: boolean) => void;
  isExpenseInvoicePending?: boolean;
  onClose: () => void;
}

export const ExpenseQuotationInvoiceDialog: React.FC<ExpenseQuotationInvoiceDialogProps> = ({
  className,
  id,
  status,
  sequential,
  open,
  expenseInvoice,
  isExpenseInvoicePending,
  onClose
}) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tInvoicing } = useTranslation('invoicing');

  const isDesktop = useMediaQuery('(min-width: 1500px)');
  const [expenseInvoiceMark, setExpenseInvoiceMark] = React.useState(false);

  const header = (
    <Label className="leading-5">
      Voulez-vous vraiment facturer le Devis N° <span className="font-semibold">{sequential}</span>{' '}
      ?
    </Label>
  );

  const content = (
    <div className="flex gap-2 items-center">
      <Checkbox
        checked={expenseInvoiceMark}
        onCheckedChange={() => setExpenseInvoiceMark(!expenseInvoiceMark)}
      />{' '}
      <Label>{tInvoicing('expense-quotation.mark_invoiced')}</Label>
    </div>
  );

  const footer = (
    <div className="flex gap-2 mt-2 items-center justify-center">
      <Button
        className="w-1/2 flex gap-2"
        onClick={() => {
          if (id)
            expenseInvoice(
              id,
              status != EXPENSE_QUOTATION_STATUS.Invoiced ? !expenseInvoiceMark : true
            );
          onClose();
        }}>
        <Check /> Facturer
        <Spinner className="ml-2" size={'small'} show={isExpenseInvoicePending} />
      </Button>
      <Button
        className="w-1/2 flex gap-2"
        variant={'secondary'}
        onClick={() => {
          onClose();
        }}>
        <X />
        {tCommon('answer.no')}
      </Button>
    </div>
  );

  if (isDesktop)
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className={cn('max-w-[25vw] p-8', className)}>
          <DialogHeader>
            <DialogTitle>{header}</DialogTitle>
            {status != EXPENSE_QUOTATION_STATUS.Invoiced && (
              <DialogDescription className="flex gap-2 pt-4 items-center px-2">
                {content}
              </DialogDescription>
            )}
          </DialogHeader>
          {footer}
        </DialogContent>
      </Dialog>
    );
  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{header}</DrawerTitle>
          {status != EXPENSE_QUOTATION_STATUS.Invoiced && (
            <DrawerDescription className="flex gap-2 items-center p-4">{content}</DrawerDescription>
          )}
        </DrawerHeader>
        <DrawerFooter className="border-t pt-2">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
