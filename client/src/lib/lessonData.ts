import { useQuery } from "@tanstack/react-query";
import { Lesson, Exchange } from "@shared/schema";

export const useLessons = (topicId: number) => {
  return useQuery({
    queryKey: ['/api/lessons', topicId],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/lessons?topicId=${queryKey[1]}`);
      if (!response.ok) {
        throw new Error('Failed to fetch lessons');
      }
      return response.json() as Promise<Lesson[]>;
    },
    enabled: !!topicId
  });
};

export const useLesson = (id: number) => {
  return useQuery({
    queryKey: [`/api/lessons/${id}`],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0]);
      if (!response.ok) {
        throw new Error('Failed to fetch lesson');
      }
      const lesson = await response.json() as Lesson;
      
      // Parse the exchanges JSON if it's a string
      if (typeof lesson.exchanges === 'string') {
        lesson.exchanges = JSON.parse(lesson.exchanges);
      }
      
      return lesson;
    },
    enabled: !!id
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

export interface UserAnswer {
  exchangeId: string;
  blankIndex: number;
  answer: string;
  isCorrect: boolean;
  isAlmostCorrect?: boolean;
}

// Sample data for use during development
export const sampleLessonData = {
  id: 1,
  topicId: 2,
  title: "Finding Your Way Around",
  context: "You're in Madrid and need to find the nearest subway station. You approach a local person to ask for directions.",
  exchanges: [
    {
      id: "ex1",
      speaker: "user",
      speakerName: "You",
      nativeText: "Excuse me, could you tell me where the nearest subway station is?",
      translatedText: "Disculpe, ¿podría decirme dónde está la estación de metro más cercana?",
      blanks: [
        { index: 2, correctAnswer: "decirme" },
        { index: 7, correctAnswer: "metro" }
      ]
    },
    {
      id: "ex2",
      speaker: "other",
      speakerName: "Local person",
      nativeText: "Of course. The nearest subway station is two blocks away. Walk straight ahead and then turn right at the pharmacy.",
      translatedText: "Claro. La estación de metro más cercana está a dos manzanas. Camine recto y luego gire a la derecha en la farmacia.",
      blanks: [
        { index: 5, correctAnswer: "cercana" },
        { index: 13, correctAnswer: "derecha" }
      ]
    },
    {
      id: "ex3",
      speaker: "user",
      speakerName: "You",
      nativeText: "Is it the Sol station or Callao station?",
      translatedText: "¿Es la estación Sol o la estación Callao?",
      blanks: [
        { index: 2, correctAnswer: "estación" },
        { index: 5, correctAnswer: "estación" }
      ]
    },
    {
      id: "ex4",
      speaker: "other",
      speakerName: "Local person",
      nativeText: "It's Sol station. It's very central and many metro lines pass through there.",
      translatedText: "Es la estación Sol. Es muy céntrica y muchas líneas de metro pasan por allí.",
      blanks: [
        { index: 3, correctAnswer: "Sol" },
        { index: 9, correctAnswer: "pasan" }
      ]
    },
    {
      id: "ex5",
      speaker: "user",
      speakerName: "You",
      nativeText: "How long does it take to walk there?",
      translatedText: "¿Cuánto tiempo se tarda en caminar hasta allí?",
      blanks: [
        { index: 1, correctAnswer: "tiempo" },
        { index: 5, correctAnswer: "caminar" }
      ]
    },
    {
      id: "ex6",
      speaker: "other",
      speakerName: "Local person",
      nativeText: "About 5 minutes, not long at all.",
      translatedText: "Unos 5 minutos, no es mucho tiempo.",
      blanks: [
        { index: 1, correctAnswer: "minutos" },
        { index: 5, correctAnswer: "tiempo" }
      ]
    },
    {
      id: "ex7",
      speaker: "user",
      speakerName: "You",
      nativeText: "Thank you very much for your help!",
      translatedText: "¡Muchas gracias por su ayuda!",
      blanks: [
        { index: 0, correctAnswer: "Muchas" },
        { index: 3, correctAnswer: "ayuda" }
      ]
    }
  ] as Exchange[]
};
