// @/lib/languages.ts 

import { createContext, useContext } from "react";
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { API_BASE_URL } from '../config';

export interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  isSourceLanguage?: number; // Optional
}

/*
// OLD
export const languages = [
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili" },
  { code: "it", name: "Italian", nativeName: "Italiano" }
];
*/

// Assuming you have a similar useQuery hook for languages
export const _useFetchAllLanguages = (): UseQueryResult<Language[], Error> => {
  return useQuery<Language[], Error>({ 
    queryKey: ['/api/languages'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/languages`);
      if (!response.ok) {
        throw new Error('Failed to fetch languages: ' + response.statusText);
      }
      const data = await response.json();
      
      // Critical check for the frontend: ensure it's an array
      if (!Array.isArray(data)) {
        console.error('API returned non-array data for languages:', data);
        throw new Error('Invalid data format received from API. Expected an array.');
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 mins
    cacheTime: 10 * 60 * 1000, // Keep data in cache for 10 mins
  });
};


// --- Language Context Definition ---

// IMPORTANT: Update LanguageContextType to include the full Language object for currentLanguage,
// and the allLanguages array.
export interface LanguageContextType {
  currentLanguage: Language | null; // Now the full Language object, or null/undefined
  setCurrentLanguageCode: (langCode: string) => void; // Still sets by code
  allLanguages: Language[]; // The array of all fetched languages
  isLoadingLanguages: boolean;
  languagesError: Error | null;
  // Helper functions now take 'allLanguages' from context, no longer directly from a 'languages' variable
  getLanguageName: (code: string) => string;
  getLanguageNativeName: (code: string) => string;
  getFormattedLanguage: (code: string) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: null, // Default to null
  setCurrentLanguageCode: () => {},
  allLanguages: [], // Default to empty array
  isLoadingLanguages: true, // Default to true initially
  languagesError: null,
  getLanguageName: (code: string) => "Unknown",
  getLanguageNativeName: (code: string) => "Unknown",
  getFormattedLanguage: (code: string) => `English → Unknown`,
});

// This is the hook your components will use to get context values
export const useLanguage = () => useContext(LanguageContext);


/* 
// OLD
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
*/