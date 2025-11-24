
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
        "relative h-[180px] w-[280px] md:h-[260px] md:w-[420px] lg:h-[300px] lg:w-[480px] flex-shrink-0 rounded-2xl md:rounded-3xl overflow-hidden shadow-card",
        isLemon ? "bg-gradient-to-br from-[#B4F22E] to-[#9AD426]" : isBlack ? "bg-black" : "bg-white",
        "transition-all duration-500 hover:shadow-glow hover:scale-105",
        className
      )}
    >
      {/* Black Pattern Design */}
      {isBlack && (
        <div className="absolute inset-0">
          <svg className="w-full h-full" viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="wave-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0,20 Q10,10 20,20 T40,20" stroke="#333" fill="none" strokeWidth="0.5"/>
                <path d="M0,25 Q10,15 20,25 T40,25" stroke="#333" fill="none" strokeWidth="0.5"/>
                <path d="M0,30 Q10,20 20,30 T40,30" stroke="#333" fill="none" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#wave-pattern)"/>
            <circle cx="400" cy="250" r="120" fill="#1a1a1a" opacity="0.5"/>
            <circle cx="360" cy="220" r="140" fill="#0a0a0a" opacity="0.3"/>
          </svg>
        </div>
      )}
      
      {/* Card Content */}
      <div className="relative h-full p-4 md:p-6 lg:p-8 flex flex-col justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className={cn("text-xl md:text-2xl lg:text-3xl font-bold tracking-tight", isLemon ? "text-white" : "text-black")}>
            {title.split('').map((letter, i) => (
              <span key={i}>
                {letter}
                {i === title.length - 1 && <span className={cn("inline-block w-1.5 h-1.5 rounded-full ml-1 mb-1.5", isLemon ? "bg-white" : "bg-black")} />}
              </span>
            ))}
          </div>
        </div>
        
        {/* Card Value */}
        <div className="text-right">
          <div className={cn("text-2xl md:text-3xl lg:text-4xl font-bold mb-1", isLemon ? "text-white" : "text-black")}>
            {value}
          </div>
          <div className={cn("text-xs md:text-sm font-medium", isLemon ? "text-white/80" : "text-black/60")}>
            Premium Card
          </div>
        </div>
      </div>
      
      {/* Chip Design */}
      <div className={cn("absolute top-4 md:top-6 lg:top-8 right-4 md:right-6 lg:right-8 w-12 md:w-14 lg:w-16 h-9 md:h-10 lg:h-12 rounded-lg backdrop-blur-md border", isLemon ? "bg-white/20 border-white/30" : isBlack ? "bg-white/10 border-white/30" : "bg-gray-200 border-gray-300")} />
    </div>
  );
};
