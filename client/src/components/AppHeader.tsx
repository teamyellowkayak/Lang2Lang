// client/src/components/AppHeader.tsx

import { useState } from 'react'; // Keep useState
// Import ONLY the useLanguage hook from your '@/lib/languages' file.
// The LanguageContext is used internally by useLanguage.
// 'languages' and 'getFormattedLanguage' are now provided via the context.
import { useLanguage } from '@/lib/languages'; // This hook gives you access to the context values

const AppHeader = () => {
  console.log("Rendering AppHeader component.");
  
  // Use the useLanguage hook to access the context values.
  // This hook provides ALL the values defined in LanguageContextType.
  const {
    currentLanguage,          // This is the Language object (or null)
    setCurrentLanguageCode,   // This is the function to update the language by its code
    allLanguages,             // This is the array of all fetched languages
    isLoadingLanguages,       // Boolean indicating if languages are still being fetched
    languagesError,           // Error object if fetching failed
    getFormattedLanguage      // This helper function is now provided by the context
  } = useLanguage(); // Call the hook!

  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // In a real implementation, we would add dark mode classes to the body
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // Call the setCurrentLanguageCode function from the context
    // This function expects a string (the language code)
    console.log('AppHeader: about to run setCurrentLanguageCode')
    setCurrentLanguageCode(e.target.value);
  };

  // --- Crucial: Handle Loading and Error states for languages ---
  // If languages are still loading, or there's an error, don't try to render the selector.
  if (isLoadingLanguages) {
    return (
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-5" /><circle cx="16" cy="16" r="6" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900">Lang<span className="text-primary">2</span>Lang</h1>
          </a>
          <div className="text-gray-500">Loading languages...</div>
        </div>
      </header>
    );
  }

  if (languagesError) {
    return (
      <header className="bg-red-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between text-red-700">
          <a href="/" className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-5" /><circle cx="16" cy="16" r="6" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900">Lang<span className="text-primary">2</span>Lang</h1>
          </a>
          <div>Error loading languages: {languagesError.message}</div>
        </div>
      </header>
    );
  }

  // If we reach this point, languages are loaded, and there's no error.
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="m5 8 6 6" />
            <path d="m4 14 6-6 2-3" />
            <path d="M2 5h12" />
            <path d="M7 2h1" />
            <path d="m22 22-5-5" />
            <circle cx="16" cy="16" r="6" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900">Lang<span className="text-primary">2</span>Lang</h1>
        </a>

        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <div className="relative">
            <select
              id="language-selector"
              className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              // The 'value' should be the 'code' of the currentLanguage object, or an empty string if null
              value={currentLanguage?.code || ''}
              onChange={handleLanguageChange}
            >
              {/* Ensure allLanguages is an array before mapping (though isLoading check handles this) */}
              {allLanguages.map(lang => (
                <option key={lang.id} value={lang.code}> {/* Use lang.id for key */}
                  {getFormattedLanguage(lang.code)} {/* Use getFormattedLanguage from context */}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <span className="material-icons text-sm">keyboard_arrow_down</span>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            id="theme-toggle"
            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={toggleTheme}
          >
            <span className="material-icons">{isDarkMode ? 'dark_mode' : 'light_mode'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;