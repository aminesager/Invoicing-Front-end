import React from 'react';
import { api } from '@/api';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectShimmer,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/common';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fromSequentialObjectToString } from '@/utils/string.utils';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errors';
import { useRouter } from 'next/router';
import {
  BankAccount,
  Currency,
  DuplicateExpenseInvoiceDto,
  EXPENSE_INVOICE_STATUS,
  ExpensePaymentInvoiceEntry,
  ExpenseQuotation,
  TaxWithholding
} from '@/types';
import { useExpenseInvoiceManager } from '../hooks/useExpenseInvoiceManager';
import { useExpenseInvoiceArticleManager } from '../hooks/useExpenseInvoiceArticleManager';
import { useExpenseInvoiceControlManager } from '../hooks/useExpenseInvoiceControlManager';
import { useMutation } from '@tanstack/react-query';
import { ExpenseInvoiceActionDialog } from '../dialogs/ExpenseInvoiceActionDialog';
import { ExpenseInvoiceDuplicateDialog } from '../dialogs/ExpenseInvoiceDuplicateDialog';
import { ExpenseInvoiceDownloadDialog } from '../dialogs/ExpenseInvoiceDownloadDialog';
import { ExpenseInvoiceDeleteDialog } from '../dialogs/ExpenseInvoiceDeleteDialog';
import { EXPENSE_INVOICE_LIFECYCLE_ACTIONS } from '@/constants/expense-invoice.lifecycle';
import { ExpenseInvoicePaymentList } from './ExpenseInvoicePaymentList';
import { UneditableInput } from '@/components/ui/uneditable/uneditable-input';

interface ExpenseInvoiceLifecycle {
  label: string;
  key: string;
  variant: 'default' | 'outline';
  icon: React.ReactNode;
  onClick?: () => void;
  loading: boolean;
  when: {
    membership: 'IN' | 'OUT';
    set: (EXPENSE_INVOICE_STATUS | undefined)[];
  };
}

interface ExpenseInvoiceControlSectionProps {
  className?: string;
  status?: EXPENSE_INVOICE_STATUS;
  isDataAltered?: boolean;
  bankAccounts: BankAccount[];
  currencies: Currency[];
  expenseQuotations: ExpenseQuotation[];
  expensePayments?: ExpensePaymentInvoiceEntry[];
  taxWithholdings?: TaxWithholding[];
  handleSubmit?: () => void;
  handleSubmitDraft: () => void;
  handleSubmitValidated: () => void;
  handleSubmitSent: () => void;
  handleSubmitDuplicate?: () => void;
  reset: () => void;
  loading?: boolean;
  edit?: boolean;
}

