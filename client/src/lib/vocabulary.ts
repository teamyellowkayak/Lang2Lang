import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";
import { WordDetail, ChatMessage } from "@shared/schema";
import { API_BASE_URL } from '../config';

export const useWordDetails = (word: string, targetLanguage: string) => {
  return useQuery<WordDetail, Error>({ 
    queryKey: ['/api/vocabulary', word, targetLanguage], 
    queryFn: async ({ queryKey }) => {
      const [_, fetchedWord, fetchedTargetLanguage] = queryKey; // Destructure correctly
      // Ensure fetchedWord and fetchedTargetLanguage are treated as strings
      const response = await fetch(`${API_BASE_URL}/api/vocabulary?word=${fetchedWord}&targetLanguage=${fetchedTargetLanguage}`);
      if (!response.ok) {
        // If not found, return a basic structure
        if (response.status === 404) {
          return {
            id: `not-found-${fetchedWord}-${fetchedTargetLanguage}`,
            word: fetchedWord as string,
            translation: "No translation available",
            partOfSpeech: "",
            definition: "No definition available",
            examples: [],
            relatedWords: [],
            targetLanguage: fetchedTargetLanguage as string,
            sourceLanguage: "en"
          } as WordDetail;
        }
        throw new Error('Failed to fetch word details');
      }
      return response.json() as Promise<WordDetail>;
    },
    gcTime: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
    enabled: !!word && !!targetLanguage
  });
};

export const useSendChatMessage = () => {
  const sendMessage = async (question: string, word: string, targetLanguage: string): Promise<ChatMessage> => {
    try {
      const response = await apiRequest("POST", "${API_BASE_URL}/api/chat", {
        question,
        word,
        targetLanguage
      });
      
      const data = await response.json();
      
      return {
        id: Date.now().toString(),
        sender: 'assistant',
        text: data.response,
        timestamp: data.timestamp || Date.now()
      };
    } catch (error) {
      console.error("Error sending chat message:", error);
      return {
        id: Date.now().toString(),
        sender: 'assistant',
        text: "Sorry, I couldn't process your question. Please try again.",
        timestamp: Date.now()
      };
    }
  };
  
  return { sendMessage };
};

/*
// Sample vocabulary data for use during development
export const sampleVocabularyData: Vocabulary = {
  id: 1,
  word: "metro",
  translation: "subway, metro",
  partOfSpeech: "noun",
  gender: "masculine",
  definition: "An underground railway system that operates in a city.",
  examples: [
    "El metro es más rápido que el autobús. (The subway is faster than the bus.)",
    "Tomo el metro todos los días para ir al trabajo. (I take the subway every day to go to work.)"
  ],
  notes: "Unlike in English, 'metro' is always masculine in Spanish, so it uses 'el' as its article, not 'la'.",
  targetLanguage: "es",
  sourceLanguage: "en",
  relatedWords: ["estación", "tren", "transporte"]
};
*/