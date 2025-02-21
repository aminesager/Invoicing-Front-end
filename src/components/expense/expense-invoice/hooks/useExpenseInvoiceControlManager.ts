import { create } from 'zustand';

export type ExpenseInvoiceControlManager = {
  isBankAccountDetailsHidden: boolean;
  isExpenseInvoiceAddressHidden: boolean;
  isDeliveryAddressHidden: boolean;
  isGeneralConditionsHidden: boolean;
  isArticleDescriptionHidden: boolean;
  isTaxStampHidden: boolean;
  isTaxWithholdingHidden: boolean;
  toggle: (field: keyof ExpenseInvoiceControlManager) => void;
  set: (field: keyof ExpenseInvoiceControlManager, value: boolean) => void;
  setControls: (
    data: Omit<
      ExpenseInvoiceControlManager,
      'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'
    >
  ) => void;
  getControls: () => Omit<
    ExpenseInvoiceControlManager,
    'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'
  >;
  reset: () => void;
};

export const useExpenseInvoiceControlManager = create<ExpenseInvoiceControlManager>()(
  (set, get) => ({
    isBankAccountDetailsHidden: false,
    isExpenseInvoiceAddressHidden: false,
    isDeliveryAddressHidden: false,
    isGeneralConditionsHidden: false,
    isArticleDescriptionHidden: false,
    isTaxStampHidden: false,
    isTaxWithholdingHidden: true,
    toggle: (field: keyof ExpenseInvoiceControlManager) =>
      set((state) => ({ ...state, [field]: !state[field] })),
    set: (field: keyof ExpenseInvoiceControlManager, value: boolean) =>
      set((state) => ({ ...state, [field]: value })),
    setControls: (data: any) => {
      set((state) => ({ ...state, ...data }));
    },
    getControls: () => {
      return get();
    },
    reset: () =>
      set({
        isBankAccountDetailsHidden: false,
        isExpenseInvoiceAddressHidden: false,
        isDeliveryAddressHidden: false,
        isGeneralConditionsHidden: false,
        isArticleDescriptionHidden: false,
        isTaxStampHidden: false,
        isTaxWithholdingHidden: true
      })
  })
);
