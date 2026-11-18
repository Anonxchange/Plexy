import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface GiftCardCartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  recipientAmount?: number;
  recipientCurrency?: string;
  currency: string;
  quantity: number;
  image?: string;
}
type CartItem = GiftCardCartItem;

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  addToCart: (itemData: Omit<CartItem, 'id' | 'quantity'>, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  removePurchasedItems: (purchased: { id: string; quantity: number }[]) => void;
}

const GiftCardCartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'gift_card_cart';

function parseItems(raw: string | null): CartItem[] {
  const parsed = raw ? JSON.parse(raw) : [];
  return Array.isArray(parsed) ? parsed.filter(i =>
    typeof i?.id === "string" && typeof i?.productId === "string" &&
    typeof i?.title === "string" && typeof i?.currency === "string" &&
    /^[a-z]{3}$/i.test(i.currency) && Number.isFinite(i?.price) && i.price > 0 &&
    Number.isInteger(i?.quantity) && i.quantity > 0 && i.quantity <= 999
  ) : [];
}

export const GiftCardCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return parseItems(stored);
    } catch { return []; }
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      toast.error("Cart changes could not be saved. Keep this tab open and allow browser storage.");
    }
  }, [items]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      try {
        setItems(parseItems(event.newValue));
      } catch { /* Keep the current cart if another tab writes invalid data. */ }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const addToCart = (itemData: Omit<CartItem, 'id' | 'quantity'>, quantity = 1) => {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) return;
    setItems(prev => {
      const existing = prev.find(i => i.productId === itemData.productId && i.recipientAmount === itemData.recipientAmount && i.recipientCurrency === itemData.recipientCurrency && i.currency === itemData.currency && i.price === itemData.price);
      if (existing) {
        return prev.map(i => i.id === existing.id ? { ...i, quantity: Math.min(999, i.quantity + quantity) } : i);
      }
      return [...prev, { ...itemData, id: `gc_${crypto.randomUUID()}`, quantity }];
    });
    toast.success("Added to cart");
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success("Removed from cart");
  };

  const clearCart = () => setItems([]);
  const removePurchasedItems = (purchased: { id: string; quantity: number }[]) => {
    setItems(prev => prev.flatMap(item => {
      const bought = purchased.find(entry => entry.id === item.id);
      if (!bought) return [item];
      const quantity = item.quantity - bought.quantity;
      return quantity > 0 ? [{ ...item, quantity }] : [];
    }));
  };

  return (
    <GiftCardCartContext.Provider value={{ items, isLoading, addToCart, updateQuantity, removeItem, clearCart, removePurchasedItems }}>
      {children}
    </GiftCardCartContext.Provider>
  );
};

export const useGiftCardCart = () => {
  const context = useContext(GiftCardCartContext);
  if (!context) throw new Error('useGiftCardCart must be used within a GiftCardCartProvider');
  return context;
};
