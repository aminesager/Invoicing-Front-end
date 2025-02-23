import React from 'react';
import { api } from '@/api';
import {
  BankAccount,
  Currency,
  DuplicateExpenseQuotationDto,
  ExpenseInvoice,
  EXPENSE_QUOTATION_STATUS
} from '@/types';
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
import { useExpenseQuotationManager } from '@/components/expense/expense-quotation/hooks/useExpenseQuotationManager';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fromSequentialObjectToString } from '@/utils/string.utils';
import { ExpenseQuotationDuplicateDialog } from '../dialogs/ExpenseQuotationDuplicateDialog';
import { ExpenseQuotationDownloadDialog } from '../dialogs/ExpenseQuotationDownloadDialog';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errors';
import { useRouter } from 'next/router';
import { ExpenseQuotationDeleteDialog } from '../dialogs/ExpenseQuotationDeleteDialog';
import { useExpenseQuotationControlManager } from '../hooks/useExpenseQuotationControlManager';
import { ExpenseQuotationActionDialog } from '../dialogs/ExpenseQuotationActionDialog';
import { useExpenseQuotationArticleManager } from '../hooks/useExpenseQuotationArticleManager';
import { EXPENSE_QUOTATION_LIFECYCLE_ACTIONS } from '@/constants/expense-quotation.lifecycle';
import { ExpenseQuotationInvoiceDialog } from '../dialogs/ExpenseQuotationInvoiceDialog';
import { ExpenseQuotationInvoiceList } from './ExpenseQuotationInvoiceList';
import { UneditableInput } from '@/components/ui/uneditable/uneditable-input';

interface ExpenseQuotationLifecycle {
  label: string;
  key: string;
  variant: 'default' | 'outline';
  icon: React.ReactNode;
  onClick?: () => void;
  loading: boolean;
  when: {
    membership: 'IN' | 'OUT';
    set: (EXPENSE_QUOTATION_STATUS | undefined)[];
  };
}

interface ExpenseQuotationControlSectionProps {
  className?: string;
  status?: EXPENSE_QUOTATION_STATUS;
  isDataAltered?: boolean;
  bankAccounts: BankAccount[];
  currencies: Currency[];
  expenseInvoices: ExpenseInvoice[];
  handleSubmit?: () => void;
  handleSubmitDraft: () => void;
  handleSubmitValidated: () => void;
  handleSubmitSent: () => void;
  handleSubmitAccepted?: () => void;
  handleSubmitRejected?: () => void;
  reset: () => void;
  refetch?: () => void;
  loading?: boolean;
  edit?: boolean;
}

