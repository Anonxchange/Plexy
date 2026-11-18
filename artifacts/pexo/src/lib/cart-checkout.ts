import { getLocalizedCheckoutPath } from "@/lib/checkout-navigation";
import { getExchangeRates } from "@/lib/crypto-prices";
import type { GiftCardCartItem } from "@/hooks/use-gift-card-cart";
import type { SavedTopup } from "@/hooks/use-topup-cart";

export interface CartPendingOrder {
  type: "giftcard" | "topup";
  title: string;
  description: string;
  amount: number;
  currency: string;
  image?: string;
  metadata: Record<string, unknown>;
}

/** Keep checkout snapshots tab-local so another cart cannot replace this order. */
export function openCartCheckout(order: CartPendingOrder) {
  if (!Number.isFinite(order.amount) || order.amount <= 0) {
    throw new Error("This order has an invalid amount. Please reselect the product.");
  }
  const id = crypto.randomUUID();
  sessionStorage.setItem(`pexly_cart_order_${id}`, JSON.stringify(order));
  const url = new URL(getLocalizedCheckoutPath(), window.location.origin);
  url.searchParams.set("cartOrder", id);
  window.location.assign(url.pathname + url.search);
}

export async function giftCardCartOrder(items: GiftCardCartItem[]): Promise<CartPendingOrder> {
  if (!items.length) throw new Error("Your gift-card cart is empty.");
  const currencies = [...new Set(items.map(item => item.currency.toUpperCase()))];
  const currency = currencies.length === 1 ? currencies[0] : "USD";
  const rates = currencies.length === 1 ? {} : await getExchangeRates();
  const amount = items.reduce((total, item) => {
    const code = item.currency.toUpperCase();
    const rate = code === currency ? 1 : rates[code];
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error(`A current exchange rate for ${code} is unavailable. Please try again.`);
    }
    if (!Number.isFinite(item.price) || item.price <= 0 ||
        !Number.isInteger(item.quantity) || item.quantity < 1 ||
        !Number.isFinite(item.recipientAmount) || (item.recipientAmount ?? 0) <= 0) {
      throw new Error("Please remove and re-add gift cards with missing or invalid denominations.");
    }
    return total + item.price / rate * item.quantity;
  }, 0);
  const quantity = items.reduce((total, item) => total + item.quantity, 0);
  return {
    type: "giftcard",
    title: items.length === 1 ? items[0].title : `${quantity} Gift Cards`,
    description: items.map(item => `${item.quantity}x ${item.title}`).join(", "),
    amount: Math.round(amount * 100) / 100,
    currency: currency.toLowerCase(),
    image: items[0].image,
    metadata: {
      service: "gift-card",
      fromCart: true,
      cartItems: items.map(item => ({ id: item.id, quantity: item.quantity })),
      items: items.map(item => ({
        productId: String(item.productId),
        productName: item.title,
        unitPrice: item.recipientAmount,
        quantity: item.quantity,
      })),
    },
  };
}

export function topupCartOrder(item: SavedTopup): CartPendingOrder {
  return { ...item, type: "topup", metadata: { ...item.metadata, savedTopupId: item.id } };
}
