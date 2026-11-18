import { CartSheet } from "@/components/shop/CartSheet";

/** Legacy gift-card entry points open the same grouped marketplace cart. */
export function GiftCardCartSheet({ open, onOpenChange }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return <CartSheet open={open} onOpenChange={onOpenChange} />;
}
