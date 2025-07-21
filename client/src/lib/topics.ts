// @/lib/topics.ts

import type { Topic } from "@shared/schema";
import { useQuery, UseQueryOptions } from "@tanstack/react-query"; // Import UseQueryOptions
import { callApiWithAuth } from '@/utils/auth'; // Import callApiWithAuth
import { useAuth } from '@/lib/authContext';

export interface TopicCategory {
  name: string;
  topics: Topic[];
}

// Define the specific options type for useTopics,
// omitting properties that are set internally by useTopics itself.
type UseTopicsOptions = Omit<
  UseQueryOptions<Topic[], Error, Topic[], ['/api/topics', string]>,
  'queryKey' | 'queryFn'
>;

export const useTopics = (
  targetLanguage: string,
  options?: UseTopicsOptions // Add options parameter here
) => {
  const { isAuthenticated } = useAuth();
  return useQuery<Topic[], Error, Topic[], ['/api/topics', string]>({ // Explicitly type useQuery
    queryKey: ['/api/topics', targetLanguage],
    queryFn: async ({ queryKey }) => {
      // Use callApiWithAuth to ensure authentication header is included
      const response = await callApiWithAuth(`/api/topics?targetLanguage=${queryKey[1]}`, {
        method: 'GET' // Specify method if not default GET
      });

      if (!response.ok) {
        // Get more detailed error message from the backend
        const errorText = await response.text();
        throw new Error(`Failed to fetch topics: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return response.json();
    },
    // Spread the options passed from the component (e.g., Home.tsx)
    // This is where the `enabled` property from Home.tsx will be applied.
    enabled: isAuthenticated && !!targetLanguage && (options?.enabled ?? true),
    ...options,
  });
};

// Define the specific options type for useTopic
type UseTopicOptions = Omit<
  UseQueryOptions<Topic, Error, Topic, [`/api/topics/${string}`]>,
  'queryKey' | 'queryFn'
>;

export const useTopic = (
  id: number,
  options?: UseTopicOptions // Add options parameter here
) => {
  // Ensure the query key correctly represents the unique resource
  // Using a template literal for string key as per React Query best practices for single item
  const queryKey = [`/api/topics/${id}`] as [`/api/topics/${string}`];
  const { isAuthenticated } = useAuth();
  
  return useQuery<Topic, Error, Topic, [`/api/topics/${string}`]>({ // Explicitly type useQuery
    queryKey: queryKey,
    queryFn: async ({ queryKey }) => {
      // Use callApiWithAuth to ensure authentication header is included
      const response = await callApiWithAuth(`${queryKey[0]}`, {
        method: 'GET' // Specify method if not default GET
      });

      if (!response.ok) {
        // Get more detailed error message from the backend
        const errorText = await response.text();
        throw new Error(`Failed to fetch topic: ${response.status} ${response.statusText} - ${errorText}`);
      }
      return response.json();
    },
    enabled: !!id && isAuthenticated && (options?.enabled ?? true),
    ...options,
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
    id: "1",
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
    id: "2",
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
    id: "3",
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