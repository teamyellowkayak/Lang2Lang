import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Lesson, Exchange } from '@shared/schema';
import WordExploration from './WordExploration';
import { generateNewFillInTheBlanks, UserAnswer } from '@/lib/lessonData';
import { useLanguage } from '@/lib/languages';

interface LessonContentProps {
  lesson: Lesson;
  currentExchangeIndex: number;
  onComplete: () => void;
}

const LessonContent: React.FC<LessonContentProps> = ({
  lesson,
  currentExchangeIndex,
  onComplete
}) => {
  const { currentLanguage } = useLanguage();
  const [exchanges, setExchanges] = useState<Exchange[]>(
    Array.isArray(lesson.exchanges) ? lesson.exchanges : []
  );
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showFeedback, setShowFeedback] = useState<'success' | 'error' | null>(null);
  const [repeatMode, setRepeatMode] = useState<'same' | 'similar' | null>(null);

  const currentExchange = useMemo(() => {
    return exchanges[currentExchangeIndex] || null;
  }, [exchanges, currentExchangeIndex]);

  // Generate input states for each blank in the current exchange
  const [inputs, setInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    // Reset inputs when the exchange changes
    if (currentExchange?.blanks) {
      const initialInputs: Record<number, string> = {};
      currentExchange.blanks.forEach(blank => {
        initialInputs[blank.index] = '';
      });
      setInputs(initialInputs);
      setShowOptions(false);
      setShowHint(false);
      setShowFeedback(null);
    }
  }, [currentExchange]);

  // Function to process the exchange text and fill in blanks
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
          // If this word is a blank answer elsewhere, replace with synonym or similar
          // For now, let's hide it with an asterisk or change its form
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
  
  // Get the text to display, which may have blank placeholders
  const displayText = useMemo(() => {
    if (!currentExchange) return '';
    return processExchangeText(currentExchange);
  }, [currentExchange, processExchangeText]);
  
  // Split the display text into words for rendering individual words
  const words = useMemo(() => {
    return displayText.split(' ');
  }, [displayText]);

  // Helper function to normalize text for comparison (removes accents and punctuation)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[.,!?;:()]/g, ""); // Remove punctuation
  };

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
        exchangeId: currentExchange.id,
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
    setShowHint(false);
  };

  const handleRepeat = (mode: 'same' | 'similar') => {
    setRepeatMode(mode);
    
    if (mode === 'same') {
      // Reset current exchange but keep the same blanks
      const initialInputs: Record<number, string> = {};
      if (currentExchange?.blanks) {
        currentExchange.blanks.forEach(blank => {
          initialInputs[blank.index] = '';
        });
      }
      setInputs(initialInputs);
    } else if (mode === 'similar') {
      // Generate new blanks for all exchanges
      const newExchanges = generateNewFillInTheBlanks(exchanges);
      setExchanges(newExchanges);
      
      // Reset inputs for the new blanks
      const initialInputs: Record<number, string> = {};
      if (newExchanges[currentExchangeIndex]?.blanks) {
        newExchanges[currentExchangeIndex].blanks.forEach(blank => {
          initialInputs[blank.index] = '';
        });
      }
      setInputs(initialInputs);
    }
    
    setShowOptions(false);
    setShowHint(false);
    setShowFeedback(null);
    setUserAnswers([]);
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

  const getWordOptions = () => {
    if (!currentExchange?.blanks) return [];

    const correctWords = currentExchange.blanks.map(blank => blank.correctAnswer);
    
    // Add some incorrect but plausible options
    const additionalOptions = [
      'encontrar', 'autobús', 'preguntar', 'tren', 'indicar', 'mostrar',
      'camino', 'dirección', 'llegar', 'parada', 'ciudad', 'lugar'
    ];
    
    // Combine correct answers with additional options, then shuffle
    const options = [...correctWords, ...additionalOptions.slice(0, 8 - correctWords.length)];
    return options.sort(() => Math.random() - 0.5);
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

  const renderWordOrBlank = (word: string, index: number) => {
    // Special handling for our blank placeholder (now "______")
    if (word === "______") {
      // Find the blank index that corresponds to this position
      const blankIndex = currentExchange?.blanks?.findIndex(blank => blank.index === index);
      
      if (blankIndex === undefined || blankIndex === -1) {
        // Fallback in case we couldn't find the blank
        return <span>{word}</span>;
      }
      
      // This is a blank to fill in
      const userAnswer = userAnswers.find(
        ans => ans.exchangeId === currentExchange!.id && ans.blankIndex === index
      );
      
      const correct = userAnswer?.isCorrect;
      const correctAnswer = currentExchange?.blanks?.find(blank => blank.index === index)?.correctAnswer;
      
      return (
        <span className="fill-blank mx-1" key={`blank-${index}`}>
          {showFeedback && userAnswer ? (
            <span>
              {correct ? (
                // If the answer is correct but not exact (missing accents), show it in green
                <span className="text-green-600">
                  {userAnswer.isAlmostCorrect ? correctAnswer : userAnswer.answer}
                </span>
              ) : (
                // If the answer is wrong, show the user's input in red and the correct answer in green
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
              value={inputs[index] || ''}
              onChange={(e) => handleInputChange(index, e.target.value)}
            />
          )}
        </span>
      );
    } else {
      // Regular word, might be clickable if from the other speaker
      return (
        <span
          key={`word-${index}`}
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
                        words.map((word, wordIdx) => (
                          <span key={`word-fragment-${wordIdx}`}>
                            {renderWordOrBlank(word, wordIdx)}
                            {wordIdx < words.length - 1 && " "}
                          </span>
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
                    setShowHint(!showHint);
                    if (!showHint) setShowOptions(false);
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium flex items-center"
                >
                  <span className="material-icons mr-1 text-sm">lightbulb</span>
                  Hint
                </button>
                
                <button 
                  onClick={() => {
                    setShowOptions(!showOptions);
                    if (!showOptions) setShowHint(false);
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
                    {getWordOptions().map((option, index) => (
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
            
            {/* Hints */}
            {showHint && (
              <div className="mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <span className="font-medium">Hint:</span> {
                      currentExchange.id === 'ex1' 
                        ? 'The first blank is a verb for "tell me" and the second is the Spanish word for "subway/metro"'
                        : 'Look for words related to the context of the conversation'
                    }
                  </p>
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
              onClick={() => onComplete()}
            >
              <span className="material-icons mr-1">arrow_back</span>
              Previous
            </button>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => handleRepeat('same')}
                className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary-50 flex items-center"
              >
                <span className="material-icons mr-1 text-sm">replay</span>
                Repeat
              </button>
              <button 
                onClick={() => handleRepeat('similar')}
                className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary-50 flex items-center"
              >
                <span className="material-icons mr-1 text-sm">shuffle</span>
                Similar
              </button>
              <button 
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center"
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
      <div className="w-full lg:w-1/3 mt-6 lg:mt-0">
        <WordExploration 
          word={selectedWord}
          targetLanguage={currentLanguage}
        />
      </div>
    </div>
  );
};

export default LessonContent;
