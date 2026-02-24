import { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { 
  ChevronRight,
  Zap, 
  Shield, 
  CreditCard, 
  Wallet, 
  RefreshCw, 
  Plus,
  Minus,
  Smartphone,
  ChevronDown,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { useAuth } from "@/lib/auth-context";
import { Link, useLocation } from "wouter";
import { AppFooter } from "@/components/app-footer";
import { PaymentMethodSelector } from "@/components/buy-crypto/PaymentMethodSelector";
import { CryptoCurrencySelector } from "@/components/crypto-currency-selector";
import { useToast } from "@/hooks/use-toast";
import { useCdpOnramp } from "@/hooks/use-cdp-onramp";

import imgStep1 from "@assets/IMG_4268.webp";
import imgStep2 from "@assets/svg-image-1-3.svg";
import imgStep3 from "@assets/svg-image-1-3.svg";
import imgPostBuy from "@assets/svg-image-1-3.svg";
import imgHold from "@assets/svg-image-1-3.svg";
import imgSwap from "@assets/svg-image-1-3.svg";
import imgSpend from "@assets/svg-image-1-3.svg";

const cryptoCurrencies = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "BCH", name: "Bitcoin Cash" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "LTC", name: "Litecoin" },
  { symbol: "USDC", name: "USDC" },
  { symbol: "USDT", name: "Tether" }
];

