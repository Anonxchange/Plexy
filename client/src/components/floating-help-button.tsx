export const FloatingHelpButton = () => {
  return (
    <button className="fixed bottom-6 right-3 z-50 group">
      <div className="relative flex items-center gap-1.5 px-3 py-2 rounded-l-full rounded-r-lg backdrop-blur-2xl bg-lime-400/80 border border-lime-600/50 shadow-[0_8px_32px_rgba(132,204,22,0.5),inset_0_0_20px_rgba(255,255,255,0.2)] hover:bg-lime-400/90 hover:shadow-[0_12px_40px_rgba(132,204,22,0.6),inset_0_0_30px_rgba(255,255,255,0.25)] hover:scale-105 transition-all duration-300 ease-out">
        {/* Gradient overlay for extra glass effect */}
        <div className="absolute inset-0 rounded-l-full rounded-r-lg bg-gradient-to-br from-lime-300/50 via-lime-400/20 to-lime-500/30 pointer-events-none" />
        
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-l-full rounded-r-lg shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.1)] pointer-events-none" />
        
        {/* Frosted noise texture */}
        <div className="absolute inset-0 rounded-l-full rounded-r-lg opacity-30 bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none" />
        
        {/* Question mark circle */}
        <div className="relative w-5 h-5 rounded-full border-1.5 border-gray-900 flex items-center justify-center">
          <span className="text-gray-900 font-bold text-xs">?</span>
        </div>
        
        <span className="relative text-gray-900 font-semibold text-sm tracking-wide drop-shadow-sm">
          Help
        </span>
      </div>
    </button>
  );
};

export default FloatingHelpButton;

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
