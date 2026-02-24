import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Stake() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Staking</h1>
        
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Earn with Kiln</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Kiln Widget Integration */}
            <div className="w-full h-[800px] overflow-hidden bg-background">
              <iframe
                src="https://kiln.widget.kiln.fi"
                title="Kiln Widget"
                allow="clipboard-write"
                className="w-full h-full border-0"
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Card className="bg-muted/30 border-none">
            <CardContent className="pt-6">
              <h3 className="font-bold mb-2">Secure</h3>
              <p className="text-sm text-muted-foreground">Enterprise-grade security powered by Kiln infrastructure.</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-none">
            <CardContent className="pt-6">
              <h3 className="font-bold mb-2">Non-Custodial</h3>
              <p className="text-sm text-muted-foreground">Keep full control of your assets while earning rewards.</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-none">
            <CardContent className="pt-6">
              <h3 className="font-bold mb-2">Transparent</h3>
              <p className="text-sm text-muted-foreground">Real-time monitoring of your staking rewards and performance.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
