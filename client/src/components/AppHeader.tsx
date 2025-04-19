import { useState, useContext } from 'react';
import { LanguageContext, languages, getFormattedLanguage } from '@/lib/languages';

const AppHeader = () => {
  const { currentLanguage, setCurrentLanguage } = useContext(LanguageContext);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // In a real implementation, we would add dark mode classes to the body
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentLanguage(e.target.value);
  };

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
              value={currentLanguage}
              onChange={handleLanguageChange}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {getFormattedLanguage(lang.code)}
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
