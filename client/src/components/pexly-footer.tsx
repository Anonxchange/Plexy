
import { useState } from "react";
import { Zap, ChevronDown, Globe, HelpCircle, Accessibility, X as XIcon } from "lucide-react";
import { SiDiscord, SiInstagram, SiFacebook, SiYoutube, SiReddit } from "react-icons/si";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link } from "wouter";

const footerSections = [
  {
    title: "For You",
    links: ["Trade Cryptocurrency", "Buy Cryptocurrency", "Sell Cryptocurrency", "Wallet", "Converter"]
  },
  {
    title: "For Your Business",
    links: ["Pexly Business", "API Documentation", "Merchant Tools"]
  },
  {
    title: "Growth",
    links: ["Affiliate Program", "Developer Program", "Referral Program"]
  },
  {
    title: "Buy Anywhere",
    links: ["Buy Bitcoin", "Buy Ethereum", "Buy USDT", "Buy USDC"]
  },
  {
    title: "Useful Links",
    links: [{ text: "Support", href: "/support" }, { text: "Bitcoin Calculator", href: "/bitcoin-calculator" }, { text: "Pexly Academy", href: "/academy" }, "Market Prices", { text: "Blog", href: "/blog" }]
  },
  {
    title: "About Pexly",
    links: [{ text: "About Us", href: "/about" }, { text: "Careers", href: "/careers" }, "Press", "Contact", { text: "Reviews", href: "/reviews" }]
  },
  {
    title: "Legal",
    links: ["Terms & Conditions", "Privacy Policy", "AML Policy", "Cookie Policy"]
  }
];

