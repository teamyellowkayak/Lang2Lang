import { createContext, useContext } from "react";
import { API_BASE_URL } from '../config';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const languages = [
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
  { code: "it", name: "Italian", nativeName: "Italiano" }
];

export interface LanguageContextType {
  currentLanguage: string;
  setCurrentLanguage: (lang: string) => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: "es",
  setCurrentLanguage: () => {}
});

export const useLanguage = () => useContext(LanguageContext);

export const getLanguageName = (code: string): string => {
  const language = languages.find(lang => lang.code === code);
  return language ? language.name : "Unknown";
};

export const getLanguageNativeName = (code: string): string => {
  const language = languages.find(lang => lang.code === code);
  return language ? language.nativeName : "Unknown";
};

export const getFormattedLanguage = (code: string): string => {
  return `English → ${getLanguageName(code)}`;
};
