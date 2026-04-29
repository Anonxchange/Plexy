import { useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check } from "lucide-react";

const LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish (Español)" },
  { code: "fr", label: "French (Français)" },
  { code: "de", label: "German (Deutsch)" },
  { code: "pt", label: "Portuguese (Português)" },
  { code: "zh", label: "Chinese (中文)" },
  { code: "ja", label: "Japanese (日本語)" },
  { code: "ar", label: "Arabic (العربية)" },
  { code: "hi", label: "Hindi (हिन्दी)" },
  { code: "ru", label: "Russian (Русский)" },
  { code: "tr", label: "Turkish (Türkçe)" },
  { code: "id", label: "Indonesian (Bahasa Indonesia)" },
  { code: "vi", label: "Vietnamese (Tiếng Việt)" },
];

const TIMEZONES = [
  { value: "UTC-12", label: "(GMT-12:00) Baker Island" },
  { value: "UTC-11", label: "(GMT-11:00) American Samoa" },
  { value: "UTC-10", label: "(GMT-10:00) Hawaii" },
  { value: "UTC-8", label: "(GMT-08:00) Los Angeles, Vancouver" },
  { value: "UTC-7", label: "(GMT-07:00) Denver, Phoenix" },
  { value: "UTC-6", label: "(GMT-06:00) Chicago, Mexico City" },
  { value: "UTC-5", label: "(GMT-05:00) New York, Toronto" },
  { value: "UTC-4", label: "(GMT-04:00) Caracas, Halifax" },
  { value: "UTC-3", label: "(GMT-03:00) São Paulo, Buenos Aires" },
  { value: "UTC-1", label: "(GMT-01:00) Azores" },
  { value: "UTC+0", label: "(GMT+00:00) London, Lisbon" },
  { value: "UTC+1", label: "(GMT+01:00) Lagos, Paris, Berlin" },
  { value: "UTC+2", label: "(GMT+02:00) Cairo, Johannesburg" },
  { value: "UTC+3", label: "(GMT+03:00) Moscow, Nairobi" },
  { value: "UTC+4", label: "(GMT+04:00) Dubai, Baku" },
  { value: "UTC+5", label: "(GMT+05:00) Karachi, Tashkent" },
  { value: "UTC+5.5", label: "(GMT+05:30) Mumbai, New Delhi" },
  { value: "UTC+6", label: "(GMT+06:00) Dhaka, Almaty" },
  { value: "UTC+7", label: "(GMT+07:00) Bangkok, Jakarta" },
  { value: "UTC+8", label: "(GMT+08:00) Shanghai, Singapore" },
  { value: "UTC+9", label: "(GMT+09:00) Tokyo, Seoul" },
  { value: "UTC+10", label: "(GMT+10:00) Sydney, Melbourne" },
  { value: "UTC+12", label: "(GMT+12:00) Auckland, Fiji" },
];

function getSavedTimezone(): string {
  return localStorage.getItem("pexly-timezone") || "UTC+0";
}

export function LocalizationSection() {
  const { t } = useTranslation();
  const [activeLang, setActiveLang] = useState<string>(i18n.language || "en");
  const [timezone, setTimezone] = useState<string>(getSavedTimezone());
  const [saved, setSaved] = useState(false);

  const handleLanguageChange = (code: string) => {
    setActiveLang(code);
  };

  const handleTimezoneChange = (value: string) => {
    setTimezone(value);
  };

  const handleSave = () => {
    i18n.changeLanguage(activeLang);
    localStorage.setItem("pexly-lang", activeLang);
    localStorage.setItem("pexly-timezone", timezone);
    if (activeLang === "ar") {
      document.documentElement.dir = "rtl";
    } else {
      document.documentElement.dir = "ltr";
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const currentLangLabel = LANGUAGES.find((l) => l.code === activeLang)?.label || "English";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-6">{t("account.title", "Account Settings")}</h3>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">{t("account.language", "Language")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("account.language_desc", "Choose the language used throughout the app")}
            </p>

            <Select value={activeLang} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full">
                <SelectValue>{currentLangLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 pt-6 border-t">
            <Label className="text-base font-semibold">{t("account.timezone", "Time Zone")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("account.timezone_desc", "Used for displaying trade timestamps")}
            </p>

            <Select value={timezone} onValueChange={handleTimezoneChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} className="min-w-[120px]">
              {saved ? (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  {t("common.saved", "Saved")}
                </span>
              ) : (
                t("account.save_changes", "Save changes")
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
