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
  const [cartId, setCartId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(CART_ID_KEY);
  });
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(CHECKOUT_URL_KEY);
  });
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const storedCartId = localStorage.getItem(CART_ID_KEY);
      if (storedCartId) {
        const storedItems = localStorage.getItem(`${ITEMS_PREFIX}${storedCartId}`);
        if (storedItems) {
          const parsed = JSON.parse(storedItems);
          const result = Array.isArray(parsed) ? parsed : [];
          console.log("useCart: Initial items load:", result.length);
          return [...result];
        }
      }
    } catch (e) {
      console.error("useCart: Initial items load error", e);
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const isRefreshing = React.useRef(false);

  // Use a ref to store items and ensure listeners always have access to the latest state
  const itemsRef = React.useRef<CartItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const syncFromStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const storedCartId = localStorage.getItem(CART_ID_KEY);
    const storedCheckoutUrl = localStorage.getItem(CHECKOUT_URL_KEY);
    
    console.log("useCart: syncFromStorage triggered", { storedCartId });
    
    setCartId(storedCartId);
    setCheckoutUrl(storedCheckoutUrl);

    if (storedCartId) {
      const storedItems = localStorage.getItem(`${ITEMS_PREFIX}${storedCartId}`);
      if (storedItems) {
        try {
          const parsedItems = JSON.parse(storedItems);
          if (Array.isArray(parsedItems)) {
            // Functional update to force re-render with fresh reference
            setItems(() => [...parsedItems]);
          } else {
            setItems([]);
          }
        } catch (e) {
          console.error("Error parsing stored items:", e);
          setItems([]);
        }
      } else {
        setItems([]);
      }
    } else {
      setItems([]);
    }
  }, []);

  const clearCart = useCallback(() => {
    if (typeof window === 'undefined') return;
    const currentId = localStorage.getItem(CART_ID_KEY);
    localStorage.removeItem(CART_ID_KEY);
    localStorage.removeItem(CHECKOUT_URL_KEY);
    if (currentId) localStorage.removeItem(`${ITEMS_PREFIX}${currentId}`);
    
    setCartId(null);
    setCheckoutUrl(null);
    setItems([]);
    
    // Explicitly notify other components that cart is cleared
    window.dispatchEvent(new CustomEvent('shopify-cart-updated', { detail: { action: 'clear' } }));
  }, []);

  const refreshCart = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const currentCartId = localStorage.getItem(CART_ID_KEY);
    if (!currentCartId) return;

    // Use a flag to prevent multiple concurrent refreshes
    if (isRefreshing.current) {
      return;
    }

    isRefreshing.current = true;
    // Only set loading if we don't have items to prevent UI flicker
    if (itemsRef.current.length === 0) {
      setIsLoading(true);
    }
    try {
      console.log("useCart: refreshCart fetching...", currentCartId);
      const data = await shopifyService.getCart(currentCartId);
      
      // Only update if we actually got a response to avoid clearing on network errors
      if (data && data.items) {
        console.log("useCart: refreshCart success", data.items.length, "items");
        const newItems = Array.isArray(data.items) ? [...data.items] : [];
        
        // CRITICAL FIX: If Shopify returns an empty cart but we just added something locally
        // or have a different count, it's likely a race condition on Shopify's side.
        // We trust our local state if it's "fresher" (has items) than a null/empty response
        // during active transitions.
        if (newItems.length === 0 && itemsRef.current.length > 0) {
          const lastUpdate = localStorage.getItem('last_cart_update');
          const now = Date.now();
          // If we updated in the last 5 seconds, don't let a null response wipe us out
          if (lastUpdate && (now - parseInt(lastUpdate)) < 5000) {
            console.warn("useCart: Shopify returned empty cart immediately after local update. Preserving local state.");
            return;
          }
        }

        localStorage.setItem(CHECKOUT_URL_KEY, data.checkoutUrl || '');
        localStorage.setItem(`${ITEMS_PREFIX}${currentCartId}`, JSON.stringify(newItems));
        
        setCartId(currentCartId);
        setCheckoutUrl(data.checkoutUrl);
        setItems(newItems);
      } else if (data === null) {
        console.warn("useCart: refreshCart confirmed cart not found");
      }
    } catch (error) {
      console.error("useCart: Error refreshing cart:", error);
    } finally {
      setIsLoading(false);
      isRefreshing.current = false;
    }
  }, [clearCart]);

  useEffect(() => {
    // Initial sync from storage happens immediately
    syncFromStorage();
    
    const handleUpdate = (e: any) => {
      // If the event was internal (same tab), we've already updated state
      if (e?.detail?.source === 'internal') {
        return;
      }

      console.log("Syncing cart from storage due to event:", e?.type || 'manual', e?.detail);
      
      const storedCartId = localStorage.getItem(CART_ID_KEY);
      const storedCheckoutUrl = localStorage.getItem(CHECKOUT_URL_KEY);
      
      if (storedCartId !== cartId) setCartId(storedCartId);
      if (storedCheckoutUrl !== checkoutUrl) setCheckoutUrl(storedCheckoutUrl);
      
      if (storedCartId) {
        const storedItems = localStorage.getItem(`${ITEMS_PREFIX}${storedCartId}`);
        if (storedItems) {
          try {
            const parsed = JSON.parse(storedItems);
            const freshItems = Array.isArray(parsed) ? parsed : [];
            // Only update if actually different to prevent render loops
            if (JSON.stringify(freshItems) !== JSON.stringify(itemsRef.current)) {
              setItems([...freshItems]);
            }
          } catch (err) {
            console.error("useCart: handleUpdate parse error", err);
          }
        }
      }
      
      if (e?.detail?.action === 'add' || e?.detail?.action === 'update' || e?.detail?.action === 'remove') {
        refreshCart();
      }
    };

    const storageListener = (e: StorageEvent) => {
      if (e.key === CART_ID_KEY || e.key === CHECKOUT_URL_KEY || (e.key && e.key.startsWith(ITEMS_PREFIX))) {
        handleUpdate(e);
      }
    };
    
    window.addEventListener('storage', storageListener);
    window.addEventListener('cart-updated', handleUpdate);
    window.addEventListener('shopify-cart-updated', handleUpdate);
    
    // Initial fetch if we have a cartId - Use a small delay to ensure providers are ready
    // Only fetch if we don't already have items to avoid clearing local state on startup
    const timer = setTimeout(() => {
      const initialCartId = localStorage.getItem(CART_ID_KEY);
      const initialCheckoutUrl = localStorage.getItem(CHECKOUT_URL_KEY);
      
      // Ensure checkoutUrl is in state if it exists in storage
      if (initialCheckoutUrl && !checkoutUrl) {
        setCheckoutUrl(initialCheckoutUrl);
      }

      // Fix: Don't call refreshCart if we already have items to prevent race condition clearing local state
      // Even if storedItems is null, we might have items in memory from a previous add
      if (initialCartId && itemsRef.current.length === 0) {
        refreshCart();
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', storageListener);
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
          
          const newItem: CartItem = { 
            ...itemData, 
            id: result.lineId || `temp_${Date.now()}`, 
            variantId, 
            quantity: 1 
          };
          
          localStorage.setItem(CART_ID_KEY, result.cartId);
          localStorage.setItem(CHECKOUT_URL_KEY, result.checkoutUrl || '');
          localStorage.setItem(`${ITEMS_PREFIX}${result.cartId}`, JSON.stringify([newItem]));
          localStorage.setItem('last_cart_update', Date.now().toString());
          
          setCartId(result.cartId);
          setCheckoutUrl(result.checkoutUrl);
          setItems([newItem]);
          
          toast.success("Added to cart!");
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('shopify-cart-updated', { 
              detail: { action: 'add', cartId: result.cartId, source: 'internal' } 
            }));
          }, 50);
        }
      } else {
        console.log("useCart: Adding line to existing cart:", currentCartId);
        const result = await shopifyService.addLineToCart(currentCartId, { variantId, quantity: 1 });
        if (result.success) {
          console.log("useCart: Line added successfully, updating local state...");
          
          // Optimistic update of local storage and state
          const newItem: CartItem = { 
            ...itemData, 
            id: result.lineId || `temp_${Date.now()}`, 
            variantId, 
            quantity: 1 
          };
          
          const currentItems = [...itemsRef.current];
          const existingItemIndex = currentItems.findIndex(item => item.variantId === variantId);
          
          let updatedItems;
          if (existingItemIndex > -1) {
            updatedItems = currentItems.map((item, idx) => 
              idx === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item
            );
          } else {
            updatedItems = [...currentItems, newItem];
          }
          
          localStorage.setItem(`${ITEMS_PREFIX}${currentCartId}`, JSON.stringify(updatedItems));
          localStorage.setItem('last_cart_update', Date.now().toString());
          setItems(updatedItems);
          
          toast.success("Added to cart!");
          
          // Ensure we have a checkout URL - if missing, refresh once
          const currentCheckoutUrl = localStorage.getItem(CHECKOUT_URL_KEY);
          if (!currentCheckoutUrl || currentCheckoutUrl === 'null' || currentCheckoutUrl === '') {
            console.log("useCart: Checkout URL missing, refreshing...");
            refreshCart();
          }
          
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('shopify-cart-updated', { 
              detail: { action: 'add', cartId: currentCartId, source: 'internal' } 
            }));
          }, 50);
        } else if (result.cartNotFound) {
          console.warn("useCart: Cart not found during add, clearing and retrying...");
          clearCart();
          // Retry once
          const retryResult = await shopifyService.createCart({ variantId, quantity: 1 });
          if (retryResult && retryResult.cartId) {
            const newItem: CartItem = { 
              ...itemData, 
              id: retryResult.lineId || `temp_${Date.now()}`, 
              variantId, 
              quantity: 1 
            };
            localStorage.setItem(CART_ID_KEY, retryResult.cartId);
            localStorage.setItem(CHECKOUT_URL_KEY, retryResult.checkoutUrl || '');
            localStorage.setItem(`${ITEMS_PREFIX}${retryResult.cartId}`, JSON.stringify([newItem]));
            setCartId(retryResult.cartId);
            setCheckoutUrl(retryResult.checkoutUrl);
            setItems([newItem]);
            toast.success("Added to cart!");
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('shopify-cart-updated', { detail: { action: 'add', cartId: retryResult.cartId } }));
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
    const currentCartId = localStorage.getItem(CART_ID_KEY);
    if (!currentCartId) return;
    
    // Optimistic update using ref-safe approach
    const previousItems = [...itemsRef.current];
    setItems(prev => prev.map(item => 
      item.id === lineId ? { ...item, quantity } : item
    ));

    setIsLoading(true);
    try {
      const result = await shopifyService.updateCartLine(currentCartId, lineId, quantity);
      if (result.success) {
        await refreshCart();
        window.dispatchEvent(new CustomEvent('shopify-cart-updated', { detail: { action: 'update', lineId, quantity } }));
      } else if (result.cartNotFound) {
        console.warn("useCart: updateQuantity/removeItem cart not found, NOT clearing");
        // clearCart();
      } else {
        setItems(previousItems);
      }
    } catch (error) {
      setItems(previousItems);
      toast.error("Failed to update quantity");
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (lineId: string) => {
    const currentCartId = localStorage.getItem(CART_ID_KEY);
    if (!currentCartId) return;
    
    // Optimistic update using ref-safe approach
    const previousItems = [...itemsRef.current];
    setItems(prev => prev.filter(item => item.id !== lineId));

    setIsLoading(true);
    try {
      const result = await shopifyService.removeLineFromCart(currentCartId, lineId);
      if (result.success) {
        await refreshCart();
        toast.success("Item removed from cart");
        window.dispatchEvent(new CustomEvent('shopify-cart-updated', { detail: { action: 'remove', lineId } }));
      } else if (result.cartNotFound) {
        console.warn("useCart: updateQuantity/removeItem cart not found, NOT clearing");
        // clearCart();
      } else {
        setItems(previousItems);
      }
    } catch (error) {
      setItems(previousItems);
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
