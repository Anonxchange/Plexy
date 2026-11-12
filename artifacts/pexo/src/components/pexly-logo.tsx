import type { CSSProperties } from "react";

interface PexlyLogoProps {
  className?: string;
  width?: CSSProperties["width"];
  tone?: "dark" | "light";
}

export function PexlyLogo({
  className,
  width = 137,
  tone = "dark",
}: PexlyLogoProps) {
  return (
    <img
      src={tone === "light" ? "/pexly-logo-light.svg" : "/pexly-logo.svg"}
      alt="Pexly"
      width={1985}
      height={463}
      className={className}
      style={{ display: "block", width, height: "auto", flex: "0 1 auto", objectFit: "contain" }}
    />
  );
}
