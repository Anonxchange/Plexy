
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
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {["HOME", "P2P", "SHOP", "SWAP", "WALLET"].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab.toLowerCase() ? "default" : "outline"}
              size="sm"
              onClick={() => handleTabClick(tab.toLowerCase())}
              className="whitespace-nowrap"
            >
              {tab}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