export const ExpenseInvoiceControlSection = ({
  className,
  status = undefined,
  isDataAltered,
  bankAccounts,
  currencies,
  expenseQuotations,
  expensePayments = [],
  taxWithholdings,
  handleSubmit,
  handleSubmitDraft,
  handleSubmitValidated,
  handleSubmitSent,
  reset,
  loading,
  edit = true
}: ExpenseInvoiceControlSectionProps) => {
  const router = useRouter();
  const { t: tInvoicing } = useTranslation('invoicing');
  const { t: tCommon } = useTranslation('common');
  const { t: tCurrency } = useTranslation('currency');

  const expenseInvoiceManager = useExpenseInvoiceManager();
  const controlManager = useExpenseInvoiceControlManager();
  const articleManager = useExpenseInvoiceArticleManager();

  //action dialog
  const [actionDialog, setActionDialog] = React.useState<boolean>(false);
  const [actionName, setActionName] = React.useState<string>();
  const [action, setAction] = React.useState<() => void>(() => {});

  //download dialog
  const [downloadDialog, setDownloadDialog] = React.useState(false);

  //Download ExpenseInvoice
  const { mutate: downloadExpenseInvoice, isPending: isDownloadPending } = useMutation({
    mutationFn: (data: { id: number; template: string }) =>
      api.expenseInvoice.download(data.id, data.template),
    onSuccess: () => {
      toast.success(tInvoicing('invoice.action_download_success'));
      setDownloadDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('invoice.action_download_failure'))
      );
    }
  });

  //duplicate dialog
  const [duplicateDialog, setDuplicateDialog] = React.useState(false);

  //Duplicate ExpenseInvoice
  const { mutate: duplicateExpenseInvoice, isPending: isDuplicationPending } = useMutation({
    mutationFn: (duplicateExpenseInvoiceDto: DuplicateExpenseInvoiceDto) =>
      api.expenseInvoice.duplicate(duplicateExpenseInvoiceDto),
    onSuccess: async (data) => {
      toast.success(tInvoicing('invoice.action_duplicate_success'));
      await router.push('/expense/expense-invoice/' + data.id);
      setDuplicateDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('invoice.action_duplicate_failure'))
      );
    }
  });

  //delete dialog
  const [deleteDialog, setDeleteDialog] = React.useState(false);

  //Delete ExpenseInvoice
  const { mutate: removeExpenseInvoice, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.expenseInvoice.remove(id),
    onSuccess: () => {
      toast.success(tInvoicing('invoice.action_remove_success'));
      router.push('/expense/expense-invoices');
    },
    onError: (error) => {
      toast.error(getErrorMessage('', error, tInvoicing('invoice.action_remove_failure')));
    }
  });

  const buttonsWithHandlers: ExpenseInvoiceLifecycle[] = [
    {
      ...EXPENSE_INVOICE_LIFECYCLE_ACTIONS.save,
      key: 'save',
      onClick: () => {
        setActionName(tCommon('commands.save'));
        !!handleSubmit &&
          setAction(() => {
            return () => handleSubmit();
          });
        setActionDialog(true);
      },
      loading: false
    },
    {
      ...EXPENSE_INVOICE_LIFECYCLE_ACTIONS.draft,
      key: 'draft',
      onClick: () => {
        setActionName(tCommon('commands.save'));
        !!handleSubmitDraft &&
          setAction(() => {
            return () => handleSubmitDraft();
          });
        setActionDialog(true);
      },
      loading: false
    },
    {
      ...EXPENSE_INVOICE_LIFECYCLE_ACTIONS.validated,
      key: 'validated',
      onClick: () => {
        setActionName(tCommon('commands.validate'));
        !!handleSubmitValidated &&
          setAction(() => {
            return () => handleSubmitValidated();
          });
        setActionDialog(true);
      },
      loading: false
    },
    {
      ...EXPENSE_INVOICE_LIFECYCLE_ACTIONS.sent,
      key: 'sent',
      onClick: () => {
        setActionName(tCommon('commands.send'));
        !!handleSubmitSent &&
          setAction(() => {
            return () => handleSubmitSent();
          });
        setActionDialog(true);
      },
      loading: false
    },
    {
      ...EXPENSE_INVOICE_LIFECYCLE_ACTIONS.duplicate,
      key: 'duplicate',
      onClick: () => {
        setDuplicateDialog(true);
      },
      loading: false
    },
    {
      ...EXPENSE_INVOICE_LIFECYCLE_ACTIONS.download,
      key: 'download',
      onClick: () => setDownloadDialog(true),
      loading: false
    },
    {
      ...EXPENSE_INVOICE_LIFECYCLE_ACTIONS.delete,
      key: 'delete',
      onClick: () => {
        setDeleteDialog(true);
      },
      loading: false
    },
    {
      ...EXPENSE_INVOICE_LIFECYCLE_ACTIONS.reset,
      key: 'reset',
      onClick: () => {
        setActionName(tCommon('commands.initialize'));
        !!reset &&
          setAction(() => {
            return () => reset();
          });
        setActionDialog(true);
      },
      loading: false
    }
  ];
  const sequential = fromSequentialObjectToString(expenseInvoiceManager.sequentialNumber);
  return (
    <>
      <ExpenseInvoiceActionDialog
        id={expenseInvoiceManager?.id || 0}
        sequential={sequential}
        action={actionName}
        open={actionDialog}
        callback={action}
        isCallbackPending={loading}
        onClose={() => setActionDialog(false)}
      />
      <ExpenseInvoiceDuplicateDialog
        id={expenseInvoiceManager?.id || 0}
        sequential={sequential}
        open={duplicateDialog}
        duplicateExpenseInvoice={(includeFiles: boolean) => {
          expenseInvoiceManager?.id &&
            duplicateExpenseInvoice({
              id: expenseInvoiceManager?.id,
              includeFiles: includeFiles
            });
        }}
        isDuplicationPending={isDuplicationPending}
        onClose={() => setDuplicateDialog(false)}
      />
      <ExpenseInvoiceDownloadDialog
        id={expenseInvoiceManager?.id || 0}
        open={downloadDialog}
        downloadExpenseInvoice={(template: string) => {
          expenseInvoiceManager?.id &&
            downloadExpenseInvoice({ id: expenseInvoiceManager?.id, template });
        }}
        isDownloadPending={isDownloadPending}
        onClose={() => setDownloadDialog(false)}
      />
      <ExpenseInvoiceDeleteDialog
        id={expenseInvoiceManager?.id || 0}
        sequential={fromSequentialObjectToString(expenseInvoiceManager?.sequentialNumber)}
        open={deleteDialog}
        deleteExpenseInvoice={() => {
          expenseInvoiceManager?.id && removeExpenseInvoice(expenseInvoiceManager?.id);
        }}
        isDeletionPending={isDeletePending}
        onClose={() => setDeleteDialog(false)}
      />
      <div className={cn(className)}>
        <div className="flex flex-col border-b w-full gap-2 pb-5">
          {/* expense-invoice status */}
          {status && (
            <Label className="text-base my-2 text-center">
              <span className="font-bold">{tInvoicing('invoice.attributes.status')} :</span>
              <span className="font-extrabold text-gray-500 mx-2">{tInvoicing(status)}</span>
            </Label>
          )}
          {/* expense-invoice lifecycle actions */}
          {buttonsWithHandlers.map((lifecycle: ExpenseInvoiceLifecycle) => {
            const idisplay = lifecycle.when?.set?.includes(status);
            const display = lifecycle.when?.membership == 'IN' ? idisplay : !idisplay;
            const disabled =
              isDataAltered && (lifecycle.key === 'save' || lifecycle.key === 'reset');
            return (
              display && (
                <Button
                  disabled={disabled}
                  variant={lifecycle.variant}
                  key={lifecycle.label}
                  className="flex items-center"
                  onClick={lifecycle.onClick}>
                  {lifecycle.icon}
                  <span className="mx-1">{tCommon(lifecycle.label)}</span>
                  <Spinner className="ml-2" size={'small'} show={lifecycle.loading} />
                </Button>
              )
            );
          })}
        </div>
        {/* associated quotation */}
        <div>
          <div className="border-b w-full  mt-5">
            <h1 className="font-bold">{tInvoicing('controls.associate_quotation')}</h1>
            <div className="my-4">
              {edit ? (
                <SelectShimmer isPending={loading}>
                  <Select
                    key={expenseInvoiceManager?.expenseQuotationId || 'quotationId'}
                    onValueChange={(e) => {
                      expenseInvoiceManager.set(
                        'expenseQuotationId',
                        expenseQuotations?.find((q) => q.id == parseInt(e))?.id
                      );
                    }}
                    value={expenseInvoiceManager?.expenseQuotationId?.toString()}>
                    <SelectTrigger className="my-1 w-full">
                      <SelectValue
                        placeholder={tInvoicing('controls.quotation_select_placeholder')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseQuotations?.map((q: ExpenseQuotation) => {
                        return (
                          <SelectItem key={q.id} value={q?.id?.toString() || ''}>
                            <span className="font-bold">{q?.sequential}</span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </SelectShimmer>
              ) : expenseInvoiceManager.expenseQuotationId ? (
                <UneditableInput
                  className="font-bold my-4"
                  value={
                    expenseQuotations.find((q) => q.id == expenseInvoiceManager.expenseQuotationId)
                      ?.sequential
                  }
                />
              ) : (
                <Label className="flex p-2 items-center justify-center gap-2 underline ">
                  <AlertCircle />
                  {tInvoicing('controls.no_associated_quotation')}
                </Label>
              )}
            </div>
          </div>
        </div>

        {/* Payment list */}
        {status &&
          [
            EXPENSE_INVOICE_STATUS.Sent,
            EXPENSE_INVOICE_STATUS.Unpaid,
            EXPENSE_INVOICE_STATUS.Paid,
            EXPENSE_INVOICE_STATUS.PartiallyPaid
          ].includes(status) &&
          expensePayments.length != 0 && (
            <ExpenseInvoicePaymentList
              className="border-b"
              expensePayments={expensePayments}
              currencies={currencies}
            />
          )}
        <div className="border-b w-full mt-5">
          {/* bank account choices */}
          <div>
            {bankAccounts.length == 0 && !controlManager.isBankAccountDetailsHidden && (
              <div>
                <h1 className="font-bold">{tInvoicing('controls.bank_details')}</h1>
                <Label className="flex p-5 items-center justify-center gap-2 underline ">
                  <AlertCircle />
                  {tInvoicing('controls.no_bank_accounts')}
                </Label>
              </div>
            )}

            {bankAccounts.length != 0 && !controlManager.isBankAccountDetailsHidden && (
              <div>
                <h1 className="font-bold">{tInvoicing('controls.bank_details')}</h1>
                <div className="my-5">
                  <SelectShimmer isPending={loading}>
                    <Select
                      key={expenseInvoiceManager.bankAccount?.id || 'bankAccount'}
                      onValueChange={(e) =>
                        expenseInvoiceManager.set(
                          'bankAccount',
                          bankAccounts.find((account) => account.id == parseInt(e))
                        )
                      }
                      defaultValue={expenseInvoiceManager?.bankAccount?.id?.toString() || ''}>
                      <SelectTrigger className="mty1 w-full">
                        <SelectValue placeholder={tInvoicing('controls.bank_select_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts?.map((account: BankAccount) => {
                          return (
                            <SelectItem key={account.id} value={account?.id?.toString() || ''}>
                              <span className="font-bold">{account?.name}</span> - (
                              {account?.currency?.code && tCurrency(account?.currency?.code)}(
                              {account?.currency?.symbol})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </SelectShimmer>
                </div>
              </div>
            )}
            {/* currency choices */}
            <div>
              <h1 className="font-bold">{tInvoicing('controls.currency_details')}</h1>
              {edit ? (
                <div>
                  {' '}
                  {currencies.length != 0 && (
                    <div className="my-5">
                      <SelectShimmer isPending={loading}>
                        <Select
                          key={expenseInvoiceManager.currency?.id || 'currency'}
                          onValueChange={(e) => {
                            expenseInvoiceManager.set(
                              'currency',
                              currencies.find((currency) => currency.id == parseInt(e))
                            );
                          }}
                          defaultValue={expenseInvoiceManager?.currency?.id?.toString() || ''}>
                          <SelectTrigger className="mty1 w-full">
                            <SelectValue
                              placeholder={tInvoicing('controls.currency_select_placeholder')}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies?.map((currency: Currency) => {
                              return (
                                <SelectItem
                                  key={currency.id}
                                  value={currency?.id?.toString() || ''}>
                                  {currency?.code && tCurrency(currency?.code)} ({currency.symbol})
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </SelectShimmer>
                    </div>
                  )}
                </div>
              ) : (
                <UneditableInput
                  className="font-bold my-4"
                  value={
                    expenseInvoiceManager.currency &&
                    `${expenseInvoiceManager.currency?.code && tCurrency(expenseInvoiceManager.currency?.code)} (${expenseInvoiceManager?.currency?.symbol})`
                  }
                />
              )}
            </div>
          </div>
        </div>
        <div className={cn('w-full py-5', !controlManager.isTaxWithholdingHidden && 'border-b')}>
          <h1 className="font-bold">{tInvoicing('controls.include_on_quotation')}</h1>
          <div className="flex w-full items-center mt-1">
            {/* bank details switch */}
            <Label className="w-full">{tInvoicing('controls.bank_details')}</Label>
            <div className="w-full m-1 text-right">
              <Switch
                onClick={() =>
                  controlManager.set(
                    'isBankAccountDetailsHidden',
                    !controlManager.isBankAccountDetailsHidden
                  )
                }
                {...{ checked: !controlManager.isBankAccountDetailsHidden }}
              />
            </div>
          </div>
          {/* article description switch */}
          <div className="flex w-full items-center mt-1">
            <Label className="w-full">{tInvoicing('controls.article_description')}</Label>
            <div className="w-full m-1 text-right">
              <Switch
                onClick={() => {
                  articleManager.removeArticleDescription();
                  controlManager.set(
                    'isArticleDescriptionHidden',
                    !controlManager.isArticleDescriptionHidden
                  );
                }}
                {...{ checked: !controlManager.isArticleDescriptionHidden }}
              />
            </div>
          </div>
          {/* invoicing address switch */}
          <div className="flex w-full items-center mt-1">
            <Label className="w-full">{tInvoicing('invoice.attributes.invoicing_address')}</Label>
            <div className="w-full m-1 text-right">
              <Switch
                onClick={() =>
                  controlManager.set(
                    'isExpenseInvoiceAddressHidden',
                    !controlManager.isExpenseInvoiceAddressHidden
                  )
                }
                {...{ checked: !controlManager.isExpenseInvoiceAddressHidden }}
              />
            </div>
          </div>
          {/* delivery address switch */}
          <div className="flex w-full items-center mt-1">
            <Label className="w-full">{tInvoicing('invoice.attributes.delivery_address')}</Label>
            <div className="w-full m-1 text-right">
              <Switch
                onClick={() =>
                  controlManager.set(
                    'isDeliveryAddressHidden',
                    !controlManager.isDeliveryAddressHidden
                  )
                }
                {...{ checked: !controlManager.isDeliveryAddressHidden }}
              />
            </div>
          </div>
          {/* general condition switch */}
          <div className="flex w-full items-center mt-1">
            <Label className="w-full">{tInvoicing('invoice.attributes.general_condition')}</Label>
            <div className="w-full m-1 text-right">
              <Switch
                onClick={() => {
                  expenseInvoiceManager.set('generalConditions', '');
                  controlManager.set(
                    'isGeneralConditionsHidden',
                    !controlManager.isGeneralConditionsHidden
                  );
                }}
                {...{ checked: !controlManager.isGeneralConditionsHidden }}
              />
            </div>
          </div>
          {/* tax stamp */}
          <div className="flex w-full items-center mt-1">
            <Label className="w-full">{tInvoicing('invoice.attributes.tax_stamp')}</Label>
            <div className="w-full m-1 text-right">
              <Switch
                onClick={() => {
                  // set taxStampId to null if edit
                  if (edit) expenseInvoiceManager.set('taxStampId', null);
                  controlManager.set('isTaxStampHidden', !controlManager.isTaxStampHidden);
                }}
                {...{ checked: !controlManager.isTaxStampHidden }}
              />
            </div>
          </div>
          {/* tax stamp */}
          <div className="flex w-full items-center mt-1">
            <Label className="w-full">{tInvoicing('invoice.attributes.withholding')}</Label>
            <div className="w-full m-1 text-right">
              <Switch
                onClick={() => {
                  expenseInvoiceManager.set('taxWithholdingId', null);
                  controlManager.set(
                    'isTaxWithholdingHidden',
                    !controlManager.isTaxWithholdingHidden
                  );
                }}
                {...{ checked: !controlManager.isTaxWithholdingHidden }}
              />
            </div>
          </div>
        </div>
        {!controlManager.isTaxWithholdingHidden && (
          <div className="w-full py-5">
            <h1 className="font-bold">{tInvoicing('controls.withholding')}</h1>
            <div className="my-4">
              <SelectShimmer isPending={loading}>
                <Select
                  key={expenseInvoiceManager?.taxWithholdingId || 'taxWithholdingId'}
                  onValueChange={(e) => {
                    expenseInvoiceManager.set('taxWithholdingId', parseInt(e));
                  }}
                  value={expenseInvoiceManager?.taxWithholdingId?.toString()}>
                  <SelectTrigger className="my-1 w-full">
                    <SelectValue
                      placeholder={tInvoicing('controls.tax_withholding_select_placeholder')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {taxWithholdings?.map((t: TaxWithholding) => {
                      return (
                        <SelectItem key={t.id} value={t?.id?.toString() || ''}>
                          <span className="font-bold">{t?.label}</span> <span>({t?.rate} %)</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </SelectShimmer>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
