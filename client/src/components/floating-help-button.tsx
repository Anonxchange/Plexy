import { HelpCircle } from "lucide-react";
import { useState } from "react";

interface FloatingHelpButtonProps {
  onClick?: () => void;
}

export function FloatingHelpButton({ onClick }: FloatingHelpButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default behavior: open Tawk.to chat if available
      if (window.Tawk_API && typeof window.Tawk_API.maximize === 'function') {
        window.Tawk_API.maximize();
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 bg-lime-400 hover:bg-lime-500 text-black font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out group"
      style={{
        borderRadius: "50px",
        transform: isHovered ? "scale(1.05)" : "scale(1)",
      }}
      aria-label="Open help chat"
    >
      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
        <HelpCircle className="w-5 h-5 text-black" strokeWidth={2.5} />
      </div>
      <span className="text-lg font-bold">Help</span>
    </button>
  );
}

// TypeScript declaration for Tawk_API
declare global {
  interface Window {
    Tawk_API?: {
      maximize: () => void;
      minimize: () => void;
      toggle: () => void;
      showWidget: () => void;
      hideWidget: () => void;
    };
    Tawk_LoadStart?: Date;
  }
}
