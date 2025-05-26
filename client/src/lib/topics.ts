import { Topic } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from '../config'; 

export interface TopicCategory {
  name: string;
  topics: Topic[];
}

export const useTopics = (targetLanguage: string) => {
  return useQuery({
    queryKey: ['/api/topics', targetLanguage],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`${API_BASE_URL}/api/topics?targetLanguage=${queryKey[1]}`);
      if (!response.ok) {
        throw new Error('Failed to fetch topics');
      }
      return response.json() as Promise<Topic[]>;
    }
  });
};

export const useTopic = (id: number) => {
  return useQuery({
    queryKey: [`/api/topics/${id}`],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`${API_BASE_URL}${queryKey[0]}`); 
      if (!response.ok) {
        throw new Error('Failed to fetch topic');
      }
      return response.json() as Promise<Topic>;
    },
    enabled: !!id
  });
};

export const getCategorizedTopics = (topics: Topic[]): TopicCategory[] => {
  const categories: Record<string, Topic[]> = {};
  
  topics.forEach(topic => {
    if (!categories[topic.category]) {
      categories[topic.category] = [];
    }
    categories[topic.category].push(topic);
  });
  
  return Object.entries(categories).map(([name, topics]) => ({
    name,
    topics
  }));
};

export const defaultTopics: Topic[] = [
  {
    id: 1,
    title: "Grocery Shopping",
    description: "Learn essential vocabulary and phrases for buying groceries and navigating supermarkets.",
    category: "Daily Situations",
    difficulty: "Beginner",
    targetLanguage: "es",
    sourceLanguage: "en",
    tags: ["shopping", "food", "daily life"],
    imagePath: null
  },
  {
    id: 2,
    title: "Asking for Directions",
    description: "Learn how to ask for and understand directions in Spanish. Master vocabulary for locations, spatial relations, and navigating a city.",
    category: "Daily Situations",
    difficulty: "Beginner",
    targetLanguage: "es",
    sourceLanguage: "en",
    tags: ["travel", "navigation", "city"],
    imagePath: null
  },
  {
    id: 3,
    title: "Banking Services",
    description: "Learn vocabulary and phrases related to banking, opening accounts, and discussing financial options.",
    category: "Daily Situations",
    difficulty: "Intermediate",
    targetLanguage: "es",
    sourceLanguage: "en",
    tags: ["finance", "money", "services"],
    imagePath: null
  }
];
