import type { ReactNode } from "react";
import { useProxiedImage } from "@/lib/image-proxy";

interface PolymarketImageProps {
  src: string | undefined | null;
  alt?: string;
  className?: string;
  fallback?: ReactNode;
}

export function PolymarketImage({ src, alt = "", className, fallback }: PolymarketImageProps) {
  const proxied = useProxiedImage(src);

  if (!src) return fallback ? <>{fallback}</> : null;

  return <img src={proxied} alt={alt} className={className} />;
}
