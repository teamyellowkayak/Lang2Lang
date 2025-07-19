// client/src/components/PhraseWordsDisplay.tsx

import React, { useState, useEffect } from 'react';
import type { Vocabulary } from '@shared/schema'; // Keep this for type definition

interface PhraseWordsDisplayProps {
  phrase: string; // The phrase that was looked up (for display purposes if needed)
  sourceLanguage: string; // Still useful for display context
  targetLanguage: string; // Still useful for display context
  translatedWords: Vocabulary[] | null; // CRITICAL: This is the data it should display
}

const PhraseWordsDisplay: React.FC<PhraseWordsDisplayProps> = ({
  phrase,
  sourceLanguage,
  targetLanguage,
  translatedWords, // CRITICAL: Destructure the incoming translatedWords prop
}) => {

  const [hiddenTranslations, setHiddenTranslations] = useState<Set<string>>(new Set());

  // This logic is now handled in Lesson.tsx and the results are passed via `translatedWords` prop.
  useEffect(() => {
    // This useEffect is now only for resetting hidden translations when the phrase changes
    // or when new translatedWords come in (though the latter might not strictly be needed if phrase is the trigger)
    if (translatedWords && translatedWords.length > 0) {
      // Initially hide all translations when new data arrives
      const initialHidden = new Set(translatedWords.map(item => item.word));
      setHiddenTranslations(initialHidden);
    } else {
      setHiddenTranslations(new Set()); // Clear if no translations
    }
  }, [translatedWords]); // Re-run when the translatedWords prop changes

  const toggleTranslationVisibility = (word: string) => {
    setHiddenTranslations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(word)) {
        newSet.delete(word);
      } else {
        newSet.add(word);
      }
      return newSet;
    });
  };

  // Simplify loading and error checks based on the `translatedWords` prop being available
  if (!translatedWords) {
      // This state implies loading or no data yet, controlled by parent's `performLookup`
      return <div className="text-center text-gray-500 py-4">Enter a phrase or click "Lookup Phrase" / "Hint" to see words.</div>;
  }

  if (translatedWords.length === 0) {
    // This could mean lookup returned no results, or initial state
    return <div className="text-center text-gray-500 py-4">No words found or translated for this phrase.</div>;
  }

  // If you want to show a loading state based on parent's `translatedWords` becoming null/empty
  // after a new lookup starts (if Lesson.tsx sets translatedWords to null during lookup),
  // you'd need a `loading` prop passed down from Lesson.tsx/PhraseHelpPanel.tsx.
  // For now, we'll assume `translatedWords` being null/empty indicates either no lookup or no results.


  return (
    <div className="phrase-words-display mt-4">
      <ul className="space-y-2">
        {translatedWords.map((item, index) => ( // CRITICAL: Map over translatedWords prop
          <li key={index} className="flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center">
              <span className="text-gray-800 text-lg font-medium cursor-pointer" onClick={() => toggleTranslationVisibility(item.word)}>
                {item.word}
              </span>
              {item.partOfSpeech && <span className="ml-2 text-gray-500 text-xs italic">({item.partOfSpeech})</span>}
              {item.gender && <span className="ml-1 text-gray-500 text-xs italic">[{item.gender}]</span>}
            </div>
            <div
              className={`text-green-600 font-semibold text-lg ${hiddenTranslations.has(item.word) ? 'invisible' : 'visible'}`}
              style={{ minWidth: '80px', textAlign: 'right' }}
              onClick={() => toggleTranslationVisibility(item.word)}
            >
              {item.translation || '[undefined]'}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PhraseWordsDisplay;