const BuyCryptoPage = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [fiat, setFiat] = useState("USD");
  const [crypto, setCrypto] = useState("BTC");
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const cdpOnramp = useCdpOnramp();

  const handleBuy = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to buy crypto.",
        variant: "destructive",
      });
      setLocation("/signin");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = await cdpOnramp.mutateAsync({
        address: user.wallet_address || (user as any)?.user_metadata?.wallet_address || "YOUR_WALLET_ADDRESS",
        purchaseCurrency: crypto,
        paymentAmount: amount,
        paymentCurrency: fiat,
      });

      if (data.onrampUrl) {
        window.open(data.onrampUrl, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const supportedAssets = useMemo(() => {
    return [
      { symbol: "BTC", name: "Bitcoin", price: "$67,248.58" },
      { symbol: "BCH", name: "Bitcoin Cash", price: "$569.42" },
      { symbol: "ETH", name: "Ethereum", price: "$1,966.33" },
      { symbol: "DOGE", name: "Dogecoin", price: "$0.10" },
      { symbol: "LTC", name: "Litecoin", price: "$53.79" },
      { symbol: "USDC", name: "USDC", price: "$1.00" },
      { symbol: "PAX", name: "Pax Dollar", price: "$1.00" },
      { symbol: "GUSD", name: "Gemini Dollar", price: "$1.00" },
      { symbol: "BUSD", name: "Binance USD", price: "$1.00" },
      { symbol: "DAI", name: "DAI", price: "$1.00" },
      { symbol: "WBTC", name: "Wrapped Bitcoin", price: "$67,927.86" },
      { symbol: "SHIB", name: "Shiba Inu", price: "$0.00000621" },
      { symbol: "APE", name: "ApeCoin", price: "$0.11" },
      { symbol: "POL", name: "Polygon", price: "$0.11" },
      { symbol: "USDT", name: "Tether", price: "$1.00" },
      { symbol: "XRP", name: "XRP", price: "$1.41" },
      { symbol: "SOL", name: "Solana", price: "$84.35" }
    ];
  }, []);

  const benefits = [
    {
      title: "Fast transactions",
      description: "Buy crypto from Pexly's trusted partners and see it in your wallet instantly.",
      icon: Zap
    },
    {
      title: "Self-custody",
      description: "You control your crypto, keys, and data.",
      icon: Shield
    },
    {
      title: "Use any wallet",
      description: "Bring your own wallet or use the Pexly Wallet to store, swap and spend after you buy.",
      icon: Wallet
    },
    {
      title: "Choose your rates",
      description: "We compare offers from the best providers so you get the most crypto for your money",
      icon: RefreshCw
    }
  ];

  const faqs = [
    {
      question: "What is cryptocurrency?",
      answer: "Cryptocurrency is a digital or virtual form of currency that uses cryptography for security. Unlike traditional currencies issued by central banks, cryptocurrencies operate on decentralized networks based on blockchain technology."
    },
    {
      question: "How do I buy cryptocurrency?",
      answer: "Buying cryptocurrency on Pexly is simple. Just select 'Buy', choose your fiat currency and amount, pick the crypto you want to receive, select a payment method, and follow the instructions to complete the purchase."
    },
    {
      question: "Why should I buy cryptocurrency?",
      answer: "People buy cryptocurrency for various reasons, including as an investment, to make fast global transfers, to access decentralized applications, or to maintain control over their financial assets in a self-custody wallet."
    },
    {
      question: "Why is Pexly the best place to buy cryptocurrency?",
      answer: "Pexly provides a secure, easy-to-use platform with multiple payment methods, competitive rates, and instant delivery to your wallet. We prioritize self-custody and user security."
    },
    {
        question: "How do I buy cryptocurrency with a credit card?",
        answer: "Buying crypto with a credit card is easy. On the buy page, enter the amount you want to spend, select your crypto, and choose credit card as your payment method. You'll be presented with offers from our partners."
    },
    {
        question: "How much cryptocurrency can I buy?",
        answer: "Limits vary depending on the partner you choose and your verification level. Generally, you can buy from a few dollars up to several thousand per transaction."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Buy Crypto Instantly | Pexly</title>
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-[#CCFF00] text-black overflow-hidden py-12 md:py-20 px-4 min-h-[500px] flex items-center">
        {/* Floating Icons for Desktop */}
        <div className="hidden md:block absolute inset-0 pointer-events-none">
          <div className="absolute top-[15%] left-[10%] animate-curve-float opacity-60">
            <img src={cryptoIconUrls.BTC} className="w-16 h-16 grayscale brightness-0" alt="" />
          </div>
          <div className="absolute top-[60%] left-[5%] animate-curve-float-reverse opacity-35">
            <img src={cryptoIconUrls.ETH} className="w-12 h-12 grayscale brightness-0" alt="" />
          </div>
          <div className="absolute top-[20%] left-[35%] animate-curve-float opacity-30">
            <img src={cryptoIconUrls.SOL} className="w-10 h-10 grayscale brightness-0" alt="" />
          </div>
          <div className="absolute bottom-[15%] left-[25%] animate-curve-float-reverse opacity-40">
            <img src={cryptoIconUrls.LTC} className="w-14 h-14 grayscale brightness-0" alt="" />
          </div>
        </div>

        <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 relative z-10">
            <div className="text-left md:w-1/2">
                <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">Buy crypto instantly.</h1>
                <p className="text-lg md:text-xl opacity-80 mb-6 max-w-md">
                    Choose from 16+ cryptocurrencies. Download the app to store with self-custody.
                </p>
            </div>

            {/* Buy Widget Card */}
            <div className="bg-white rounded-[24px] p-6 md:p-8 text-left text-gray-900 shadow-2xl w-full max-w-[500px] border border-gray-100">
              <h2 className="text-2xl md:text-3xl font-black text-center mb-6 tracking-tight">Buy Cryptocurrency</h2>
              
              <div className="flex justify-center mb-8">
                <div className="bg-gray-100 p-1 rounded-full flex w-full max-w-[180px]">
                  <button 
                    onClick={() => setMode("buy")}
                    className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${mode === "buy" ? "bg-[#CCFF00] text-black shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Buy
                  </button>
                  <button 
                    onClick={() => setMode("sell")}
                    className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${mode === "sell" ? "bg-[#CCFF00] text-black shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Sell
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-xl p-4 focus-within:border-black transition-colors bg-white">
                  <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">Amount</label>
                  <div className="flex items-center justify-between gap-3">
                    <div className="bg-gray-50 border border-gray-100 px-3 py-2 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-gray-100 transition-all min-w-[100px]">
                        <span className="font-bold text-xs text-gray-700">USD</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                    </div>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-right text-2xl font-medium w-full outline-none text-gray-400 placeholder:text-gray-200 bg-transparent"
                    />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-4 focus-within:border-black transition-colors bg-white">
                  <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">Buying</label>
                  <CryptoCurrencySelector 
                  value={crypto}
                  onChange={(symbol) => setCrypto(symbol)}
                />
                </div>

                <div className="border border-gray-200 rounded-xl p-4 focus-within:border-black transition-colors bg-white">
                  <label className="text-[10px] font-bold text-gray-400 mb-1 block uppercase tracking-wider">Payment Method</label>
                  <PaymentMethodSelector 
                    selectedId={paymentMethod}
                    onSelect={setPaymentMethod}
                  />
                </div>

                <Button 
                  onClick={handleBuy}
                  disabled={cdpOnramp.isPending || !amount}
                  className="w-full h-14 bg-[#CCFF00] hover:bg-[#b8e600] text-black rounded-xl text-base font-bold shadow-sm mt-4 border-none transition-all"
                >
                  {cdpOnramp.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "View Offers"
                  )}
                </Button>

                <div className="text-center mt-6">
                  <p className="text-gray-500 font-medium text-xs">Don't have a wallet? <span className="text-black font-bold cursor-pointer hover:underline">Get the Pexly app</span></p>
                </div>
              </div>
            </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-8 tracking-tight">How to buy crypto online or with the Pexly App</h2>
            <p className="text-lg text-gray-500 leading-relaxed max-w-4xl mx-auto font-medium">
              Buy cryptocurrency with a credit card, debit card, bank account, Apple Pay, Google Pay, Venmo, PayPal, and Cash App from Pexly's trusted partners. Delivered quickly to any wallet, no hidden fees or third-party custody. Buy crypto online or in the Pexly app.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                step: 1, 
                title: "Choose your crypto", 
                desc: "Select from the top cryptocurrencies. Enter the amount of crypto you'd like to buy.",
                img: imgStep1
              },
              { 
                step: 2, 
                title: "Send to any wallet", 
                desc: "Enter the address where you'd like to receive your Bitcoin. Need a wallet? Store with Pexly's non-custodial wallet.",
                img: imgStep2
              },
              { 
                step: 3, 
                title: "Pay and receive your crypto", 
                desc: "Choose the best rate and pay with credit card, debit card, bank account, Apple Pay, Google Pay, Venmo, PayPal, and Cash App.",
                img: imgStep3
              }
            ].map((item) => (
              <div key={item.step} className="text-center flex flex-col">
                <div className="text-[#CCFF00] text-2xl font-black mb-6">
                  {item.step}
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tight">{item.title}</h3>
                <p className="text-gray-500 text-sm mb-10 max-w-xs mx-auto font-medium leading-relaxed">{item.desc}</p>
                <div className="mt-auto bg-[#f4f7ff] rounded-[32px] p-6 shadow-sm border border-gray-50">
                  <img src={item.img} alt={item.title} className="w-full h-auto rounded-xl shadow-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Assets Section */}
      <section className="py-24 px-4 bg-white border-t border-gray-50">
        <div className="container mx-auto max-w-7xl">
            <div className="bg-white border border-gray-100 rounded-[32px] p-12 md:p-16 shadow-sm">
                <div className="mb-12">
                  <h2 className="text-4xl font-black mb-4 text-gray-900 tracking-tight">Supported Assets</h2>
                  <p className="text-lg text-gray-500 font-medium">Buy the most popular cryptocurrencies including Bitcoin, Ethereum and more.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-y-12 gap-x-8">
                  {supportedAssets.map((asset) => (
                    <div key={asset.symbol} className="flex items-start gap-4 group cursor-pointer">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-sm border border-gray-100">
                        <img 
                            src={cryptoIconUrls[asset.symbol as keyof typeof cryptoIconUrls] || `/logos/${asset.name.toLowerCase().replace(" ", "-")}-logo.svg`} 
                            alt={asset.name} 
                            className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-[12px] text-gray-500 font-bold mb-0.5 leading-none">{asset.name}</p>
                        <p className="text-lg font-black text-gray-900 mb-0.5 leading-tight">{asset.price}</p>
                        <Link href={`/buy-crypto?coin=${asset.symbol}`} className="text-black font-bold flex items-center gap-1 hover:underline text-[11px] uppercase tracking-wide">
                          Buy {asset.name} ({asset.symbol}) →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-16 tracking-tight">Benefits of buying cryptocurrency through Pexly</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, i) => (
              <div key={i} className="p-10 rounded-[32px] bg-[#f4f7ff] text-left border border-gray-50 group hover:bg-[#ebf0ff] transition-all">
                <div className="w-14 h-14 rounded-2xl bg-[#CCFF00] flex items-center justify-center text-black mb-8 shadow-lg">
                  <benefit.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tight">{benefit.title}</h3>
                <p className="text-gray-500 text-base leading-relaxed font-medium">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Post-Buy Actions */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="md:w-1/2">
               <img src={imgPostBuy} alt="Post Buy" className="w-full h-auto rounded-[32px] shadow-2xl" />
            </div>
            <div className="md:w-1/2">
              <h2 className="text-3xl md:text-5xl font-black mb-12 tracking-tight leading-tight">What can I do after I buy cryptocurrency?</h2>
              <div className="space-y-12">
                  {[
                    { 
                      title: "Hold", 
                      desc: "Buy your favorite coins and add to your growing portfolio.",
                      icon: imgHold
                    },
                    { 
                      title: "Swap", 
                      desc: "Exchange one asset for another without leaving the app. Swap Bitcoin, Ethereum, Dogecoin and all of your favorite coins.",
                      icon: imgSwap
                    },
                    { 
                      title: "Spend", 
                      desc: "Pay bills, shop with top brands, buy gift cards, or use HODL Pay to spend without selling, all in the Pexly Wallet.",
                      icon: imgSpend
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6 items-start">
                      <div className="w-14 h-14 rounded-full bg-[#f4f7ff] flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-50 p-3 shadow-sm">
                        <img src={item.icon} alt={item.title} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black mb-3 tracking-tight">{item.title}</h3>
                        <p className="text-gray-500 text-base leading-relaxed font-medium">{item.desc}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-white border-t border-gray-50">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-16 tracking-tight">Cryptocurrency frequently asked questions</h2>
          <div className="max-w-5xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-b border-gray-100 px-0">
                  <AccordionTrigger className="text-xl font-bold hover:no-underline text-left py-8 group">
                    <span className="flex items-center gap-4 text-black">
                      <Plus className="w-6 h-6 text-black group-data-[state=open]:hidden" />
                      <Minus className="w-6 h-6 text-black hidden group-data-[state=open]:block" />
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-500 text-lg leading-relaxed pt-0 pb-8 pl-10 font-medium">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
};

export default BuyCryptoPage;
