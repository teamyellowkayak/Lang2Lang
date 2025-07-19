// Lang2Lang/server/shared/schema.ts

import { z } from "zod"; // Keep Zod for defining schemas

// --- User Schema ---
// We're defining the schema directly with Zod, reflecting Firestore's string IDs
export const userSchema = z.object({
  id: z.string(), // Firestore uses string IDs
  username: z.string(),
  password: z.string(),
});

export const insertUserSchema = userSchema.pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema>; // Directly infer from Zod schema

// --- Language Schema ---
export const languageSchema = z.object({
  id: z.string(), // Firestore uses string IDs
  code: z.string(),
  name: z.string(),
  nativeName: z.string(),
  isSourceLanguage: z.number().int().default(0), // Firestore supports numbers. Default can be handled in logic.
});

export const insertLanguageSchema = languageSchema.omit({
  id: true,
});

export type InsertLanguage = z.infer<typeof insertLanguageSchema>;
export type Language = z.infer<typeof languageSchema>;

// --- Topic Schema ---
export const topicSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  difficulty: z.string(),
  targetLanguage: z.string(),
  sourceLanguage: z.string().default("en"),
  tags: z.array(z.string()).optional(), // Firestore arrays work naturally
  imagePath: z.string().optional().nullable(), // Image path might be null or optional
});

export const insertTopicSchema = topicSchema.omit({
  id: true,
});

export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = z.infer<typeof topicSchema>;

// --- Lesson Schema ---
export const lessonSchema = z.object({
  id: z.string(), // Firestore uses string IDs
  topicId: z.string(), // Foreign key to Topic ID, now a string
  title: z.string(),
  context: z.string(),
  createdAt: z.string(),
  status: z.enum(['available', 'in progress', 'done']),
  exchanges: z.array(z.object({ // Firestore supports nested objects and arrays directly
    id: z.string().optional(), // Firestore ID or custom ID for exchanges within a lesson
    speaker: z.enum(['user', 'other']),
    speakerName: z.string(),
    nativeText: z.string(),
    translatedText: z.string(),
    blanks: z.array(z.object({
      index: z.number().int(),
      correctAnswer: z.string(),
      incorrectAnswers: z.record(z.string(), z.string()).optional(),
    })).optional(),
  })),
});

export const insertLessonSchema = lessonSchema.omit({
  id: true,
});

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type LessonWithTopic = Lesson & {
  topicDetails: Topic;
};

// --- Vocabulary Schema ---
export const vocabularySchema = z.object({
  id: z.string(), // Firestore uses string IDs
  word: z.string(),
  translation: z.string(),
  partOfSpeech: z.string(),
  gender: z.string().optional().nullable(),
  definition: z.string(),
  examples: z.array(z.string()).optional(), // Firestore arrays work naturally
  notes: z.string().optional().nullable(),
  targetLanguage: z.string(),
  sourceLanguage: z.string().default("en"),
  relatedWords: z.array(z.string()).optional(), // Firestore arrays work naturally
});

export const insertVocabularySchema = vocabularySchema.omit({
  id: true,
});

export type InsertVocabulary = z.infer<typeof insertVocabularySchema>;
export type Vocabulary = z.infer<typeof vocabularySchema>;

// --- Progress Schema ---
export const progressSchema = z.object({
  id: z.string(), // Firestore uses string IDs
  userId: z.string(), // Foreign key to User ID, now a string
  lessonId: z.string(), // Foreign key to Lesson ID, now a string
  completed: z.number().int().default(0),
  score: z.number().int().optional().nullable(),
  lastAttempted: z.string().optional().nullable(), // Assuming this is a date string
});

export const insertProgressSchema = progressSchema.omit({
  id: true,
});

export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type Progress = z.infer<typeof progressSchema>;

// --- Types for client-side use (No change needed here, they are already pure Zod/TS) ---
export type Exchange = z.infer<typeof lessonSchema>['exchanges'][number]; // Infer from lessonSchema's exchanges array
export type WordDetail = z.infer<typeof vocabularySchema>; // Can directly infer from vocabularySchema

export type ChatMessage = {
  id: string; // Ensure this matches Firestore's string ID if stored
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
};

export type UserAnswer = {
  exchangeId: string; // Assuming exchangeId can be a string
  blankIndex: number;
  answer: string;
  isCorrect: boolean;
  isAlmostCorrect?: boolean;
};