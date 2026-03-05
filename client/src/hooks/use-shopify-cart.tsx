import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { shopifyService } from '@/lib/shopify-service';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  variantId: string;
  title: string;
  price: number;
  currency: string;
  quantity: number;
  image?: string;
}

interface CartContextType {
  cartId: string | null;
  checkoutUrl: string | null;
  items: CartItem[];
  isLoading: boolean;
  addToCart: (variantId: string, itemData: Omit<CartItem, 'id' | 'quantity'>) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_ID_KEY = 'shopify_cart_id';
const CHECKOUT_URL_KEY = 'shopify_checkout_url';
const ITEMS_PREFIX = 'cart_items_';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartId, setCartId] = useState<string | null>(localStorage.getItem(CART_ID_KEY));
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(localStorage.getItem(CHECKOUT_URL_KEY));
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const syncFromStorage = useCallback(() => {
    const storedCartId = localStorage.getItem(CART_ID_KEY);
    const storedCheckoutUrl = localStorage.getItem(CHECKOUT_URL_KEY);
    
    console.log("useCart: syncFromStorage", { storedCartId, storedCheckoutUrl });
    
    setCartId(storedCartId);
    setCheckoutUrl(storedCheckoutUrl);

    if (storedCartId) {
      const storedItems = localStorage.getItem(`${ITEMS_PREFIX}${storedCartId}`);
      if (storedItems) {
        try {
          const parsedItems = JSON.parse(storedItems);
          console.log("useCart: Loaded items from storage", parsedItems.length);
          setItems(parsedItems);
        } catch (e) {
          console.error("Error parsing stored items:", e);
        }
      } else {
        console.log("useCart: No items found in storage for cartId", storedCartId);
        setItems([]);
      }
    } else {
      setItems([]);
    }
  }, []);

  const refreshCart = useCallback(async () => {
    const currentCartId = localStorage.getItem(CART_ID_KEY);
    if (!currentCartId) return;

    setIsLoading(true);
    try {
      console.log("useCart: refreshCart fetching...", currentCartId);
      const data = await shopifyService.getCart(currentCartId);
      if (data) {
        console.log("useCart: refreshCart success", data.items.length, "items");
        setItems(data.items);
        setCheckoutUrl(data.checkoutUrl);
        localStorage.setItem(CHECKOUT_URL_KEY, data.checkoutUrl);
        localStorage.setItem(`${ITEMS_PREFIX}${currentCartId}`, JSON.stringify(data.items));
      } else {
        console.warn("useCart: refreshCart returned no data, clearing cart");
        // Cart not found or expired
        clearCart();
      }
    } catch (error) {
      console.error("useCart: Error refreshing cart:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCart = useCallback(() => {
    const currentId = localStorage.getItem(CART_ID_KEY);
    localStorage.removeItem(CART_ID_KEY);
    localStorage.removeItem(CHECKOUT_URL_KEY);
    if (currentId) localStorage.removeItem(`${ITEMS_PREFIX}${currentId}`);
    
    setCartId(null);
    setCheckoutUrl(null);
    setItems([]);
    
    window.dispatchEvent(new Event('cart-updated'));
  }, []);

  useEffect(() => {
    syncFromStorage();
    
    const handleUpdate = (e: any) => {
      console.log("Syncing cart from storage due to event:", e?.type);
      syncFromStorage();
    };
    
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('cart-updated', handleUpdate);
    window.addEventListener('shopify-cart-updated', handleUpdate);
    
    // Initial fetch if we have a cartId
    const initialCartId = localStorage.getItem(CART_ID_KEY);
    if (initialCartId) {
      refreshCart();
    }

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('cart-updated', handleUpdate);
      window.removeEventListener('shopify-cart-updated', handleUpdate);
    };
  }, [syncFromStorage, refreshCart]);

  const addToCart = async (variantId: string, itemData: Omit<CartItem, 'id' | 'quantity'>) => {
    setIsLoading(true);
    try {
      const currentCartId = localStorage.getItem(CART_ID_KEY);
      console.log("useCart: Adding to cart. Current cartId:", currentCartId);
      
      if (!currentCartId) {
        console.log("useCart: Creating new cart...");
        const result = await shopifyService.createCart({ variantId, quantity: 1 });
        if (result && result.cartId) {
          console.log("useCart: Cart created successfully:", result.cartId);
          localStorage.setItem(CART_ID_KEY, result.cartId);
          localStorage.setItem(CHECKOUT_URL_KEY, result.checkoutUrl || '');
          
          const newItem = { ...itemData, id: result.lineId || result.cartId, variantId, quantity: 1 };
          localStorage.setItem(`${ITEMS_PREFIX}${result.cartId}`, JSON.stringify([newItem]));
          
          setCartId(result.cartId);
          setCheckoutUrl(result.checkoutUrl);
          setItems([newItem]);
          
          toast.success("Added to cart!");
          // Use a small delay before dispatching to ensure storage is settled
          setTimeout(() => {
            window.dispatchEvent(new Event('cart-updated'));
          }, 50);
        }
      } else {
        console.log("useCart: Adding line to existing cart:", currentCartId);
        const result = await shopifyService.addLineToCart(currentCartId, { variantId, quantity: 1 });
        if (result.success) {
          console.log("useCart: Line added successfully, refreshing...");
          await refreshCart();
          toast.success("Added to cart!");
          setTimeout(() => {
            window.dispatchEvent(new Event('cart-updated'));
          }, 50);
        } else if (result.cartNotFound) {
          console.warn("useCart: Cart not found during add, clearing and retrying...");
          clearCart();
          // Retry once
          const retryResult = await shopifyService.createCart({ variantId, quantity: 1 });
          if (retryResult) {
            localStorage.setItem(CART_ID_KEY, retryResult.cartId);
            localStorage.setItem(CHECKOUT_URL_KEY, retryResult.checkoutUrl || '');
            const newItem = { ...itemData, id: retryResult.lineId || retryResult.cartId, variantId, quantity: 1 };
            localStorage.setItem(`${ITEMS_PREFIX}${retryResult.cartId}`, JSON.stringify([newItem]));
            setCartId(retryResult.cartId);
            setCheckoutUrl(retryResult.checkoutUrl);
            setItems([newItem]);
            toast.success("Added to cart!");
            setTimeout(() => {
              window.dispatchEvent(new Event('cart-updated'));
            }, 50);
          }
        }
      }
    } catch (error) {
      console.error("useCart: Error in addToCart:", error);
      toast.error("Failed to add to cart");
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (lineId: string, quantity: number) => {
    if (!cartId) return;
    setIsLoading(true);
    try {
      const result = await shopifyService.updateCartLine(cartId, lineId, quantity);
      if (result.success) {
        await refreshCart();
        window.dispatchEvent(new Event('cart-updated'));
      } else if (result.cartNotFound) {
        clearCart();
      }
    } catch (error) {
      toast.error("Failed to update quantity");
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (lineId: string) => {
    if (!cartId) return;
    setIsLoading(true);
    try {
      const result = await shopifyService.removeLineFromCart(cartId, lineId);
      if (result.success) {
        await refreshCart();
        toast.success("Item removed from cart");
        window.dispatchEvent(new Event('cart-updated'));
      } else if (result.cartNotFound) {
        clearCart();
      }
    } catch (error) {
      toast.error("Failed to remove item");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{
      cartId,
      checkoutUrl,
      items,
      isLoading,
      addToCart,
      updateQuantity,
      removeItem,
      refreshCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
