
import { Card, CardContent } from "@/components/ui/card";

interface LimitSection {
  title: string;
  limit: string;
  used: string;
  remaining: string;
}

export function PaymentLimits() {
  const singlePaymentLimit = "15,000.00 USD";

  const limits: LimitSection[] = [
    {
      title: "Daily Limit",
      limit: "20,000.00 USD",
      used: "0.00 USD",
      remaining: "20,000.00 USD",
    },
    {
      title: "Monthly Limit",
      limit: "50,000.00 USD",
      used: "0.00 USD",
      remaining: "50,000.00 USD",
    },
    {
      title: "Yearly Limit",
      limit: "100,000.00 USD",
      used: "1.66 USD",
      remaining: "99,998.34 USD",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Single Payment Limit {singlePaymentLimit}
      </div>

      {limits.map((section, index) => (
        <div key={index} className="space-y-3">
          <h3 className="text-lg font-semibold">{section.title}</h3>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{section.title} Payment Limit</span>
                <span className="font-medium">{section.limit}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Used</span>
                <span className="font-medium">{section.used}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-medium">{section.remaining}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
