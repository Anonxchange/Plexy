import { useState } from "react";
import { PexlyFooter } from "@/components/pexly-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useEarnProducts,
  useEarnPosition,
  useSubscribeEarn,
  useRedeemEarn,
} from "@/hooks/use-bybit-earn";
import { ShieldCheck, Layers, BarChart3, AlertCircle, Loader2 } from "lucide-react";

const CATEGORIES: { label: string; value: string | undefined }[] = [
  { label: "Flexible Saving", value: "FlexibleSaving" },
  { label: "On-Chain", value: "OnChain" },
];

function formatCategory(cat?: string) {
  if (!cat) return "";
  if (cat === "FlexibleSaving") return "Flexible";
  if (cat === "OnChain") return "On-Chain";
  return cat;
}

function ProductCardSkeleton() {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-16 h-4" />
          </div>
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>
        <Skeleton className="w-24 h-6" />
        <Skeleton className="w-32 h-3" />
        <Skeleton className="w-full h-9 rounded-lg" />
      </CardContent>
    </Card>
  );
}

function PositionCardSkeleton() {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-14 h-5 rounded-full" />
        </div>
        <Skeleton className="w-28 h-6" />
        <div className="flex gap-2 mt-1">
          <Skeleton className="flex-1 h-9 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

interface Product {
  productId: string;
  coin: string;
  category?: string;
  apy?: string;
  rate?: string;
  minStakingAmount?: string;
  maxStakingAmount?: string;
  [key: string]: unknown;
}

interface Position {
  productId?: string;
  coin?: string;
  amount?: string;
  totalAmount?: string;
  income?: string;
  category?: string;
  [key: string]: unknown;
}

function SubscribeDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [amount, setAmount] = useState("");
  const subscribe = useSubscribeEarn();

  const handleSubscribe = async () => {
    if (!product || !amount) return;
    try {
      await subscribe.mutateAsync({ productId: product.productId, amount });
      setAmount("");
      onOpenChange(false);
    } catch {
      // error surfaced via subscribe.isError
    }
  };

  const apr = product?.estimatedApr ?? product?.apy ?? product?.rate ?? "—";
  const min = product?.minStakingAmount;
  const max = product?.maxStakingAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle>Stake {product?.coin}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <div className="rounded-lg bg-secondary p-3 text-sm flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">APR</span>
              <span className="text-lime font-semibold">{apr}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span className="text-foreground">{formatCategory(product?.category as string)}</span>
            </div>
            {min && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min</span>
                <span className="text-foreground">{min} {product?.coin}</span>
              </div>
            )}
            {max && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max</span>
                <span className="text-foreground">{max} {product?.coin}</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">
              Amount ({product?.coin})
            </label>
            <Input
              type="number"
              placeholder={`Min ${min ?? "0"}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          {subscribe.isError && (
            <p className="text-xs text-destructive flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {(subscribe.error as Error)?.message ?? "Something went wrong"}
            </p>
          )}

          <Button
            onClick={handleSubscribe}
            disabled={!amount || subscribe.isPending}
            className="w-full bg-lime text-black hover:bg-lime/90 font-semibold"
          >
            {subscribe.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Confirm Stake"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RedeemDialog({
  position,
  open,
  onOpenChange,
}: {
  position: Position | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [amount, setAmount] = useState("");
  const redeem = useRedeemEarn();

  const handleRedeem = async () => {
    if (!position?.productId || !amount) return;
    try {
      await redeem.mutateAsync({ productId: position.productId, amount });
      setAmount("");
      onOpenChange(false);
    } catch {
      // error surfaced via redeem.isError
    }
  };

  const staked = position?.amount ?? position?.totalAmount ?? "0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle>Redeem {position?.coin}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <div className="rounded-lg bg-secondary p-3 text-sm flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Staked</span>
              <span className="text-foreground font-semibold">{staked} {position?.coin}</span>
            </div>
            {position?.income && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Earned</span>
                <span className="text-lime">{position.income} {position?.coin}</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">
              Amount to redeem ({position?.coin})
            </label>
            <Input
              type="number"
              placeholder={`Max ${staked}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          {redeem.isError && (
            <p className="text-xs text-destructive flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {(redeem.error as Error)?.message ?? "Something went wrong"}
            </p>
          )}

          <Button
            onClick={handleRedeem}
            disabled={!amount || redeem.isPending}
            variant="destructive"
            className="w-full font-semibold"
          >
            {redeem.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Confirm Redeem"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Stake() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>("FlexibleSaving");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  const { data: productsData, isLoading: productsLoading, isError: productsError } = useEarnProducts(activeCategory);
  const { data: positionData, isLoading: positionLoading, isError: positionError } = useEarnPosition();

  const products: Product[] = Array.isArray(productsData) ? productsData : (productsData?.list ?? []);
  const positions: Position[] = Array.isArray(positionData) ? positionData : (positionData?.list ?? []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-grow max-w-5xl mx-auto px-4 py-8 w-full">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Staking</h1>
          <p className="text-muted-foreground text-sm">Earn passive income by staking your crypto assets.</p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { icon: ShieldCheck, label: "Secure" },
            { icon: Layers, label: "Non-Custodial" },
            { icon: BarChart3, label: "Transparent" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm text-muted-foreground">
              <Icon className="w-4 h-4 text-lime" />
              {label}
            </div>
          ))}
        </div>

        <Tabs defaultValue="products">
          <TabsList className="bg-secondary mb-6">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="positions">My Positions</TabsTrigger>
          </TabsList>

          {/* ── Products Tab ── */}
          <TabsContent value="products">
            {/* Category filter */}
            <div className="flex gap-2 flex-wrap mb-5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat.value
                      ? "bg-lime text-black"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Error */}
            {productsError && (
              <div className="flex items-center gap-2 text-destructive text-sm py-8 justify-center">
                <AlertCircle className="w-4 h-4" />
                Failed to load products. Please try again.
              </div>
            )}

            {/* Skeletons */}
            {productsLoading && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Empty */}
            {!productsLoading && !productsError && products.length === 0 && (
              <div className="text-center py-16 text-muted-foreground text-sm">
                No products available in this category.
              </div>
            )}

            {/* Product grid */}
            {!productsLoading && !productsError && products.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => {
                  const apr = product.estimatedApr ?? product.apy ?? product.rate;
                  return (
                    <Card key={product.productId} className="border border-border bg-card hover:border-lime/40 transition-colors">
                      <CardContent className="p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
                              {product.coin?.slice(0, 2)}
                            </div>
                            <span className="font-semibold text-sm">{product.coin}</span>
                          </div>
                          {product.category && (
                            <Badge variant="secondary" className="text-[10px]">
                              {formatCategory(product.category as string)}
                            </Badge>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">APR</p>
                          <p className="text-2xl font-bold text-lime">
                            {apr ? `${apr}%` : "—"}
                          </p>
                        </div>

                        {product.minStakingAmount && (
                          <p className="text-xs text-muted-foreground">
                            Min: {product.minStakingAmount} {product.coin}
                          </p>
                        )}

                        <Button
                          onClick={() => setSelectedProduct(product)}
                          className="w-full bg-lime text-black hover:bg-lime/90 text-sm font-semibold"
                        >
                          Stake
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Positions Tab ── */}
          <TabsContent value="positions">
            {positionError && (
              <div className="flex items-center gap-2 text-destructive text-sm py-8 justify-center">
                <AlertCircle className="w-4 h-4" />
                Failed to load positions. Please try again.
              </div>
            )}

            {positionLoading && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <PositionCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!positionLoading && !positionError && positions.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-sm mb-3">You have no active staking positions.</p>
                <p className="text-xs text-muted-foreground">Browse products and stake to start earning.</p>
              </div>
            )}

            {!positionLoading && !positionError && positions.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {positions.map((pos, idx) => {
                  const staked = pos.amount ?? pos.totalAmount ?? "0";
                  return (
                    <Card key={pos.productId ?? idx} className="border border-border bg-card">
                      <CardContent className="p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
                              {pos.coin?.slice(0, 2)}
                            </div>
                            <span className="font-semibold text-sm">{pos.coin}</span>
                          </div>
                          {pos.category && (
                            <Badge variant="secondary" className="text-[10px]">
                              {formatCategory(pos.category as string)}
                            </Badge>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Staked</p>
                          <p className="text-xl font-bold text-foreground">
                            {staked} <span className="text-sm font-normal text-muted-foreground">{pos.coin}</span>
                          </p>
                        </div>

                        {pos.income && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Earned</span>
                            <span className="text-lime font-semibold">+{pos.income} {pos.coin}</span>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          onClick={() => setSelectedPosition(pos)}
                          className="w-full text-sm font-semibold border-border hover:bg-secondary"
                        >
                          Redeem
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <SubscribeDialog
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}
      />
      <RedeemDialog
        position={selectedPosition}
        open={!!selectedPosition}
        onOpenChange={(open) => { if (!open) setSelectedPosition(null); }}
      />

      <PexlyFooter />
    </div>
  );
}
