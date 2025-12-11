import { PexlyFooter } from "@/components/pexly-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Bitcoin } from "lucide-react";
import { useSchema, feesPageSchema } from "@/hooks/use-schema";

export function Fees() {
  useSchema(feesPageSchema, "fees-page-schema");
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Pexly Fees</h1>
          </div>
          <p className="text-muted-foreground">
            Transparent pricing for all our services
          </p>
        </div>

        {/* Send-outs Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Send-outs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* BTC */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Bitcoin className="h-5 w-5 text-orange-500" />
                BTC
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  To an external wallet (Dynamic network fee + Pexly wallet fee)
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Send amount</th>
                        <th className="text-left py-2">Fee</th>
                        <th className="text-left py-2">Lightning</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">$0 - $49.99</td>
                        <td className="py-2">$4.50</td>
                        <td className="py-2">1.5%</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">$50 - $99.99</td>
                        <td className="py-2">9%</td>
                        <td className="py-2">1.5%</td>
                      </tr>
                      <tr>
                        <td className="py-2">$100+</td>
                        <td className="py-2">$18</td>
                        <td className="py-2">1.5%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  To an internal wallet ($1,000 fee-free send-out limit, resets every 30 days)
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Send amount</th>
                        <th className="text-left py-2">Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">$0 - $50</td>
                        <td className="py-2">$1.50</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">$50 - $100</td>
                        <td className="py-2">3%</td>
                      </tr>
                      <tr>
                        <td className="py-2">$100+</td>
                        <td className="py-2">$6</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ETH, USDT, USDC, SOL, TON, XMR */}
            <div>
              <h3 className="text-lg font-semibold mb-3">
                ETH • USDT • USDC • SOL • TON • XMR
              </h3>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  To an external wallet (Dynamic network fee + Pexly wallet fee)
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Send amount</th>
                        <th className="text-left py-2">Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">$0 - $49.99</td>
                        <td className="py-2">$0.50</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">$50 - $99.99</td>
                        <td className="py-2">1%</td>
                      </tr>
                      <tr>
                        <td className="py-2">$100+</td>
                        <td className="py-2">$2</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  To an internal wallet ($1,000 fee-free send-out limit, resets every 30 days)
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Send amount</th>
                        <th className="text-left py-2">Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">$0 - $50</td>
                        <td className="py-2">$0.50</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">$50 - $100</td>
                        <td className="py-2">1%</td>
                      </tr>
                      <tr>
                        <td className="py-2">$100+</td>
                        <td className="py-2">$2</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marketplace Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Marketplace - All crypto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sell */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Sell</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Payment</th>
                      <th className="text-left py-2">Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Credit/Debit cards</td>
                      <td className="py-2">1%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Digital currencies</td>
                      <td className="py-2">1%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Online wallets</td>
                      <td className="py-2">1%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Cash</td>
                      <td className="py-2">1%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Mobile money</td>
                      <td className="py-2">0.1% - 1%</td>
                    </tr>
                    <tr>
                      <td className="py-2">Gift cards</td>
                      <td className="py-2">5%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Buy */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Buy</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Payment</th>
                      <th className="text-left py-2">Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Credit/Debit cards</td>
                      <td className="py-2">No fee</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Digital currencies</td>
                      <td className="py-2">No fee</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Online wallets</td>
                      <td className="py-2">No fee</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Cash</td>
                      <td className="py-2">No fee</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Mobile money</td>
                      <td className="py-2">No fee</td>
                    </tr>
                    <tr>
                      <td className="py-2">Gift cards</td>
                      <td className="py-2">2.2%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bank Transfer */}
            <div>
              <h3 className="text-lg font-semibold mb-3">BTC • ETH • SOL • TON • XMR</h3>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Payment</th>
                      <th className="text-left py-2">Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Bank transfer (Sell)</td>
                      <td className="py-2">0.75%</td>
                    </tr>
                    <tr>
                      <td className="py-2">Bank transfer (Buy)</td>
                      <td className="py-2">No fee</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-semibold mb-3">USDT • USDC</h3>
              <p className="text-sm text-muted-foreground mb-2">For GHS & NGN trades</p>
              <p className="text-sm text-muted-foreground mb-2">Sell (Fee is based on your previous month's trading volume)</p>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Payment</th>
                      <th className="text-left py-2">Trade volume</th>
                      <th className="text-left py-2">Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Bank transfer / Mobile money</td>
                      <td className="py-2">&lt;$20,000</td>
                      <td className="py-2">0.15%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2"></td>
                      <td className="py-2">&gt;$20,000</td>
                      <td className="py-2">0.1%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Bank transfer</td>
                      <td className="py-2">&lt;$50,000</td>
                      <td className="py-2">1%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2"></td>
                      <td className="py-2">$50,000 - $500,000</td>
                      <td className="py-2">0.75%</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2"></td>
                      <td className="py-2">$500,000 - $1,000,000</td>
                      <td className="py-2">0.5%</td>
                    </tr>
                    <tr>
                      <td className="py-2"></td>
                      <td className="py-2">&gt;$1,000,000</td>
                      <td className="py-2">0.25%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Payment</th>
                      <th className="text-left py-2">Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2">Bank transfer (Buy)</td>
                      <td className="py-2">No fee</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Swap Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Swap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">XMR/USDT</td>
                    <td className="py-2">1% + Provider fee</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">BTC/USDT</td>
                    <td className="py-2">0.09%-0.15% + Provider fee</td>
                  </tr>
                  <tr>
                    <td className="py-2">All other swap pairs</td>
                    <td className="py-2">0.15% + Provider fee</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Spot Exchange Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Spot exchange
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Maker (limit orders)</td>
                    <td className="py-2">0.15% - 0.19%</td>
                  </tr>
                  <tr>
                    <td className="py-2">Taker</td>
                    <td className="py-2">0.16 - 0.2%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Crypto to Fiat Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Crypto to Fiat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Crypto to bank</td>
                    <td className="py-2">2.5%</td>
                  </tr>
                  <tr>
                    <td className="py-2">Crypto to mobile money</td>
                    <td className="py-2">2.5-3.5%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Visa Card Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Visa card
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">Card activation/termination</td>
                    <td className="py-2">1 USDT</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Top-ups &lt;$100</td>
                    <td className="py-2">2 USDT</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Top-ups &gt;$100</td>
                    <td className="py-2">1.5% (no less than 2 USDT)</td>
                  </tr>
                  <tr>
                    <td className="py-2">Non-US transactions</td>
                    <td className="py-2">3% + $0.50</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      <PexlyFooter />
    </div>
  );
}
