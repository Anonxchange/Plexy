import { useState } from "react";
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
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { CryptoCurrencySelector } from "@/components/crypto-currency-selector";
import { FiatCurrencySelector } from "@/components/fiat-currency-selector";
import { cryptoIconUrls } from "@/lib/crypto-icons";
import { useAuth } from "@/lib/auth-context";
import { Link } from "wouter";

const BuyCryptoPage = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [fiat, setFiat] = useState("USD");
  const [crypto, setCrypto] = useState("BTC");

  const supportedAssets = [
    { symbol: "BTC", name: "Bitcoin", price: "$67,248.58" },
    { symbol: "BCH", name: "Bitcoin Cash", price: "$569.42" },
    { symbol: "ETH", name: "Ethereum", price: "$1,966.33" },
    { symbol: "DOGE", name: "Dogecoin", price: "$0.10" },
    { symbol: "LTC", name: "Litecoin", price: "$53.79" },
    { symbol: "USDC", name: "USDC", price: "$1.00" },
    { symbol: "PYUSD", name: "Pax Dollar", price: "$1.00" },
    { symbol: "GUSD", name: "Gemini Dollar", price: "$1.00" },
    { symbol: "BUSD", name: "Binance USD", price: "$1.00" },
    { symbol: "DAI", name: "DAI", price: "$1.00" },
    { symbol: "WBTC", name: "Wrapped Bitcoin", price: "$67,927.86" },
    { symbol: "SHIB", name: "Shiba Inu", price: "$0.00000621" },
    { symbol: "APE", name: "ApeCoin", price: "$0.11" },
    { symbol: "POL", name: "Polygon", price: "$0.11" },
    { symbol: "USDT", name: "Tether", price: "$1.00" },
    { symbol: "XRP", name: "XRP", price: "$1.41" },
    { symbol: "SOL", name: "Solana", price: "$84.35" },
  ];

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
      title: "Flexible payment methods",
      description: "Pay with credit card, debit card, Apple Pay or Google Pay.",
      icon: CreditCard
    },
    {
      title: "Use any wallet",
      description: "Bring your own wallet or use the Pexly Wallet to store, swap and spend after you buy.",
      icon: Wallet
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
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Buy Crypto Instantly | Pexly</title>
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-[#002B24] text-white overflow-hidden py-24 px-4 min-h-[700px] flex items-center">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">Buy crypto instantly.</h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-lg leading-relaxed">
                Choose from 16+ cryptocurrencies. Download the app to store with self-custody.
              </p>
            </div>

            {/* Buy Widget Card */}
            <div className="bg-white rounded-[32px] p-8 text-gray-900 shadow-2xl max-w-lg mx-auto w-full">
              <div className="flex justify-center mb-8">
                <div className="bg-gray-100 p-1 rounded-full flex w-full max-w-[200px]">
                  <button 
                    onClick={() => setMode("buy")}
                    className={`flex-1 py-2 rounded-full font-bold transition-all ${mode === "buy" ? "bg-[#002B24] text-white shadow-lg" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Buy
                  </button>
                  <button 
                    onClick={() => setMode("sell")}
                    className={`flex-1 py-2 rounded-full font-bold transition-all ${mode === "sell" ? "bg-[#002B24] text-white shadow-lg" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    Sell
                  </button>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-center mb-8">Buy Cryptocurrency</h2>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Amount</label>
                  <div className="relative border rounded-2xl p-4 flex items-center gap-4 hover:border-[#002B24] transition-colors focus-within:border-[#002B24] focus-within:ring-1 focus-within:ring-[#002B24]">
                    <FiatCurrencySelector value={fiat} onChange={setFiat} />
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-right text-2xl font-bold w-full outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Buying</label>
                  <CryptoCurrencySelector value={crypto} onChange={setCrypto} />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Payment Method</label>
                  <Button variant="outline" className="w-full h-14 justify-between rounded-2xl text-lg px-4 border-gray-200 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">Select a payment method</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Button>
                </div>

                <Button className="w-full h-14 bg-[#002B24] hover:bg-[#003d33] text-white rounded-2xl text-lg font-bold shadow-lg mt-4 disabled:opacity-50" disabled={!amount}>
                  View Offers
                </Button>

                <p className="text-center text-sm text-gray-500 mt-6">
                  Don't have a wallet? <Link href="/wallet" className="text-[#002B24] font-bold hover:underline">Get the Pexly app</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-white border-b">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">How to buy crypto online or with the Pexly App</h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Buy cryptocurrency with a credit card, debit card, bank account, Apple Pay, Google Pay, Venmo, PayPal, and Cash App from Pexly's trusted partners. Delivered quickly to any wallet, no hidden fees or third-party custody.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { 
                step: 1, 
                title: "Choose your crypto", 
                desc: "Select from the top cryptocurrencies. Enter the amount of crypto you'd like to buy.",
                img: "/icons/step1.svg"
              },
              { 
                step: 2, 
                title: "Send to any wallet", 
                desc: "Enter the address where you'd like to receive your Bitcoin. Need a wallet? Store with Pexly's non-custodial wallet.",
                img: "/icons/step2.svg"
              },
              { 
                step: 3, 
                title: "Pay and receive your crypto", 
                desc: "Choose the best rate and pay with credit card, debit card, bank account, Apple Pay, Google Pay, Venmo, PayPal, and Cash App.",
                img: "/icons/step3.svg"
              }
            ].map((item) => (
              <div key={item.step} className="text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#002B24] flex items-center justify-center text-xl font-bold mb-8">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-gray-600 text-lg mb-8 h-24">{item.desc}</p>
                <div className="bg-gray-50 rounded-3xl p-6 w-full aspect-[4/3] flex items-center justify-center overflow-hidden shadow-sm">
                  <img src={item.img} alt={item.title} className="max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Assets */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-16">
            <h2 className="text-4xl font-bold mb-4">Supported Assets</h2>
            <p className="text-xl text-gray-600">Buy the most popular cryptocurrencies including Bitcoin, Ethereum and more.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportedAssets.map((asset) => (
              <Card key={asset.symbol} className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={cryptoIconUrls[asset.symbol as keyof typeof cryptoIconUrls] || `/logos/${asset.name.toLowerCase().replace(" ", "-")}-logo.svg`} 
                      alt={asset.name} 
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h3 className="font-bold text-lg">{asset.name}</h3>
                      <p className="text-gray-900 font-bold">{asset.price}</p>
                    </div>
                  </div>
                  <Link href={`/buy-crypto?coin=${asset.symbol}`} className="text-[#002B24] font-bold flex items-center gap-1 hover:underline">
                    Buy {asset.name} ({asset.symbol}) <ChevronRight className="w-4 h-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-20">Benefits of buying cryptocurrency through Pexly</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, i) => (
              <div key={i} className="p-10 rounded-3xl bg-blue-50/50 hover:bg-blue-50 transition-colors group">
                <div className="w-14 h-14 rounded-2xl bg-[#002B24] flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{benefit.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Post-Buy Actions */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative rounded-[40px] overflow-hidden shadow-2xl bg-white p-4">
              <img src="/assets/IMG_2657.png" alt="Pexly Wallet App" className="w-full h-auto rounded-[32px]" />
            </div>
            <div className="space-y-12">
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">What can I do after I buy cryptocurrency?</h2>
              {[
                { 
                  title: "Hold", 
                  desc: "Buy your favorite coins and add to your growing portfolio.",
                  icon: Wallet
                },
                { 
                  title: "Swap", 
                  desc: "Exchange one asset for another without leaving the app. Swap Bitcoin, Ethereum, Dogecoin and all of your favorite coins.",
                  icon: RefreshCw
                },
                { 
                  title: "Spend", 
                  desc: "Pay bills, shop with top brands, buy gift cards, or use Pexly Pay to spend without selling, all in the Pexly Wallet.",
                  icon: Smartphone
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-8 items-start group">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-[#002B24] group-hover:bg-[#002B24] group-hover:text-white transition-all flex-shrink-0 shadow-md">
                    <item.icon className="w-8 h-8" />
                  </div>
                  <div className="pt-2">
                    <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">Cryptocurrency frequently asked questions</h2>
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border rounded-2xl px-8 py-2 border-gray-100 bg-white hover:border-gray-200 transition-colors">
                  <AccordionTrigger className="text-xl font-bold hover:no-underline text-left py-6">
                    <span className="flex items-center gap-6">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-data-[state=open]:bg-[#002B24] group-data-[state=open]:text-white transition-colors">
                        <Plus className="w-5 h-5 group-data-[state=open]:hidden" />
                        <Minus className="w-5 h-5 hidden group-data-[state=open]:block" />
                      </div>
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-lg leading-relaxed pt-2 pb-8 pl-14 pr-8">
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
