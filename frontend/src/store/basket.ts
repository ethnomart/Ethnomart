import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BasketItem {
  productId: number;
  productName: string;
  priceGbp: number;
  quantity: number;
  imageUrl?: string;
}

interface BasketState {
  storeId: number | null;
  storeName: string | null;
  items: BasketItem[];
  addItem: (item: BasketItem, storeId: number, storeName: string) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearBasket: () => void;
  totalGbp: () => number;
  itemCount: () => number;
}

export const useBasketStore = create<BasketState>()(
  persist(
    (set, get) => ({
      storeId: null,
      storeName: null,
      items: [],

      addItem: (item: BasketItem, storeId: number, storeName: string) => {
        set((state: BasketState) => {
          let newItems = state.items;
          if (state.storeId !== null && state.storeId !== storeId) {
            newItems = [];
          }

          const existingItem = newItems.find(
            (i: BasketItem) => i.productId === item.productId,
          );
          if (existingItem) {
            return {
              storeId,
              storeName,
              items: newItems.map((i: BasketItem) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          }

          return {
            storeId,
            storeName,
            items: [...newItems, item],
          };
        });
      },

      removeItem: (productId: number) => {
        set((state: BasketState) => {
          const newItems = state.items.filter(
            (i: BasketItem) => i.productId !== productId,
          );
          return {
            items: newItems,
            storeId: newItems.length === 0 ? null : state.storeId,
            storeName: newItems.length === 0 ? null : state.storeName,
          };
        });
      },

      updateQuantity: (productId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state: BasketState) => ({
          items: state.items.map((i: BasketItem) =>
            i.productId === productId ? { ...i, quantity } : i,
          ),
        }));
      },

      clearBasket: () => set({ storeId: null, storeName: null, items: [] }),

      totalGbp: () =>
        get().items.reduce(
          (total: number, item: BasketItem) =>
            total + item.priceGbp * item.quantity,
          0,
        ),

      itemCount: () =>
        get().items.reduce(
          (count: number, item: BasketItem) => count + item.quantity,
          0,
        ),
    }),
    {
      name: 'ethnomart-basket',
    },
  ),
);
