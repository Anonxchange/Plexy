import { WalletCard } from "../wallet-card";

export default function WalletCardExample() {
  return (
    <div className="p-4">
      <WalletCard
        crypto="BTC"
        fullName="Bitcoin"
        balance={0.05234567}
        usdValue={6367.89}
        change24h={2.34}
      />
    </div>
  );
}
