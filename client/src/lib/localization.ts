export interface CountryInfo {
  name: string;
  code: string;
  flag: string;
  currency: string;
  currencyCode: string;
  phoneCode: string;
}

export const countries: CountryInfo[] = [
  { name: "Ghana", code: "GH", flag: "🇬🇭", currency: "Ghanaian Cedi", currencyCode: "GHS", phoneCode: "+233" },
  { name: "Nigeria", code: "NG", flag: "🇳🇬", currency: "Nigerian Naira", currencyCode: "NGN", phoneCode: "+234" },
  { name: "United States", code: "US", flag: "🇺🇸", currency: "US Dollar", currencyCode: "USD", phoneCode: "+1" },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧", currency: "British Pound", currencyCode: "GBP", phoneCode: "+44" },
  { name: "Kenya", code: "KE", flag: "🇰🇪", currency: "Kenyan Shilling", currencyCode: "KES", phoneCode: "+254" },
  { name: "South Africa", code: "ZA", flag: "🇿🇦", currency: "South African Rand", currencyCode: "ZAR", phoneCode: "+27" },
  { name: "Uganda", code: "UG", flag: "🇺🇬", currency: "Ugandan Shilling", currencyCode: "UGX", phoneCode: "+256" },
  { name: "Tanzania", code: "TZ", flag: "🇹🇿", currency: "Tanzanian Shilling", currencyCode: "TZS", phoneCode: "+255" },
  { name: "Rwanda", code: "RW", flag: "🇷🇼", currency: "Rwandan Franc", currencyCode: "RWF", phoneCode: "+250" },
  { name: "Zambia", code: "ZM", flag: "🇿🇲", currency: "Zambian Kwacha", currencyCode: "ZMW", phoneCode: "+260" },
  { name: "Egypt", code: "EG", flag: "🇪🇬", currency: "Egyptian Pound", currencyCode: "EGP", phoneCode: "+20" },
  { name: "Morocco", code: "MA", flag: "🇲🇦", currency: "Moroccan Dirham", currencyCode: "MAD", phoneCode: "+212" },
  { name: "India", code: "IN", flag: "🇮🇳", currency: "Indian Rupee", currencyCode: "INR", phoneCode: "+91" },
  { name: "Pakistan", code: "PK", flag: "🇵🇰", currency: "Pakistani Rupee", currencyCode: "PKR", phoneCode: "+92" },
  { name: "Bangladesh", code: "BD", flag: "🇧🇩", currency: "Bangladeshi Taka", currencyCode: "BDT", phoneCode: "+880" },
  { name: "Philippines", code: "PH", flag: "🇵🇭", currency: "Philippine Peso", currencyCode: "PHP", phoneCode: "+63" },
  { name: "Indonesia", code: "ID", flag: "🇮🇩", currency: "Indonesian Rupiah", currencyCode: "IDR", phoneCode: "+62" },
  { name: "Malaysia", code: "MY", flag: "🇲🇾", currency: "Malaysian Ringgit", currencyCode: "MYR", phoneCode: "+60" },
  { name: "Singapore", code: "SG", flag: "🇸🇬", currency: "Singapore Dollar", currencyCode: "SGD", phoneCode: "+65" },
  { name: "Thailand", code: "TH", flag: "🇹🇭", currency: "Thai Baht", currencyCode: "THB", phoneCode: "+66" },
  { name: "Vietnam", code: "VN", flag: "🇻🇳", currency: "Vietnamese Dong", currencyCode: "VND", phoneCode: "+84" },
  { name: "Japan", code: "JP", flag: "🇯🇵", currency: "Japanese Yen", currencyCode: "JPY", phoneCode: "+81" },
  { name: "South Korea", code: "KR", flag: "🇰🇷", currency: "South Korean Won", currencyCode: "KRW", phoneCode: "+82" },
  { name: "China", code: "CN", flag: "🇨🇳", currency: "Chinese Yuan", currencyCode: "CNY", phoneCode: "+86" },
  { name: "Australia", code: "AU", flag: "🇦🇺", currency: "Australian Dollar", currencyCode: "AUD", phoneCode: "+61" },
  { name: "New Zealand", code: "NZ", flag: "🇳🇿", currency: "New Zealand Dollar", currencyCode: "NZD", phoneCode: "+64" },
  { name: "Canada", code: "CA", flag: "🇨🇦", currency: "Canadian Dollar", currencyCode: "CAD", phoneCode: "+1" },
  { name: "Mexico", code: "MX", flag: "🇲🇽", currency: "Mexican Peso", currencyCode: "MXN", phoneCode: "+52" },
  { name: "Brazil", code: "BR", flag: "🇧🇷", currency: "Brazilian Real", currencyCode: "BRL", phoneCode: "+55" },
  { name: "Argentina", code: "AR", flag: "🇦🇷", currency: "Argentine Peso", currencyCode: "ARS", phoneCode: "+54" },
  { name: "Colombia", code: "CO", flag: "🇨🇴", currency: "Colombian Peso", currencyCode: "COP", phoneCode: "+57" },
  { name: "Peru", code: "PE", flag: "🇵🇪", currency: "Peruvian Sol", currencyCode: "PEN", phoneCode: "+51" },
  { name: "Chile", code: "CL", flag: "🇨🇱", currency: "Chilean Peso", currencyCode: "CLP", phoneCode: "+56" },
  { name: "Germany", code: "DE", flag: "🇩🇪", currency: "Euro", currencyCode: "EUR", phoneCode: "+49" },
  { name: "France", code: "FR", flag: "🇫🇷", currency: "Euro", currencyCode: "EUR", phoneCode: "+33" },
  { name: "Italy", code: "IT", flag: "🇮🇹", currency: "Euro", currencyCode: "EUR", phoneCode: "+39" },
  { name: "Spain", code: "ES", flag: "🇪🇸", currency: "Euro", currencyCode: "EUR", phoneCode: "+34" },
  { name: "Netherlands", code: "NL", flag: "🇳🇱", currency: "Euro", currencyCode: "EUR", phoneCode: "+31" },
  { name: "Belgium", code: "BE", flag: "🇧🇪", currency: "Euro", currencyCode: "EUR", phoneCode: "+32" },
  { name: "Portugal", code: "PT", flag: "🇵🇹", currency: "Euro", currencyCode: "EUR", phoneCode: "+351" },
  { name: "Poland", code: "PL", flag: "🇵🇱", currency: "Polish Zloty", currencyCode: "PLN", phoneCode: "+48" },
  { name: "Czech Republic", code: "CZ", flag: "🇨🇿", currency: "Czech Koruna", currencyCode: "CZK", phoneCode: "+420" },
  { name: "Hungary", code: "HU", flag: "🇭🇺", currency: "Hungarian Forint", currencyCode: "HUF", phoneCode: "+36" },
  { name: "Romania", code: "RO", flag: "🇷🇴", currency: "Romanian Leu", currencyCode: "RON", phoneCode: "+40" },
  { name: "Turkey", code: "TR", flag: "🇹🇷", currency: "Turkish Lira", currencyCode: "TRY", phoneCode: "+90" },
  { name: "Russia", code: "RU", flag: "🇷🇺", currency: "Russian Ruble", currencyCode: "RUB", phoneCode: "+7" },
  { name: "Ukraine", code: "UA", flag: "🇺🇦", currency: "Ukrainian Hryvnia", currencyCode: "UAH", phoneCode: "+380" },
  { name: "United Arab Emirates", code: "AE", flag: "🇦🇪", currency: "UAE Dirham", currencyCode: "AED", phoneCode: "+971" },
  { name: "Saudi Arabia", code: "SA", flag: "🇸🇦", currency: "Saudi Riyal", currencyCode: "SAR", phoneCode: "+966" },
  { name: "Qatar", code: "QA", flag: "🇶🇦", currency: "Qatari Riyal", currencyCode: "QAR", phoneCode: "+974" },
  { name: "Kuwait", code: "KW", flag: "🇰🇼", currency: "Kuwaiti Dinar", currencyCode: "KWD", phoneCode: "+965" },
  { name: "Bahrain", code: "BH", flag: "🇧🇭", currency: "Bahraini Dinar", currencyCode: "BHD", phoneCode: "+973" },
  { name: "Oman", code: "OM", flag: "🇴🇲", currency: "Omani Rial", currencyCode: "OMR", phoneCode: "+968" },
  { name: "Jordan", code: "JO", flag: "🇯🇴", currency: "Jordanian Dinar", currencyCode: "JOD", phoneCode: "+962" },
  { name: "Israel", code: "IL", flag: "🇮🇱", currency: "Israeli Shekel", currencyCode: "ILS", phoneCode: "+972" },
  { name: "Sri Lanka", code: "LK", flag: "🇱🇰", currency: "Sri Lankan Rupee", currencyCode: "LKR", phoneCode: "+94" },
  { name: "Sweden", code: "SE", flag: "🇸🇪", currency: "Swedish Krona", currencyCode: "SEK", phoneCode: "+46" },
  { name: "Norway", code: "NO", flag: "🇳🇴", currency: "Norwegian Krone", currencyCode: "NOK", phoneCode: "+47" },
  { name: "Denmark", code: "DK", flag: "🇩🇰", currency: "Danish Krone", currencyCode: "DKK", phoneCode: "+45" },
  { name: "Switzerland", code: "CH", flag: "🇨🇭", currency: "Swiss Franc", currencyCode: "CHF", phoneCode: "+41" },
  { name: "Hong Kong", code: "HK", flag: "🇭🇰", currency: "Hong Kong Dollar", currencyCode: "HKD", phoneCode: "+852" },
  { name: "Taiwan", code: "TW", flag: "🇹🇼", currency: "Taiwan Dollar", currencyCode: "TWD", phoneCode: "+886" },
];

export function getCountryInfo(countryName: string | null | undefined): CountryInfo {
  if (!countryName) {
    return countries.find(c => c.name === "Ghana") || countries[0];
  }
  
  const normalizedName = countryName.trim().toLowerCase();
  
  const found = countries.find(c => 
    c.name.toLowerCase() === normalizedName ||
    c.code.toLowerCase() === normalizedName
  );
  
  return found || countries.find(c => c.name === "Ghana") || countries[0];
}

export function getCountryFlag(countryName: string | null | undefined): string {
  return getCountryInfo(countryName).flag;
}

export function getCountryCurrency(countryName: string | null | undefined): string {
  return getCountryInfo(countryName).currency;
}

export function getCountryCurrencyCode(countryName: string | null | undefined): string {
  return getCountryInfo(countryName).currencyCode;
}

export function getCountryPhoneCode(countryName: string | null | undefined): string {
  return getCountryInfo(countryName).phoneCode;
}

export function getAllCountryNames(): string[] {
  return countries.map(c => c.name).sort();
}
