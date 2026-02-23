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
  ChevronDown
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
import { Link } from "wouter";
import { AppFooter } from "@/components/app-footer";

// Mock data for currencies since we can't import them
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

import imgStep1 from "@assets/svg-image-1-3.svg";
import imgStep2 from "@assets/svg-image-1-3.svg";
import imgStep3 from "@assets/svg-image-1-3.svg";
import imgPostBuy from "@assets/svg-image-1-3.svg";
import imgHold from "@assets/svg-image-1-3.svg";
import imgSwap from "@assets/svg-image-1-3.svg";
import imgSpend from "@assets/svg-image-1-3.svg";

const BuyCryptoPage = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [fiat, setFiat] = useState("USD");
  const [crypto, setCrypto] = useState("BTC");

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
      <section className="relative bg-[#0033ad] text-white overflow-hidden py-16 md:py-24 px-4 min-h-[600px] flex items-center">
        <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="text-left md:w-1/2">
                <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">Buy crypto instantly.</h1>
                <p className="text-lg md:text-xl opacity-90 mb-8 max-w-md">
                    Choose from 16+ cryptocurrencies. Download the app to store with self-custody.
                </p>
            </div>

            {/* Buy Widget Card */}
            <div className="bg-white rounded-[24px] p-6 md:p-10 text-left text-gray-900 shadow-2xl w-full max-w-[540px] border border-gray-100 relative z-10">
              <h2 className="text-2xl md:text-3xl font-black text-center mb-8 tracking-tight">Buy Cryptocurrency</h2>
              
              <div className="flex justify-center mb-10">
                <div className="bg-gray-100 p-1 rounded-full flex w-full max-w-[200px]">
                  <button 
                    onClick={() => setMode("buy")}
                    className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${mode === "buy" ? "bg-[#0033ad] text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Buy
                  </button>
                  <button 
                    onClick={() => setMode("sell")}
                    className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all ${mode === "sell" ? "bg-[#0033ad] text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Sell
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                <div className="border border-gray-200 rounded-xl p-5 focus-within:border-[#0033ad] transition-colors bg-white group">
                  <label className="text-[11px] font-bold text-gray-400 mb-2 block uppercase tracking-wider">Amount</label>
                  <div className="flex items-center justify-between gap-4">
                    <div className="bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-all min-w-[120px]">
                        <span className="font-bold text-sm text-gray-700">USD</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-right text-3xl font-medium w-full outline-none text-gray-300 placeholder:text-gray-200 bg-transparent"
                    />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-5 focus-within:border-[#0033ad] transition-colors bg-white group">
                  <label className="text-[11px] font-bold text-gray-400 mb-2 block uppercase tracking-wider">Buying</label>
                  <div className="bg-[#0033ad] text-white px-5 py-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-[#002a8f] transition-all shadow-sm">
                      <span className="font-bold text-sm">Select a crypto currency</span>
                      <ChevronDown className="w-5 h-5" />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-5 focus-within:border-[#0033ad] transition-colors bg-white group">
                  <label className="text-[11px] font-bold text-gray-400 mb-2 block uppercase tracking-wider">Payment Method</label>
                  <div className="bg-[#0033ad] text-white px-5 py-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-[#002a8f] transition-all shadow-sm">
                      <span className="font-bold text-sm">Select a payment method</span>
                      <ChevronRight className="w-5 h-5" />
                  </div>
                </div>

                <Button className="w-full h-16 bg-gray-200 hover:bg-gray-300 text-gray-500 rounded-xl text-lg font-bold shadow-sm mt-6 border-none transition-all" disabled={true}>
                  View Offers
                </Button>

                <div className="text-center mt-8">
                  <p className="text-gray-500 font-medium text-sm">Don't have a wallet? <span className="text-[#0033ad] font-bold cursor-pointer hover:underline">Get the Pexly app</span></p>
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
                <div className="text-[#0033ad] text-2xl font-black mb-6">
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
                        <Link href={`/buy-crypto?coin=${asset.symbol}`} className="text-[#0033ad] font-bold flex items-center gap-1 hover:underline text-[11px] uppercase tracking-wide">
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
                <div className="w-14 h-14 rounded-2xl bg-[#0033ad] flex items-center justify-center text-white mb-8 shadow-lg">
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
                    <span className="flex items-center gap-4">
                      <Plus className="w-6 h-6 text-[#0033ad] group-data-[state=open]:hidden" />
                      <Minus className="w-6 h-6 text-[#0033ad] hidden group-data-[state=open]:block" />
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
