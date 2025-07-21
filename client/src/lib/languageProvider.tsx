// src/lib/languageProvider.tsx

import React, { useState, useEffect, ReactNode, useMemo } from 'react'; // Import useMemo
import { LanguageContext } from './languageContext';
import type {
  Language,
  LanguageContextType
} from './languageContext'; 
import { _useFetchAllLanguages } from './languages';
import { useAuth } from './authContext';

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const { isAuthenticated } = useAuth();

// below is where the issue most likely is
  const { data: allLanguages, isLoading, isError, error } = _useFetchAllLanguages({
    enabled: isAuthenticated
  });
  const [currentLanguageCode, setCurrentLanguageCodeState] = useState<string>("es");
  

  console.log("LanguageProvider Status:");
  console.log("  isLoading:", isLoading);
  console.log("  isError:", isError);
  console.log("  error (if any):", error);
  console.log("  allLanguages (data):", allLanguages);
  console.log("  isAuthenticated (LP):", isAuthenticated);

  useEffect(() => {
    if (allLanguages && allLanguages.length > 0 && currentLanguageCode === "es") {
      const defaultExists = allLanguages.some(lang => lang.code === "es");
      if (!defaultExists) {
        console.log('languageProvider.tsx: "es" not found, setting to first language');
        setCurrentLanguageCodeState(allLanguages[0].code);
      } else {
         console.log('languageProvider.tsx: "es" found or initial setup complete');
      }
    } else if (allLanguages && allLanguages.length === 0) {
        console.log('languageProvider.tsx: allLanguages array is empty, cannot set default.');
    } else if (!allLanguages) {
        console.log('languageProvider.tsx: allLanguages is null/undefined, waiting for data.');
    }
  }, [allLanguages, currentLanguageCode]);

  const currentLanguage: Language | null = useMemo(
    () => allLanguages?.find(lang => lang.code === currentLanguageCode) || null,
    [allLanguages, currentLanguageCode]
  );

  const getLanguageName = React.useCallback((code: string): string => {
    const language = allLanguages?.find(lang => lang.code === code);
    return language ? language.name : "Unknown";
  }, [allLanguages]);

  const getLanguageNativeName = React.useCallback((code: string): string => {
    const language = allLanguages?.find(lang => lang.code === code);
    return language ? language.nativeName : "Unknown";
  }, [allLanguages]);

  const getFormattedLanguage = React.useCallback((code: string): string => {
    return `English → ${getLanguageName(code)}`;
  }, [getLanguageName]);

  const setCurrentLanguageCode = React.useCallback((code: string) => {
    console.log('languageProvider.tsx: setCurrentLanguageCode called with', code);
    setCurrentLanguageCodeState(code);
  }, []);

  // Wrap contextValue in useMemo to ensure it only updates when its dependencies change
  const contextValue: LanguageContextType = useMemo(() => ({
    currentLanguage,
    setCurrentLanguageCode,
    allLanguages: allLanguages || [],
    isLoadingLanguages: isLoading, // This is the key part
    languagesError: isError ? error : null,
    getLanguageName,
    getLanguageNativeName,
    getFormattedLanguage,
  }), [
    currentLanguage,
    setCurrentLanguageCode,
    allLanguages,
    isLoading, // << Make sure this is a dependency
    isError,
    error,
    getLanguageName,
    getLanguageNativeName,
    getFormattedLanguage
  ]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};