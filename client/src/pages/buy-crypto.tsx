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
    return cryptoCurrencies.map(c => ({
      symbol: c.symbol,
      name: c.name,
      price: c.symbol === "BTC" ? "$66,924.64" : 
             c.symbol === "ETH" ? "$1,952.29" :
             c.symbol === "SOL" ? "$84.35" :
             c.symbol === "BCH" ? "$568.99" :
             c.symbol === "DOGE" ? "$0.10" :
             c.symbol === "LTC" ? "$53.33" :
             c.symbol === "USDC" ? "$1.00" :
             c.symbol === "USDT" ? "$1.00" : "$1.00"
    }));
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
      <section className="relative bg-[#CCFF00] text-black overflow-hidden py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Buy crypto instantly.</h1>
            <p className="text-base md:text-lg opacity-80 mb-10 max-w-2xl mx-auto">
                Choose from 16+ cryptocurrencies. Download the app to store with self-custody.
            </p>

            {/* Buy Widget Card */}
            <div className="bg-white rounded-[32px] p-8 text-left text-gray-900 shadow-2xl max-w-lg mx-auto w-full border border-gray-100">
              <h2 className="text-2xl font-bold mb-8">Buy Crypto</h2>
              
              <div className="flex justify-center mb-8">
                <div className="bg-gray-100 p-1.5 rounded-full flex w-full max-w-[240px]">
                  <button 
                    onClick={() => setMode("buy")}
                    className={`flex-1 py-3 rounded-full text-sm font-bold transition-all ${mode === "buy" ? "bg-black text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Buy
                  </button>
                  <button 
                    onClick={() => setMode("sell")}
                    className={`flex-1 py-3 rounded-full text-sm font-bold transition-all ${mode === "sell" ? "bg-black text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Sell
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="border border-gray-200 rounded-2xl p-6 hover:border-black transition-colors">
                  <label className="text-xs font-bold text-gray-500 mb-3 block uppercase tracking-widest">Amount</label>
                  <div className="flex items-center justify-between gap-4">
                    <div className="bg-black text-white px-5 py-3 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-gray-800 transition-all min-w-[160px] shadow-sm">
                        <span className="font-bold text-sm flex-1 text-center">Select Currency</span>
                        <ChevronDown className="w-4 h-4" />
                    </div>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-right text-3xl font-bold w-full outline-none text-black placeholder:text-gray-300 bg-transparent"
                    />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-2xl p-6 hover:border-black transition-colors">
                  <label className="text-xs font-bold text-gray-500 mb-3 block uppercase tracking-widest">Buying</label>
                  <div className="bg-black text-white px-5 py-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-all shadow-sm">
                      <span className="font-bold text-sm">Select Asset</span>
                      <ChevronDown className="w-5 h-5" />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-2xl p-6 hover:border-black transition-colors">
                  <label className="text-xs font-bold text-gray-500 mb-3 block uppercase tracking-widest">Payment Method</label>
                  <div className="bg-black text-white px-5 py-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-all shadow-sm">
                      <span className="font-bold text-sm">Select Payment</span>
                      <ChevronRight className="w-5 h-5" />
                  </div>
                </div>

                <Button className="w-full h-16 bg-[#CCFF00] hover:bg-[#b8e600] text-black rounded-2xl text-base font-black shadow-lg mt-4 uppercase tracking-widest border-none transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={false}>
                  View Offers
                </Button>

                <div className="text-center mt-6 space-y-2">
                  <p className="text-gray-500 font-medium text-sm">Don't have a wallet? <span className="text-black font-bold cursor-pointer hover:underline">Get the Pexly app</span></p>
                </div>
              </div>
            </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">How to buy crypto online or with the Pexly App</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Buy cryptocurrency with a credit card, debit card, bank account, Apple Pay, Google Pay, Venmo, PayPal, and Cash App from Pexly's trusted partners. Delivered quickly to any wallet, no hidden fees or third-party custody. Buy crypto online or in the Pexly app.
            </p>
          </div>

          <div className="space-y-20">
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
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-white border border-gray-100 shadow-sm text-black flex items-center justify-center text-xl font-bold mx-auto mb-8">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-gray-600 text-base mb-10 max-w-xl mx-auto">{item.desc}</p>
                <div className="bg-[#f8faff] rounded-[32px] p-8 max-w-xl mx-auto shadow-sm">
                  <img src={item.img} alt={item.title} className="w-full h-auto rounded-2xl shadow-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Assets Section - Containerized */}
      <section className="py-20 px-4 bg-white border-t border-gray-50">
        <div className="container mx-auto max-w-4xl">
            <div className="bg-[#fdfdfd] border border-gray-100 rounded-[32px] p-8 md:p-12">
                <div className="mb-10">
                  <h2 className="text-3xl font-bold mb-4 text-gray-900">Supported Assets</h2>
                  <p className="text-lg text-gray-600 mb-8">Buy the most popular cryptocurrencies including Bitcoin, Ethereum and more.</p>
                </div>
                <div className="space-y-10">
                  {supportedAssets.slice(0, 6).map((asset) => (
                    <div key={asset.symbol} className="flex items-start gap-5 group cursor-pointer">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-sm">
                        <img 
                            src={cryptoIconUrls[asset.symbol as keyof typeof cryptoIconUrls] || `/logos/${asset.name.toLowerCase().replace(" ", "-")}-logo.svg`} 
                            alt={asset.name} 
                            className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 border-b border-gray-50 pb-6 last:border-0">
                        <p className="text-base text-gray-500 font-medium mb-1">{asset.name}</p>
                        <p className="text-2xl font-bold text-gray-900 mb-2">{asset.price}</p>
                        <Link href={`/buy-crypto?coin=${asset.symbol}`} className="text-black font-bold flex items-center gap-1 hover:underline text-sm uppercase tracking-wide">
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
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-12">Benefits of buying cryptocurrency through Pexly</h2>
          <div className="space-y-6">
            {benefits.map((benefit, i) => (
              <div key={i} className="p-8 md:p-10 rounded-[32px] bg-[#f8faff] text-left border border-gray-50">
                <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center text-white mb-8">
                  <benefit.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
                <p className="text-gray-600 text-base leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Post-Buy Actions */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">What can I do after I buy cryptocurrency?</h2>
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
                <div key={i} className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-16 h-16 rounded-full bg-[#f8faff] flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-50 p-3">
                    <img src={item.icon} alt={item.title} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-gray-600 text-base leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* FAQ Section - Containerized */}
      <section className="py-20 px-4 bg-[#f8faff]">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Cryptocurrency frequently asked questions</h2>
          <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 p-4 md:p-8">
            <Accordion type="single" collapsible className="divide-y divide-gray-50">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-none px-4">
                  <AccordionTrigger className="text-lg font-bold hover:no-underline text-left py-6">
                    <span className="flex items-center gap-4">
                      <Plus className="w-5 h-5 text-black group-data-[state=open]:hidden" />
                      <Minus className="w-5 h-5 text-black hidden group-data-[state=open]:block" />
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-base leading-relaxed pt-0 pb-6 pl-9 pr-4">
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
