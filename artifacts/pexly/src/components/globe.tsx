import React from 'react';

export const Globe = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-72 h-72 sm:w-96 sm:h-96">
        {/* Main Globe Sphere */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/50 bg-gradient-to-br from-primary/20 via-transparent to-transparent shadow-[0_0_60px_rgba(180,242,46,0.15)]"></div>
        
        {/* Latitude lines */}
        <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-primary/30 scale-y-[0.85]"></div>
        <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-primary/25 scale-y-[0.55]"></div>
        <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-primary/20 scale-y-[0.25]"></div>
        
        {/* Longitude lines */}
        <div className="absolute inset-0 rounded-full border-l-2 border-r-2 border-primary/30 scale-x-[0.85]"></div>
        <div className="absolute inset-0 rounded-full border-l-2 border-r-2 border-primary/25 scale-x-[0.55]"></div>
        <div className="absolute inset-0 rounded-full border-l-2 border-r-2 border-primary/20 scale-x-[0.25]"></div>
        
        {/* Decorative Outer Ring */}
        <div className="absolute inset-[-15%] rounded-full border-2 border-primary/10 rotate-[30deg]"></div>
        
        {/* Internal Glow */}
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl"></div>
        
        {/* Highlight Points */}
        <div className="absolute top-[25%] left-[25%] w-2 h-2 bg-primary rounded-full shadow-[0_0_12px_rgba(180,242,46,1)]"></div>
        <div className="absolute top-[45%] right-[20%] w-2 h-2 bg-primary rounded-full shadow-[0_0_12px_rgba(180,242,46,1)]"></div>
        <div className="absolute bottom-[35%] left-[30%] w-2 h-2 bg-primary rounded-full shadow-[0_0_12px_rgba(180,242,46,1)]"></div>
        <div className="absolute bottom-[20%] right-[30%] w-2 h-2 bg-primary rounded-full shadow-[0_0_12px_rgba(180,242,46,1)]"></div>
      </div>
    </div>
  );
};
