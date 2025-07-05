// @/lib/LanguageProvider.tsx 

import React, { useState, useEffect, ReactNode } from 'react';
import {
  LanguageContext,
  Language, // Import Language interface
  _useFetchAllLanguages, // Import the internal fetching hook
  LanguageContextType
} from './languages'; // Adjust path if needed for languages.ts

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const { data: allLanguages, isLoading, isError, error } = _useFetchAllLanguages();
  const [currentLanguageCode, setCurrentLanguageCodeState] = useState<string>("en2es"); // State for the code

  // Effect to set an initial current language code once data is loaded
  useEffect(() => {
    if (allLanguages && allLanguages.length > 0 && currentLanguageCode === "es") {
      // Ensure "es" exists, otherwise pick the first one from the fetched list
      const defaultExists = allLanguages.some(lang => lang.code === "es");
      if (!defaultExists) {
        setCurrentLanguageCodeState(allLanguages[0].code);
      }
    }
  }, [allLanguages, currentLanguageCode]);

  // Derive the full currentLanguage object from the allLanguages array
  const currentLanguage: Language | null = allLanguages?.find(
    lang => lang.code === currentLanguageCode
  ) || null;

  // Memoize helper functions for performance (optional but good practice)
  const getLanguageName = React.useCallback((code: string): string => {
    const language = allLanguages?.find(lang => lang.code === code);
    return language ? language.name : "Unknown";
  }, [allLanguages]); // Dependency array: recreate if allLanguages changes

  const getLanguageNativeName = React.useCallback((code: string): string => {
    const language = allLanguages?.find(lang => lang.code === code);
    return language ? language.nativeName : "Unknown";
  }, [allLanguages]);

  const getFormattedLanguage = React.useCallback((code: string): string => {
    return `English → ${getLanguageName(code)}`;
  }, [getLanguageName]); // Dependency on getLanguageName

  // Override setCurrentLanguageCode to ensure it uses the local state
  const setCurrentLanguageCode = React.useCallback((code: string) => {
    setCurrentLanguageCodeState(code);
  }, []);

  // Prepare the context value
  const contextValue: LanguageContextType = {
    currentLanguage, // The full object
    setCurrentLanguageCode, // Function to update the code
    allLanguages: allLanguages || [], // Ensure it's always an array
    isLoadingLanguages: isLoading,
    languagesError: isError ? error : null,
    getLanguageName,
    getLanguageNativeName,
    getFormattedLanguage,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};