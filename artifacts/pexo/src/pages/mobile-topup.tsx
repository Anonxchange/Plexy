import { useState, useMemo, useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { ChevronDown, ArrowRight, Smartphone, Gift, Star, Shield, Mail, UserCheck, ChevronUp, Share2, Heart, Plus } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { sanitizeImageUrl } from "@/lib/sanitize";
import { devLog } from "@/lib/dev-logger";
import { SYMBOL_ICON_MAP } from "@/lib/crypto-icons";
import { CurrentMarketingPage } from "@/components/marketing/current-marketing-page";
// Same data hooks as the All Gift Cards page, so top-up works for guests exactly like it does there.
import { useGiftCardCountries } from "@/hooks/use-reloadly";
import { useAirtimeOperators } from "@/hooks/use-airtime-operators";
import { guessCountry, rememberCountry, savedCountry } from "@/lib/gift-card-utils";

const TOPUP_CSS = `
.pxg .gsa{--ink:#091e1c;--mute:#52625f;--line:#e3ebe9;--field:#f3f7f6;--lime:#bef264;color:var(--ink);background:#fff;min-height:80vh;padding-bottom:40px}
.pxg .gsa .gsa-w{max-width:1100px;margin:0 auto;padding:0 16px}
.pxg .gsa .gsa-kinds{display:flex;justify-content:center;gap:8px;padding-top:22px;overflow-x:auto;scrollbar-width:none}
.pxg .gsa .gsa-kinds::-webkit-scrollbar{display:none}
.pxg .gsa .gsa-kind{flex:0 0 auto;display:inline-flex;align-items:center;height:48px;padding:0 24px;border:1.5px solid transparent;border-radius:999px;color:var(--ink);font-weight:700;font-size:18px;text-decoration:none;background:transparent}
.pxg .gsa .gsa-kind[aria-current="page"]{border-color:var(--ink)}
.pxg .gsa .gsa-hero{margin:44px auto 0;max-width:760px;text-align:center;font-weight:900;text-transform:uppercase;font-size:clamp(34px,9vw,64px);line-height:1.08;letter-spacing:-.01em;color:var(--ink)}
.pxg .gsa .gsa-bar{display:flex;align-items:center;gap:6px;max-width:680px;height:64px;margin:40px auto 0;padding:0 6px 0 14px;background:var(--field);border:1.5px solid var(--line);border-radius:999px}
.pxg .gsa .gsa-bar:focus-within{border-color:var(--ink)}
.pxg .gsa .gsa-cs{position:relative;flex:0 0 auto;display:flex;align-items:center;gap:6px;height:100%}
.pxg .gsa .gsa-cs select{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;font-size:16px}
.pxg .gsa .gsa-flag{width:36px;height:36px;border-radius:50%;object-fit:cover;background:var(--line);flex:0 0 auto}
.pxg .gsa .gsa-bar input{flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;color:var(--ink);font-family:inherit;font-size:20px;padding:0 10px;margin:0;box-shadow:none;-webkit-appearance:none;appearance:none}
.pxg .gsa .gsa-bar input::placeholder{color:#7b8a87;opacity:1}
.pxg .gsa .gsa-go{display:grid;place-items:center;flex:0 0 auto;width:52px;height:52px;border:0;border-radius:50%;background:var(--lime);color:var(--ink);cursor:pointer;padding:0}
.pxg .gsa .gsa-pay{margin-top:34px;text-align:center;font-size:20px;font-weight:500}
.pxg .gsa .gsa-pay .ic{display:flex;justify-content:center;margin-top:14px}
.pxg .gsa .gsa-pay .ic span{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:#fff;margin-left:-6px;border:1.5px solid var(--line);overflow:hidden}
.pxg .gsa .gsa-pay .ic img{width:24px;height:24px;object-fit:contain}
.pxg .gsa .gsa-pop{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:80px;font-size:28px;font-weight:800}
.pxg .gsa .gsa-pop .gsa-flag{width:48px;height:48px}
.pxg .gsa .gsa-filter{display:flex;justify-content:center;margin-top:22px}
.pxg .gsa .gsa-pill{position:relative;display:inline-flex;align-items:center;height:56px;border:1.5px solid var(--line);border-radius:999px;background:#fff}
.pxg .gsa .gsa-pill select{height:100%;border:0;background:transparent;color:var(--ink);font-family:inherit;font-weight:700;font-size:20px;padding:0 52px 0 26px;border-radius:999px;cursor:pointer;-webkit-appearance:none;appearance:none}
.pxg .gsa .gsa-pill svg{position:absolute;right:18px;pointer-events:none}
.pxg .gsa .gsa-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 14px;margin-top:26px}
@media(min-width:700px){.pxg .gsa .gsa-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:24px 18px}}
@media(min-width:1000px){.pxg .gsa .gsa-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
.pxg .gsa .gsa-tile{display:block;width:100%;text-align:left;padding:0;margin:0;border:0;background:none;color:inherit;font-family:inherit;cursor:pointer}
.pxg .gsa .gsa-art{aspect-ratio:1.05;border-radius:22px;background:#fff;border:1px solid var(--line);display:grid;place-items:center;overflow:hidden;transition:transform .2s}
.pxg .gsa .gsa-tile:hover .gsa-art{transform:translateY(-4px)}
.pxg .gsa .gsa-art img{max-width:68%;max-height:68%;object-fit:contain}
.pxg .gsa .gsa-tn{margin-top:10px;font-weight:700;font-size:16px;line-height:1.25;color:var(--ink)}
.pxg .gsa .gsa-ts{margin-top:2px;font-size:14px;color:var(--mute)}
.pxg .gsa .gsa-sk{aspect-ratio:1.05;border-radius:22px;background:linear-gradient(90deg,#eef2f1,#f7f9f8,#eef2f1);background-size:200% 100%;animation:gsa-pulse 1.2s linear infinite}
@keyframes gsa-pulse{to{background-position:-200% 0}}
.pxg .gsa .gsa-msg{margin:30px 0;text-align:center;color:var(--mute);font-size:15px}
.pxg .gsa .gsa-msg button{text-decoration:underline;background:none;border:0;color:inherit;cursor:pointer}
`;

function flagUrl(iso: string) {
  return `https://flagcdn.com/w80/${iso.toLowerCase()}.png`;
}

// Operators come from the same hook as the All Gift Cards page; make sure the fields the detail view needs exist.
function normalizeOperator(op: any) {
  return {
    ...op,
    operatorId: op.operatorId ?? op.id,
    logoUrls: op.logoUrls ?? (op.logoUrl ? [op.logoUrl] : op.logo ? [op.logo] : op.img ? [op.img] : []),
  };
}

// Swaps to a fallback icon in React state when the image fails (no DOM style changes).
function LogoWithFallback({
  src,
  alt,
  fallback,
  crossOrigin,
}: {
  src?: string | null;
  alt: string;
  fallback: ReactNode;
  crossOrigin?: "anonymous" | "use-credentials";
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  if (!src || failed) {
    return <div className="w-full h-full flex items-center justify-center">{fallback}</div>;
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-contain"
      crossOrigin={crossOrigin}
      onError={() => setFailed(true)}
    />
  );
}

// ── Crypto payment icons (using real coin logos from local registry) ──
const CRYPTO_ICONS = [
  { label: "Bitcoin",   symbol: "BTC" },
  { label: "Litecoin",  symbol: "LTC" },
  { label: "Ethereum",  symbol: "ETH" },
  { label: "USDC",      symbol: "USDC" },
  { label: "USDT",      symbol: "USDT" },
  { label: "Solana",    symbol: "SOL" },
];

function CryptoIconImg({ symbol, label }: { symbol: string; label: string }) {
  const [failed, setFailed] = useState(false);
  const src = SYMBOL_ICON_MAP[symbol];
  if (!src || failed) {
    return (
      <div className="w-9 h-9 rounded-full bg-[#f3f7f6] border border-[#e3ebe9] flex items-center justify-center shadow-sm">
        <span className="text-[10px] font-bold text-[#52625f]">{symbol.slice(0, 3)}</span>
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-white border border-[#e3ebe9] flex items-center justify-center overflow-hidden shadow-sm p-1.5">
      <img src={src} alt={label} className="w-full h-full object-contain" onError={() => setFailed(true)} />
    </div>
  );
}

const FEATURES = [
  { icon: UserCheck, label: "No Account Required" },
  { icon: Mail,      label: "Instant Delivery" },
  { icon: Shield,    label: "Private and Safe" },
];

// ── FAQ ───────────────────────────────────────────────────────────────────────
const TOPUP_FAQS = [
  {
    question: "Does my carrier accept crypto directly?",
    answer: "No — carriers don't accept crypto, but Pexly bridges the gap. You pay us in Bitcoin, USDT, ETH, or any supported crypto, and we instantly forward the top-up to your carrier in their local currency.",
  },
  {
    question: "Which countries are supported for mobile top-ups?",
    answer: "Pexly supports mobile top-ups in 150+ countries across Africa, Asia, Latin America, the Middle East, and Europe. Select your country from the list to see available operators and amounts.",
  },
  {
    question: "How long does the top-up take to arrive?",
    answer: "Most top-ups are delivered within seconds of your crypto payment being confirmed. In rare cases it can take up to 5 minutes depending on the operator. You'll see a confirmation on screen when it's done.",
  },
  {
    question: "What happens if the top-up fails?",
    answer: "If a top-up fails after payment, you are not charged. The transaction is reversed automatically. You'll see an error message on screen — try again or contact support if the issue persists.",
  },
  {
    question: "What phone number format should I enter?",
    answer: "Enter the full international phone number without the + sign. For example, for a Nigerian number +234 801 234 5678, enter 2348012345678. The country you select sets the correct dialling code automatically.",
  },
];

// ── Related Operators ──────────────────────────────────────────────────────────
function RelatedOperators({
  operators,
  selectedOperator,
  currentCountry,
  onSelect,
}: {
  operators: any[];
  selectedOperator: any | null;
  currentCountry: any | null;
  onSelect: (op: any) => void;
}) {
  const others = operators
    .filter((op: any) => op.operatorId !== selectedOperator?.operatorId)
    .slice(0, 6);

  if (others.length === 0) return null;

  const countryName = currentCountry?.name ?? "";

  return (
    <section className="py-12 px-4 md:px-6 lg:px-8 border-t border-[#e3ebe9]">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-black text-[#091e1c] mb-1">
          {countryName ? `More operators in ${countryName}` : "More operators"}
        </h2>
        <p className="text-sm text-[#52625f] mb-6">
          Other carriers available for this country.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {others.map((op: any) => {
            const logo = sanitizeImageUrl(op.logoUrls?.[0]);
            const currency = op.senderCurrencyCode || "USD";
            const symbol = op.senderCurrencySymbol || "$";
            const hasFixed = op.fixedAmounts?.length > 0;
            const rangeLabel = hasFixed
              ? `${symbol}${op.fixedAmounts[0]} – ${symbol}${op.fixedAmounts[op.fixedAmounts.length - 1]}`
              : op.minAmount && op.maxAmount
              ? `${symbol}${op.minAmount} – ${symbol}${op.maxAmount}`
              : null;

            return (
              <button
                key={op.operatorId}
                onClick={() => onSelect(op)}
                className="text-left bg-white border border-[#e3ebe9] rounded-2xl overflow-hidden hover:border-[#bef264]/50 hover:shadow-md transition-all duration-200 group"
              >
                {/* Logo tile */}
                <div className="bg-white flex items-center justify-center h-28 p-4 border-b border-[#e3ebe9]">
                  {logo ? (
                    <img
                      src={logo}
                      alt={op.name}
                      className="max-h-16 max-w-full object-contain"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#bef264]/30 flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-[#091e1c]" />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-3">
                  <p className="font-semibold text-[#091e1c] text-sm leading-tight line-clamp-2">
                    {op.name}
                  </p>
                  {rangeLabel && (
                    <p className="text-xs text-[#52625f] mt-0.5">
                      {rangeLabel} {currency}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TopupFaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#e3ebe9]">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between py-4 text-left gap-4">
        <span className="text-[#091e1c] font-semibold text-sm leading-snug">{question}</span>
        <span className={cn("flex-shrink-0 h-6 w-6 rounded-full border border-[#e3ebe9] flex items-center justify-center transition-transform duration-200", open ? "rotate-45" : "")}>
          <Plus className="h-3 w-3 text-[#52625f]" />
        </span>
      </button>
      <div className={cn("overflow-hidden transition-all duration-300", open ? "max-h-[300px]" : "max-h-0")}>
        <p className="text-[#52625f] text-sm leading-relaxed pb-4">{answer}</p>
      </div>
    </div>
  );
}

function TopupFaq() {
  return (
    <section className="py-14 px-4 md:px-6 lg:px-8 border-t border-[#e3ebe9]">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-black text-[#091e1c] mb-1">Frequently asked</h2>
        <h2 className="text-3xl font-black text-[#091e1c] mb-2">questions</h2>
        <p className="text-sm text-[#52625f] mb-8">
          Everything you need to know about mobile top-ups on Pexly.
        </p>
        <div>
          {TOPUP_FAQS.map((faq, i) => (
            <TopupFaqItem key={i} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}

const TopupDetailView = ({
  selectedOperator,
  currentCountry,
  proxiedOperatorLogo,
  phoneNumber,
  setPhoneNumber,
  amount,
  setAmount,
  suggestedAmounts,
  selectedCountry,
  onBack,
}: {
  selectedOperator: any;
  currentCountry: any;
  proxiedOperatorLogo: string | null;
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  suggestedAmounts: { amount: number; description: string | null }[];
  selectedCountry: string;
  onBack: () => void;
}) => {
  const [descOpen, setDescOpen] = useState(true);

  const currency = selectedOperator.senderCurrencyCode || "USD";
  const minAmt   = selectedOperator.minAmount ?? "";
  const maxAmt   = selectedOperator.maxAmount ?? "";
  const rangePlaceholder = minAmt && maxAmt ? `${minAmt} - ${maxAmt}` : "Enter amount";

  const handleCheckout = () => {
    if (!amount || !phoneNumber) {
      toast.error("Please enter both phone number and amount");
      return;
    }
    localStorage.setItem("pexly_pending_order", JSON.stringify({
      type: "topup",
      title: `${selectedOperator.name} Top-Up`,
      description: `Mobile top-up — ${selectedOperator.name}`,
      amount: Number(amount),
      currency: currency.toLowerCase(),
      image: sanitizeImageUrl(selectedOperator.logoUrls?.[0]),
      metadata: {
        service: "mobile-topup",
        operatorId: selectedOperator.operatorId,
        recipientPhone: phoneNumber,
        recipientCountryCode: selectedCountry,
        operatorName: selectedOperator.name,
      },
    }));
    devLog.info("Redirecting to checkout for topup");
    const seg = window.location.pathname.split("/")[1];
    const langBase = seg && seg.length === 2 ? `/${seg}` : "/en";
    window.open(`${langBase}/checkout`, "_blank");
  };

  const [liked, setLiked] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: selectedOperator.name, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  return (
    <div className="animate-fade-in max-w-xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-[#52625f] mb-5">
        <button onClick={onBack} className="hover:text-[#091e1c] underline underline-offset-2 transition-colors">
          {currentCountry?.name || selectedCountry}
        </button>
        <span>›</span>
        <span className="text-[#091e1c] font-medium">Prepaid phones</span>
      </nav>

      {/* Operator logo + action icons */}
      <div className="relative flex justify-center mb-5">
        <div className="absolute right-0 top-0 flex items-center gap-2">
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-white border border-[#e3ebe9] flex items-center justify-center text-[#091e1c] hover:bg-[#f3f7f6] transition-colors shadow-sm"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLiked(v => !v)}
            className="w-10 h-10 rounded-full bg-white border border-[#e3ebe9] flex items-center justify-center transition-colors shadow-sm hover:bg-[#f3f7f6]"
            aria-label="Save"
          >
            <Heart className={`w-4 h-4 transition-colors ${liked ? "fill-red-500 text-red-500" : "text-[#091e1c]"}`} />
          </button>
        </div>
        <div className="w-28 h-28 bg-white rounded-2xl border border-[#e3ebe9] flex items-center justify-center p-3 shadow-sm overflow-hidden">
          <LogoWithFallback src={proxiedOperatorLogo} alt={selectedOperator.name} fallback={<Smartphone className="w-12 h-12 text-[#52625f]" />} />
        </div>
      </div>

      {/* Title + rating */}
      <h2 className="text-2xl font-bold text-[#091e1c] text-center mb-1">{selectedOperator.name}</h2>
      <div className="flex items-center justify-center gap-1.5 mb-4">
        {[1,2,3,4,5].map(i => (
          <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        ))}
        <span className="text-sm text-[#52625f] ml-1">4.8 (228)</span>
      </div>

      {/* Description blurb */}
      <p className="text-sm text-[#52625f] text-center mb-8 leading-relaxed px-2">
        {selectedOperator.name} is a mobile operator in {currentCountry?.name || selectedCountry}. Top up mobile
        minutes and data instantly using Bitcoin, USDT, and other cryptocurrencies.
      </p>

      {/* Amount input — currency-prefixed */}
      <div className="mb-5">
        <p className="text-base font-semibold text-[#091e1c] mb-2">Enter amount</p>
        <div className="flex items-stretch border border-[#e3ebe9] rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#bef264]/40 transition-all">
          <div className="flex items-center px-4 border-r border-[#e3ebe9] bg-[#f3f7f6]/40">
            <span className="text-sm font-semibold text-[#091e1c] whitespace-nowrap">{currency}</span>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={rangePlaceholder}
            min={selectedOperator.minAmount}
            max={selectedOperator.maxAmount}
            className="flex-1 bg-transparent text-[#091e1c] placeholder:text-[#52625f] text-base py-4 px-4 outline-none min-w-0"
          />
        </div>
        {minAmt && maxAmt && (
          <p className="text-xs text-[#52625f] mt-1.5 px-1">
            Range: {currency} {minAmt} – {maxAmt}
          </p>
        )}
      </div>

      {/* Quick-select amounts */}
      {suggestedAmounts.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          {suggestedAmounts.slice(0, 9).map((item) => (
            <button
              key={item.amount}
              onClick={() => setAmount(item.amount.toString())}
              className={`py-2.5 px-2 rounded-xl border transition-all flex flex-col items-center gap-0.5 text-sm font-semibold ${
                amount === item.amount.toString()
                  ? "border-[#bef264] bg-[#bef264] text-[#091e1c] ring-2 ring-[#bef264]/20"
                  : "border-[#e3ebe9] bg-white hover:border-[#bef264]/50 text-[#091e1c] hover:bg-[#f3f7f6]/30"
              }`}
            >
              {selectedOperator.senderCurrencySymbol || ""}{item.amount}
              {item.description && (
                <span className={`text-[10px] font-normal line-clamp-1 ${amount === item.amount.toString() ? "text-[#091e1c]/70" : "text-[#52625f]"}`}>
                  {item.description}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Phone number input */}
      <div className="mb-7">
        <p className="text-base font-semibold text-[#091e1c] mb-2">The phone number to refill</p>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="e.g. 0802 123 4567"
          className="w-full border border-[#e3ebe9] rounded-xl bg-white text-[#091e1c] placeholder:text-[#52625f] text-base py-4 px-4 outline-none focus:ring-2 focus:ring-[#bef264]/40 transition-all"
        />
      </div>

      {/* CTA buttons */}
      <div className="space-y-3 mb-8">
        <button
          disabled={!amount || !phoneNumber}
          onClick={handleCheckout}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-full bg-[#FFC439] hover:bg-[#f0b429] active:bg-[#e0a420] disabled:opacity-50 disabled:cursor-not-allowed text-[#003087] font-bold text-base transition-colors shadow-md"
        >
          <span>Add to cart</span>
          <div className="flex items-center gap-1">
            {[
              { symbol: "BTC", label: "Bitcoin" },
              { symbol: "USDT", label: "USDT" },
              { symbol: "USDC", label: "USDC" },
              { symbol: "SOL", label: "Solana" },
            ].map(({ symbol, label }) => (
              <div
                key={label}
                className="h-6 w-6 rounded-full bg-white flex items-center justify-center overflow-hidden ring-1 ring-black/5"
              >
                <img src={SYMBOL_ICON_MAP[symbol]} alt={label} className="h-4 w-4 object-contain" />
              </div>
            ))}
          </div>
        </button>
        <button
          disabled={!amount || !phoneNumber}
          onClick={handleCheckout}
          className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-full bg-[#f3f7f6] hover:bg-[#f3f7f6]/70 disabled:opacity-50 disabled:cursor-not-allowed text-[#091e1c] font-semibold text-base transition-all active:scale-[0.98] border border-[#e3ebe9]"
        >
          <Gift className="w-5 h-5" />
          Purchase as gift
        </button>
      </div>

      {/* Crypto payment icons */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {CRYPTO_ICONS.map((c) => (
          <CryptoIconImg key={c.label} symbol={c.symbol} label={c.label} />
        ))}
      </div>

      <div className="border-t border-[#e3ebe9] mb-6" />

      {/* Feature list */}
      <ul className="space-y-4 mb-6">
        {FEATURES.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-[#091e1c] shrink-0" />
            <span className="text-sm font-medium text-[#091e1c]">{label}</span>
          </li>
        ))}
      </ul>

      <div className="border-t border-[#e3ebe9] mb-5" />

      {/* Description accordion */}
      <div>
        <button
          onClick={() => setDescOpen(o => !o)}
          className="w-full flex items-center justify-between py-2 text-left"
        >
          <span className="font-semibold text-[#091e1c]">Description</span>
          {descOpen ? <ChevronUp className="w-5 h-5 text-[#52625f]" /> : <ChevronDown className="w-5 h-5 text-[#52625f]" />}
        </button>
        {descOpen && (
          <div className="mt-3 space-y-3 text-sm text-[#52625f] leading-relaxed pb-2">
            <p>
              {selectedOperator.name} mobile allows you to refill mobile minutes and data instantly with cryptocurrency.
            </p>
            <p>
              Buy {selectedOperator.name} top-up with crypto such as Bitcoin, Ethereum, USDT, USDC, Solana, and many more.
            </p>
          </div>
        )}
      </div>

      <div className="h-10" />
    </div>
  );
};

const PAY_ICONS = ["BTC", "ETH", "USDT", "SOL"];

const Index = () => {
  useEffect(() => { try { localStorage.removeItem("pexly_pending_order"); } catch {} }, []);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  const [amount, setAmount] = useState<string>("");
  const [kind, setKind] = useState<"all" | "data">("all");
  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    const s = savedCountry();
    return s && s !== "ALL" ? s : guessCountry();
  });

  const countriesQuery = useGiftCardCountries();
  const operatorsQuery = useAirtimeOperators(selectedCountry, true);
  const countries: any[] = countriesQuery.data ?? [];
  const operators: any[] = useMemo(() => (operatorsQuery.data ?? []).map(normalizeOperator), [operatorsQuery.data]);
  const isLoadingOperators = operatorsQuery.isLoading;

  const currentCountry = useMemo(
    () => countries.find((c: any) => c.isoName === selectedCountry),
    [countries, selectedCountry],
  );
  const countryName = currentCountry?.name || selectedCountry;

  const shownOperators = useMemo(
    () => (kind === "data" ? operators.filter((o: any) => o.bundle || o.data) : operators),
    [operators, kind],
  );

  const proxiedOperatorLogo = sanitizeImageUrl(selectedOperator?.logoUrls?.[0]);

  const suggestedAmounts = useMemo(() => {
    if (!selectedOperator) return [];
    if ((selectedOperator.bundle || selectedOperator.data) && selectedOperator.fixedAmountsDescriptions) {
      return Object.entries(selectedOperator.fixedAmountsDescriptions).map(([amt, description]) => ({
        amount: Number(amt),
        description: String(description),
      }));
    }
    const min = selectedOperator.minAmount || 2;
    const max = selectedOperator.maxAmount || 120;
    const fixed = selectedOperator.fixedAmounts || [];
    if (fixed.length > 0) return fixed.map((f: any) => ({ amount: Number(f), description: null }));
    return [2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120]
      .filter(a => a >= min && a <= max)
      .map(a => ({ amount: a, description: null }));
  }, [selectedOperator]);

  const changeCountry = (c: string) => {
    setSelectedCountry(c);
    setSelectedOperator(null);
    rememberCountry(c);
  };

  const openOperator = (operator: any) => {
    setSelectedOperator(operator);
    setAmount("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const rangeOf = (op: any) => {
    const cur = op.senderCurrencyCode || "";
    if (op.denominationType === "FIXED" && op.fixedAmounts?.length) {
      return `${Math.min(...op.fixedAmounts)} – ${Math.max(...op.fixedAmounts)} ${cur}`.trim();
    }
    if (op.minAmount != null && op.maxAmount != null) return `${op.minAmount} – ${op.maxAmount} ${cur}`.trim();
    return "";
  };

  const scrollToOperators = () => {
    document.getElementById("topup-operators")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <CurrentMarketingPage page={"gift-cards"}>
      <div className={"page-wrapper"}>
        <main id={"top"}>
          <div className={"pxg"}>
            <div className={"gsa"}>
              <style>{TOPUP_CSS}</style>

              <div className={"gsa-w"}>
                <div className={"gsa-kinds"}>
                  <Link href={"/gift-cards/all"} className={"gsa-kind"}>{"Gift Cards"}</Link>
                  <span className={"gsa-kind"} aria-current={"page"}>{"Phone Refills"}</span>
                </div>
              </div>

              {selectedOperator ? (
                <div className={"gsa-w pt-6"}>
                  <TopupDetailView
                    selectedOperator={selectedOperator}
                    currentCountry={currentCountry}
                    proxiedOperatorLogo={proxiedOperatorLogo}
                    phoneNumber={phoneNumber}
                    setPhoneNumber={setPhoneNumber}
                    amount={amount}
                    setAmount={setAmount}
                    suggestedAmounts={suggestedAmounts}
                    selectedCountry={selectedCountry}
                    onBack={() => setSelectedOperator(null)}
                  />
                </div>
              ) : (
                <div className={"gsa-w"}>
                  <h1 className={"gsa-hero"}>{"Top-up prepaid phones, from anywhere."}</h1>

                  <div className={"gsa-bar"}>
                    <label className={"gsa-cs"}>
                      <img className={"gsa-flag"} src={flagUrl(selectedCountry)} alt={""} />
                      <ChevronDown size={18} />
                      <select value={selectedCountry} onChange={(e) => changeCountry(e.target.value)} aria-label={"Country"}>
                        {!countries.some((c: any) => c.isoName === selectedCountry) ? <option value={selectedCountry}>{selectedCountry}</option> : null}
                        {countries.map((c: any) => (
                          <option key={c.isoName} value={c.isoName}>{c.name}</option>
                        ))}
                      </select>
                    </label>
                    <input
                      type={"tel"}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder={"0802 123 4567"}
                      aria-label={"Phone number"}
                    />
                    <button type={"button"} className={"gsa-go"} aria-label={"Continue"} onClick={scrollToOperators}>
                      <ArrowRight size={24} />
                    </button>
                  </div>

                  <div className={"gsa-pay"}>
                    {"Pay with crypto, cards, and wallets"}
                    <div className={"ic"}>
                      {PAY_ICONS.map((s) => (SYMBOL_ICON_MAP[s] ? <span key={s}><img src={SYMBOL_ICON_MAP[s]} alt={s} /></span> : null))}
                    </div>
                  </div>

                  <div className={"gsa-pop"} id={"topup-operators"}>
                    <img className={"gsa-flag"} src={flagUrl(selectedCountry)} alt={""} />
                    <span>{"Popular in " + countryName}</span>
                  </div>

                  <div className={"gsa-filter"}>
                    <label className={"gsa-pill"}>
                      <select value={kind} onChange={(e) => setKind(e.target.value as "all" | "data")} aria-label={"Type"}>
                        <option value={"all"}>{"Operators"}</option>
                        <option value={"data"}>{"Data bundles"}</option>
                      </select>
                      <ChevronDown size={22} />
                    </label>
                  </div>

                  <div className={"gsa-grid"}>
                    {isLoadingOperators
                      ? Array.from({ length: 8 }).map((_, i) => <div key={i} className={"gsa-sk"}></div>)
                      : shownOperators.map((op: any) => {
                        const logo = sanitizeImageUrl(op.logoUrls?.[0]);
                        return (
                          <button key={op.operatorId} type={"button"} className={"gsa-tile"} onClick={() => openOperator(op)}>
                            <div className={"gsa-art"}>
                              {logo ? (
                                <img src={logo} alt={""} loading={"lazy"} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                              ) : (
                                <Smartphone className={"w-10 h-10 text-[#52625f]"} />
                              )}
                            </div>
                            <div className={"gsa-tn"}>{op.name}</div>
                            {rangeOf(op) ? <div className={"gsa-ts"}>{rangeOf(op)}</div> : null}
                          </button>
                        );
                      })}
                  </div>

                  {operatorsQuery.isError ? (
                    <p className={"gsa-msg"}>
                      {"Operators couldn’t be loaded: " + (((operatorsQuery.error as any)?.message as string) || "unknown error")}{" "}
                      <button type={"button"} onClick={() => operatorsQuery.refetch()}>{"Try again"}</button>
                    </p>
                  ) : !isLoadingOperators && shownOperators.length === 0 ? (
                    <p className={"gsa-msg"}>{"No operators found for this country."}</p>
                  ) : null}
                </div>
              )}

              {selectedOperator && (
                <RelatedOperators
                  operators={operators}
                  selectedOperator={selectedOperator}
                  currentCountry={currentCountry}
                  onSelect={openOperator}
                />
              )}

      {/* ── How Refills Work ── */}
      <section className="py-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-[#091e1c] mb-2">How refills work</h2>
          <p className="text-[#52625f] mb-10 text-sm">Three simple steps — takes less than a minute.</p>

          <div className="space-y-8">
            {/* Step 1 */}
            <div>
              <div className="bg-white border border-[#e3ebe9] rounded-3xl p-8 flex items-center justify-center min-h-[140px] mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white border-2 border-[#e3ebe9] rounded-xl px-4 py-2.5 shadow-sm">
                    <span className="font-mono text-[#091e1c] text-lg tracking-widest">342934</span>
                    <span className="w-0.5 h-5 bg-[#bef264] ml-0.5 animate-pulse" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#bef264] flex items-center justify-center shadow-md shrink-0">
                    <ArrowRight className="w-5 h-5 text-[#091e1c]" />
                  </div>
                </div>
              </div>
              <h3 className="font-bold text-[#091e1c] text-base mb-1">Enter a phone number &amp; amount</h3>
              <p className="text-sm text-[#52625f]">Type in the phone number and the amount you want us to refill.</p>
            </div>

            {/* Step 2 */}
            <div>
              <div className="bg-white border border-[#e3ebe9] rounded-3xl p-8 flex items-center justify-center min-h-[140px] mb-4">
                <div className="flex items-center gap-5">
                  {/* Bitcoin coin */}
                  <div className="w-14 h-14 rounded-full bg-[#F7931A] flex items-center justify-center shadow-lg shrink-0">
                    <span className="text-[#091e1c] font-black text-xl">₿</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#52625f]" />
                  {/* QR code */}
                  <div className="w-14 h-14 bg-white border border-[#e3ebe9] rounded-xl p-1.5 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 21 21" className="w-full h-full" fill="currentColor">
                      <rect x="0" y="0" width="9" height="9" rx="1" className="text-[#091e1c]" />
                      <rect x="2" y="2" width="5" height="5" className="text-background" />
                      <rect x="3" y="3" width="3" height="3" className="text-[#091e1c]" />
                      <rect x="12" y="0" width="9" height="9" rx="1" className="text-[#091e1c]" />
                      <rect x="14" y="2" width="5" height="5" className="text-background" />
                      <rect x="15" y="3" width="3" height="3" className="text-[#091e1c]" />
                      <rect x="0" y="12" width="9" height="9" rx="1" className="text-[#091e1c]" />
                      <rect x="2" y="14" width="5" height="5" className="text-background" />
                      <rect x="3" y="15" width="3" height="3" className="text-[#091e1c]" />
                      <rect x="12" y="12" width="3" height="3" className="text-[#091e1c]" />
                      <rect x="16" y="12" width="5" height="3" className="text-[#091e1c]" />
                      <rect x="12" y="16" width="5" height="2" className="text-[#091e1c]" />
                      <rect x="18" y="16" width="3" height="5" className="text-[#091e1c]" />
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className="font-bold text-[#091e1c] text-base mb-1">Pay with any payment method</h3>
              <p className="text-sm text-[#52625f]">Your payment is confirmed the same minute in most cases.</p>
            </div>

            {/* Step 3 */}
            <div>
              <div className="bg-white border border-[#e3ebe9] rounded-3xl p-8 flex items-center justify-center min-h-[140px] mb-4">
                <div className="relative w-16 h-16">
                  {/* Back paper */}
                  <div className="absolute inset-0 translate-x-2 -translate-y-1 bg-[#f3f7f6] border border-[#e3ebe9] rounded-xl" />
                  {/* Front paper */}
                  <div className="absolute inset-0 bg-white border border-[#e3ebe9] rounded-xl flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow">
                      <svg viewBox="0 0 12 12" className="w-4 h-4" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 6l3 3 5-5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="font-bold text-[#091e1c] text-base mb-1">That's it, here is your refill</h3>
              <p className="text-sm text-[#52625f]">Once your payment is confirmed you will get your refill sent out.</p>
            </div>
          </div>
        </div>
      </section>


              <TopupFaq />
            </div>
          </div>
        </main>
      </div>
    </CurrentMarketingPage>
  );
};

export default Index;