export const ExpenseQuotationControlSection = ({
  className,
  status = undefined,
  isDataAltered,
  bankAccounts,
  currencies,
  expenseInvoices,
  handleSubmit,
  handleSubmitDraft,
  handleSubmitValidated,
  handleSubmitSent,
  handleSubmitAccepted,
  handleSubmitRejected,
  reset,
  refetch,
  loading,
  edit = true
}: ExpenseQuotationControlSectionProps) => {
  const router = useRouter();
  const { t: tInvoicing } = useTranslation('invoicing');
  const { t: tCommon } = useTranslation('common');
  const { t: tCurrency } = useTranslation('currency');

  const expenseQuotationManager = useExpenseQuotationManager();
  const controlManager = useExpenseQuotationControlManager();
  const articleManager = useExpenseQuotationArticleManager();

  //action dialog
  const [actionDialog, setActionDialog] = React.useState<boolean>(false);
  const [actionName, setActionName] = React.useState<string>();
  const [action, setAction] = React.useState<() => void>(() => {});

  //download dialog
  const [downloadDialog, setDownloadDialog] = React.useState(false);

  //Download Quotation
  const { mutate: downloadExpenseQuotation, isPending: isDownloadPending } = useMutation({
    mutationFn: (data: { id: number; template: string }) =>
      api.expenseQuotation.download(data.id, data.template),
    onSuccess: () => {
      toast.success(tInvoicing('quotation.action_download_success'));
      setDownloadDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('quotation.action_download_failure'))
      );
    }
  });

  //duplicate dialog
  const [duplicateDialog, setDuplicateDialog] = React.useState(false);

  //Duplicate Quotation
  const { mutate: duplicateExpenseQuotation, isPending: isDuplicationPending } = useMutation({
    mutationFn: (duplicateExpenseQuotationDto: DuplicateExpenseQuotationDto) =>
      api.expenseQuotation.duplicate(duplicateExpenseQuotationDto),
    onSuccess: async (data) => {
      toast.success(tInvoicing('quotation.action_duplicate_success'));
      await router.push('/expense/expense-quotation/' + data.id);
      setDuplicateDialog(false);
    },
    onError: (error) => {
      toast.error(
        getErrorMessage('invoicing', error, tInvoicing('quotation.action_duplicate_failure'))
      );
    }
  });

  //delete dialog
  const [deleteDialog, setDeleteDialog] = React.useState(false);

  //Delete ExpenseQuotation
  const { mutate: removeExpenseQuotation, isPending: isDeletePending } = useMutation({
    mutationFn: (id: number) => api.expenseQuotation.remove(id),
    onSuccess: () => {
      toast.success(tInvoicing('quotation.action_remove_success'));
      router.push('/expense/expense-quotations');
    },
    onError: (error) => {
      toast.error(getErrorMessage('', error, tInvoicing('quotation.action_remove_failure')));
    }
  });

  //invoice dialog
  const [expenseInvoiceDialog, setExpenseInvoiceDialog] = React.useState(false);

  //Invoice quotation
  const { mutate: expenseInvoiceExpenseQuotation, isPending: isInvoicingPending } = useMutation({
    mutationFn: (data: { id?: number; createExpenseInvoice: boolean }) =>
      api.expenseQuotation.expenseInvoice(data.id, data.createExpenseInvoice),
    onSuccess: (data) => {
      toast.success('Devis facturé avec succès');
      refetch?.();
      router.push(
        `/expense/expense-invoice/${data.expenseInvoices[data?.expenseInvoices?.length - 1].id}`
      );
    },
    onError: (error) => {
      const message = getErrorMessage('contacts', error, 'Erreur lors de la facturation de devis');
      toast.error(message);
    }
  });

  const buttonsWithHandlers: ExpenseQuotationLifecycle[] = [
    {
      ...EXPENSE_QUOTATION_LIFECYCLE_ACTIONS.save,
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
      ...EXPENSE_QUOTATION_LIFECYCLE_ACTIONS.draft,
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
      ...EXPENSE_QUOTATION_LIFECYCLE_ACTIONS.validated,
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
      ...EXPENSE_QUOTATION_LIFECYCLE_ACTIONS.sent,
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
      ...EXPENSE_QUOTATION_LIFECYCLE_ACTIONS.accepted,
      key: 'accepted',
      onClick: () => {
        setActionName(tCommon('commands.accept'));
        !!handleSubmitAccepted &&
          setAction(() => {
            return () => handleSubmitAccepted();
          });
        setActionDialog(true);
      },
      loading: false
    },
    {
      ...EXPENSE_QUOTATION_LIFECYCLE_ACTIONS.rejected,
      key: 'rejected',
      onClick: () => {
        setActionName(tCommon('commands.reject'));
        !!handleSubmitRejected &&
          setAction(() => {
            return () => handleSubmitRejected();
          });
        setActionDialog(true);
      },
      loading: false
    },
    {
      ...EXPENSE_QUOTATION_LIFECYCLE_ACTIONS.invoiced,
      key: 'to_invoice',
      onClick: () => {
        setExpenseInvoiceDialog(true);
      },
      loading: false
    },
    {
      ...EXPENSE_QUOTATION_LIFECYCLE_ACTIONS.duplicate,
      key: 'duplicate',
      onClick: () => {
        setDuplicateDialog(true);
      },
      loading: false
    },
    {
      ...EXPENSE_QUOTATION_LIFECYCLE_ACTIONS.download,
      key: 'download',
      onClick: () => setDownloadDialog(true),
      loading: false
    },
    {
      ...EXPENSE_QUOTATION_LIFECYCLE_ACTIONS.delete,
      key: 'delete',
      onClick: () => {
        setDeleteDialog(true);
      },
      loading: false
    },
    {
      ...EXPENSE_QUOTATION_LIFECYCLE_ACTIONS.reset,
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
  const sequential = fromSequentialObjectToString(expenseQuotationManager.sequentialNumber);
  return (
    <>
      <ExpenseQuotationActionDialog
        id={expenseQuotationManager?.id || 0}
        sequential={sequential}
        action={actionName}
        open={actionDialog}
        callback={action}
        isCallbackPending={loading}
        onClose={() => setActionDialog(false)}
      />
      <ExpenseQuotationDuplicateDialog
        id={expenseQuotationManager?.id || 0}
        sequential={sequential}
        open={duplicateDialog}
        duplicateExpenseQuotation={(includeFiles: boolean) => {
          expenseQuotationManager?.id &&
            duplicateExpenseQuotation({
              id: expenseQuotationManager?.id,
              includeFiles: includeFiles
            });
        }}
        isDuplicationPending={isDuplicationPending}
        onClose={() => setDuplicateDialog(false)}
      />
      <ExpenseQuotationDownloadDialog
        id={expenseQuotationManager?.id || 0}
        open={downloadDialog}
        downloadExpenseQuotation={(template: string) => {
          expenseQuotationManager?.id &&
            downloadExpenseQuotation({ id: expenseQuotationManager?.id, template });
        }}
        isDownloadPending={isDownloadPending}
        onClose={() => setDownloadDialog(false)}
      />
      <ExpenseQuotationDeleteDialog
        id={expenseQuotationManager?.id || 0}
        sequential={sequential}
        open={deleteDialog}
        deleteExpenseQuotation={() => {
          expenseQuotationManager?.id && removeExpenseQuotation(expenseQuotationManager?.id);
        }}
        isDeletionPending={isDeletePending}
        onClose={() => setDeleteDialog(false)}
      />
      <ExpenseQuotationInvoiceDialog
        id={expenseQuotationManager?.id || 0}
        status={expenseQuotationManager?.status}
        sequential={sequential}
        open={expenseInvoiceDialog}
        isExpenseInvoicePending={isInvoicingPending}
        expenseInvoice={(id: number, createExpenseInvoice: boolean) => {
          expenseInvoiceExpenseQuotation({ id, createExpenseInvoice });
        }}
        onClose={() => setExpenseInvoiceDialog(false)}
      />
      <div className={cn(className)}>
        <div className="flex flex-col border-b w-full gap-2 pb-5">
          {/* quotation status */}
          {status && (
            <Label className="text-base my-2 text-center">
              <span className="font-bold">{tInvoicing('quotation.attributes.status')} :</span>
              <span className="font-extrabold text-gray-500 ml-2 mr-1">{tInvoicing(status)}</span>
              {status === EXPENSE_QUOTATION_STATUS.Invoiced && expenseInvoices?.length != 0 && (
                <span className="font-extrabold text-gray-500">({expenseInvoices?.length})</span>
              )}
            </Label>
          )}
          {/* quotation lifecycle actions */}
          {buttonsWithHandlers.map((lifecycle: ExpenseQuotationLifecycle) => {
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
        {/* Invoice list */}
        {status === EXPENSE_QUOTATION_STATUS.Invoiced && expenseInvoices.length != 0 && (
          <ExpenseQuotationInvoiceList className="border-b" expenseInvoices={expenseInvoices} />
        )}
        <div className={cn('w-full mt-5 border-b')}>
          {/* bank account choices */}
          <div>
            {!controlManager.isBankAccountDetailsHidden && (
              <React.Fragment>
                {bankAccounts.length == 0 && (
                  <div>
                    <h1 className="font-bold">{tInvoicing('controls.bank_details')}</h1>
                    <Label className="flex p-5 items-center justify-center gap-2 underline ">
                      <AlertCircle />
                      {tInvoicing('controls.no_bank_accounts')}
                    </Label>
                  </div>
                )}
                {bankAccounts.length != 0 && (
                  <div>
                    <h1 className="font-bold">{tInvoicing('controls.bank_details')}</h1>
                    <div className="my-5">
                      <SelectShimmer isPending={loading}>
                        <Select
                          key={expenseQuotationManager.bankAccount?.id || 'bankAccount'}
                          onValueChange={(e) =>
                            expenseQuotationManager.set(
                              'bankAccount',
                              bankAccounts.find((account) => account.id == parseInt(e))
                            )
                          }
                          defaultValue={expenseQuotationManager?.bankAccount?.id?.toString() || ''}>
                          <SelectTrigger className="mty1 w-full">
                            <SelectValue
                              placeholder={tInvoicing('controls.bank_select_placeholder')}
                            />
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
              </React.Fragment>
            )}
            {/* currency choices */}
            <h1 className="font-bold">{tInvoicing('controls.currency_details')}</h1>
            {edit ? (
              <div>
                {currencies.length != 0 && (
                  <div className="my-5">
                    <SelectShimmer isPending={loading}>
                      <Select
                        key={expenseQuotationManager.currency?.id || 'currency'}
                        onValueChange={(e) => {
                          expenseQuotationManager.set(
                            'currency',
                            currencies.find((currency) => currency.id == parseInt(e))
                          );
                        }}
                        defaultValue={expenseQuotationManager?.currency?.id?.toString() || ''}>
                        <SelectTrigger className="mty1 w-full">
                          <SelectValue
                            placeholder={tInvoicing('controls.currency_select_placeholder')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies?.map((currency: Currency) => {
                            return (
                              <SelectItem key={currency.id} value={currency?.id?.toString() || ''}>
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
                  expenseQuotationManager.currency &&
                  `${expenseQuotationManager.currency?.code && tCurrency(expenseQuotationManager.currency?.code)} (${expenseQuotationManager?.currency?.symbol})`
                }
              />
            )}
          </div>
        </div>
        <div className="w-full py-5">
          <h1 className="font-bold">{tInvoicing('controls.include_on_quotation')}</h1>
          <div className="flex w-full items-center mt-1">
            {/* bank details switch */}
            <Label className="w-full">{tInvoicing('controls.bank_details')}</Label>
            <div className="w-full m-1 text-right">
              <Switch
                onClick={() => {
                  controlManager.set(
                    'isBankAccountDetailsHidden',
                    !controlManager.isBankAccountDetailsHidden
                  );
                  expenseQuotationManager.set('bankAccount', null);
                }}
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
            <Label className="w-full">{tInvoicing('quotation.attributes.invoicing_address')}</Label>
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
            <Label className="w-full">{tInvoicing('quotation.attributes.delivery_address')}</Label>
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
            <Label className="w-full">{tInvoicing('quotation.attributes.general_condition')}</Label>
            <div className="w-full m-1 text-right">
              <Switch
                onClick={() => {
                  expenseQuotationManager.set('generalConditions', '');
                  controlManager.set(
                    'isGeneralConditionsHidden',
                    !controlManager.isGeneralConditionsHidden
                  );
                }}
                {...{ checked: !controlManager.isGeneralConditionsHidden }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
