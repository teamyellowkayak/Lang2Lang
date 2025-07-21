import { WordDetail, ChatMessage } from "@shared/schema";
import { callApiWithAuth } from '@/utils/auth';
import { useAuth } from '@/lib/authContext';
import { useQuery, UseQueryOptions, QueryKey } from "@tanstack/react-query";

type WordDetailsQueryOptions = Omit<
  UseQueryOptions<WordDetail, Error>,
  'queryKey' | 'queryFn'
>;

export const useWordDetails = (
  word: string,
  targetLanguage: string,
  options?: WordDetailsQueryOptions
) => {
  const { isAuthenticated } = useAuth();

  const queryKey = ['/api/vocabulary', word, targetLanguage] as const;

  // No need for the verbose generic on useQuery anymore
  return useQuery({
    queryKey: queryKey,
    queryFn: async ({ queryKey }) => {
      // The types of fetchedWord and fetchedTargetLanguage are now correctly inferred
      const [_, fetchedWord, fetchedTargetLanguage] = queryKey;
      const response = await callApiWithAuth(
        `/api/vocabulary?word=${fetchedWord}&targetLanguage=${fetchedTargetLanguage}`,
        { method: 'GET' }
      );
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
        const errorBody = await response.text();
        throw new Error(`Failed to fetch word details: ${response.status} ${response.statusText} - ${errorBody}`);
      }
      return response.json() as Promise<WordDetail>;
    },
    gcTime: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated && !!word && !!targetLanguage,
    ...options, 
  });
};

export const useSendChatMessage = () => {
  const sendMessage = async (question: string, word: string, targetLanguage: string): Promise<ChatMessage> => {
    try {
      const response = await callApiWithAuth(
        `/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question,
            word,
            targetLanguage,
          }),
        }
      );

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