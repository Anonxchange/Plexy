import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useWalletData } from "@/hooks/use-wallet-data";

export function WalletHeader() {
  const { data: wallet } = useWalletData();
  
  return (
    <Card className="bg-primary text-primary-foreground">
      <CardHeader>
        <CardTitle>Total Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold">
          ${wallet?.totalBalance?.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
