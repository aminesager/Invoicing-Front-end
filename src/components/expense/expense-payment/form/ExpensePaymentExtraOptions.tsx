import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { FileUploader } from '@/components/ui/file-uploader';
import { Files } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import React from 'react';
import { useExpensePaymentManager } from '../hooks/useExpensePaymentManager';

interface ExpensePaymentExtraOptionsProps {
  className?: string;
  loading?: boolean;
}

export const ExpensePaymentExtraOptions = ({
  className,
  loading
}: ExpensePaymentExtraOptionsProps) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const expensePaymentManager = useExpensePaymentManager();

  const handleFilesChange = (files: File[]) => {
    if (files.length > expensePaymentManager.uploadedFiles.length) {
      const newFiles = files.filter(
        (file) =>
          !expensePaymentManager.uploadedFiles.some((uploadedFile) => uploadedFile.file === file)
      );
      expensePaymentManager.set('uploadedFiles', [
        ...expensePaymentManager.uploadedFiles,
        ...newFiles.map((file) => ({ file }))
      ]);
    } else {
      const updatedFiles = expensePaymentManager.uploadedFiles.filter((uploadedFile) =>
        files.some((file) => file === uploadedFile.file)
      );
      expensePaymentManager.set('uploadedFiles', updatedFiles);
    }
  };

  return (
    <Accordion type="multiple" className={cn(className, 'mx-1 border-b')}>
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <div className="flex gap-2 justify-center items-center">
            <Files />
            <Label>{tInvoicing('payment.attributes.files')}</Label>
          </div>
        </AccordionTrigger>
        <AccordionContent className="m-5">
          <FileUploader
            accept={{
              'image/*': [],
              'application/pdf': [],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
              'application/msword': [],
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
              'application/vnd.ms-excel': []
            }}
            className="my-5"
            maxFileCount={Infinity}
            value={expensePaymentManager.uploadedFiles?.map((d) => d.file)}
            onValueChange={handleFilesChange}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
