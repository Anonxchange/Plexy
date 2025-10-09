
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PexlyFooter } from "@/components/pexly-footer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, ShoppingCart, Star, Filter, Package } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  inStock: boolean;
}

const products: Product[] = [
  {
    id: 1,
    name: "Wireless Headphones",
    description: "Premium noise-canceling wireless headphones with 30-hour battery life",
    price: 299.99,
    category: "Electronics",
    image: "/assets/IMG_0996.png",
    rating: 4.5,
    reviews: 128,
    inStock: true,
  },
  {
    id: 2,
    name: "Smart Watch",
    description: "Fitness tracker with heart rate monitor and GPS",
    price: 199.99,
    category: "Electronics",
    image: "/assets/IMG_1002.png",
    rating: 4.3,
    reviews: 89,
    inStock: true,
  },
  {
    id: 3,
    name: "Coffee Maker",
    description: "Programmable coffee maker with thermal carafe",
    price: 79.99,
    category: "Home & Kitchen",
    image: "/assets/IMG_1003.png",
    rating: 4.7,
    reviews: 256,
    inStock: true,
  },
  {
    id: 4,
    name: "Laptop Stand",
    description: "Ergonomic aluminum laptop stand with cooling design",
    price: 49.99,
    category: "Office",
    image: "/assets/IMG_0996.png",
    rating: 4.6,
    reviews: 92,
    inStock: true,
  },
  {
    id: 5,
    name: "Yoga Mat",
    description: "Non-slip exercise mat with carrying strap",
    price: 29.99,
    category: "Sports & Fitness",
    image: "/assets/IMG_1002.png",
    rating: 4.4,
    reviews: 167,
    inStock: true,
  },
  {
    id: 6,
    name: "LED Desk Lamp",
    description: "Adjustable LED lamp with touch control and USB charging",
    price: 39.99,
    category: "Office",
    image: "/assets/IMG_1003.png",
    rating: 4.5,
    reviews: 134,
    inStock: false,
  },
  {
    id: 7,
    name: "Backpack",
    description: "Water-resistant laptop backpack with USB charging port",
    price: 59.99,
    category: "Accessories",
    image: "/assets/IMG_0996.png",
    rating: 4.6,
    reviews: 203,
    inStock: true,
  },
  {
    id: 8,
    name: "Bluetooth Speaker",
    description: "Portable waterproof speaker with 360° sound",
    price: 89.99,
    category: "Electronics",
    image: "/assets/IMG_1002.png",
    rating: 4.7,
    reviews: 312,
    inStock: true,
  },
];

const categories = ["All", "Electronics", "Home & Kitchen", "Office", "Sports & Fitness", "Accessories"];

export function Shop() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartCount, setCartCount] = useState(0);

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

  const handleAddToCart = (product: Product) => {
    setCartCount(cartCount + 1);
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Shop</h1>
              <p className="text-muted-foreground">Discover amazing products for every need</p>
            </div>
            <Button variant="outline" className="relative">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Cart
              {cartCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {!product.inStock && (
                    <Badge className="absolute top-2 right-2" variant="destructive">
                      Out of Stock
                    </Badge>
                  )}
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                    <Badge variant="outline" className="shrink-0">{product.category}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="ml-1 text-sm font-medium">{product.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({product.reviews} reviews)
                    </span>
                  </div>
                  <p className="text-2xl font-bold">${product.price}</p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button
                    className="w-full"
                    onClick={() => setSelectedProduct(product)}
                    disabled={!product.inStock}
                  >
                    {product.inStock ? "View Details" : "Out of Stock"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Product Details Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedProduct.name}</DialogTitle>
                <DialogDescription>
                  <Badge variant="outline" className="mt-2">{selectedProduct.category}</Badge>
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold mb-2">${selectedProduct.price}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="ml-1 font-medium">{selectedProduct.rating}</span>
                      </div>
                      <span className="text-muted-foreground">
                        ({selectedProduct.reviews} reviews)
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-muted-foreground">{selectedProduct.description}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="text-muted-foreground">Availability</span>
                      <Badge variant={selectedProduct.inStock ? "default" : "destructive"}>
                        {selectedProduct.inStock ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium">Free shipping</span>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                  Close
                </Button>
                <Button onClick={() => handleAddToCart(selectedProduct)}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PexlyFooter />
    </div>
  );
}
