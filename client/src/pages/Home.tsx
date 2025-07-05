// Home.tsx

import { useState } from 'react';
import { useLanguage } from '@/lib/languages';
import { useTopics, getCategorizedTopics } from '@/lib/topics';
import TopicSelection from '@/components/TopicSelection';
import TopicPreview from '@/components/TopicPreview';
import { Topic } from '@shared/schema';

const Home = () => {
  console.log("Rendering Home component.");
  
  // Destructure the values provided by LanguageContext through useLanguage hook
  // You now get:
  // - currentLanguageCode (string): The 'code' of the current language (e.g., "en2es")
  // - setCurrentLanguageCode (function): To change the current language
  // - allLanguages (Language[]): The array of all fetched languages
  // - isLoadingLanguages (boolean): Whether the languages are still loading
  // - languagesError (Error | null): Any error during language fetching
  const {
    currentLanguage,          // This is the Language object (or null)
    setCurrentLanguageCode,   // This is the function to update the language by its code
    allLanguages,             // This is the array of all fetched languages
    isLoadingLanguages,       // Boolean indicating if languages are still being fetched
    languagesError,           // Error object if fetching failed
    getFormattedLanguage      // This helper function is now provided by the context
  } = useLanguage();

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // --- ADD THESE CONSOLE LOGS ---
  console.log('Home.tsx: isLoadingLanguages', isLoadingLanguages);
  console.log('Home.tsx: languagesError', languagesError);
  console.log('Home.tsx: currentLanguage (object)', currentLanguage);
  console.log('Home.tsx: currentLanguage.code (string)', currentLanguage?.code);
  // --- END CONSOLE LOGS ---

  // Pass the currentLanguageCode to useTopics.
  // We need to ensure currentLanguageCode is valid before useTopics fires.
  // useTopics will probably also have its own isLoading.
  // Provide a default fallback
  const languageCodeForTopics = currentLanguage?.code || "es"; 
  
  const { data: topics, isLoading: isTopicsLoading } = useTopics(languageCodeForTopics);

  // --- ADD THESE CONSOLE LOGS ---
  console.log('Home.tsx: isTopicsLoading', isTopicsLoading);
  console.log('Home.tsx: topics data', topics);
  // --- END CONSOLE LOGS ---
  
  const categorizedTopics = topics
    ? getCategorizedTopics(topics)
    : [];

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
  };

  // 1. Handle Language Loading State FIRST
  if (isLoadingLanguages) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        Loading application languages...
      </div>
    );
  }

  // 2. Handle Language Error State
  if (languagesError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-red-500">
        Error loading languages: {languagesError.message}
      </div>
    );
  }

  // At this point, languages are loaded (allLanguages is available)
  // and currentLanguageCode is set.

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Optional: Add a language selector here if you want users to change the language */}
      {/*
      <div className="mb-4">
        <label htmlFor="language-select" className="block text-sm font-medium text-gray-700">
          Select Language:
        </label>
        <select
          id="language-select"
          value={currentLanguageCode}
          onChange={(e) => setCurrentLanguageCode(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {allLanguages.map(lang => (
            <option key={lang.id} value={lang.code}>
              {lang.name} ({lang.nativeName})
            </option>
          ))}
        </select>
      </div>
      */}

      <div className="flex flex-col md:flex-row gap-8">
        <TopicSelection
          categories={categorizedTopics}
          onTopicSelect={handleTopicSelect}
          selectedTopic={selectedTopic}
          // Pass the combined loading state if useTopics depends on currentLanguageCode
          isLoading={isTopicsLoading || !currentLanguageCode} // Topics are loading OR currentLanguageCode isn't set yet
          // You might need to pass currentLanguageCode to TopicSelection if it needs to display it
          // currentLanguageCode={currentLanguageCode}
        />

        <TopicPreview
          topic={selectedTopic}
          // Combine loading states: if topics are loading OR no topic selected yet, and languages are loaded.
          isLoading={isTopicsLoading && !selectedTopic}
        />
      </div>
    </div>
  );
};

export default Home;