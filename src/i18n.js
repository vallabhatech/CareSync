// i18n setup for multilingual support.
//
// Wires CareSync to react-i18next + i18next with browser language detection.
// Translations are namespaced by feature (common, nav, dashboard, medicine,
// symptom, clinics, login, profile, settings, footer) and shipped as JSON
// resource bundles under src/i18n/locales/<lang>.json.
//
// The user's chosen language is persisted to localStorage (key:
// `caresync_language`) by the language detector, so the app reloads in the
// last selected language. Adding a new language requires only:
//   1. a new locale JSON file (copy en.json, translate the values), and
//   2. a new <MenuItem> in the Settings language selector (see SUPPORTED_LANGUAGES).
//
// See CONTRIBUTING.md ("Adding a new language") for the full walkthrough.

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./i18n/locales/en.json";
import hi from "./i18n/locales/hi.json";

// Single source of truth for which languages the UI offers. The Settings
// language selector maps over this list, so adding an entry here (plus the
// matching locale JSON) is all that is needed to expose a new language.
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "hi", label: "हिन्दी (Hindi)", dir: "ltr" },
];

// localStorage key used by the language detector to persist the choice.
export const LANGUAGE_STORAGE_KEY = "caresync_language";

export const resources = {
  en,
  hi,
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    // Namespaces correspond to the top-level keys in each locale file.
    ns: ["common", "nav", "dashboard", "medicine", "symptom", "clinics", "login", "profile", "settings", "footer"],
    defaultNS: "common",
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    detection: {
      // Prefer an explicit saved choice; fall back to the browser language.
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false, // React already escapes values against XSS.
    },
    react: {
      useSuspense: true,
    },
  });

/**
 * Resolve the text direction ("ltr" | "rtl") for a given language code.
 * RTL CSS is out of scope for this issue, but this hook lets the app set the
 * document `dir` attribute so future Arabic/Hebrew support can build on it.
 *
 * @param {string} [lng] - Language code; defaults to the active language.
 * @returns {"ltr"|"rtl"} The text direction for that language.
 */
export const getLanguageDir = (lng) => {
  const code = lng || i18n.language || "en";
  const base = code.split("-")[0];
  const match = SUPPORTED_LANGUAGES.find((l) => l.code === base);
  return match?.dir || "ltr";
};

// Keep the document <html dir> attribute in sync with the active language so
// directionality is correct on load and after every language change.
const applyDir = (lng) => {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("dir", getLanguageDir(lng));
    document.documentElement.setAttribute("lang", (lng || "en").split("-")[0]);
  }
};

applyDir(i18n.language);
i18n.on("languageChanged", applyDir);

export default i18n;
