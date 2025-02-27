import { create } from 'zustand';

export type ExpenseQuotationControlManager = {
  isBankAccountDetailsHidden: boolean;
  // isExpenseInvoiceAddressHidden: boolean;
  // isDeliveryAddressHidden: boolean;
  isGeneralConditionsHidden: boolean;
  isArticleDescriptionHidden: boolean;
  toggle: (field: keyof ExpenseQuotationControlManager) => void;
  set: (field: keyof ExpenseQuotationControlManager, value: boolean) => void;
  setControls: (
    data: Omit<
      ExpenseQuotationControlManager,
      'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'
    >
  ) => void;
  getControls: () => Omit<
    ExpenseQuotationControlManager,
    'toggle' | 'set' | 'getControls' | 'setControls' | 'reset'
  >;
  reset: () => void;
};

export const useExpenseQuotationControlManager = create<ExpenseQuotationControlManager>()(
  (set, get) => ({
    isBankAccountDetailsHidden: false,
    // isExpenseInvoiceAddressHidden: false,
    // isDeliveryAddressHidden: false,
    isGeneralConditionsHidden: false,
    isArticleDescriptionHidden: false,
    toggle: (field: keyof ExpenseQuotationControlManager) =>
      set((state) => ({ ...state, [field]: !state[field] })),
    set: (field: keyof ExpenseQuotationControlManager, value: boolean) =>
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
        // isExpenseInvoiceAddressHidden: false,
        // isDeliveryAddressHidden: false,
        isGeneralConditionsHidden: false,
        isArticleDescriptionHidden: false
      })
  })
);
