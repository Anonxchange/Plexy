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
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground border border-primary-border rounded-full shadow-md hover:shadow-lg transition-all duration-200 ease-in-out hover-elevate active-elevate-2"
      style={{
        transform: isHovered ? "scale(1.02)" : "scale(1)",
      }}
      aria-label="Open help chat"
    >
      <HelpCircle className="w-4 h-4" strokeWidth={2.5} />
      <span className="text-sm font-medium">Help</span>
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
