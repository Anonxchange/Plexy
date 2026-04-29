import * as React from "react";
import { Check, ChevronsUpDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cryptoIconUrls } from "@/lib/crypto-icons";

interface CryptoCurrency {
  symbol: string;
  name: string;
  iconUrl: string;
}

const cryptoCurrencies: CryptoCurrency[] = [
  { symbol: "BTC", name: "Bitcoin", iconUrl: cryptoIconUrls.BTC },
  { symbol: "ETH", name: "Ethereum", iconUrl: cryptoIconUrls.ETH },
  { symbol: "SOL", name: "Solana", iconUrl: cryptoIconUrls.SOL },
  { symbol: "BNB", name: "Binance Coin", iconUrl: cryptoIconUrls.BNB },
  { symbol: "TRX", name: "Tron", iconUrl: cryptoIconUrls.TRX },
  { symbol: "USDC", name: "USD Coin", iconUrl: cryptoIconUrls.USDC },
  { symbol: "USDT", name: "Tether", iconUrl: cryptoIconUrls.USDT },
  { symbol: "LTC", name: "Litecoin", iconUrl: cryptoIconUrls.LTC },
];

interface CryptoCurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CryptoCurrencySelector({ value, onChange }: CryptoCurrencySelectorProps) {
  const [open, setOpen] = React.useState(false);

  const selectedCrypto = cryptoCurrencies.find((crypto) => crypto.symbol === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-full justify-between px-3 py-2 min-h-[40px]"
        >
          {selectedCrypto ? (
            <span className="flex items-center gap-2">
              <img 
                src={selectedCrypto.iconUrl} 
                alt={selectedCrypto.symbol}
                className="w-5 h-5 rounded-full"
              />
              <span className="font-semibold text-sm">{selectedCrypto.symbol}</span>
            </span>
          ) : (
            "Select"
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search crypto..." />
          <CommandList>
            <CommandEmpty>No cryptocurrency found.</CommandEmpty>
            <CommandGroup>
              {cryptoCurrencies.map((crypto) => (
                <CommandItem
                  key={crypto.symbol}
                  value={crypto.symbol}
                  onSelect={() => {
                    onChange(crypto.symbol);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === crypto.symbol ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <img 
                    src={crypto.iconUrl} 
                    alt={crypto.symbol}
                    className="w-5 h-5 rounded-full mr-2"
                  />
                  <span className="font-semibold">{crypto.symbol}</span>
                  <span className="ml-auto text-muted-foreground text-sm">{crypto.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
