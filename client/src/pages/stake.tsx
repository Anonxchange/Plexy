import { useQuery } from "@tanstack/react-query";
import { PexlyFooter } from "@/components/pexly-footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ExternalLink } from "lucide-react";
import { getStaderPools, getStakeUrl, type StaderPool } from "@/hooks/use-bybit-earn";

const CHAIN_CONFIG: Record<string, { color: string; bg: string; initials: string }> = {
  Ethereum: { color: "#627EEA", bg: "#627EEA22", initials: "ETH" },
  Polygon:  { color: "#8247E5", bg: "#8247E522", initials: "POL" },
  BSC:      { color: "#F3BA2F", bg: "#F3BA2F22", initials: "BNB" },
  Fantom:   { color: "#1969FF", bg: "#1969FF22", initials: "FTM" },
  Hedera:   { color: "#ffffff", bg: "#33333388", initials: "HBAR" },
};

const LEARN_MORE_URLS: Record<string, string> = {
  Ethereum: "https://www.staderlabs.com/eth/",
  Polygon:  "https://www.staderlabs.com/polygon/",
  BSC:      "https://www.staderlabs.com/bnb/",
  Fantom:   "https://www.staderlabs.com/fantom/",
  Hedera:   "https://www.staderlabs.com/hedera/",
};

function formatUsd(val: number): string {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${Math.round(val / 1_000)}K`;
  return `$${val.toFixed(0)}`;
}

function formatUsdFull(val: number): string {
  return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

interface ChainGroup {
  chain: string;
  tvlUsd: number;
  pools: StaderPool[];
}

function groupByChain(pools: StaderPool[]): ChainGroup[] {
  const map: Record<string, ChainGroup> = {};
  for (const pool of pools) {
    if (!map[pool.chain]) map[pool.chain] = { chain: pool.chain, tvlUsd: 0, pools: [] };
    map[pool.chain].tvlUsd += pool.tvlUsd;
    map[pool.chain].pools.push(pool);
  }
  return Object.values(map).sort((a, b) => b.tvlUsd - a.tvlUsd);
}

function ChainIcon({ chain }: { chain: string }) {
  const cfg = CHAIN_CONFIG[chain] ?? { color: "#888", bg: "#88888822", initials: chain.slice(0, 3).toUpperCase() };
  return (
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 shadow-lg"
      style={{ backgroundColor: cfg.bg, border: `2px solid ${cfg.color}33`, color: cfg.color }}
    >
      {cfg.initials}
    </div>
  );
}

function NetworkCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-lime/[0.04] p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Skeleton className="w-28 h-6 mb-2" />
          <Skeleton className="w-40 h-4" />
        </div>
        <Skeleton className="w-16 h-16 rounded-2xl" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="flex-1 h-10 rounded-xl" />
        <Skeleton className="flex-1 h-10 rounded-xl" />
      </div>
    </div>
  );
}

function NetworkCard({ group }: { group: ChainGroup }) {
  const learnUrl = LEARN_MORE_URLS[group.chain] ?? "https://www.staderlabs.com/";
  const stakeUrl = getStakeUrl(group.chain);

  return (
    <div className="rounded-2xl border border-lime/20 bg-lime/[0.04] p-5 hover:border-lime/40 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-1">{group.chain}</h3>
          <p className="text-sm text-muted-foreground">
            {formatUsdFull(group.tvlUsd)} staked
          </p>
        </div>
        <ChainIcon chain={group.chain} />
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1 rounded-xl border-border text-foreground hover:bg-secondary text-sm"
          onClick={() => window.open(learnUrl, "_blank", "noopener,noreferrer")}
        >
          Learn More
        </Button>
        <Button
          className="flex-1 rounded-xl bg-lime text-black hover:bg-lime/90 text-sm font-semibold"
          onClick={() => window.open(stakeUrl, "_blank", "noopener,noreferrer")}
        >
          Stake now
        </Button>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 font-medium">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

export default function Stake() {
  const { data: pools = [], isLoading, isError, error } = useQuery<StaderPool[]>({
    queryKey: ["stader-pools"],
    queryFn: getStaderPools,
    staleTime: 60_000,
  });

  const chains = groupByChain(pools);
  const totalTvl = pools.reduce((sum, p) => sum + p.tvlUsd, 0);
  const networkCount = chains.length;
  const poolCount = pools.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-grow max-w-2xl mx-auto px-4 w-full">

        {/* ── Hero ── */}
        <div className="pt-12 pb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight mb-3">
            Unlock liquidity and<br />amplify rewards
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Start liquid staking securely across multiple chains
          </p>

          {/* Stats row */}
          <div className="flex items-center border border-border rounded-2xl bg-card px-2 py-4 mb-8">
            {isLoading ? (
              <>
                <div className="flex-1 flex justify-center"><Skeleton className="w-20 h-8" /></div>
                <div className="w-px h-10 bg-border" />
                <div className="flex-1 flex justify-center"><Skeleton className="w-16 h-8" /></div>
                <div className="w-px h-10 bg-border" />
                <div className="flex-1 flex justify-center"><Skeleton className="w-20 h-8" /></div>
              </>
            ) : (
              <>
                <StatItem label="Assets Staked" value={totalTvl > 0 ? formatUsd(totalTvl) : "—"} />
                <div className="w-px h-10 bg-border shrink-0" />
                <StatItem label="Networks" value={networkCount > 0 ? `${networkCount}` : "—"} />
                <div className="w-px h-10 bg-border shrink-0" />
                <StatItem label="Pools" value={poolCount > 0 ? `${poolCount}+` : "—"} />
              </>
            )}
          </div>

          <Button
            className="w-full rounded-2xl bg-lime text-black hover:bg-lime/90 text-base font-semibold h-14"
            onClick={() => window.open("https://www.staderlabs.com/", "_blank", "noopener,noreferrer")}
          >
            Stake now
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* ── Supported Networks ── */}
        <div className="pb-12">
          <h2 className="text-2xl font-bold text-foreground text-center mb-1">Supported networks</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Choose your favourite network and start earning rewards
          </p>

          {/* Error */}
          {isError && (
            <div className="flex items-center gap-2 text-destructive text-sm py-10 justify-center">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {(error as Error)?.message ?? "Failed to load staking pools. Please try again."}
            </div>
          )}

          {/* Skeletons */}
          {isLoading && (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <NetworkCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && chains.length === 0 && (
            <p className="text-center py-12 text-muted-foreground text-sm">
              No staking networks available right now.
            </p>
          )}

          {/* Network list */}
          {!isLoading && !isError && chains.length > 0 && (
            <div className="flex flex-col gap-4">
              {chains.map((group) => (
                <NetworkCard key={group.chain} group={group} />
              ))}
            </div>
          )}
        </div>
      </div>

      <PexlyFooter />
    </div>
  );
}
