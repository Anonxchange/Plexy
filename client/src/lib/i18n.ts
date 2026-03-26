import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en.json";
import fr from "@/locales/fr.json";
import es from "@/locales/es.json";
import pt from "@/locales/pt.json";
import ar from "@/locales/ar.json";
import zh from "@/locales/zh.json";
import ru from "@/locales/ru.json";
import de from "@/locales/de.json";
import tr from "@/locales/tr.json";
import hi from "@/locales/hi.json";
import id from "@/locales/id.json";
import vi from "@/locales/vi.json";
import ja from "@/locales/ja.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
    pt: { translation: pt },
    ar: { translation: ar },
    zh: { translation: zh },
    ru: { translation: ru },
    de: { translation: de },
    tr: { translation: tr },
    hi: { translation: hi },
    id: { translation: id },
    vi: { translation: vi },
    ja: { translation: ja },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
