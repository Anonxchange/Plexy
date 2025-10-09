import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import heroImage from "@assets/generated_images/Crypto_P2P_trading_hero_641f4218.png";

export function HeroSection() {
  const [tradeType, setTradeType] = useState("buy");
  const [crypto, setCrypto] = useState("BTC");
  const [currency, setCurrency] = useState("USD");
  const [paymentMethod, setPaymentMethod] = useState("all");

  const btcPrice = 121626.05;

  const handleFindOffers = () => {
    console.log("Finding offers:", { tradeType, crypto, currency, paymentMethod });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-20 lg:py-32 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="inline-block">
                <span className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  Trusted by 14M+ users worldwide
                </span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold text-foreground leading-tight tracking-tight">
                The people-powered way to move money
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed">
                Trade cryptocurrency with 500+ payment methods across 140 countries. Fast, secure, and reliable P2P marketplace.
              </p>
            </div>

            <div className="bg-card border border-card-border rounded-3xl p-8 space-y-6 shadow-2xl backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">I want to</label>
                  <Select value={tradeType} onValueChange={setTradeType}>
                    <SelectTrigger className="h-12" data-testid="select-trade-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Cryptocurrency</label>
                  <Select value={crypto} onValueChange={setCrypto}>
                    <SelectTrigger className="h-12" data-testid="select-crypto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                      <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                      <SelectItem value="USDT">Tether (USDT)</SelectItem>
                      <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 text-center border border-border/50">
                <div className="text-sm text-muted-foreground mb-1">Current Market Price</div>
                <div className="text-2xl font-bold tabular-nums text-foreground">
                  1 {crypto} ≈ ${btcPrice.toLocaleString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Currency</label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-12" data-testid="select-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">🇺🇸 USD</SelectItem>
                      <SelectItem value="EUR">🇪🇺 EUR</SelectItem>
                      <SelectItem value="GBP">🇬🇧 GBP</SelectItem>
                      <SelectItem value="NGN">🇳🇬 NGN</SelectItem>
                      <SelectItem value="INR">🇮🇳 INR</SelectItem>
                      <SelectItem value="CNY">🇨🇳 CNY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-foreground">Payment Method</label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-12" data-testid="select-payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      <SelectItem value="all">All Methods (500+)</SelectItem>

                      {/* E-Wallets & Digital Payments */}
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="venmo">Venmo</SelectItem>
                      <SelectItem value="cashapp">Cash App</SelectItem>
                      <SelectItem value="zelle">Zelle</SelectItem>
                      <SelectItem value="applepay">Apple Pay</SelectItem>
                      <SelectItem value="googlepay">Google Pay</SelectItem>
                      <SelectItem value="samsungpay">Samsung Pay</SelectItem>
                      <SelectItem value="wise">Wise</SelectItem>
                      <SelectItem value="revolut">Revolut</SelectItem>
                      <SelectItem value="skrill">Skrill</SelectItem>
                      <SelectItem value="neteller">Neteller</SelectItem>
                      <SelectItem value="perfectmoney">Perfect Money</SelectItem>
                      <SelectItem value="webmoney">WebMoney</SelectItem>
                      <SelectItem value="payeer">Payeer</SelectItem>
                      <SelectItem value="advcash">AdvCash</SelectItem>
                      <SelectItem value="ecopayz">EcoPayz</SelectItem>
                      <SelectItem value="payoneer">Payoneer</SelectItem>
                      <SelectItem value="paysera">Paysera</SelectItem>

                      {/* Bank Transfers */}
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="ach">ACH</SelectItem>
                      <SelectItem value="sepa">SEPA</SelectItem>
                      <SelectItem value="wire">Wire Transfer</SelectItem>
                      <SelectItem value="swift">SWIFT</SelectItem>
                      <SelectItem value="bacs">BACS</SelectItem>
                      <SelectItem value="chaps">CHAPS</SelectItem>
                      <SelectItem value="fps">FPS</SelectItem>
                      <SelectItem value="interac">Interac e-Transfer</SelectItem>
                      <SelectItem value="target2">TARGET2</SelectItem>
                      <SelectItem value="rtgs">RTGS</SelectItem>

                      {/* Cards */}
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="visa">Visa</SelectItem>
                      <SelectItem value="mastercard">Mastercard</SelectItem>
                      <SelectItem value="amex">American Express</SelectItem>
                      <SelectItem value="discover">Discover</SelectItem>
                      <SelectItem value="maestro">Maestro</SelectItem>
                      <SelectItem value="unionpay">UnionPay</SelectItem>
                      <SelectItem value="jcb">JCB</SelectItem>
                      <SelectItem value="dinersclub">Diners Club</SelectItem>
                      <SelectItem value="rupay">RuPay</SelectItem>
                      <SelectItem value="elo">Elo</SelectItem>

                      {/* Mobile Money Africa */}
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                      <SelectItem value="orange">Orange Money</SelectItem>
                      <SelectItem value="airtel">Airtel Money</SelectItem>
                      <SelectItem value="tigopesa">Tigo Pesa</SelectItem>
                      <SelectItem value="ecocash">Ecocash</SelectItem>
                      <SelectItem value="wave">Wave</SelectItem>
                      <SelectItem value="vodafone">Vodafone Cash</SelectItem>
                      <SelectItem value="moov">Moov Money</SelectItem>

                      {/* Mobile Money Asia */}
                      <SelectItem value="gcash">GCash</SelectItem>
                      <SelectItem value="paymaya">PayMaya</SelectItem>
                      <SelectItem value="bkash">bKash</SelectItem>
                      <SelectItem value="paytm">Paytm</SelectItem>
                      <SelectItem value="phonepe">PhonePe</SelectItem>
                      <SelectItem value="alipay">Alipay</SelectItem>
                      <SelectItem value="wechat">WeChat Pay</SelectItem>
                      <SelectItem value="kakaopay">KakaoPay</SelectItem>
                      <SelectItem value="linepay">LINE Pay</SelectItem>
                      <SelectItem value="grabpay">GrabPay</SelectItem>
                      <SelectItem value="boost">Boost</SelectItem>
                      <SelectItem value="tng">Touch 'n Go</SelectItem>
                      <SelectItem value="shopeepay">ShopeePay</SelectItem>
                      <SelectItem value="ovo">OVO</SelectItem>
                      <SelectItem value="dana">Dana</SelectItem>
                      <SelectItem value="gopay">GoPay</SelectItem>
                      <SelectItem value="truemoney">TrueMoney</SelectItem>
                      <SelectItem value="paypay">PayPay</SelectItem>
                      <SelectItem value="rakuten">Rakuten Pay</SelectItem>
                      <SelectItem value="toss">Toss</SelectItem>
                      <SelectItem value="naver">Naver Pay</SelectItem>

                      {/* Latin America */}
                      <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                      <SelectItem value="picpay">PicPay</SelectItem>
                      <SelectItem value="nequi">Nequi</SelectItem>
                      <SelectItem value="yape">Yape</SelectItem>
                      <SelectItem value="pix">Pix</SelectItem>
                      <SelectItem value="oxxo">OXXO</SelectItem>
                      <SelectItem value="boleto">Boleto Bancário</SelectItem>
                      <SelectItem value="rapipago">Rapipago</SelectItem>
                      <SelectItem value="nubank">Nubank</SelectItem>
                      <SelectItem value="c6bank">C6 Bank</SelectItem>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="pagseguro">PagSeguro</SelectItem>

                      {/* Gift Cards */}
                      <SelectItem value="amazon">Amazon Gift Card</SelectItem>
                      <SelectItem value="apple">Apple Gift Card</SelectItem>
                      <SelectItem value="googleplay">Google Play</SelectItem>
                      <SelectItem value="steam">Steam</SelectItem>
                      <SelectItem value="itunes">iTunes</SelectItem>
                      <SelectItem value="ebay">eBay</SelectItem>
                      <SelectItem value="xbox">Xbox</SelectItem>
                      <SelectItem value="playstation">PlayStation</SelectItem>
                      <SelectItem value="visagift">Visa Gift Card</SelectItem>
                      <SelectItem value="netflix">Netflix</SelectItem>
                      <SelectItem value="spotify">Spotify</SelectItem>
                      <SelectItem value="nike">Nike</SelectItem>
                      <SelectItem value="adidas">Adidas</SelectItem>
                      <SelectItem value="starbucks">Starbucks</SelectItem>
                      <SelectItem value="mcdonalds">McDonald's</SelectItem>
                      <SelectItem value="bestbuy">Best Buy</SelectItem>
                      <SelectItem value="homedepot">Home Depot</SelectItem>
                      <SelectItem value="target">Target</SelectItem>
                      <SelectItem value="walmart">Walmart</SelectItem>

                      {/* Money Transfer */}
                      <SelectItem value="westernunion">Western Union</SelectItem>
                      <SelectItem value="moneygram">MoneyGram</SelectItem>
                      <SelectItem value="remitly">Remitly</SelectItem>
                      <SelectItem value="worldremit">WorldRemit</SelectItem>
                      <SelectItem value="ria">Ria</SelectItem>
                      <SelectItem value="xoom">Xoom</SelectItem>
                      <SelectItem value="azimo">Azimo</SelectItem>
                      <SelectItem value="transfergo">TransferGo</SelectItem>
                      <SelectItem value="xe">Xe</SelectItem>
                      <SelectItem value="instarem">InstaReM</SelectItem>

                      {/* Banking Apps */}
                      <SelectItem value="chime">Chime</SelectItem>
                      <SelectItem value="varo">Varo</SelectItem>
                      <SelectItem value="current">Current</SelectItem>
                      <SelectItem value="sofi">SoFi</SelectItem>
                      <SelectItem value="ally">Ally</SelectItem>
                      <SelectItem value="n26">N26</SelectItem>
                      <SelectItem value="monese">Monese</SelectItem>
                      <SelectItem value="starling">Starling</SelectItem>
                      <SelectItem value="bunq">Bunq</SelectItem>
                      <SelectItem value="marcus">Marcus</SelectItem>
                      <SelectItem value="capitalone">Capital One</SelectItem>
                      <SelectItem value="chase">Chase</SelectItem>
                      <SelectItem value="wellsfargo">Wells Fargo</SelectItem>
                      <SelectItem value="bankofamerica">Bank of America</SelectItem>
                      <SelectItem value="citi">Citibank</SelectItem>
                      <SelectItem value="hsbc">HSBC</SelectItem>
                      <SelectItem value="barclays">Barclays</SelectItem>

                      {/* BNPL */}
                      <SelectItem value="klarna">Klarna</SelectItem>
                      <SelectItem value="afterpay">Afterpay</SelectItem>
                      <SelectItem value="affirm">Affirm</SelectItem>
                      <SelectItem value="sezzle">Sezzle</SelectItem>
                      <SelectItem value="quadpay">Quadpay</SelectItem>
                      <SelectItem value="zip">Zip</SelectItem>
                      <SelectItem value="clearpay">Clearpay</SelectItem>
                      <SelectItem value="laybuy">Laybuy</SelectItem>
                      <SelectItem value="splitit">Splitit</SelectItem>
                      <SelectItem value="humm">Humm</SelectItem>

                      {/* Investment & Trading */}
                      <SelectItem value="robinhood">Robinhood</SelectItem>
                      <SelectItem value="webull">Webull</SelectItem>
                      <SelectItem value="etrade">E*TRADE</SelectItem>
                      <SelectItem value="tdameritrade">TD Ameritrade</SelectItem>
                      <SelectItem value="fidelity">Fidelity</SelectItem>
                      <SelectItem value="schwab">Schwab</SelectItem>
                      <SelectItem value="interactive">Interactive Brokers</SelectItem>
                      <SelectItem value="m1finance">M1 Finance</SelectItem>
                      <SelectItem value="acorns">Acorns</SelectItem>
                      <SelectItem value="stash">Stash</SelectItem>

                      {/* Business Solutions */}
                      <SelectItem value="quickbooks">QuickBooks Payments</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="billcom">Bill.com</SelectItem>
                      <SelectItem value="melio">Melio</SelectItem>
                      <SelectItem value="xero">Xero</SelectItem>
                      <SelectItem value="freshbooks">FreshBooks</SelectItem>
                      <SelectItem value="zoho">Zoho Books</SelectItem>
                      <SelectItem value="sage">Sage</SelectItem>
                      <SelectItem value="tipalti">Tipalti</SelectItem>
                      <SelectItem value="avidxchange">AvidXchange</SelectItem>

                      {/* Crypto */}
                      <SelectItem value="bitcoin">Bitcoin</SelectItem>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      <SelectItem value="usdt">USDT</SelectItem>
                      <SelectItem value="usdc">USDC</SelectItem>
                      <SelectItem value="bnb">BNB</SelectItem>
                      <SelectItem value="xrp">XRP</SelectItem>
                      <SelectItem value="litecoin">Litecoin</SelectItem>
                      <SelectItem value="dogecoin">Dogecoin</SelectItem>
                      <SelectItem value="cardano">Cardano</SelectItem>
                      <SelectItem value="solana">Solana</SelectItem>

                      {/* Cash Options */}
                      <SelectItem value="cashdeposit">Cash Deposit</SelectItem>
                      <SelectItem value="cashinperson">Cash in Person</SelectItem>
                      <SelectItem value="atm">ATM Cash</SelectItem>
                      <SelectItem value="cashpickup">Cash Pickup</SelectItem>

                      {/* Regional - Europe */}
                      <SelectItem value="ideal">iDEAL</SelectItem>
                      <SelectItem value="sofort">Sofort</SelectItem>
                      <SelectItem value="giropay">Giropay</SelectItem>
                      <SelectItem value="bancontact">Bancontact</SelectItem>
                      <SelectItem value="eps">EPS</SelectItem>
                      <SelectItem value="przelewy24">Przelewy24</SelectItem>
                      <SelectItem value="multibanco">Multibanco</SelectItem>
                      <SelectItem value="trustly">Trustly</SelectItem>
                      <SelectItem value="swish">Swish</SelectItem>
                      <SelectItem value="vipps">Vipps</SelectItem>
                      <SelectItem value="mobilepay">MobilePay</SelectItem>
                      <SelectItem value="blik">BLIK</SelectItem>
                      <SelectItem value="mybank">MyBank</SelectItem>
                      <SelectItem value="satispay">Satispay</SelectItem>
                      <SelectItem value="bizum">Bizum</SelectItem>
                      <SelectItem value="mbway">MB WAY</SelectItem>
                      <SelectItem value="twint">Twint</SelectItem>

                      {/* Middle East */}
                      <SelectItem value="fawry">Fawry</SelectItem>
                      <SelectItem value="stcpay">STC Pay</SelectItem>
                      <SelectItem value="sadad">Sadad</SelectItem>
                      <SelectItem value="mada">Mada</SelectItem>
                      <SelectItem value="qnb">QNB</SelectItem>
                      <SelectItem value="emiratesnbd">Emirates NBD</SelectItem>
                      <SelectItem value="fab">FAB</SelectItem>
                      <SelectItem value="adcb">ADCB</SelectItem>

                      {/* India Specific */}
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="imps">IMPS</SelectItem>
                      <SelectItem value="neft">NEFT</SelectItem>
                      <SelectItem value="paytmwallet">Paytm Wallet</SelectItem>
                      <SelectItem value="googlepayindia">Google Pay India</SelectItem>
                      <SelectItem value="amazonpayindia">Amazon Pay India</SelectItem>

                      {/* Russia & CIS */}
                      <SelectItem value="yandex">Yandex.Money</SelectItem>
                      <SelectItem value="qiwi">QIWI</SelectItem>
                      <SelectItem value="sberbank">Sberbank</SelectItem>
                      <SelectItem value="tinkoff">Tinkoff</SelectItem>

                      {/* China */}
                      <SelectItem value="jdpay">JD Pay</SelectItem>
                      <SelectItem value="meituan">Meituan Pay</SelectItem>

                      {/* Prepaid & Other */}
                      <SelectItem value="vanilla">Vanilla Visa</SelectItem>
                      <SelectItem value="greendot">Greendot</SelectItem>
                      <SelectItem value="bluebird">Bluebird</SelectItem>
                      <SelectItem value="netspend">NetSpend</SelectItem>
                      <SelectItem value="serve">Serve</SelectItem>
                      <SelectItem value="mango">Mango</SelectItem>

                      {/* Delivery Services */}
                      <SelectItem value="ubercash">Uber Cash</SelectItem>
                      <SelectItem value="lyft">Lyft Credits</SelectItem>
                      <SelectItem value="doordash">DoorDash</SelectItem>
                      <SelectItem value="grubhub">Grubhub</SelectItem>
                      <SelectItem value="postmates">Postmates</SelectItem>
                      <SelectItem value="deliveroo">Deliveroo</SelectItem>
                      <SelectItem value="justeat">Just Eat</SelectItem>
                      <SelectItem value="bolt">Bolt</SelectItem>
                      <SelectItem value="rappi">Rappi</SelectItem>
                      <SelectItem value="glovo">Glovo</SelectItem>

                      {/* Point of Sale */}
                      <SelectItem value="paypalhere">PayPal Here</SelectItem>
                      <SelectItem value="sumup">SumUp</SelectItem>
                      <SelectItem value="izettle">iZettle</SelectItem>
                      <SelectItem value="clover">Clover</SelectItem>
                      <SelectItem value="toast">Toast</SelectItem>
                      <SelectItem value="shopifypos">Shopify POS</SelectItem>
                      <SelectItem value="lightspeed">Lightspeed</SelectItem>
                      <SelectItem value="vend">Vend</SelectItem>

                      {/* Neobanks */}
                      <SelectItem value="mercury">Mercury</SelectItem>
                      <SelectItem value="brex">Brex</SelectItem>
                      <SelectItem value="ramp">Ramp</SelectItem>
                      <SelectItem value="vivid">Vivid</SelectItem>
                      <SelectItem value="lydia">Lydia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                className="w-full h-14 text-lg font-semibold shadow-lg" 
                size="lg"
                onClick={handleFindOffers}
                data-testid="button-find-offers"
              >
                Find offers
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </div>
          </div>

          <div className="relative lg:block hidden">
            <img
              src={heroImage}
              alt="Cryptocurrency P2P Trading"
              className="w-full h-auto rounded-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}