import { useState, useEffect } from 'react';
import { useWordDetails, useSendChatMessage } from '@/lib/vocabulary';
import { ChatMessage } from '@shared/schema';

interface WordExplorationProps {
  word: string | null;
  targetLanguage: string;
}

const WordExploration: React.FC<WordExplorationProps> = ({
  word,
  targetLanguage
}) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [questionInput, setQuestionInput] = useState('');
  const { data: wordDetails, isLoading } = useWordDetails(word || '', targetLanguage);
  const { sendMessage } = useSendChatMessage();

  // Reset chat messages when word changes
  useEffect(() => {
    setChatMessages([]);
  }, [word]);

  const handleSendQuestion = async () => {
    if (!word || !questionInput.trim()) return;

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: questionInput,
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setQuestionInput('');

    // Send message to API and get response
    try {
      const response = await sendMessage(questionInput, word, targetLanguage);
      setChatMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!word) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
        <div id="word-exploration">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Word Details</h3>
          
          {/* Default State (No word selected) */}
          <div id="default-state" className="mb-4">
            <p className="text-gray-500 italic">Click on any word in the conversation to see its meaning and usage information.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
        <div id="word-exploration">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Word Details</h3>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
      <div id="word-exploration">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Word Details</h3>
        
        {/* Word Details */}
        <div id="word-details">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xl font-semibold text-gray-900">{word}</h4>
                <p className="text-gray-500 text-sm">
                  {wordDetails?.partOfSpeech}
                  {wordDetails?.gender && `, ${wordDetails.gender}`}
                </p>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <span className="material-icons">volume_up</span>
              </button>
            </div>
            
            <p className="text-primary-700 font-medium mt-1">{wordDetails?.translation}</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-1">Definition</h5>
              <p className="text-gray-600">{wordDetails?.definition}</p>
            </div>
            
            {wordDetails?.examples && wordDetails.examples.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-1">Example Sentences</h5>
                <ul className="space-y-2 text-gray-600 text-sm">
                  {wordDetails.examples.map((example, index) => (
                    <li key={index}>• {example}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {wordDetails?.notes && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-1">Notes</h5>
                <p className="text-gray-600 text-sm">{wordDetails.notes}</p>
              </div>
            )}
          </div>
          
          {/* Related Words */}
          {wordDetails?.relatedWords && wordDetails.relatedWords.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 uppercase tracking-wider mb-2">Related Words</h5>
              <div className="flex flex-wrap gap-2">
                {wordDetails.relatedWords.map((relatedWord, index) => (
                  <button 
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-sm hover:bg-gray-200"
                  >
                    {relatedWord}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Word Chat Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Ask about this word</h3>
          
          <div className="bg-gray-50 rounded-lg p-3 mb-3 max-h-48 overflow-y-auto">
            <div className="space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-gray-500 text-sm italic text-center py-2">
                  Ask a question about "{word}" below
                </p>
              ) : (
                chatMessages.map(message => (
                  <div key={message.id} className="flex">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${
                      message.sender === 'user' 
                        ? 'bg-gray-300 text-gray-600' 
                        : 'bg-primary-100 text-primary-700'
                    } flex items-center justify-center`}>
                      <span className="text-sm">{message.sender === 'user' ? 'Y' : 'A'}</span>
                    </div>
                    <div className={`ml-3 ${
                      message.sender === 'user' 
                        ? 'bg-white' 
                        : 'bg-primary-50'
                    } p-2 rounded-lg shadow-sm`}>
                      <p className="text-gray-800 text-sm">{message.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="flex items-center mt-3">
            <input 
              type="text" 
              placeholder="Ask a question about this word..." 
              className="flex-1 border border-gray-300 rounded-l-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendQuestion()}
            />
            <button 
              className="bg-primary text-white rounded-r-md py-2 px-4 text-sm font-medium hover:bg-primary-dark"
              onClick={handleSendQuestion}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordExploration;
