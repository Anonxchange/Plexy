import { Zap } from "lucide-react";
import { SiX, SiTelegram, SiFacebook, SiInstagram, SiLinkedin, SiYoutube, SiApple, SiGoogleplay } from "react-icons/si";
import { Link } from "wouter";

const footerColumns = [
  {
    heading: "Buy Crypto",
    links: [
      { label: "Buy Bitcoin", href: "/p2p?tab=buy&crypto=BTC" },
      { label: "Buy Ethereum", href: "/p2p?tab=buy&crypto=ETH" },
      { label: "Buy Tether", href: "/p2p?tab=buy&crypto=USDT" },
      { label: "Buy USDC", href: "/p2p?tab=buy&crypto=USDC" },
    ],
  },
  {
    heading: "Sell Crypto",
    links: [
      { label: "Sell Bitcoin", href: "/p2p?tab=sell&crypto=BTC" },
      { label: "Sell Ethereum", href: "/p2p?tab=sell&crypto=ETH" },
      { label: "Sell Tether", href: "/p2p?tab=sell&crypto=USDT" },
      { label: "Sell USDC", href: "/p2p?tab=sell&crypto=USDC" },
    ],
  },
  {
    heading: "About Pexly",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
      { label: "Reviews", href: "/reviews" },
    ],
  },
  {
    heading: "Useful Links",
    links: [
      { label: "Wallet", href: "/wallet" },
      { label: "Support", href: "https://help.pexly.app", external: true },
      { label: "Bitcoin Calculator", href: "/bitcoin-calculator" },
      { label: "Market Prices", href: "/markets" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Vendor Reminder", href: "/vendor-reminder" },
      { label: "AML Policy", href: "/aml-policy" },
      { label: "Privacy Notice", href: "/privacy" },
      { label: "Cookie Policy", href: "/cookie-policy" },
      { label: "Restricted Countries", href: "/restricted-countries" },
      { label: "VIP Program T&C", href: "/vip-terms" },
    ],
  },
];

const socials = [
  { icon: SiX, label: "X (Twitter)", href: "#" },
  { icon: SiLinkedin, label: "LinkedIn", href: "#" },
  { icon: SiTelegram, label: "Telegram", href: "#" },
  { icon: SiInstagram, label: "Instagram", href: "#" },
  { icon: SiFacebook, label: "Facebook", href: "#" },
  { icon: SiYoutube, label: "YouTube", href: "#" },
];

export function AppFooter() {
  return (
    <footer className="relative overflow-hidden">
      {/* Frosted glass backdrop */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(180deg, rgba(20,20,20,0.97) 0%, rgba(14,14,14,0.99) 100%)",
          backdropFilter: "blur(40px) saturate(150%)",
          WebkitBackdropFilter: "blur(40px) saturate(150%)",
        }}
      />

      {/* Subtle ambient glow at top */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-40 w-2/3 rounded-full bg-[#B4F22E]/[0.04] blur-[80px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-12">

        {/* Top: Logo + App downloads */}
        <div className="flex flex-row items-center justify-between gap-4 mb-16 pb-10 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#B4F22E] flex items-center justify-center">
              <Zap className="h-5 w-5 text-black" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Pexly</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#"
              aria-label="Download on the App Store"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-white/10 text-sm text-white/60 hover:text-white hover:border-white/20 transition-all duration-200"
            >
              <SiApple className="h-[15px] w-[15px]" />
              <span>iOS</span>
            </a>
            <a
              href="#"
              aria-label="Get it on Google Play"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-white/10 text-sm text-white/60 hover:text-white hover:border-white/20 transition-all duration-200"
            >
              <SiGoogleplay className="h-[14px] w-[14px]" />
              <span>Android</span>
            </a>
          </div>
        </div>

        {/* Link columns — open grid, no cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-12 mb-16">
          {footerColumns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 mb-6">
                {col.heading}
              </h3>
              <ul className="space-y-4">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[15px] text-white/55 hover:text-white transition-colors duration-150 leading-none"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-[15px] text-white/55 hover:text-white transition-colors duration-150 leading-none"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-white/[0.06] mb-10" />

        {/* Socials */}
        <div className="flex items-center gap-3 mb-8">
          {socials.map(({ icon: Icon, label, href }) => (
            <a
              key={label}
              href={href}
              aria-label={`Follow Pexly on ${label}`}
              className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/25 transition-all duration-200"
            >
              <Icon className="h-[15px] w-[15px]" />
            </a>
          ))}
        </div>

        {/* Legal disclaimer */}
        <p className="text-[11px] text-white/20 leading-relaxed text-center max-w-3xl mx-auto mb-8">
          "PEXLY" is a registered trademark of Pexly, Inc. Pexly Inc. has no relationship to MoneyGram, Western Union, Payoneer, WorldRemit, PayPal, Skrill, Neteller, Venmo, Apple, or any other payment method. Their respective wordmarks and trademarks belong to them alone.
        </p>

        {/* Bottom bar — very last line */}
        <div className="h-px w-full bg-white/[0.04] mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/25">
          <span>© {new Date().getFullYear()} Pexly, Inc. All rights reserved.</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#B4F22E] shadow-[0_0_5px_rgba(180,242,46,0.9)]" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
