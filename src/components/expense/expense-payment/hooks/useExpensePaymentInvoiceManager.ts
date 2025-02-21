import { Currency, ExpensePaymentInvoiceEntry } from '@/types';
import dinero from 'dinero.js';
import { createDineroAmountFromFloatWithDynamicCurrency } from '@/utils/money.utils';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

type ExpensePaymentPseudoItem = { id: string; expenseInvoice: ExpensePaymentInvoiceEntry };

export type ExpensePaymentInvoiceManager = {
  expenseInvoices: ExpensePaymentPseudoItem[];
  add: (expenseInvoice?: ExpensePaymentInvoiceEntry) => void;
  update: (id: string, article: ExpensePaymentInvoiceEntry) => void;
  delete: (id: string) => void;
  setInvoices: (
    entries: ExpensePaymentInvoiceEntry[],
    currency: Currency,
    convertionRate: number,
    mode?: 'EDIT' | 'NEW'
  ) => void;
  reset: () => void;
  getInvoices: () => ExpensePaymentInvoiceEntry[];
  calculateUsedAmount: () => number;
  init: () => void;
};

export const useExpensePaymentInvoiceManager = create<ExpensePaymentInvoiceManager>()(
  (set, get) => ({
    expenseInvoices: [],
    add: (expenseInvoice: ExpensePaymentInvoiceEntry = {} as ExpensePaymentInvoiceEntry) => {
      set((state) => ({
        expenseInvoices: [...state.expenseInvoices, { id: uuidv4(), expenseInvoice }]
      }));
    },

    update: (id: string, expenseInvoice: ExpensePaymentInvoiceEntry) => {
      set((state) => ({
        expenseInvoices: state.expenseInvoices.map((a) =>
          a.id === id ? { ...a, expenseInvoice } : a
        )
      }));
    },

    delete: (id: string) => {
      set((state) => ({
        expenseInvoices: state.expenseInvoices.filter((a) => a.id !== id)
      }));
    },

    setInvoices: (
      entries: ExpensePaymentInvoiceEntry[],
      currency: Currency,
      convertionRate: number,
      mode?: 'EDIT' | 'NEW'
    ) => {
      const actualEntries =
        mode === 'EDIT'
          ? entries.map((entry) => {
              const amountPaid = entry?.expenseInvoice?.amountPaid || 0;
              const entryAmount = entry?.amount || 0;
              return {
                ...entry,
                expenseInvoice: {
                  ...entry.expenseInvoice,
                  amountPaid: amountPaid - entryAmount
                },
                amount: dinero({
                  amount: createDineroAmountFromFloatWithDynamicCurrency(
                    currency.id != entry.expenseInvoice?.currencyId
                      ? entryAmount / convertionRate
                      : entryAmount,
                    currency.digitAfterComma || 3
                  ),
                  precision: currency.digitAfterComma || 3
                }).toUnit()
              };
            })
          : entries;
      set({
        expenseInvoices: actualEntries.map((expenseInvoice) => {
          return {
            id: uuidv4(),
            expenseInvoice
          };
        })
      });
    },

    reset: () =>
      set({
        expenseInvoices: []
      }),
    init: () => {
      const updatedInvoices = get().expenseInvoices.map((i) => ({
        ...i,
        expenseInvoice: {
          ...i.expenseInvoice,
          amount: 0
        }
      }));
      set({ expenseInvoices: updatedInvoices });
    },
    getInvoices: () => {
      return get().expenseInvoices.map((item) => {
        return item.expenseInvoice;
      });
    },
    calculateUsedAmount: () => {
      const expenseInvoices = get().expenseInvoices.map((i) => i.expenseInvoice);
      return expenseInvoices.reduce((acc, expenseInvoice) => {
        return acc + (expenseInvoice?.amount || 0);
      }, 0);
    }
  })
);
