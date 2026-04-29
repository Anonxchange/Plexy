import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { countries } from "@/lib/localization";

interface FiatCurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
  triggerLabel?: string;
}

const popularCurrencies = ["USD", "GBP", "CAD", "EUR", "INR", "KES", "NGN", "GHS"];

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  NGN: "₦",
  GHS: "₵",
  KES: "KSh",
  CAD: "C$",
  AUD: "A$",
  ZAR: "R",
  BRL: "R$",
  RUB: "₽",
  TRY: "₺",
  AED: "د.إ",
  SAR: "﷼",
};

const currenciesMap = countries.reduce((acc, country) => {
  if (!acc[country.currencyCode]) {
    acc[country.currencyCode] = {
      code: country.currencyCode,
      name: country.currency,
      flag: country.flag,
      symbol: currencySymbols[country.currencyCode] || country.currencyCode,
    };
  }
  return acc;
}, {} as Record<string, { code: string; name: string; flag: string; symbol: string }>);

const uniqueCurrencies = Object.values(currenciesMap);

export function FiatCurrencySelector({ value, onChange, triggerLabel = "Select currency" }: FiatCurrencySelectorProps) {
  const [open, setOpen] = React.useState(false);

  const selectedCurrency = uniqueCurrencies.find((c) => c.code === value);
  const popularCurrenciesList = uniqueCurrencies.filter((c) => popularCurrencies.includes(c.code));
  const otherCurrencies = uniqueCurrencies.filter((c) => !popularCurrencies.includes(c.code));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity px-0 h-auto"
        >
          {selectedCurrency && (
            <>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white bg-blue-500">
                {selectedCurrency.symbol}
              </div>
              <span className="font-semibold text-foreground">{selectedCurrency.code}</span>
            </>
          )}
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[400px]">
        <DialogHeader>
          <DialogTitle>Preferred currency</DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Search currency or country..." />
          <ScrollArea className="h-[300px]">
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup heading="Popular">
              {popularCurrenciesList.map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={`${currency.name} ${currency.code}`}
                  onSelect={() => {
                    onChange(currency.code);
                    setOpen(false);
                  }}
                  className={cn(
                    "cursor-pointer",
                    value === currency.code && "bg-primary/10"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === currency.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="mr-2">{currency.flag}</span>
                  <span>{currency.name}</span>
                  <span className="ml-auto text-muted-foreground text-sm font-semibold">
                    {currency.code}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="All currencies">
              {otherCurrencies.map((currency) => (
                <CommandItem
                  key={`${currency.code}-other`}
                  value={`${currency.name} ${currency.code}`}
                  onSelect={() => {
                    onChange(currency.code);
                    setOpen(false);
                  }}
                  className={cn(
                    "cursor-pointer",
                    value === currency.code && "bg-primary/10"
                  )}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === currency.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="mr-2">{currency.flag}</span>
                  <span>{currency.name}</span>
                  <span className="ml-auto text-muted-foreground text-sm font-semibold">
                    {currency.code}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </ScrollArea>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
