import { FileUploader } from '@/components/ui/file-uploader';
import { Textarea } from '@/components/ui/textarea';
import { Files, NotebookTabs } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useExpenseQuotationManager } from '../hooks/useExpenseQuotationManager';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import React from 'react';

interface ExpenseQuotationUploadProps {
  className?: string;
  loading?: boolean;
}

export const ExpenseQuotationUpload = ({ className, loading }: ExpenseQuotationUploadProps) => {
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
  );
};
