import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { shopifyService } from "@/lib/shopify-service";

interface CarouselProduct {
  img: string;
  name: string;
  price: string;
  category: string;
  handle: string;
}

const FALLBACK: CarouselProduct[] = [
  { img: "/shop/street-jacket.png",      name: "Street Jacket",      price: "$129", category: "APPAREL",     handle: "" },
  { img: "/shop/urban-runner.png",       name: "Urban Runner",       price: "$89",  category: "FOOTWEAR",    handle: "" },
  { img: "/shop/crossbody-bag.png",      name: "Crossbody Bag",      price: "$64",  category: "ACCESSORIES", handle: "" },
  { img: "/shop/thermal-base-layer.png", name: "Thermal Base Layer", price: "$55",  category: "APPAREL",     handle: "" },
  { img: "/shop/gps-sport-watch.png",    name: "GPS Sport Watch",    price: "$219", category: "ELECTRONICS", handle: "" },
  { img: "/shop/lowtop-sneaker.png",     name: "Low-Top Sneaker",    price: "$110", category: "FOOTWEAR",    handle: "" },
  { img: "/shop/mesh-cap.png",           name: "Mesh Cap",           price: "$34",  category: "ACCESSORIES", handle: "" },
  { img: "/shop/wireless-earbuds.png",   name: "Wireless Earbuds",   price: "$79",  category: "ELECTRONICS", handle: "" },
  { img: "/shop/cargo-shorts.png",       name: "Cargo Shorts",       price: "$48",  category: "APPAREL",     handle: "" },
  { img: "/shop/trail-boot.png",         name: "Trail Boot",         price: "$145", category: "FOOTWEAR",    handle: "" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function leafCategory(path: string) {
  if (!path) return "SHOP";
  const parts = path.split(" > ");
  return parts[parts.length - 1].toUpperCase();
}

function ProductCard({ item }: { item: CarouselProduct }) {
  const dest = item.handle ? `/shop?q=${encodeURIComponent(item.name)}` : `/shop?q=${encodeURIComponent(item.name)}`;
  return (
    <Link href={dest}>
      <div className="relative flex-shrink-0 w-48 h-64 rounded-2xl overflow-hidden shadow-md group cursor-pointer">
        <img
          src={item.img}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <span className="absolute top-3 left-3 text-[10px] font-bold tracking-widest text-white bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
          {item.category}
        </span>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
          <p className="text-white text-sm font-semibold leading-tight line-clamp-2">{item.name}</p>
          <p className="text-[#CCFF00] font-bold text-sm flex-shrink-0">{item.price}</p>
        </div>
      </div>
    </Link>
  );
}

export function FeatureCarousel() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<CarouselProduct[]>(() => shuffle(FALLBACK));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await shopifyService.getProducts(50);
        if (cancelled) return;
        const edges = result.products || [];
        const mapped: CarouselProduct[] = edges
          .map((edge: any) => {
            const p = edge.node;
            const img = p.images?.edges?.[0]?.node?.url || "";
            if (!img) return null;
            const amount = parseFloat(p.priceRange?.minVariantPrice?.amount ?? "0");
            const currency = p.priceRange?.minVariantPrice?.currencyCode ?? "USD";
            const catPath = (() => {
              const c = p.category;
              if (!c) return "";
              const parts = [...(c.ancestors || []).map((a: any) => a.name), c.name];
              return parts.filter(Boolean).join(" > ");
            })();
            return {
              img,
              name: p.title,
              price: formatPrice(amount, currency),
              category: leafCategory(catPath || p.productType || ""),
              handle: p.handle,
            } as CarouselProduct;
          })
          .filter(Boolean) as CarouselProduct[];

        if (mapped.length >= 6) {
          setProducts(shuffle(mapped));
        }
      } catch {
        // keep fallback
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const doubled = [...products, ...products];
  const doubledRev = [...products].reverse().concat([...products].reverse());

  return (
    <section className="w-full py-12 lg:py-20 bg-background overflow-hidden">
      <style>{`
        @keyframes pexly-scroll-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes pexly-scroll-right {
          0%   { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}</style>

      <div className="max-w-8xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-16">

          {/* LEFT — SCROLLING PRODUCT CARDS */}
          <div className="relative select-none">
            {/* Row 1 — scroll left */}
            <div className="overflow-hidden mb-3">
              <div
                className="flex gap-3 w-max"
                style={{ animation: "pexly-scroll-left 40s linear infinite" }}
              >
                {doubled.map((item, i) => <ProductCard key={`r1-${i}`} item={item} />)}
              </div>
            </div>

            {/* Row 2 — scroll right */}
            <div className="overflow-hidden">
              <div
                className="flex gap-3 w-max"
                style={{ animation: "pexly-scroll-right 48s linear infinite" }}
              >
                {doubledRev.map((item, i) => <ProductCard key={`r2-${i}`} item={item} />)}
              </div>
            </div>
          </div>

          {/* RIGHT — TEXT */}
          <div className="text-left space-y-6 lg:pl-16">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
                {t('feature.title_line1')} <br />
                <span className="text-green-800 dark:text-primary">{t('feature.title_line2')}</span> <br />
                {t('feature.title_line3')}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                {t('feature.subtitle')}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/shop">
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-3 rounded-full text-base transition-all shadow-md active:scale-95 flex items-center gap-2">
                  {t('feature.cta')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
