
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

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
        "bg-gradient-card backdrop-blur-sm",
        isLemon ? "bg-gradient-card-lemon" : isBlack ? "bg-black" : "bg-gradient-card backdrop-blur-sm",
        "transition-all duration-500 hover:shadow-glow hover:scale-105",
        className
      )}
    >
      {/* Card Background Image */}
      {!isLemon && (
        <div 
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}
      
      {/* Gradient Overlay */}
      {!isLemon && <div className="absolute inset-0 bg-gradient-to-br from-navy-dark/40 via-transparent to-navy/60" />}
      
      {/* Card Content */}
      <div className="relative h-full p-4 md:p-6 lg:p-8 flex flex-col justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Zap className={cn("w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7", isLemon ? "text-white" : "text-gold")} fill={isLemon ? "white" : "hsl(var(--gold))"} />
          <div className={cn("text-xl md:text-2xl lg:text-3xl font-bold tracking-tight", isLemon ? "text-white" : "text-cream")}>
            {title}
          </div>
        </div>
        
        {/* Card Value */}
        <div className="text-right">
          <div className={cn("text-2xl md:text-3xl lg:text-4xl font-bold mb-1", isLemon ? "text-white" : "text-cream")}>
            {value}
          </div>
          <div className={cn("text-xs md:text-sm font-medium", isLemon ? "text-white/80" : "text-slate")}>
            Premium Card
          </div>
        </div>
      </div>
      
      {/* Chip Design */}
      <div className={cn("absolute top-4 md:top-6 lg:top-8 right-4 md:right-6 lg:right-8 w-12 md:w-14 lg:w-16 h-9 md:h-10 lg:h-12 rounded-lg backdrop-blur-md border", isLemon ? "bg-white/20 border-white/30" : "bg-gold/20 border-gold/30")} />
    </div>
  );
};
