
import React from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export function PageNavigation() {
  const [location, navigate] = useLocation();

  const getActiveTab = () => {
    if (location === "/") return "home";
    if (location === "/p2p") return "p2p";
    if (location === "/shop") return "shop";
    if (location === "/swap") return "swap";
    if (location === "/wallet") return "wallet";
    return location.slice(1);
  };

  const handleTabClick = (tab: string) => {
    const targetPath = tab === "home" ? "/" : `/${tab}`;
    // Always navigate, even if already on the page
    navigate(targetPath, { replace: false });
  };

  const activeTab = getActiveTab();

  return (
    <div className="bg-card border-b lg:hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {["HOME", "P2P", "SHOP", "SWAP", "WALLET"].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab.toLowerCase() ? "default" : "outline"}
              size="sm"
              onClick={() => handleTabClick(tab.toLowerCase())}
              className="h-8 sm:h-9 px-2 sm:px-3 text-[10px] xs:text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              {tab}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
