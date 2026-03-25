import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export function NotificationsSection() {
  const [tradeUpdates, setTradeUpdates] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [newOffers, setNewOffers] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Trade Updates</p>
              <p className="text-sm text-muted-foreground">Notifications about your trades</p>
            </div>
            <Switch checked={tradeUpdates} onCheckedChange={setTradeUpdates} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Price Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified of price changes</p>
            </div>
            <Switch checked={priceAlerts} onCheckedChange={setPriceAlerts} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New Offers</p>
              <p className="text-sm text-muted-foreground">Notifications about new trading offers</p>
            </div>
            <Switch checked={newOffers} onCheckedChange={setNewOffers} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Marketing Emails</p>
              <p className="text-sm text-muted-foreground">Promotional content and updates</p>
            </div>
            <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
