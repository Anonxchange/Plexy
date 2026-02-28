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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      <div className="aspect-[4/3] bg-muted relative group cursor-pointer" onClick={() => onViewDetails(product)}>
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/20" />
          </div>
        )}
        {product.user_id === 'shopify' && onAddToCart && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-2 right-2 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-md hover:bg-primary hover:text-primary-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        )}
      </div>
      <CardHeader className="pb-3 flex-none">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-1">{product.title}</CardTitle>
          <Badge variant="outline" className="shrink-0">{product.category}</Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {product.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-muted-foreground">
            Location: {product.location}
          </span>
        </div>
        <p className="text-2xl font-bold">{product.price} {product.currency}</p>
      </CardContent>
      <CardFooter className="pt-0 flex-none">
        <Button
          className="w-full"
          onClick={() => onViewDetails(product)}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};
