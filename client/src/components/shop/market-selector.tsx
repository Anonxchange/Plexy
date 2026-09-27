import { useState, useEffect } from 'react';
import { setMarket, getCurrentMarket, availableCountries } from '@/lib/market-manager';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MarketSelector() {
  const [market, setCurrentMarket] = useState(getCurrentMarket());

  const handleChange = (countryCode: string) => {
    const config = setMarket(countryCode);
    setCurrentMarket(config);
    // Optionally refetch products
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2">
      <Select defaultValue={getCurrentMarket()} onValueChange={handleChange}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableCountries.map(country => (
            <SelectItem key={country.code} value={country.code}>
              {country.code} - {country.region}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
