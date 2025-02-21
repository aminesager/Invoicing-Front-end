import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { FileUploader } from '@/components/ui/file-uploader';
import { Textarea } from '@/components/ui/textarea';
import { Files, NotebookTabs } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useExpenseQuotationManager } from '../hooks/useExpenseQuotationManager';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import React from 'react';

interface ExpenseQuotationExtraOptionsProps {
  className?: string;
  loading?: boolean;
}

export const ExpenseQuotationExtraOptions = ({
  className,
  loading
}: ExpenseQuotationExtraOptionsProps) => {
  const { t: tInvoicing } = useTranslation('invoicing');
  const expenseQuotationManager = useExpenseQuotationManager();

  const handleFilesChange = (files: File[]) => {
    if (files.length > expenseQuotationManager.uploadedFiles.length) {
      const newFiles = files.filter(
        (file) =>
          !expenseQuotationManager.uploadedFiles.some((uploadedFile) => uploadedFile.file === file)
      );
      expenseQuotationManager.set('uploadedFiles', [
        ...expenseQuotationManager.uploadedFiles,
        ...newFiles.map((file) => ({ file }))
      ]);
    } else {
      const updatedFiles = expenseQuotationManager.uploadedFiles.filter((uploadedFile) =>
        files.some((file) => file === uploadedFile.file)
      );
      expenseQuotationManager.set('uploadedFiles', updatedFiles);
    }
  };

  return (
    <Accordion type="multiple" className={cn(className, 'mx-1 border-b')}>
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <div className="flex gap-2 justify-center items-center">
            <Files />
            <Label>{tInvoicing('expense-quotation.attributes.files')}</Label>
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
            value={expenseQuotationManager.uploadedFiles?.map((d) => d.file)}
            onValueChange={handleFilesChange}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          <div className="flex gap-2 justify-center items-center">
            <NotebookTabs />
            <Label>{tInvoicing('quotation.attributes.notes')}</Label>
          </div>
        </AccordionTrigger>
        <AccordionContent className="m-5">
          <Textarea
            placeholder={tInvoicing('expense-quotation.attributes.notes')}
            className="resize-none"
            value={expenseQuotationManager.notes}
            onChange={(e) => expenseQuotationManager.set('notes', e.target.value)}
            isPending={loading}
            rows={7}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
