import { useState, useEffect } from "react";
import { ArrowLeft, Copy, Blocks, Clock, HardDrive } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBlock, formatHash, formatTimestamp } from "@/lib/blockchain-api";
import { Link } from "wouter";

export default function BlockDetail() {
  const location = useLocation();
  const blockHash = location[0].split('/').pop();
  const [blockData, setBlockData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlock = async () => {
      if (!blockHash) return;
      try {
        setLoading(true);
        const data = await getBlock(blockHash);
        if (data) {
          setBlockData(data);
        } else {
          setError('Block not found');
        }
      } catch (err: any) {
        setError(`Error loading block: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchBlock();
  }, [blockHash]);

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
            <p className="mt-4 text-muted-foreground">Loading block details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blockData) {
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
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive">{error || 'Block not found'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const blockSize = (blockData.size / 1024 / 1024).toFixed(2);

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
          <h1 className="text-sm text-muted-foreground">BITCOIN &gt; BLOCK</h1>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">Bitcoin block</h2>
          <p className="text-muted-foreground">Block #{blockData.height}</p>
        </div>

        {/* Block Hash Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">BLOCK HASH</p>
                <div className="flex items-center gap-3 bg-secondary/50 p-4 rounded-lg break-all">
                  <code className="text-primary font-mono text-sm flex-1">{blockData.hash}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(blockData.hash)}
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
          {/* Height Card */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">BLOCK HEIGHT</p>
              <div className="flex items-center gap-2">
                <Blocks className="h-5 w-5 text-primary" />
                <p className="text-2xl font-bold">{blockData.height}</p>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Card */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">TRANSACTIONS</p>
              <div className="flex items-center gap-2">
                <Blocks className="h-5 w-5 text-success" />
                <p className="text-2xl font-bold">{blockData.n_tx || 0}</p>
              </div>
            </CardContent>
          </Card>

          {/* Size Card */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">BLOCK SIZE</p>
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-blue-500" />
                <p className="text-2xl font-bold">{blockSize} MB</p>
              </div>
            </CardContent>
          </Card>

          {/* Time Card */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">TIMESTAMP</p>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div className="text-sm">
                  <p className="font-bold">{formatTimestamp(blockData.time)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Block Details */}
        <Card variant="default">
          <CardHeader>
            <CardTitle>Block Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Height</span>
                <span className="font-bold">{blockData.height}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Hash</span>
                <code className="font-mono text-sm">{formatHash(blockData.hash)}</code>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Transactions</span>
                <span className="font-bold">{blockData.n_tx || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Size</span>
                <span className="font-bold">{blockSize} MB</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Mined</span>
                <span className="text-sm">{formatTimestamp(blockData.time)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
