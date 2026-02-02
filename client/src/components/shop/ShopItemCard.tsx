import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

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
}

interface ShopItemCardProps {
  product: Listing;
  onViewDetails: (product: Listing) => void;
}

export const ShopItemCard = ({ product, onViewDetails }: ShopItemCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-[4/3] bg-muted relative">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/20" />
          </div>
        )}
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-1">{product.title}</CardTitle>
          <Badge variant="outline" className="shrink-0">{product.category}</Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {product.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-muted-foreground">
            Location: {product.location}
          </span>
        </div>
        <p className="text-2xl font-bold">{product.price} {product.currency}</p>
      </CardContent>
      <CardFooter className="pt-0">
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
