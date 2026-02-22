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
import { Card, CardContent } from "@/components/ui/card";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { useAuth } from "@/lib/auth-context";
import { Link } from "wouter";

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
      description: "Buy crypto from BitPay's trusted partners and see it in your wallet instantly.",
      icon: Zap
    },
    {
      title: "Self-custody",
      description: "You control your crypto, keys, and data.",
      icon: Shield
    },
    {
      title: "Use any wallet",
      description: "Bring your own wallet or use the BitPay Wallet to store, swap and spend after you buy.",
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
      answer: "Buying cryptocurrency on BitPay is simple. Just select 'Buy', choose your fiat currency and amount, pick the crypto you want to receive, select a payment method, and follow the instructions to complete the purchase."
    },
    {
      question: "Why should I buy cryptocurrency?",
      answer: "People buy cryptocurrency for various reasons, including as an investment, to make fast global transfers, to access decentralized applications, or to maintain control over their financial assets in a self-custody wallet."
    },
    {
      question: "Why is BitPay the best place to buy cryptocurrency?",
      answer: "BitPay provides a secure, easy-to-use platform with multiple payment methods, competitive rates, and instant delivery to your wallet. We prioritize self-custody and user security."
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
        <title>Buy Crypto Instantly | BitPay</title>
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-[#1A3BB5] text-white overflow-hidden py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Buy crypto instantly.</h1>
            <p className="text-lg md:text-xl opacity-90 mb-12 max-w-2xl mx-auto">
                Choose from 16+ cryptocurrencies. Download the app to store with self-custody.
            </p>

            {/* Buy Widget Card */}
            <div className="bg-white rounded-3xl p-8 text-left text-gray-900 shadow-2xl max-w-md mx-auto w-full">
              <h2 className="text-2xl font-bold mb-8">Buy Crypto</h2>
              
              <div className="flex justify-center mb-8">
                <div className="bg-gray-50 p-1 rounded-full flex w-full max-w-[180px]">
                  <button 
                    onClick={() => setMode("buy")}
                    className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${mode === "buy" ? "bg-[#1A3BB5] text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Buy
                  </button>
                  <button 
                    onClick={() => setMode("sell")}
                    className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${mode === "sell" ? "bg-[#1A3BB5] text-white shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Sell
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="border border-gray-100 rounded-xl p-6">
                  <label className="text-xs font-semibold text-gray-400 mb-4 block uppercase tracking-wider">Amount</label>
                  <div className="flex items-center justify-between gap-4">
                    <div className="bg-[#1A3BB5] text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-[#152e8f] transition-colors min-w-[140px]">
                        <span className="font-bold flex-1">Select Currency</span>
                        <ChevronDown className="w-4 h-4" />
                    </div>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-right text-3xl font-medium w-full outline-none text-gray-400 placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div className="border border-gray-100 rounded-xl p-6">
                  <label className="text-xs font-semibold text-gray-400 mb-4 block uppercase tracking-wider">Buying</label>
                  <div className="bg-[#1A3BB5] text-white px-4 py-3 rounded-lg flex items-center justify-between cursor-pointer hover:bg-[#152e8f] transition-colors">
                      <span className="font-bold">Select</span>
                      <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                <div className="border border-gray-100 rounded-xl p-6">
                  <label className="text-xs font-semibold text-gray-400 mb-4 block uppercase tracking-wider">Payment Method</label>
                  <div className="bg-[#1A3BB5] text-white px-4 py-3 rounded-lg flex items-center justify-between cursor-pointer hover:bg-[#152e8f] transition-colors">
                      <span className="font-bold">Select</span>
                      <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                <Button className="w-full h-14 bg-gray-100 hover:bg-gray-200 text-gray-400 rounded-xl text-lg font-bold shadow-none mt-4 uppercase tracking-wider" disabled={true}>
                  View Offers
                </Button>

                <div className="text-center mt-6 space-y-1">
                  <p className="text-[#1A3BB5] font-bold cursor-pointer hover:underline text-lg">Don't have a wallet?</p>
                  <p className="text-[#1A3BB5] font-bold cursor-pointer hover:underline text-lg">Get the BitPay app</p>
                </div>
              </div>
            </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">How to buy crypto online or with the BitPay App</h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Buy cryptocurrency with a credit card, debit card, bank account, Apple Pay, Google Pay, Venmo, PayPal, and Cash App from BitPay's trusted partners. Delivered quickly to any wallet, no hidden fees or third-party custody. Buy crypto online or in the BitPay app.
            </p>
          </div>

          <div className="space-y-24">
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
                desc: "Enter the address where you'd like to receive your Bitcoin. Need a wallet? Store with BitPay's non-custodial wallet.",
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
                <div className="w-16 h-16 rounded-full bg-white border border-gray-50 shadow-sm text-[#1A3BB5] flex items-center justify-center text-2xl font-bold mx-auto mb-10">
                  {item.step}
                </div>
                <h3 className="text-4xl font-bold mb-6">{item.title}</h3>
                <p className="text-gray-600 text-lg mb-12 max-w-2xl mx-auto">{item.desc}</p>
                <div className="bg-[#EFF2FF] rounded-[40px] p-12 max-w-2xl mx-auto shadow-sm">
                  <img src={item.img} alt={item.title} className="w-full h-auto rounded-3xl shadow-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Assets */}
      <section className="py-24 px-4 bg-white border-t border-gray-50">
        <div className="container mx-auto max-w-4xl">
            <div className="mb-12">
              <h2 className="text-5xl font-bold mb-8 text-gray-900">Supported Assets</h2>
              <p className="text-xl text-gray-600 mb-12">Buy the most popular cryptocurrencies including Bitcoin, Ethereum and more.</p>
            </div>
            <div className="space-y-12">
              {supportedAssets.slice(0, 6).map((asset) => (
                <div key={asset.symbol} className="flex items-start gap-6 group cursor-pointer">
                  <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 shadow-sm">
                    <img 
                        src={cryptoIconUrls[asset.symbol as keyof typeof cryptoIconUrls] || `/logos/${asset.name.toLowerCase().replace(" ", "-")}-logo.svg`} 
                        alt={asset.name} 
                        className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg text-gray-500 font-medium mb-1">{asset.name}</p>
                    <p className="text-4xl font-bold text-gray-900 mb-3">{asset.price}</p>
                    <Link href={`/buy-crypto?coin=${asset.symbol}`} className="text-[#1A3BB5] font-bold flex items-center gap-1 hover:underline text-lg">
                      Buy {asset.name} ({asset.symbol}) →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-16">Benefits of buying cryptocurrency through BitPay</h2>
          <div className="space-y-8">
            {benefits.map((benefit, i) => (
              <div key={i} className="p-12 rounded-[40px] bg-[#EFF2FF] text-left">
                <div className="w-20 h-20 rounded-full bg-[#1A3BB5] flex items-center justify-center text-white mb-10">
                  <benefit.icon className="w-10 h-10" />
                </div>
                <h3 className="text-4xl font-bold mb-6">{benefit.title}</h3>
                <p className="text-gray-600 text-xl leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Post-Buy Actions */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">What can I do after I buy cryptocurrency?</h2>
          <div className="space-y-16">
              {[
                { 
                  title: "Hold", 
                  desc: "Buy your favorite coins and add to your growing portfolio.",
                  icon: imgPostBuy
                },
                { 
                  title: "Swap", 
                  desc: "Exchange one asset for another without leaving the app. Swap Bitcoin, Ethereum, Dogecoin and all of your favorite coins.",
                  icon: imgPostBuy // Using the same icon placeholder for now as per design
                },
                { 
                  title: "Spend", 
                  desc: "Pay bills, shop with top brands, buy gift cards, or use HODL Pay to spend without selling, all in the BitPay Wallet.",
                  icon: imgPostBuy
                },
              ].map((item, i) => (
                <div key={i} className="flex flex-col md:flex-row gap-10 items-start">
                  <div className="w-24 h-24 rounded-full bg-[#EFF2FF] flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img src={item.icon} alt={item.title} className="w-full h-full object-cover scale-150" />
                  </div>
                  <div>
                    <h3 className="text-4xl font-bold mb-4">{item.title}</h3>
                    <p className="text-gray-600 text-xl leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-[#EFF2FF]">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">Cryptocurrency frequently asked questions</h2>
          <div className="bg-white rounded-[32px] overflow-hidden shadow-sm">
            <Accordion type="single" collapsible className="divide-y divide-gray-100">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-none px-8">
                  <AccordionTrigger className="text-xl font-bold hover:no-underline text-left py-8">
                    <span className="flex items-center gap-6">
                      <Plus className="w-6 h-6 text-[#1A3BB5] group-data-[state=open]:hidden" />
                      <Minus className="w-6 h-6 text-[#1A3BB5] hidden group-data-[state=open]:block" />
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-lg leading-relaxed pt-0 pb-8 pl-12 pr-8">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BuyCryptoPage;
