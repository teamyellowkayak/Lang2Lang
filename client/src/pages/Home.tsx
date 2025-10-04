// Home.tsx

import { useLanguage, LanguageContext } from '@/lib/languageContext';
import { useTopics, getCategorizedTopics } from '@/lib/topics';
import TopicSelection from '@/components/TopicSelection';
import TopicPreview from '@/components/TopicPreview';
import type { Topic } from '@shared/schema';
import { useState, useContext, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';

const Home = () => {
  console.log("Rendering Home component.");

  // Access the authentication status using the custom useAuth hook
  const { isAuthenticated } = useAuth();
  
  // Destructure the values provided by LanguageContext through useLanguage hook
  const {
    currentLanguage,
    setCurrentLanguageCode,
    allLanguages,
    isLoadingLanguages,
    languagesError,
    getFormattedLanguage
  } = useLanguage();

  const rawContextValue = useContext(LanguageContext);
  console.log('Home.tsx: Raw context value from useContext directly:', rawContextValue);

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  console.log('Home.tsx: isLoadingLanguages', isLoadingLanguages);
  console.log('Home.tsx: languagesError', languagesError);
  console.log('Home.tsx: currentLanguage (object)', currentLanguage);
  console.log('Home.tsx: currentLanguage.code (string)', currentLanguage?.code);
  console.log('Home.tsx: isAuthenticated', isAuthenticated);

  useEffect(() => {
    console.log("Home.tsx useEffect: isLoadingLanguages changed to", isLoadingLanguages);
    if (!isLoadingLanguages && !languagesError && allLanguages && allLanguages.length > 0) {
      console.log("Home.tsx useEffect: Languages are confirmed loaded and ready!");
    }
  }, [isLoadingLanguages, languagesError, allLanguages]);

  const languageCodeForTopics = currentLanguage?.code || "es";

  // Use React Query's `enabled` option to conditionally fetch topics
  const { data: topics, isLoading: isTopicsLoading } = useTopics(languageCodeForTopics, {
    enabled: isAuthenticated && !isLoadingLanguages && !languagesError && !!currentLanguage?.code
  });

  console.log('Home.tsx: isTopicsLoading', isTopicsLoading);
  console.log('Home.tsx: topics data', topics);

  const categorizedTopics = topics
    ? getCategorizedTopics(topics)
    : [];

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
    
    // Wait for the state update (which triggers TopicPreview to render/update)
    setTimeout(() => {
      const topicContentSection = document.getElementById('topic-preview-section');
      if (topicContentSection) {
        // Use 'smooth' behavior for a nicer transition on mobile
        topicContentSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 0); // Use setTimeout(..., 0) to ensure scroll happens after React renders the new state
  };

  // 1. Handle overall application loading states first
  if (!isAuthenticated) {
    // This state should ideally be handled by App.tsx rendering PasswordGate
    // but as a fallback/clarification, if Home renders without auth, show message
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        Authentication required to view content.
      </div>
    );
  }

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
  // currentLanguageCode is set, AND isAuthenticated is true.

  // 3. Handle Topics Loading State
  // This state will only be reached if isAuthenticated is true
  if (isTopicsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        Loading topics...
      </div>
    );
  }

  console.log('home.tsx 1: about to run setCurrentLanguageCode');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <TopicSelection
          categories={categorizedTopics}
          onTopicSelect={handleTopicSelect}
          selectedTopic={selectedTopic}
          isLoading={isTopicsLoading}
        />

        <div id="topic-preview-section" className="w-full md:w-2/3"> 
          <TopicPreview
            topic={selectedTopic}
            isLoading={isTopicsLoading && !selectedTopic}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;