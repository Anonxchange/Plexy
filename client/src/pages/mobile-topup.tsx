import { Card, CardContent } from "@/components/ui/card";
import { BitrefillWidget } from "@/components/bitrefill-widget";

export default function MobileTopup() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Mobile Topuo Instantly
          </h1>
          <p className="text-lg text-muted-foreground">
            Purchase USDT with 500+ payment methods from anywhere in the world
          </p>
        </div>

        {/* Bitrefill Widget */}
        <div className="mb-8">
          <BitrefillWidget />
        </div>

        {/* Info Card */}
        <Card className="bg-muted/30 border-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-3">Why Bitrefill?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Instant purchases - Get USDT in minutes</li>
              <li>✓ Multiple payment methods - Pay your way</li>
              <li>✓ Global coverage - Available in 140+ countries</li>
              <li>✓ Secure - Industry-leading security standards</li>
              <li>✓ Competitive rates - Best prices available</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
