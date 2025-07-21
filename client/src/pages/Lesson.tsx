// client/src/pages/Lesson.tsx

import { useState, useEffect, useCallback } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useLesson } from '@/lib/lessonData';
import LessonNavigation from '@/components/LessonNavigation';
import LessonContent from '@/components/LessonContent';
import type { LessonWithTopic as LessonType, Exchange, Vocabulary } from '@shared/schema';
import { useLanguage } from '@/lib/languageContext';
import { callApiWithAuth } from '@/utils/auth';
import { useAuth } from '@/lib/authContext';

const Lesson = () => {
  // --- ALL HOOKS MUST BE DECLARED AT THE TOP LEVEL AND UNCONDITIONALLY ---
  const [_, params] = useRoute('/lesson/:id');
  const [__, setLocation] = useLocation();
  console.log("Lesson Params: ", params);
  const lessonId: string = params?.id || 'abc'; 

  console.log('ID being passed to useLesson hook:', lessonId);

  const { data: lesson, isLoading, error } = useLesson(lessonId);
  const [currentExchangeIndex, setCurrentExchangeIndex] = useState(0);

  const { isAuthenticated } = useAuth();
  
  // STATE FOR PHRASE HELP PANEL
  const [phraseHelpInput, setPhraseHelpInput] = useState<string>('');
  const [translatedWords, setTranslatedWords] = useState<Vocabulary[]>([]);
  const [chatExplanation, setChatExplanation] = useState<string | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Access current language from context
  const { currentLanguage } = useLanguage();

  // --- DERIVED STATE (NOT HOOKS) CAN BE CONDITIONAL OR DERIVED SAFELY ---
  // Ensure these are derived safely even if lesson is null/undefined initially
  const exchanges: Exchange[] = Array.isArray(lesson?.exchanges)
    ? lesson.exchanges
    : (typeof lesson?.exchanges === 'string'
        ? JSON.parse(lesson.exchanges)
        : []);

  const totalSteps = exchanges.length;
  const currentExchange = exchanges[currentExchangeIndex];
  const isLastStep = currentExchangeIndex === totalSteps - 1 && totalSteps > 0;

    console.log("Steps: ",currentExchangeIndex.toString()," of ",(totalSteps-1).toString(),isLastStep.toString());

  // Reset phraseFromHint, phraseHelpInput, and translatedWords when moving to a new lesson or exchange
  // This useEffect will run on every render, but its dependencies make it trigger only when needed.
  useEffect(() => {
    setPhraseHelpInput('');
    setTranslatedWords([]);
    setChatExplanation(null);
    setIsLoadingChat(false);
    setChatError(null);
  }, [lessonId, currentExchangeIndex]);

  // Function to perform the vocabulary lookup
  // Its dependencies (currentExchange, currentLanguage) might be null initially, which is fine,
  // as the function itself handles those null checks.
  const performPhraseLookup = useCallback(async (textToLookup: string) => {
    const effectiveSourceLanguage = lesson?.topicDetails?.sourceLanguage || 'en';
    const effectiveTargetLanguage = lesson?.topicDetails?.targetLanguage || 'es';
    if (!textToLookup.trim() || !effectiveTargetLanguage) {
      console.warn("Attempted phrase lookup with empty text or missing target language.");
      setTranslatedWords([]);
      return;
    }

    try {
      const response = await callApiWithAuth(`/api/vocabulary-lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nativeText: textToLookup,
          sourceLanguage: effectiveSourceLanguage,
          targetLanguage: effectiveTargetLanguage,
        }),
      });

      if (!response.ok) {
        let errorBody: { message?: string } = {}; // Initialize with an empty object
        try {
          errorBody = await response.json();
        } catch (jsonError) {
          // If response is not JSON, use its text
          errorBody.message = await response.text();
        }

        const errorMessage = errorBody.message || `API call failed with status ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setTranslatedWords(data);
    } catch (err: any) {
      console.error("Error calling backend vocabulary lookup API:", err.message);
      setTranslatedWords([]);
    }
  }, [lesson?.topicDetails?.sourceLanguage, lesson?.topicDetails?.targetLanguage]);

  const onAskAIQuestion = useCallback(async (
    nativeText: string,
    translatedText: string,
    userQuestion: string
  ) => {
    setIsLoadingChat(true);
    setChatError(null);
    setChatExplanation(null);

    const effectiveSourceLanguage = lesson?.topicDetails?.sourceLanguage || 'en';
    const effectiveTargetLanguage = lesson?.topicDetails?.targetLanguage || 'es';

    if (!nativeText.trim() || !translatedText.trim() || !userQuestion.trim()) {
      setChatError("Please provide all necessary information (original, translated text, and your question).");
      setIsLoadingChat(false);
      return;
    }

    try {
      const response = await callApiWithAuth(`/api/chat-about-sentence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nativeText,
          translatedText,
          userQuestion,
          sourceLanguage: effectiveSourceLanguage,
          targetLanguage: effectiveTargetLanguage,
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          errorData = { message: await response.text() };
        }
        throw new Error(errorData.message || `AI Chat API call failed with status ${response.status}`);
      }

      const data = await response.json();
      setChatExplanation(data.explanation);
    } catch (err: any) {
      console.error("Error fetching chat explanation:", err);
      setChatError(err.message || "An unexpected error occurred during AI chat.");
    } finally {
      setIsLoadingChat(false);
    }
  }, [lesson?.topicDetails?.targetLanguage, lesson?.topicDetails?.sourceLanguage]);

  const handleLessonCompletion = useCallback(async () => { // Make handleLessonCompletion useCallback
    console.log(`Frontend: Attempting to mark lesson ${lessonId} as done`);
    try {
      const response = await callApiWithAuth(`/api/lessons/${lessonId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Frontend: API call failed with status ${response.status}:`, errorData.message || 'Unknown error');
        throw new Error(errorData.message || `Failed to mark lesson as done (Status: ${response.status})`);
      }

      console.log(`Frontend: Lesson ${lessonId} successfully marked as done on the backend.`);
    } catch (error: any) {
      console.error('Frontend: Error during API call to mark lesson as done:', error.message);
    }

    setLocation('/');
  }, [lessonId, setLocation]);

  const handleNextStep = useCallback(() => { // Make handleComplete (now handleNextStep) useCallback to prevent re-creation
    if (!lesson || !Array.isArray(lesson.exchanges)) return;

    if (currentExchangeIndex < lesson.exchanges.length - 1) {
     setCurrentExchangeIndex(currentExchangeIndex + 1);
    } else {
      // handleLessonCompletion();
    }
  }, [lesson, currentExchangeIndex, handleLessonCompletion]); // Add handleLessonCompletion to deps

  const handlePrevious = useCallback(() => { // Make handlePrevious useCallback
    if (currentExchangeIndex > 0) {
      setCurrentExchangeIndex(currentExchangeIndex - 1);
    }
  }, [currentExchangeIndex]);

  const handleNavigation = useCallback((step: number) => { // Make handleNavigation useCallback
    setCurrentExchangeIndex(step - 1);
  }, []); // Empty deps because it only uses the setter

  // MODIFIED: handleHintClick now updates the phraseHelpInput and triggers the lookup
  const handleHintClick = useCallback((hintContent: string) => { // Make handleHintClick useCallback
    console.log("Lesson.tsx: Hint clicked with content:", hintContent);
    setPhraseHelpInput(hintContent);
    performPhraseLookup(hintContent);
  }, [performPhraseLookup]); // Add performPhraseLookup to deps


  // --- CONDITIONAL RENDERING AFTER ALL HOOKS ARE CALLED ---
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-700">Failed to load lesson: {error.message}</p>
          <button
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
            onClick={() => setLocation('/')}
          >
            Return to Topics
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !lesson) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          {/* ... Your loading skeleton JSX here ... */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="flex items-center space-x-1">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="w-24 h-2 bg-gray-200 rounded-full"></div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-2/3">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="h-24 bg-gray-200 rounded mb-6"></div>

                <div className="space-y-6 mb-8">
                  <div className="flex">
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    <div className="ml-4 w-full">
                      <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-6 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-1/3">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex">
      {/* Main Section: Main Lesson Content and Navigation */}
      <div className="flex-grow pr-6">
        <LessonNavigation
          currentStep={currentExchangeIndex + 1}
          totalSteps={totalSteps}
          onNavigate={handleNavigation}
          onDone={handleLessonCompletion}
        />

        <LessonContent
          lesson={lesson as LessonType}
          currentExchangeIndex={currentExchangeIndex}
          isLastStep={isLastStep}
          onPrevious={handlePrevious}
          onCompleteStep={handleNextStep}
          onHintClick={handleHintClick}
          hintText={currentExchange?.nativeText || ''}
          phraseHelpInput={phraseHelpInput}
          setPhraseHelpInput={setPhraseHelpInput}
          translatedWords={translatedWords}
          performPhraseLookup={performPhraseLookup}
          sourceLanguage={lesson?.topicDetails?.sourceLanguage || 'en'}
          targetLanguage={lesson?.topicDetails?.targetLanguage || 'es'}
          chatExplanation={chatExplanation}
          isLoadingChat={isLoadingChat}
          chatError={chatError}
          onAskAIQuestion={onAskAIQuestion}
        />
      </div>
    </div>
  );
};

export default Lesson;