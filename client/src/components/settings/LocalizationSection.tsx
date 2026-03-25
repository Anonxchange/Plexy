import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, ChevronsUpDown } from "lucide-react";

export function LocalizationSection() {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English (English)"]);
  const [timezone, setTimezone] = useState("(GMT+01:00) Africa, Lagos - 10:25 PM");

  const availableLanguages = [
    "English (English)",
    "Spanish (Español)",
    "French (Français)",
    "German (Deutsch)",
    "Portuguese (Português)",
    "Chinese (中文)",
    "Japanese (日本語)",
    "Korean (한국어)",
    "Arabic (العربية)",
    "Hindi (हिन्दी)",
    "Russian (Русский)",
    "Italiano (Italiano)",
  ];

  const timezones = [
    "(GMT+01:00) Africa, Lagos - 10:25 PM",
    "(GMT+00:00) UTC - 09:25 PM",
    "(GMT-05:00) America, New York - 04:25 PM",
    "(GMT-08:00) America, Los Angeles - 01:25 PM",
    "(GMT+01:00) Europe, London - 09:25 PM",
    "(GMT+02:00) Europe, Paris - 10:25 PM",
    "(GMT+03:00) Europe, Moscow - 12:25 AM",
    "(GMT+08:00) Asia, Shanghai - 05:25 AM",
    "(GMT+09:00) Asia, Tokyo - 06:25 AM",
    "(GMT+05:30) Asia, Mumbai - 02:55 AM",
  ];

  const handleRemoveLanguage = (lang: string) => {
    if (selectedLanguages.length > 1) {
      setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-6">Account localization settings</h3>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Languages</Label>

            <div className="space-y-2">
              {selectedLanguages.map((lang, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center justify-between px-4 py-3 border border-primary/50 bg-primary/5 rounded-lg">
                    <span className="text-sm font-medium">{lang}</span>
                    {selectedLanguages.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLanguage(lang)}
                        className="h-auto p-1 hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ChevronsUpDown className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">Languages you can use while trading</p>

            <Select
              onValueChange={(value) => {
                if (!selectedLanguages.includes(value)) {
                  setSelectedLanguages([...selectedLanguages, value]);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Add another language..." />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages
                  .filter((lang) => !selectedLanguages.includes(lang))
                  .map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 pt-6 border-t">
            <Label className="text-base font-semibold">Your Time Zone</Label>

            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
