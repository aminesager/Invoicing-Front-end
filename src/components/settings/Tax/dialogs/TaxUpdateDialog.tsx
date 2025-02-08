import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/common';
import { Info, WalletCards } from 'lucide-react';
import { TaxForm } from '../TaxForm';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useMediaQuery } from '@/hooks/other/useMediaQuery';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';

interface TaxUpdateDialogProps {
  className?: string;
  id?: number;
  open: boolean;
  updateTax: () => void;
  isUpdatePending?: boolean;
  onClose: () => void;
}

export const TaxUpdateDialog: React.FC<TaxUpdateDialogProps> = ({
  className,
  open,
  updateTax,
  isUpdatePending,
  onClose
}) => {
  const { t: tCommon } = useTranslation('common');
  const isDesktop = useMediaQuery('(min-width: 1500px)');
  const title = (
    <>
      <WalletCards />
      <Label className="font-semibold">Mise à jour d&apos;un taxe</Label>
    </>
  );
  const description = (
    <>
      <Info className="h-10 w-10" />
      <Label className="leading-5">
        Vous pouvez ici mettre à jour les détails du taxe sélectionnée. Assurez-vous de vérifier vos
        modifications avant de les enregistrer.
      </Label>
    </>
  );

  const footer = (
    <div className="flex gap-2 mt-2">
      <Button
        onClick={() => {
          updateTax?.();
        }}>
        {tCommon('commands.save')}
        <Spinner show={isUpdatePending} />
      </Button>
      <Button
        variant={'secondary'}
        onClick={() => {
          onClose();
        }}>
        {tCommon('commands.cancel')}
      </Button>
    </div>
  );

  if (isDesktop)
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className={cn('max-w-[30vw]', className)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{title}</DialogTitle>
            <DialogDescription className="flex gap-2 pt-2 items-center">
              {description}
            </DialogDescription>
          </DialogHeader>
          <TaxForm className="gap-2 px-3 pb-2" />
          <DialogFooter className="border-t pt-5">{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">{title}</DrawerTitle>
          <DrawerDescription className="flex gap-2 py-4 items-center px-2">
            {description}
          </DrawerDescription>
        </DrawerHeader>
        <TaxForm className="gap-2 px-3 pb-5" />
        <DrawerFooter className="border-t pt-2">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
