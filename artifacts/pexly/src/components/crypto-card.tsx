
import { cn } from "@/lib/utils";

interface CryptoCardProps {
  title: string;
  value: string;
  image: string;
  variant?: "default" | "lemon" | "black";
  className?: string;
}

export const CryptoCard = ({ title, value, image, variant = "default", className }: CryptoCardProps) => {
  const isLemon = variant === "lemon";
  const isBlack = variant === "black";

  return (
    <div
      className={cn(
        "relative h-[180px] w-[280px] md:h-[260px] md:w-[420px] lg:h-[300px] lg:w-[480px] flex-shrink-0 rounded-2xl md:rounded-3xl overflow-hidden",
        isLemon ? "bg-gradient-to-br from-[#B4F22E] via-[#A8E826] to-[#9AD426]" : isBlack ? "bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]" : "bg-gradient-to-br from-white to-gray-50",
        "transition-all duration-500 hover:scale-[1.02]",
        isLemon ? "shadow-[0_8px_30px_rgb(180,242,46,0.3)]" : "shadow-[0_8px_30px_rgba(0,0,0,0.15)]",
        "hover:shadow-2xl",
        className
      )}
    >
      {/* Subtle Pattern Overlay for all cards */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" viewBox="0 0 480 300">
          <defs>
            <pattern id={`dots-${variant}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill={isLemon ? "#fff" : isBlack ? "#333" : "#ddd"} opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#dots-${variant})`}/>
        </svg>
      </div>

      {/* Gradient Accents */}
      <div className={cn(
        "absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20",
        isLemon ? "bg-white" : isBlack ? "bg-gray-500" : "bg-[#B4F22E]"
      )} />
      
      {/* Card Content */}
      <div className="relative h-full p-4 md:p-6 lg:p-8 flex flex-col justify-between">
        {/* Top Section */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className={cn(
            "text-xl md:text-2xl lg:text-3xl font-bold tracking-tight",
            isLemon ? "text-white drop-shadow-sm" : isBlack ? "text-white drop-shadow-sm" : "text-black"
          )}>
            {title.split('').map((letter, i) => (
              <span key={i}>
                {letter}
                {i === title.length - 1 && (
                  <span className={cn(
                    "inline-block w-1.5 h-1.5 rounded-full ml-1 mb-1.5",
                    isLemon ? "bg-white" : isBlack ? "bg-white" : "bg-black"
                  )} />
                )}
              </span>
            ))}
          </div>

          {/* Contactless Icon */}
          <svg className={cn("w-6 h-6 md:w-7 md:h-7", isLemon ? "text-white/70" : isBlack ? "text-white/70" : "text-black/70")} viewBox="0 0 24 24" fill="none">
            <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Middle Section - EMV Chip */}
        <div className="flex justify-start">
          <div className={cn(
            "w-12 h-9 md:w-14 md:h-10 lg:w-16 lg:h-12 rounded-lg flex items-center justify-center relative overflow-hidden",
            isLemon ? "bg-gradient-to-br from-yellow-200 to-yellow-400" : isBlack ? "bg-gradient-to-br from-yellow-200 to-yellow-400" : "bg-gradient-to-br from-yellow-300 to-yellow-500"
          )}>
            {/* Chip Grid Pattern */}
            <svg className="w-7 h-6 md:w-8 md:h-7 lg:w-9 lg:h-8 text-yellow-700" viewBox="0 0 48 48" fill="none">
              <rect x="8" y="8" width="32" height="32" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="20" y1="8" x2="20" y2="40" stroke="currentColor" strokeWidth="1"/>
              <line x1="28" y1="8" x2="28" y2="40" stroke="currentColor" strokeWidth="1"/>
              <line x1="8" y1="20" x2="40" y2="20" stroke="currentColor" strokeWidth="1"/>
              <line x1="8" y1="28" x2="40" y2="28" stroke="currentColor" strokeWidth="1"/>
            </svg>
          </div>
        </div>
        
        {/* Bottom Section - Card Value & Number */}
        <div>
          {/* Card Number */}
          <div className={cn(
            "text-xs md:text-sm font-mono tracking-wider mb-2 opacity-60",
            isLemon ? "text-white" : isBlack ? "text-white" : "text-black"
          )}>
            •••• •••• •••• {value.slice(-4)}
          </div>
          
          <div className="flex items-end justify-between">
            <div>
              <div className={cn(
                "text-[10px] md:text-xs uppercase tracking-wide opacity-50 mb-1",
                isLemon ? "text-white" : isBlack ? "text-white" : "text-black"
              )}>
                Balance
              </div>
              <div className={cn(
                "text-xl md:text-2xl lg:text-3xl font-bold",
                isLemon ? "text-white" : isBlack ? "text-white" : "text-black"
              )}>
                ${value}
              </div>
            </div>

            {/* Card Network Logo (Generic) */}
            <div className={cn(
              "text-[10px] md:text-xs font-bold tracking-widest",
              isLemon ? "text-white/40" : isBlack ? "text-white/40" : "text-black/40"
            )}>
              DEBIT
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
