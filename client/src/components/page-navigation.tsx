
import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export function PageNavigation() {
  const [location, navigate] = useLocation();
  const { t } = useTranslation();

  const getActiveTab = () => {
    if (location === "/") return "home";
    if (location === "/buy-crypto") return "buy";
    if (location === "/shop") return "shop";
    if (location === "/swap") return "swap";
    if (location === "/wallet") return "wallet";
    return location.slice(1);
  };

  const handleTabClick = (tab: string) => {
    const targetPath = tab === "home" ? "/" : tab === "buy" ? "/buy-crypto" : `/${tab}`;
    // Always navigate, even if already on the page
    navigate(targetPath, { replace: false });
  };

  const activeTab = getActiveTab();

  const tabs: { id: string; labelKey: string }[] = [
    { id: "home",   labelKey: "nav.home" },
    { id: "buy",    labelKey: "nav.buy" },
    { id: "shop",   labelKey: "nav.shop" },
    { id: "swap",   labelKey: "nav.swap" },
    { id: "wallet", labelKey: "nav.wallet" },
  ];

  return (
    <div className="bg-card border-b lg:hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {tabs.map(({ id, labelKey }) => (
            <Button
              key={id}
              variant={activeTab === id ? "default" : "outline"}
              size="sm"
              onClick={() => handleTabClick(id)}
              className="h-8 sm:h-9 px-2 sm:px-3 text-[10px] xs:text-xs sm:text-sm font-medium whitespace-nowrap uppercase"
            >
              {t(labelKey)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
