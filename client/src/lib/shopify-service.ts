import { supabase } from './supabase';
import { toast } from "sonner";

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
      if ((error as any).status === 402) {
        toast.error("Shopify: Payment required", {
          description: "Your store needs an active billing plan. Visit https://admin.shopify.com to upgrade.",
        });
        return;
      }
      const errorMessage = error.message || "Failed to process request";
      console.error('Supabase function error:', error);
      throw new Error(errorMessage);
    }

    if (data?.errors) {
      throw new Error(`Error calling Shopify: ${data.errors.map((e: { message: string }) => e.message).join(', ')}`);
    }

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

    const lines = cart.lines?.edges || [];
    const items = lines.map((edge: any) => {
      const node = edge.node;
      const variant = node.merchandise;
      const product = variant.product;

      return {
        id: node.id,
        variantId: variant.id,
        title: product.title + (variant.title !== 'Default Title' ? ` - ${variant.title}` : ''),
        price: parseFloat(variant.price.amount),
        currency: variant.price.currencyCode,
        quantity: node.quantity,
        image: product.images?.edges[0]?.node?.url
      };
    });

    return {
      id: cart.id,
      totalQuantity: cart.totalQuantity,
      checkoutUrl: cart.checkoutUrl,
      items
    };
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

// Keep legacy named exports for backward compatibility with existing imports
export const createShopifyCart = shopifyService.createCart;
export const addLineToShopifyCart = shopifyService.addLineToCart;
export const updateShopifyCartLine = shopifyService.updateCartLine;
export const removeLineFromShopifyCart = shopifyService.removeLineFromCart;
