import { ShoppingCart, Package } from '@/lib/icons';
import { sanitizeImageUrl } from "@/lib/sanitize";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  location: string;
  status: string;
  user_id: string;
  variantId?: string;
}

interface ShopItemCardProps {
  product: Listing;
  onViewDetails: (product: Listing) => void;
  onAddToCart?: (product: Listing) => void;
}

export const ShopItemCard = ({ product, onViewDetails, onAddToCart }: ShopItemCardProps) => {
  return (
    <div
      className="group cursor-pointer flex flex-col h-full"
      onClick={() => onViewDetails(product)}
    >
      {/* Image — tall, sharp corners */}
      <div className="aspect-[3/4] bg-muted overflow-hidden relative mb-3">
        {product.images && product.images.length > 0 ? (
          <img
            src={sanitizeImageUrl(product.images[0])}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Package className="h-12 w-12 text-muted-foreground/20" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 gap-1">
        <h3 className="text-[13px] sm:text-sm font-medium leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {product.title}
        </h3>

        {/* Price left — Cart right */}
        <div className="flex items-center justify-between mt-auto pt-1.5">
          <p className="text-sm sm:text-[15px] font-bold text-foreground">
            {product.currency} {product.price.toLocaleString()}
          </p>
          {onAddToCart && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              className="h-8 w-8 flex items-center justify-center bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary transition-colors"
              aria-label="Add to cart"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
