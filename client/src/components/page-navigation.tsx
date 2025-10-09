import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export function PageNavigation() {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    if (location === "/") {
      setActiveTab("home");
    } else if (location === "/p2p") {
      setActiveTab("p2p");
    } else if (location === "/wallet") {
      setActiveTab("wallet");
    } else {
      const path = location.slice(1);
      setActiveTab(path);
    }
  }, [location]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (tab === "home") {
      navigate("/");
    } else if (tab === "swap") {
      navigate("/swap");
    } else {
      navigate(`/${tab}`);
    }
  };

  return (
    <div className="bg-card border-b">
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
