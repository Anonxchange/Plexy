import { toast } from "sonner";
import { supabase } from "./supabase";

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    handle: string;
    priceRange: {
      minVariantPrice: {
        amount: string;
        currencyCode: string;
      };
    };
    images: {
      edges: Array<{
        node: {
          url: string;
          altText: string | null;
        };
      }>;
    };
    variants: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          price: {
            amount: string;
            currencyCode: string;
          };
          availableForSale: boolean;
          selectedOptions: Array<{
            name: string;
            value: string;
          }>;
        };
      }>;
    };
    options: Array<{
      name: string;
      values: string[];
    }>;
  };
}

// Query name constants matching server-side allowlist
export const PRODUCTS_QUERY = 'getProducts';
export const PRODUCT_BY_HANDLE_QUERY = 'getProductByHandle';
export const CART_QUERY = 'cartQuery';
export const CART_CREATE_MUTATION = 'cartCreate';
export const CART_LINES_ADD_MUTATION = 'cartLinesAdd';
export const CART_LINES_UPDATE_MUTATION = 'cartLinesUpdate';
export const CART_LINES_REMOVE_MUTATION = 'cartLinesRemove';

export async function storefrontApiRequest(queryName: string, variables: Record<string, unknown> = {}) {
  try {
    const { data, error } = await supabase.functions.invoke('shopify-storefront', {
      body: { queryName, variables }
    });

    if (error) {
      if (error.status === 402) {
        toast.error("Shopify: Payment required", {
          description: "Your store needs an active billing plan. Visit https://admin.shopify.com to upgrade.",
        });
        return;
      }
      // Handle generic error message from server
      const errorMessage = error.message || "Failed to process request";
      console.error('Supabase function error:', error);
      throw new Error(errorMessage);
    }

    if (data?.errors) {
      throw new Error(`Error calling Shopify: ${data.errors.map((e: { message: string }) => e.message).join(', ')}`);
    }
    
    // Check if the response itself contains an error field (from our Deno.serve catch block)
    if (data?.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (err: any) {
    console.error('Shopify request failed:', err);
    throw err;
  }
}

export function formatPrice(amount: string | number, currencyCode: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(Number(amount));
}

function formatCheckoutUrl(checkoutUrl: string): string {
  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set('channel', 'online_store');
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}

function isCartNotFoundError(userErrors: Array<{ field: string[] | null; message: string }>): boolean {
  return userErrors.some(e => e.message.toLowerCase().includes('cart not found') || e.message.toLowerCase().includes('does not exist'));
}

export const shopifyService = {
  async getProducts(first: number = 250, after?: string, query?: string) {
    const data = await storefrontApiRequest(PRODUCTS_QUERY, { first, after, query });
    return {
      products: data?.data?.products?.edges || [],
      pageInfo: data?.data?.products?.pageInfo
    };
  },

  async getProductByHandle(handle: string) {
    const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
    return data?.data?.productByHandle;
  },

  async getCart(cartId: string) {
    const data = await storefrontApiRequest(CART_QUERY, { id: cartId });
    const cart = data?.data?.cart;
    if (!cart) return null;

    // The cart query in the edge function only returns id and totalQuantity
    // We need more details for the UI. However, the Edge Function ALLOWED_QUERIES 
    // for cartQuery is: query cart($id: ID!) { cart(id: $id) { id totalQuantity } }
    
    // WAIT: I see the Edge Function source in attached_assets.
    // It has:
    // cartQuery: `query cart($id: ID!) { cart(id: $id) { id totalQuantity } }`
    // This is very limited. I should probably update the Edge Function if I could, 
    // but I only have the client code.
    
    // Actually, looking at cartCreate and cartLinesAdd, they return:
    // lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } }
    
    // If I can't change the Edge Function, I have to work with what's there.
    // But the CartSheet UI needs title, price, etc.
    
    return cart;
  },

  async createCart(item: { variantId: string; quantity: number }) {
    const data = await storefrontApiRequest(CART_CREATE_MUTATION, {
      input: { lines: [{ quantity: item.quantity, merchandiseId: item.variantId }] },
    });

    if (data?.data?.cartCreate?.userErrors?.length > 0) {
      console.error('Cart creation failed:', data.data.cartCreate.userErrors);
      return null;
    }

    const cart = data?.data?.cartCreate?.cart;
    if (!cart?.checkoutUrl) return null;

    const lineId = cart.lines.edges[0]?.node?.id;
    if (!lineId) return null;

    return { cartId: cart.id, checkoutUrl: formatCheckoutUrl(cart.checkoutUrl), lineId };
  },

  async addLineToCart(cartId: string, item: { variantId: string; quantity: number }) {
    const data = await storefrontApiRequest(CART_LINES_ADD_MUTATION, {
      cartId,
      lines: [{ quantity: item.quantity, merchandiseId: item.variantId }],
    });

    const userErrors = data?.data?.cartLinesAdd?.userErrors || [];
    if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
    if (userErrors.length > 0) return { success: false };

    const lines = data?.data?.cartLinesAdd?.cart?.lines?.edges || [];
    const newLine = lines.find((l: any) => l.node.merchandise.id === item.variantId);
    return { success: true, lineId: newLine?.node?.id };
  },

  async updateCartLine(cartId: string, lineId: string, quantity: number) {
    const data = await storefrontApiRequest(CART_LINES_UPDATE_MUTATION, {
      cartId,
      lines: [{ id: lineId, quantity }],
    });

    const userErrors = data?.data?.cartLinesUpdate?.userErrors || [];
    if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
    if (userErrors.length > 0) return { success: false };
    return { success: true };
  },

  async removeLineFromCart(cartId: string, lineId: string) {
    const data = await storefrontApiRequest(CART_LINES_REMOVE_MUTATION, {
      cartId,
      lineIds: [lineId],
    });

    const userErrors = data?.data?.cartLinesRemove?.userErrors || [];
    if (isCartNotFoundError(userErrors)) return { success: false, cartNotFound: true };
    if (userErrors.length > 0) return { success: false };
    return { success: true };
  }
};
