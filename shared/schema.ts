import { pgTable, text, serial, integer, json, array } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Main user schema for authentication (not used in initial version)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Language schema
export const languages = pgTable("languages", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  nativeName: text("native_name").notNull(),
  isSourceLanguage: integer("is_source_language").notNull().default(0),
});

export const insertLanguageSchema = createInsertSchema(languages).omit({
  id: true,
});

export type InsertLanguage = z.infer<typeof insertLanguageSchema>;
export type Language = typeof languages.$inferSelect;

// Topic schema
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  targetLanguage: text("target_language").notNull(),
  sourceLanguage: text("source_language").notNull().default("en"),
  tags: text("tags").array(),
  imagePath: text("image_path"),
});

export const insertTopicSchema = createInsertSchema(topics).omit({
  id: true,
});

export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = typeof topics.$inferSelect;

// Lesson schema
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull(),
  title: text("title").notNull(),
  context: text("context").notNull(),
  exchanges: json("exchanges").notNull(),
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
});

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

// Vocabulary schema
export const vocabulary = pgTable("vocabulary", {
  id: serial("id").primaryKey(),
  word: text("word").notNull(),
  translation: text("translation").notNull(),
  partOfSpeech: text("part_of_speech").notNull(),
  gender: text("gender"),
  definition: text("definition").notNull(),
  examples: text("examples").array(),
  notes: text("notes"),
  targetLanguage: text("target_language").notNull(),
  sourceLanguage: text("source_language").notNull().default("en"),
  relatedWords: text("related_words").array(),
});

export const insertVocabularySchema = createInsertSchema(vocabulary).omit({
  id: true,
});

export type InsertVocabulary = z.infer<typeof insertVocabularySchema>;
export type Vocabulary = typeof vocabulary.$inferSelect;

// Progress schema (not used in initial version)
export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  completed: integer("completed").notNull().default(0),
  score: integer("score"),
  lastAttempted: text("last_attempted"),
});

export const insertProgressSchema = createInsertSchema(progress).omit({
  id: true,
});

export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type Progress = typeof progress.$inferSelect;

// Types for client-side use
export type Exchange = {
  id: string;
  speaker: 'user' | 'other';
  speakerName: string;
  nativeText: string;
  translatedText: string;
  blanks?: Array<{
    index: number;
    correctAnswer: string;
  }>
};

export type WordDetail = {
  word: string;
  translation: string;
  partOfSpeech: string;
  gender?: string;
  definition: string;
  examples: string[];
  notes?: string;
  relatedWords: string[];
};

export type ChatMessage = {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
};

export type UserAnswer = {
  exchangeId: string;
  blankIndex: number;
  answer: string;
  isCorrect: boolean;
  isAlmostCorrect?: boolean;
};