export function PexlyFooter() {
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (title: string) => {
    setOpenSections(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-8 lg:px-8 lg:py-12 max-w-7xl">
        {/* Logo */}
        <div className="flex items-center gap-3 pb-4 lg:pb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">pexly</span>
        </div>

        {/* Mobile: Language Selector and Buttons */}
        <div className="space-y-4 lg:hidden">
          <Select defaultValue="en">
            <SelectTrigger className="w-full h-14">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
            </SelectContent>
          </Select>

          {/* FAQ & Help Center */}
          <Button variant="outline" className="w-full h-14 justify-start" asChild>
            <a href="#">
              <HelpCircle className="h-5 w-5 mr-3 text-muted-foreground" />
              <span className="text-base">FAQ & Help Center</span>
            </a>
          </Button>

          {/* Accessibility */}
          <Button variant="outline" className="w-full h-14 justify-start" asChild>
            <a href="#">
              <Accessibility className="h-5 w-5 mr-3 text-muted-foreground" />
              <span className="text-base">Accessibility</span>
            </a>
          </Button>
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden lg:grid lg:grid-cols-4 xl:grid-cols-7 gap-6 lg:gap-8 mb-8 lg:mb-12">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-base lg:text-lg font-semibold mb-3 lg:mb-4">{section.title}</h3>
              <ul className="space-y-2 lg:space-y-3 text-xs lg:text-sm text-muted-foreground">
                {section.links.map((link) => (
                  <li key={typeof link === 'string' ? link : link.text}>
                    {typeof link === 'string' ? (
                      <a href="#" className="hover:text-foreground transition-colors">
                        {link}
                      </a>
                    ) : (
                      link.href.startsWith('/') ? (
                        <Link to={link.href} className="hover:text-foreground transition-colors">
                          {link.text}
                        </Link>
                      ) : (
                        <a href={link.href} className="hover:text-foreground transition-colors">
                          {link.text}
                        </a>
                      )
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile: Collapsible Sections */}
        <div className="space-y-2 pt-4 lg:hidden">
          {footerSections.map((section) => (
            <Collapsible
              key={section.title}
              open={openSections.includes(section.title)}
              onOpenChange={() => toggleSection(section.title)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full py-4 border-b hover:bg-accent/50 transition-colors">
                <h3 className="text-lg font-semibold text-left">{section.title}</h3>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    openSections.includes(section.title) ? "rotate-180" : ""
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 pb-2 space-y-3">
                {section.links.map((link) => (
                  <li key={typeof link === 'string' ? link : link.text}>
                    {typeof link === 'string' ? (
                      <a href="#" className="hover:text-foreground transition-colors">
                        {link}
                      </a>
                    ) : (
                      link.href.startsWith('/') ? (
                        <Link to={link.href} className="hover:text-foreground transition-colors">
                          {link.text}
                        </Link>
                      ) : (
                        <a href={link.href} className="hover:text-foreground transition-colors">
                          {link.text}
                        </a>
                      )
                    )}
                  </li>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

        {/* Desktop: Language Selector and Buttons */}
        <div className="hidden lg:flex lg:items-center lg:gap-3 xl:gap-4 lg:mb-6 xl:mb-8 flex-wrap">
          <Select defaultValue="en">
            <SelectTrigger className="w-44 xl:w-48 h-11 xl:h-12">
              <div className="flex items-center gap-2 xl:gap-3">
                <Globe className="h-4 xl:h-5 w-4 xl:w-5 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="h-11 xl:h-12 text-sm" asChild>
            <a href="#">
              <HelpCircle className="h-4 xl:h-5 w-4 xl:w-5 mr-2 text-muted-foreground" />
              FAQ & Help Center
            </a>
          </Button>

          <Button variant="outline" className="h-11 xl:h-12 text-sm" asChild>
            <a href="#">
              <Accessibility className="h-4 xl:h-5 w-4 xl:w-5 mr-2 text-muted-foreground" />
              Accessibility
            </a>
          </Button>
        </div>

        {/* App Download Buttons */}
        <div className="flex gap-3 lg:gap-4 pt-6 lg:pt-0 flex-wrap">
          <a
            href="#"
            className="flex-1 lg:flex-none min-w-[160px]"
          >
            <div className="bg-black text-white rounded-lg px-3 lg:px-4 py-2.5 lg:py-3 flex items-center justify-center gap-2 hover:bg-black/90 transition-colors">
              <svg className="h-6 lg:h-7 w-6 lg:w-7 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="text-left">
                <div className="text-[10px] lg:text-xs">Get it on the</div>
                <div className="text-xs lg:text-sm font-semibold">App Store</div>
              </div>
            </div>
          </a>
          <a
            href="#"
            className="flex-1 lg:flex-none min-w-[160px]"
          >
            <div className="bg-black text-white rounded-lg px-3 lg:px-4 py-2.5 lg:py-3 flex items-center justify-center gap-2 hover:bg-black/90 transition-colors">
              <svg className="h-6 lg:h-7 w-6 lg:w-7 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              <div className="text-left">
                <div className="text-[10px] lg:text-xs">GET IT ON</div>
                <div className="text-xs lg:text-sm font-semibold">Google Play</div>
              </div>
            </div>
          </a>
        </div>

        {/* Social Media Icons */}
        <div className="flex justify-center lg:justify-start gap-3 lg:gap-4 pt-4 lg:pt-6 flex-wrap">
          <a href="#" className="w-10 h-10 lg:w-12 lg:h-12 border rounded-lg flex items-center justify-center hover:bg-accent transition-colors flex-shrink-0">
            <XIcon className="h-4 lg:h-5 w-4 lg:w-5" />
          </a>
          <a href="#" className="w-10 h-10 lg:w-12 lg:h-12 border rounded-lg flex items-center justify-center hover:bg-accent transition-colors flex-shrink-0">
            <SiDiscord className="h-4 lg:h-5 w-4 lg:w-5" />
          </a>
          <a href="#" className="w-10 h-10 lg:w-12 lg:h-12 border rounded-lg flex items-center justify-center hover:bg-accent transition-colors flex-shrink-0">
            <SiInstagram className="h-4 lg:h-5 w-4 lg:w-5" />
          </a>
          <a href="#" className="w-10 h-10 lg:w-12 lg:h-12 border rounded-lg flex items-center justify-center hover:bg-accent transition-colors flex-shrink-0">
            <SiFacebook className="h-4 lg:h-5 w-4 lg:w-5" />
          </a>
          <a href="#" className="w-10 h-10 lg:w-12 lg:h-12 border rounded-lg flex items-center justify-center hover:bg-accent transition-colors flex-shrink-0">
            <SiYoutube className="h-4 lg:h-5 w-4 lg:w-5" />
          </a>
          <a href="#" className="w-10 h-10 lg:w-12 lg:h-12 border rounded-lg flex items-center justify-center hover:bg-accent transition-colors flex-shrink-0">
            <SiReddit className="h-4 lg:h-5 w-4 lg:w-5" />
          </a>
        </div>

        {/* Legal Disclaimer */}
        <div className="text-[10px] lg:text-xs text-muted-foreground leading-relaxed pt-4 lg:pt-6 border-t mt-6 lg:mt-8">
          <p>
            "PEXLY" is a registered trademark of Pexly, Inc. Copyright © {new Date().getFullYear()} Pexly, Inc. All Rights Reserved. 
            Pexly Inc. has no relation to MoneyGram, Western Union, Payoneer, WorldRemit, Paxum, PayPal, Amazon, OkPay, Payza, 
            Walmart, Reloadit, Perfect Money, WebMoney, Google Wallet, BlueBird, Serve, Square Cash, NetSpend, Chase QuickPay, 
            Skrill, Vanilla, MyVanilla, OneVanilla, Neteller, Venmo, Apple, ChimpChange or any other payment method. We make no 
            claims about being supported by or supporting these services. Their respective wordmarks and trademarks belong to 
            them alone. Official mailing address: 4023 Kennett Pike #50541, Wilmington, DE 19807
          </p>
        </div>
      </div>
    </footer>
  );
}
