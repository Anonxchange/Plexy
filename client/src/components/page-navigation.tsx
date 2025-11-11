import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export function PageNavigation() {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    const path = location === "/" ? "home" : location.slice(1);
    setActiveTab(path);
  }, [location]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    navigate(tab === "home" ? "/" : `/${tab}`);
  };

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