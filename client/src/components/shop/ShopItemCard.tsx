import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, ShoppingCart } from "lucide-react";

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
      <div className="aspect-square bg-[#F5F5F5] rounded-xl overflow-hidden relative mb-3">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-10 w-10 text-muted-foreground/20" />
          </div>
        )}
        {product.user_id === 'shopify' && onAddToCart && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-2 right-2 h-8 w-8 rounded-lg bg-white/80 backdrop-blur-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-sm border border-border/10 hover:bg-primary hover:text-primary-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="flex flex-col flex-1 space-y-1">
        <h3 className="text-[15px] font-medium leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {product.title}
        </h3>
        <div className="flex flex-col mt-auto pt-1">
          <p className="text-[16px] font-serif font-bold text-foreground">
            {product.currency} {product.price.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};
