// client/src/components/PhraseHelpPanel.tsx

import React, { useState, useEffect, type KeyboardEvent, useRef } from 'react';
import PhraseWordsDisplay from './PhraseWordsDisplay';
import PhraseChatDisplay from './PhraseChatDisplay';
import { useLanguage } from '@/lib/languageContext'; 
import { Vocabulary } from '@shared/schema';

interface PhraseHelpPanelProps {
  phraseHelpInput: string;
  setPhraseHelpInput: (phrase: string) => void;
  translatedWords: Vocabulary[]; // Results from lookup, controlled by Lesson.tsx
  performPhraseLookup: (nativeText: string) => void; // Function to trigger lookup, controlled via Lesson.tsx
  sourceLanguage: string;
  targetLanguage: string;
  translatedSentence: string;
  chatExplanation: string | null;
  isLoadingChat: boolean;
  chatError: string | null;
  onAskAIQuestion: (nativeText: string, translatedText: string, userQuestion: string) => void;
}

const PhraseHelpPanel: React.FC<PhraseHelpPanelProps> = ({
  phraseHelpInput,
  setPhraseHelpInput,
  translatedWords,
  performPhraseLookup,
  sourceLanguage,
  targetLanguage,
  translatedSentence,
  chatExplanation,
  isLoadingChat,
  chatError,
  onAskAIQuestion,
}) => {
  const [activeTab, setActiveTab] = useState<'words' | 'conjugations' | 'chat'>('words');

  const [displayedPhrase, setDisplayedPhrase] = useState<string>('');

  const isInitialMount = useRef(true);

  const { allLanguages, isLoadingLanguages, languagesError } = useLanguage(); // May need to add back!

  useEffect(() => {
    // if (isInitialMount.current && phraseHelpInput) {
    // console.log("Initial mount/hint triggered. Setting displayedPhrase:", phraseHelpInput);
    if (phraseHelpInput) {
      setDisplayedPhrase(phraseHelpInput);
      setActiveTab('words');
    }
  }, [phraseHelpInput, performPhraseLookup]);

  const handleLookup = () => {
    setDisplayedPhrase(phraseHelpInput);
    console.log('PhraseHelpInput: ',phraseHelpInput);
    performPhraseLookup(phraseHelpInput);
    setActiveTab('words'); // Default to words tab after lookup
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleLookup();
    }
  };

  if (isLoadingLanguages) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 sticky top-20 text-center text-gray-500">
        Loading language data...
      </div>
    );
  }

  if (languagesError) {
    return (
      <div className="bg-red-100 text-red-700 rounded-lg shadow-md p-6 sticky top-20 text-center">
        Error loading languages: {languagesError.message}
      </div>
    );
  }

 if (!targetLanguage || (allLanguages && allLanguages.length < 2)) {
    return (
      <div className="bg-yellow-100 text-yellow-700 rounded-lg shadow-md p-6 sticky top-20 text-center">
        Not enough languages configured for Phrase Help.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Phrase Help</h3>

      <div className="mb-4">
        <label htmlFor="phraseInput" className="block text-sm font-medium text-gray-700 mb-1">
          Enter or view phrase:
        </label>
        <textarea
          id="phraseInput"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          rows={2}
          placeholder="Type a phrase in English here..."
          value={phraseHelpInput}
          onChange={(e) => setPhraseHelpInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleLookup}
          className="mt-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition ease-in-out duration-150"
        >
          Lookup Phrase
        </button>
      </div>

      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'words' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('words')}
        >
          Words
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'conjugations' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('conjugations')}
        >
          Conjugations
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'chat' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('chat')}
        >
          AI Chat
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'words' && displayedPhrase && (
          <PhraseWordsDisplay
            phrase={displayedPhrase}
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
            translatedWords={translatedWords}
          />
        )}
        {activeTab === 'words' && !displayedPhrase && (
          <p className="text-center text-gray-500 py-4">Enter a phrase above or click "Hint" in the lesson.</p>
        )}
        {activeTab === 'conjugations' && (
          <div className="py-4 text-center text-gray-500">
            (Future feature: Tenses and Conjugations)
          </div>
        )}
        {activeTab === 'chat' && (
          <PhraseChatDisplay
            nativeText={displayedPhrase}
            translatedText={translatedSentence}
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
            chatExplanation={chatExplanation}
            isLoadingChat={isLoadingChat}
            chatError={chatError}
            onAskAIQuestion={(userQuestion) =>
              onAskAIQuestion(displayedPhrase, translatedSentence, userQuestion)
            }
          />
        )}
      </div>
    </div>
  );
};

export default PhraseHelpPanel;