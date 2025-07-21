// client/src/lib/lessonData.ts

import { useQuery } from "@tanstack/react-query";
import type { Lesson as LessonType, Topic, LessonWithTopic, Exchange } from "@shared/schema";
import { callApiWithAuth } from '@/utils/auth';
import { useAuth } from '@/lib/authContext';

export const useLessons = (topicId: string) => {
  const { isAuthenticated } = useAuth();
  return useQuery<LessonType[], Error>({ 
    queryKey: ['/api/lessons', topicId],
    queryFn: async ({ queryKey }) => {
      const response = await callApiWithAuth(`/api/lessons?topicId=${queryKey[1]}`);
      if (!response.ok) {
        throw new Error('Failed to fetch lessons');
      }
      const data = await response.json();
      return data as LessonType[]; 
    },
    enabled: !!topicId && isAuthenticated,
    gcTime: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLesson = (id: string) => {
  const { isAuthenticated } = useAuth();
  return useQuery<LessonWithTopic, Error>({ // Specify generic type for useQuery
    queryKey: ['/api/lessons', id],
    queryFn: async ({ queryKey }) => {
      const lessonId = queryKey[1] as string;
      const lessonResponse = await callApiWithAuth(`/api/lessons/${lessonId}`);

     if (lessonResponse.status === 304) {
        throw new Error("Lesson data not modified. Re-using cached data or no new data available.");
      }
      
      if (!lessonResponse.ok) {
        // This captures 4xx and 5xx errors
        const errorText = await lessonResponse.text();
        throw new Error(`Failed to load lesson: ${lessonResponse.status} - ${errorText || lessonResponse.statusText}`);
      }

      // Parse lesson data
      let lessonData: LessonType;
      try {
        lessonData = await lessonResponse.json();
      } catch (jsonError) {
        console.error("JSON parsing failed.");
        // You can throw a new error with more context, or the original error
        throw new Error(`Failed to parse lesson data as JSON. Error: ${jsonError}.`);
      }

      // const lessonData: LessonType = await lessonResponse.json(); 
      console.log("Data received from server:", lessonData);
 
      if (!lessonData.topicId) {
        throw new Error("Lesson data is missing topicId.");
      }

      // Fetch Topic data using lesson.topicId
      const topicResponse = await callApiWithAuth(`/api/topics/${lessonData.topicId}`);
      if (!topicResponse.ok) {
        throw new Error(`Failed to fetch topic for lesson: ${topicResponse.statusText}`);
      }
      const topicData: Topic = await topicResponse.json();

      if (typeof lessonData.exchanges === 'string') {
        (lessonData as any).exchanges = JSON.parse(lessonData.exchanges); // Cast to any to allow reassignment if type is strict
      }

      // Combine them into the new LessonWithTopic type
      const combinedData: LessonWithTopic = {
        ...lessonData,
        topicDetails: topicData,
      };

      return combinedData;
    },
    enabled: !!id && isAuthenticated,
    gcTime: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });
};

export const generateNewFillInTheBlanks = (exchanges: Exchange[]): Exchange[] => {
  // Create a deep copy of the exchanges
  const newExchanges = JSON.parse(JSON.stringify(exchanges));
  
  // For each exchange, randomly select new blanks if there are already blanks defined
  newExchanges.forEach((exchange: Exchange) => {
    if (exchange.blanks && exchange.blanks.length > 0) {
      const words = exchange.translatedText.split(' ');
      
      // Remove punctuation from words for better selection
      const cleanWords = words.map(word => word.replace(/[.,!?;:()]/g, ''));
      
      // Find indices of words that have length > 3 (more substantial words)
      const eligibleIndices = cleanWords
        .map((word, index) => word.length > 3 ? index : -1)
        .filter(index => index !== -1);
      
      // If we have enough words, select new random blanks
      if (eligibleIndices.length >= exchange.blanks.length) {
        // Shuffle and take the first n indices
        const shuffled = [...eligibleIndices].sort(() => 0.5 - Math.random());
        const selectedIndices = shuffled.slice(0, exchange.blanks.length);
        
        // Update blanks with new indices and correct answers
        exchange.blanks = selectedIndices.map(index => ({
          index,
          correctAnswer: cleanWords[index]
        }));
      }
    }
  });
  
  return newExchanges;
};
