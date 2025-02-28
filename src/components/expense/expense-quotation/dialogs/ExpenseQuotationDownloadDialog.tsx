import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Spinner } from '@/components/common';
import { Label } from '@/components/ui/label';
import { File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/other/useMediaQuery';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';

interface ExpenseQuotationDownloadDialogProps {
  className?: string;
  id: number;
  open: boolean;
  downloadExpenseQuotation: (template: string) => void;
  isDownloadPending: boolean;
  onClose: () => void;
}

export const ExpenseQuotationDownloadDialog: React.FC<ExpenseQuotationDownloadDialogProps> = ({
  className,
  id,
  open,
  downloadExpenseQuotation,
  isDownloadPending,
  onClose
}) => {
  const { t: tCommon } = useTranslation('common');
  const isDesktop = useMediaQuery('(min-width: 1500px)');

  const body = (
    <div className={cn(className, 'flex gap-2 mt-2 items-center justify-center')}>
      <Button className="w-1/2 flex gap-2">{tCommon('commands.download')}</Button>
      <Button
        className="w-1/2 flex gap-2"
        variant={'secondary'}
        onClick={() => {
          onClose();
        }}>
        {tCommon('Cancel')}
      </Button>
    </div>
  );

  if (isDesktop)
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className={cn('max-w-[30vw] p-8', className)}>
          <DialogHeader>
            <DialogTitle>Telechargement</DialogTitle>
            <DialogDescription>Voulez vous telecharger le piéce jointe ?</DialogDescription>
          </DialogHeader>
          <div>{body}</div>
        </DialogContent>
      </Dialog>
    );

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Telechargement</DrawerTitle>
          <DrawerDescription>Vous pouvez choisir le modèle que vous souhaitez</DrawerDescription>
        </DrawerHeader>
        <div>{body}</div>
        <DrawerFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>
            {tCommon('commands.cancel')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
