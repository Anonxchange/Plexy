import { useMemo } from "react";

const partners = [
  { name: "AsiaTokenFund", logo: null },
  { name: "avalanche", logo: null },
  { name: "AP", logo: null },
  { name: "barchart", logo: null },
  { name: "BLOCKO", logo: null },
  { name: "CoinDesk", logo: null },
  { name: "CryptoSlate", logo: null },
];

export function PartnerCarousel() {
  const duplicatedPartners = useMemo(() => [...partners, ...partners, ...partners], []);

  return (
    <div className="bg-[#1a1a2e] py-4 overflow-hidden">
      <div className="relative">
        <div className="flex gap-12 items-center animate-scroll">
          {duplicatedPartners.map((partner, index) => (
            <div 
              key={`${partner.name}-${index}`} 
              className="flex items-center gap-2 min-w-fit whitespace-nowrap opacity-70 hover:opacity-100 transition-opacity"
            >
              <span className="font-medium text-white/80 text-sm tracking-wide">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
