// components/LessonContent.tsx

import React, { useState, useEffect, useMemo, useCallback, useRef, type KeyboardEvent } from 'react';
import type { Lesson as LessonType, Exchange, UserAnswer, LessonWithTopic, WordDetail } from '@shared/schema';
import PhraseHelp from './PhraseHelpPanel';

interface LessonContentProps {
  lesson: LessonWithTopic;
  currentExchangeIndex: number;
  onComplete: () => void;
  onPrevious: () => void;
  hintText: string;
  onHintClick: (content: string) => void;
  phraseHelpInput: string;
  setPhraseHelpInput: (phrase: string) => void;
  translatedWords: WordDetail[];
  performPhraseLookup: (nativeText: string) => void;
  sourceLanguage: string;
  targetLanguage: string;
  chatExplanation: string | null;
  isLoadingChat: boolean;
  chatError: string | null;
  onAskAIQuestion: (nativeText: string, translatedText: string, userQuestion: string) => void;
}

const LessonContent: React.FC<LessonContentProps> = ({
  lesson,
  currentExchangeIndex,
  onComplete,
  onPrevious,
  hintText,
  onHintClick,
  phraseHelpInput,
  setPhraseHelpInput,
  translatedWords,
  performPhraseLookup,
  sourceLanguage,
  targetLanguage,
  chatExplanation,
  isLoadingChat,
  chatError,
  onAskAIQuestion,
}) => {
  const [exchanges, setExchanges] = useState<Exchange[]>(
    Array.isArray(lesson.exchanges) ? lesson.exchanges : []
  );
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [showFeedback, setShowFeedback] = useState<'success' | 'error' | null>(null);

  const currentExchange = useMemo(() => {
    return exchanges[currentExchangeIndex] || null;
  }, [exchanges, currentExchangeIndex]);

  // Generate input states for each blank in the current exchange
  const [inputs, setInputs] = useState<Record<number, string>>({});

  // Store the shuffled word options for the current exchange
  const [shuffledWordOptions, setShuffledWordOptions] = useState<string[]>([]);

  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
 
  // Helper function to normalize text for comparison (removes accents and punctuation)
  const normalizeText = (text: string): string => {
    return text
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[.,!?¿'`;:()]/g, ""); // Remove punctuation
  };

  const getWordOptions = useCallback(() => {
    if (!currentExchange?.blanks) return [];

    const optionsSet = new Set<string>();

    currentExchange.blanks.forEach(blank => {
      optionsSet.add(blank.correctAnswer.toLowerCase().replace(/[.,!?¿'`;:()]/g, ""));
      if (blank.incorrectAnswers && Array.isArray(blank.incorrectAnswers)) {
        blank.incorrectAnswers.forEach(incorrect => {
          optionsSet.add(incorrect.toLowerCase().replace(/[.,!?¿'`;:()]/g, ""));
        });
      }
    });

    const desiredMinTotalOptions = 8;
    const additionalGenericOptions = [
      'de', 'a', 'del', 'la', 'el', 'su',
      'por', 'para', 'las', 'les', 'le', 'los'
    ];

    let genericIndex = 0;
    while (optionsSet.size < desiredMinTotalOptions && genericIndex < additionalGenericOptions.length) {
      optionsSet.add(additionalGenericOptions[genericIndex].toLowerCase());
      genericIndex++;
    }

    // Convert the Set to an Array and shuffle it before returning
    return Array.from(optionsSet).sort(() => Math.random() - 0.5);
  }, [currentExchange]); // Recalculate this function if currentExchange changes

  // useEffect to initialize inputs and populate shuffledWordOptions when currentExchange changes
  useEffect(() => {
    // Reset inputs when the exchange changes
    if (currentExchange?.blanks) {
      const initialInputs: Record<number, string> = {};
      currentExchange.blanks.forEach(blank => {
        initialInputs[blank.index] = '';
      });
      setInputs(initialInputs);
      setShowOptions(false);
      setShowFeedback(null);
      
      const firstBlankIndex = currentExchange.blanks[0]?.index;
      if (firstBlankIndex !== undefined && inputRefs.current[firstBlankIndex]) {
        setTimeout(() => {
          inputRefs.current[firstBlankIndex]?.focus();
        }, 0);
      }
    }

    // Generate and set shuffled word options when the current exchange changes
    if (currentExchange) {
      setShuffledWordOptions(getWordOptions());
    } else {
      setShuffledWordOptions([]); // Clear options if no current exchange
    }
    if (currentExchange) {
      setPhraseHelpInput(currentExchange.nativeText);
      // performPhraseLookup(currentExchange.nativeText);
    }
  }, [currentExchange, getWordOptions, setPhraseHelpInput, performPhraseLookup]);

  // Function to process the exchange text and fill in blanks
/*  
  const processExchangeText = useCallback((exchange: Exchange) => {
    if (!exchange.blanks || exchange.blanks.length === 0) {
      return exchange.translatedText;
    }
    
    // Get all blank answers and their indices
    const blanks = exchange.blanks.map(blank => {
      return { 
        index: blank.index,
        word: blank.correctAnswer
      };
    });
    
    // Start with the original text
    let text = exchange.translatedText;
    let output = "";
    
    // Split by spaces to handle words separately
    const words = text.split(' ');
    
    // Process each word
    words.forEach((word, index) => {
      // Check if this index is a blank
      const isBlankIndex = blanks.some(blank => blank.index === index);
      
      // Clean the word from punctuation for comparison
      const cleanWord = word.replace(/[.,!?;:()]/g, '');
      
      if (isBlankIndex) {
        // Replace this specific word with a blank
        output += "______ ";
      } else {
        // Check if this word appears elsewhere as a blank answer
        const matchingBlank = blanks.find(blank => 
          cleanWord.toLowerCase() === blank.word.toLowerCase()
        );
        
        if (matchingBlank) {
          // If this word is a blank answer elsewhere, replace with asterisk
          const maskedWord = word.replace(/[a-zA-Z]/g, '*');
          output += maskedWord + " ";
        } else {
          // Regular word, keep as is
          output += word + " ";
        }
      }
    });
    
    return output.trim();
  }, []);
*/
  
  // Get the text to display, which may have blank placeholders
  // const displayText = useMemo(() => {
  //  if (!currentExchange) return '';
  //   return processExchangeText(currentExchange);
  // }, [currentExchange, processExchangeText]);
  
  // Split the display text into words for rendering individual words
  // const words = useMemo(() => {
  //   return displayText.split(' ');
  // }, [displayText]);

  const handleCheck = () => {
    if (!currentExchange?.blanks) return;

    const newUserAnswers: UserAnswer[] = [];
    let allCorrect = true;

    currentExchange.blanks.forEach(blank => {
      const userAnswer = inputs[blank.index] || '';
      
      // First check for normalized match (ignoring accents and punctuation)
      const normalizedUserAnswer = normalizeText(userAnswer);
      const normalizedCorrectAnswer = normalizeText(blank.correctAnswer);
      
      // Consider "almost correct" if it's the same word without accents
      const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
      
      if (!isCorrect) {
        allCorrect = false;
      }

      newUserAnswers.push({
        exchangeId: currentExchange.id || `temp-exchange-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        blankIndex: blank.index,
        answer: userAnswer,
        isCorrect,
        // Add a flag to track if it's almost correct (same without accents)
        isAlmostCorrect: normalizedUserAnswer === normalizedCorrectAnswer && userAnswer !== blank.correctAnswer
      });
    });

    setUserAnswers(newUserAnswers);
    setShowFeedback(allCorrect ? 'success' : 'error');
    setShowOptions(false);
  };

  const handleRepeat = () => {
    // Reset current exchange but keep the same blanks
    const initialInputs: Record<number, string> = {};
    if (currentExchange?.blanks) {
        currentExchange.blanks.forEach(blank => {
        initialInputs[blank.index] = '';
        });
        setInputs(initialInputs);    
        setShowOptions(false);
        setShowFeedback(null);
        setUserAnswers([]);
    }
  };

  const handleWordClick = (word: string) => {
    // Remove any punctuation from the word
    const cleanWord = word.replace(/[.,!?;:()]/g, '');
    setSelectedWord(cleanWord);
  };

  const handleInputChange = (index: number, value: string) => {
    setInputs(prev => ({
      ...prev,
      [index]: value
    }));
  };

  const handleOptionClick = (option: string) => {
    // Find the first blank that doesn't have an answer yet
    const blankIndices = Object.keys(inputs).map(Number);
    for (const index of blankIndices) {
      if (!inputs[index]) {
        handleInputChange(index, option);
        return;
      }
    }
    
    // If all blanks are filled, replace the last one
    if (blankIndices.length > 0) {
      const lastIndex = blankIndices[blankIndices.length - 1];
      handleInputChange(lastIndex, option);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
    if (e.key === ' ') { // Check if the pressed key is the space bar
      e.preventDefault(); // Prevent the space character from being entered into the input

      // Get all blank indices for the current exchange, sorted numerically
      const blankIndices = currentExchange?.blanks
        ?.map(blank => blank.index)
        .sort((a, b) => a - b) || [];

      // Find the position of the current blank in the sorted list
      const currentBlankIndexInSortedArray = blankIndices.indexOf(currentIndex);

      // Check if there is a next blank
      if (currentBlankIndexInSortedArray !== -1 && currentBlankIndexInSortedArray < blankIndices.length - 1) {
        const nextBlankIndex = blankIndices[currentBlankIndexInSortedArray + 1];
        const nextInput = inputRefs.current[nextBlankIndex];
        if (nextInput) {
          nextInput.focus(); // Focus on the next input field
        }
      }
      // If it's the last blank, do nothing
    }
  };

  const renderWordOrBlank = (word: string, wordIndex: number) => {
    const blankData = currentExchange?.blanks?.find(blank => blank.index === wordIndex);

    if (blankData) { // If blankData exists, this word position should be a blank
        const userAnswer = userAnswers.find(
          (ans) => ans.exchangeId === currentExchange!.id && ans.blankIndex === wordIndex
    );

    const correct = userAnswer?.isCorrect;
    const correctAnswer = blankData.correctAnswer; // Directly use blankData

    return (
      <span className="fill-blank mx-1" key={`blank-${wordIndex}`}>
        {showFeedback && userAnswer ? (
          <span>
            {correct ? (
              <span className="text-green-600">
                {userAnswer.isAlmostCorrect ? correctAnswer : userAnswer.answer}
              </span>
            ) : (
              <>
                <span className="text-red-400">{userAnswer.answer}</span>
                <span className="ml-1 text-green-600">{correctAnswer}</span>
              </>
            )}
          </span>
        ) : (
          <input
            type="text"
            className="w-24 bg-transparent border-b border-gray-400 outline-none text-center"
            placeholder="______"
            value={inputs[wordIndex] || ''}

            onChange={(e) => handleInputChange(wordIndex, e.target.value)}
            onKeyDown={(e) => handleInputKeyDown(e, wordIndex)}
            ref={(el) => { inputRefs.current[wordIndex] = el; }} 
          />
        )}
      </span>
    );
  } else {
    // This is a regular word, might be clickable if from the other speaker
    return (
      <span
        key={`word-${wordIndex}`} // Use wordIndex here
        className={currentExchange?.speaker === 'other' ? 'clickable-word' : undefined}
        onClick={currentExchange?.speaker === 'other' ? () => handleWordClick(word) : undefined}
      >
        {word}
      </span>
    );
  }
};
  

  if (!currentExchange) {
    return (
      <div className="text-center py-10">
        <p>No lesson content available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Exercise Area */}
      <div className="w-full lg:w-2/3">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{lesson.title}</h2>
          
          {/* Context Scenario */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-gray-700 italic">{lesson.context}</p>
          </div>
          
          {/* Conversation Exchange */}
          <div className="space-y-6 mb-8">
            {exchanges.slice(0, currentExchangeIndex + 1).map((exchange, exchangeIdx) => (
              <div className="flex items-start" key={exchange.id}>
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full ${
                    exchange.speaker === 'user' 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'bg-gray-100 text-gray-700'
                  } flex items-center justify-center font-medium`}>
                    {exchange.speaker === 'user' ? 'Y' : 'L'}
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">{exchange.speakerName}:</p>
                  <div className="text-gray-900 text-lg mt-1">
                    {/* English text */}
                    <p className="text-gray-500 text-base mb-1">{exchange.nativeText}</p>
                    
                    {/* Translated text with interactive words */}
                    <p className="text-gray-900">
                        {exchangeIdx === currentExchangeIndex ? (
                        // Current exchange - interactive with blanks
                        currentExchange.translatedText.split(' ').map((word, wordIdx) => (
                        <React.Fragment key={`word-fragment-${wordIdx}`}>
                        {renderWordOrBlank(word, wordIdx)}
                        {wordIdx < currentExchange.translatedText.split(' ').length - 1 && " "}
                   </React.Fragment>
                    ))
                    ) : (
                    // Previous exchanges - just show the text
                    exchange.translatedText
                    )}

                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Input Controls & Feedback */}
          <div className="border-t border-gray-200 pt-4">
            {currentExchange?.blanks ? (
              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={() => {
                    // Ensure that 'hintText' is passed down as a prop to LessonContent
                    // and 'onHintClick' is also passed down as a prop.
                    if (hintText) { // Only call if there's actual hint content
                      onHintClick(hintText);
                    }
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium flex items-center"
                >
                  <span className="material-icons mr-1 text-sm">lightbulb</span>
                  Hint
                </button>
                
                <button 
                  onClick={() => {
                    setShowOptions(!showOptions);
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium flex items-center"
                >
                  <span className="material-icons mr-1 text-sm">list</span>
                  Show Options
                </button>
                
                <button 
                  onClick={handleCheck}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-md text-sm font-medium flex items-center ml-auto"
                >
                  <span className="material-icons mr-1 text-sm">check</span>
                  Check Answer
                </button>
              </div>
            ) : (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-blue-800">
                  <span className="material-icons inline-block align-text-bottom mr-1">info</span>
                  Read the conversation and understand the context. Click on any words in the response to see their meaning.
                </p>
              </div>
            )}
            
            
            {/* Word Options */}
            {showOptions && (
              <div className="mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {shuffledWordOptions.map((option, index) => (
                      <button 
                        key={index}
                        onClick={() => handleOptionClick(option)}
                        className="px-2 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Feedback */}
            {showFeedback === 'success' && (
              <div className="mb-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-green-800">
                    <span className="font-medium">¡Correcto!</span> You've correctly identified the missing words.
                  </p>
                </div>
              </div>
            )}
            
            {showFeedback === 'error' && (
              <div className="mb-4">
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-red-800">
                    <span className="font-medium">Not quite right.</span> The correct answers are:
                  </p>
                  <ul className="mt-1 text-red-700 ml-4 list-disc">
                    {userAnswers.filter(ans => !ans.isCorrect).map((answer, idx) => {
                      const correctAnswer = currentExchange.blanks?.find(
                        blank => blank.index === answer.blankIndex
                      )?.correctAnswer;
                      
                      return (
                        <li key={idx}>
                          <span className="text-red-400">{answer.answer}</span>{' '}
                          <span className="text-green-600 font-medium">{correctAnswer}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-6">
            <button 
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center"
              disabled={currentExchangeIndex === 0}
              onClick={() => onPrevious()}
            >
              <span className="material-icons mr-1">arrow_back</span>
              Previous
            </button>
            
            <div className="flex space-x-3">
              <button 
                onClick={handleRepeat}
                className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary-50 flex items-center"
              >
                <span className="material-icons mr-1 text-sm">replay</span>
                Repeat
              </button>
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                onClick={() => onComplete()}
              >
                Next
                <span className="material-icons ml-1">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Word Exploration Sidebar */}
      <div className="w-full lg:w-1/3 mt-6 lg:mt-0 lg:ml-6 p-6 bg-white shadow-md rounded-lg">
        <PhraseHelp
          phraseHelpInput={phraseHelpInput}
          setPhraseHelpInput={setPhraseHelpInput}
          translatedWords={translatedWords}
          performPhraseLookup={performPhraseLookup}
          sourceLanguage={sourceLanguage} // Assuming these are props or state in LessonContent
          targetLanguage={targetLanguage} // Adjust as per your actual state/prop management
          translatedSentence={currentExchange.translatedText}
          chatExplanation={chatExplanation}
          isLoadingChat={isLoadingChat}
          chatError={chatError}
          onAskAIQuestion={onAskAIQuestion}
       />
      </div>
    </div>
  );
};

export default LessonContent;
