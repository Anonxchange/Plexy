import { useState, useEffect } from "react";
import { ArrowLeft, Copy, ArrowRight, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTransaction, formatHash, formatTimestamp, satoshiToBTC } from "@/lib/blockchain-api";
import { Link } from "wouter";

export default function TransactionDetail() {
  const location = useLocation();
  const txHash = location[0].split('/').pop();
  const [txData, setTxData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTx = async () => {
      if (!txHash) return;
      try {
        setLoading(true);
        const data = await getTransaction(txHash);
        if (data) {
          setTxData(data);
        } else {
          setError('Transaction not found');
        }
      } catch (err: any) {
        setError(`Error loading transaction: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTx();
  }, [txHash]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/explorer">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
            <p className="mt-4 text-muted-foreground">Loading transaction details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !txData) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/explorer">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <Card variant="default" className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive">{error || 'Transaction not found'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalBTC = satoshiToBTC(txData.total || 0);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/explorer">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-sm text-muted-foreground">BITCOIN &gt; TRANSACTION</h1>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">Bitcoin transaction</h2>
          <p className="text-muted-foreground">View transaction details and flow</p>
        </div>

        {/* Transaction Hash Card */}
        <Card variant="default" className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">TRANSACTION HASH</p>
                <div className="flex items-center gap-3 bg-secondary/50 p-4 rounded-lg break-all">
                  <code className="text-primary font-mono text-sm flex-1">{txData.hash}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(txData.hash)}
                    className="flex-shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Total Card */}
          <Card variant="default">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">TOTAL VALUE</p>
              <p className="text-2xl font-bold">{totalBTC.toFixed(8)} BTC</p>
              <p className="text-sm text-muted-foreground mt-1">
                ≈ ${(totalBTC * 88696).toFixed(2)} USD
              </p>
            </CardContent>
          </Card>

          {/* Inputs/Outputs Card */}
          <Card variant="default">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">INPUTS & OUTPUTS</p>
              <div className="flex gap-8">
                <div>
                  <p className="text-sm text-muted-foreground">Inputs</p>
                  <p className="text-2xl font-bold">{txData.inputs?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Outputs</p>
                  <p className="text-2xl font-bold">{txData.out?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Details */}
        <Card variant="default" className="mb-6">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Hash</span>
                <code className="font-mono text-sm">{formatHash(txData.hash)}</code>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Block Height</span>
                <span className="font-bold">{txData.block_height || 'Unconfirmed'}</span>
              </div>
              {txData.time && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Time</span>
                  <span className="text-sm">{formatTimestamp(txData.time)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Inputs */}
        {txData.inputs && txData.inputs.length > 0 && (
          <Card variant="default" className="mb-6">
            <CardHeader>
              <CardTitle>Inputs ({txData.inputs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {txData.inputs.map((input: any, idx: number) => (
                  <div key={idx} className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Input {idx + 1}</p>
                    {input.prev_out?.addr && (
                      <code className="text-primary font-mono text-sm break-all">
                        {formatHash(input.prev_out.addr)}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Outputs */}
        {txData.out && txData.out.length > 0 && (
          <Card variant="default">
            <CardHeader>
              <CardTitle>Outputs ({txData.out.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {txData.out.map((output: any, idx: number) => (
                  <div key={idx} className="p-3 bg-secondary/30 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm text-muted-foreground">Output {idx + 1}</p>
                      <span className="text-sm font-bold">
                        {satoshiToBTC(output.value).toFixed(8)} BTC
                      </span>
                    </div>
                    {output.addr && (
                      <code className="text-primary font-mono text-sm break-all">
                        {formatHash(output.addr)}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
