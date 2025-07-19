// client/src/components/PhraseChatDisplay.tsx

import React, { useState, useEffect } from "react";
import "./PhraseChatDisplay.css";

interface PhraseChatDisplayProps {
  nativeText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;

  // --- NEW PROPS (received from parent) ---
  chatExplanation: string | null;   // The AI explanation itself
  isLoadingChat: boolean;           // Loading state for the AI call
  chatError: string | null;         // Error message from the AI call

  // Function to call the AI chat API, passed from parent
  // It only needs the user's question, as nativeText/translatedText are already props.
  onAskAIQuestion: (userQuestion: string) => void;
}

const DEFAULT_CHAT_QUESTION = "Explain why this translates this way.";

const PhraseChatDisplay: React.FC<PhraseChatDisplayProps> = ({
  nativeText,
  translatedText,
  sourceLanguage,
  targetLanguage,
  // --- Destructure new props ---
  chatExplanation,
  isLoadingChat,
  chatError,
  onAskAIQuestion, // The function to call
}) => {
  const [userQuestion, setUserQuestion] = useState(DEFAULT_CHAT_QUESTION);

  // Effect to reset user question when context changes
  useEffect(() => {
    setUserQuestion(DEFAULT_CHAT_QUESTION);
    // Note: We no longer reset explanation, isLoadingChat, chatError here
    // because they are managed by the parent via props.
  }, [nativeText, translatedText, sourceLanguage, targetLanguage]);

  const handleAskQuestion = () => { // Make it synchronous, as the async part is in parent
    if (!userQuestion.trim()) {
      alert("Please enter a question."); // Use simple alert for UI feedback
      return;
    }
    if (!nativeText.trim() || !translatedText.trim()) {
        alert("Both original and translated text must be available to ask a question.");
        return;
    }

    // Call the parent's function to trigger the API request
    onAskAIQuestion(userQuestion);
  };

  return (
    <div className="phrase-chat-display">
      <div className="chat-context">
        <p>
          <strong>Original ({sourceLanguage}):</strong> {nativeText}
        </p>
        <p>
          <strong>Translated ({targetLanguage}):</strong> {translatedText}
        </p>
      </div>

      <div className="chat-input-section">
        <textarea
          className="chat-question-textarea"
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
          rows={4}
          placeholder="Type your question about the translation here..."
          disabled={isLoadingChat} // Use prop for disabled state
        />
        <button
          className="chat-send-button"
          onClick={handleAskQuestion}
          disabled={isLoadingChat || !nativeText.trim() || !translatedText.trim()} // Use prop for disabled state
        >
          {isLoadingChat ? "Thinking..." : "Ask AI"}
        </button>
      </div>

      {chatError && <p className="chat-error-message">Error: {chatError}</p>} {/* Use prop for error message */}

      {chatExplanation && (
        <div className="chat-explanation-section">
          <h3>AI Explanation:</h3>
          <p>{chatExplanation}</p> {/* Use prop for explanation */}
        </div>
      )}
    </div>
  );
};

export default PhraseChatDisplay;