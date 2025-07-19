// src/lib/languageContext.ts

import { createContext, useContext } from "react";

export interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  isSourceLanguage?: number;
}

export interface LanguageContextType {
  currentLanguage: Language | null;
  setCurrentLanguageCode: (langCode: string) => void;
  allLanguages: Language[];
  isLoadingLanguages: boolean;
  languagesError: Error | null;
  getLanguageName: (code: string) => string;
  getLanguageNativeName: (code: string) => string;
  getFormattedLanguage: (code: string) => string;
}

// Define the context with a default value
export const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: null,
  setCurrentLanguageCode: () => {},
  allLanguages: [],
  isLoadingLanguages: true,
  languagesError: null,
  getLanguageName: (code: string) => "Unknown",
  getLanguageNativeName: (code: string) => "Unknown",
  getFormattedLanguage: (code: string) => `English → Unknown`,
});

// This is the single, official hook for consuming the LanguageContext
export const useLanguage = () => useContext(LanguageContext);