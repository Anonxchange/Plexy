import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { 
  Search, 
  ChevronDown, 
  ChevronRight,
  ArrowRight, 
  Zap, 
  Shield, 
  CreditCard, 
  Wallet, 
  RefreshCw, 
  ArrowUpRight,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  Smartphone,
  History,
  TrendingUp,
  MessageCircle,
  HelpCircle
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

// Asset imports
import heroStepImg from "@assets/Screenshot_2026-02-22_at_05.28.37_1771767052240.png";
import appPreviewImg from "@assets/Screenshot_2026-02-22_at_05.28.58_1771767052240.png";

const BuyCryptoPage = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [fiat, setFiat] = useState("USD");
  const [crypto, setCrypto] = useState("BTC");
  const [paymentMethod, setPaymentMethod] = useState("");

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
      answer: "Pexly offers a secure, user-friendly platform with competitive rates, zero hidden fees, and multiple payment options. Our self-custody approach ensures you always remain in control of your assets."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Buy Crypto Instantly | Pexly</title>
      </Helmet>

      {/* Hero Section */}
      <section className="bg-[#002B24] text-white py-16 md:py-24 px-4 overflow-hidden relative">
        <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="z-10 animate-in fade-in slide-in-from-left-8 duration-700">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Buy crypto instantly.
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-md leading-relaxed">
              Choose from 16+ cryptocurrencies. Download the app to store with self-custody.
            </p>
          </div>

          <div className="z-10 animate-in fade-in slide-in-from-right-8 duration-700">
            <Card className="w-full max-w-md mx-auto border-none shadow-2xl overflow-hidden rounded-3xl bg-white">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Buy Cryptocurrency</h2>
                
                <div className="flex bg-gray-100 p-1 rounded-full mb-8">
                  <button 
                    onClick={() => setMode("buy")}
                    className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${mode === 'buy' ? 'bg-[#002B24] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Buy
                  </button>
                  <button 
                    onClick={() => setMode("sell")}
                    className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${mode === 'sell' ? 'bg-[#002B24] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Sell
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Amount</label>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus-within:border-[#002B24] transition-colors">
                      <div className="w-24">
                        <FiatCurrencySelector value={fiat} onChange={setFiat} />
                      </div>
                      <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 bg-transparent border-none text-right font-bold text-xl text-gray-900 focus:outline-none placeholder:text-gray-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">{mode === 'buy' ? 'Buying' : 'Selling'}</label>
                    <CryptoCurrencySelector value={crypto} onChange={setCrypto} />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Payment Method</label>
                    <Button 
                      variant="outline" 
                      className="w-full justify-between h-14 rounded-2xl border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
                      onClick={() => {}}
                    >
                      <span className="flex items-center gap-2">
                        {paymentMethod ? paymentMethod : "Select a payment method"}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Button>
                  </div>

                  <Button className="w-full h-14 rounded-2xl bg-gray-100 text-gray-400 font-bold text-lg hover:bg-gray-200 transition-colors disabled:cursor-not-allowed">
                    View Offers
                  </Button>
                </div>
              </CardContent>
            </Card>
            <div className="text-center mt-6">
              <a href="#" className="text-white/80 hover:text-white text-sm font-medium underline underline-offset-4">
                Don't have a wallet? Get the Pexly app
              </a>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Steps Section */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            How to buy crypto online or with the Pexly App
          </h2>
          <p className="text-lg text-gray-600 mb-16 max-w-3xl mx-auto leading-relaxed">
            Buy cryptocurrency with a credit card, debit card, bank account, Apple Pay, Google Pay, Venmo, PayPal, and Cash App from Pexly's trusted partners. Delivered quickly to any wallet, no hidden fees or third-party custody. Buy crypto online or in the Pexly app.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                step: 1, 
                title: "Choose your crypto", 
                desc: "Select from the top cryptocurrencies. Enter the amount of crypto you'd like to buy.",
                img: heroStepImg
              },
              { 
                step: 2, 
                title: "Send to any wallet", 
                desc: "Enter the address where you'd like to receive your Bitcoin. Need a wallet? Store with Pexly's non-custodial wallet.",
                img: heroStepImg 
              },
              { 
                step: 3, 
                title: "Pay and receive your crypto", 
                desc: "Choose the best rate and pay with credit card, debit card, bank account, Apple Pay, Google Pay, Venmo, PayPal, and Cash App.",
                img: heroStepImg
              },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-[#002B24] flex items-center justify-center text-[#002B24] font-bold text-xl mb-6">
                  {s.step}
                </div>
                <h3 className="text-xl font-bold mb-4">{s.title}</h3>
                <p className="text-gray-600 mb-8 px-4 leading-relaxed">{s.desc}</p>
                <div className="w-full bg-white rounded-3xl shadow-lg p-2 overflow-hidden border border-gray-100">
                  <img src={s.img} alt={s.title} className="w-full h-auto rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Assets Section */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-5xl border border-gray-100 rounded-[40px] p-8 md:p-16">
          <h2 className="text-3xl font-bold mb-4">Supported Assets</h2>
          <p className="text-gray-500 mb-12 font-medium">Buy the most popular cryptocurrencies including Bitcoin, Ethereum and more.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
            {supportedAssets.map((asset) => (
              <div key={asset.symbol} className="flex items-start gap-4 group cursor-pointer">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-50 p-0.5">
                  <img src={cryptoIconUrls[asset.symbol as keyof typeof cryptoIconUrls]} alt={asset.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{asset.name}</h4>
                  <p className="text-lg font-bold mb-1">{asset.price}</p>
                  <a href="#" className="text-primary text-sm font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Buy {asset.name} ({asset.symbol}) <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center md:text-left">
            Benefits of buying cryptocurrency through Pexly
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, i) => (
              <div key={i} className="bg-gray-50 p-10 rounded-[40px] flex flex-col items-start gap-6 hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 rounded-full bg-[#002B24] flex items-center justify-center text-white">
                  <benefit.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-4">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-lg">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Post-Purchase Section */}
      <section className="py-24 px-4 bg-white overflow-hidden">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center gap-16">
          <div className="w-full md:w-1/2 animate-in fade-in slide-in-from-left-12 duration-1000">
            <img src={appPreviewImg} alt="App Preview" className="w-full h-auto drop-shadow-2xl rounded-[40px]" />
          </div>
          <div className="w-full md:w-1/2 space-y-12">
            <h2 className="text-3xl md:text-5xl font-bold leading-tight">What can I do after I buy cryptocurrency?</h2>
            
            {[
              { 
                title: "Hold", 
                desc: "Buy your favorite coins and add to your growing portfolio.",
                icon: Shield
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
              <div key={i} className="flex gap-6 items-start group">
                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center text-[#002B24] group-hover:bg-[#002B24] group-hover:text-white transition-all flex-shrink-0 shadow-sm">
                  <item.icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">Cryptocurrency frequently asked questions</h2>
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border rounded-2xl px-6 py-2 border-gray-100">
                  <AccordionTrigger className="text-lg font-bold hover:no-underline text-left">
                    <span className="flex items-center gap-4">
                      <Plus className="w-5 h-5 text-primary shrink-0 group-data-[state=open]:hidden" />
                      <Minus className="w-5 h-5 text-primary shrink-0 hidden group-data-[state=open]:block" />
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 text-lg leading-relaxed pt-4 pb-6 px-9">
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
