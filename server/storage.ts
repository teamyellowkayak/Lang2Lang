import { 
  users, 
  type User, 
  type InsertUser, 
  languages, 
  type Language, 
  type InsertLanguage,
  topics, 
  type Topic, 
  type InsertTopic,
  lessons, 
  type Lesson, 
  type InsertLesson,
  vocabulary, 
  type Vocabulary, 
  type InsertVocabulary,
  progress, 
  type Progress, 
  type InsertProgress
} from "@shared/schema";

// Enhanced storage interface to accommodate all our data models
export interface IStorage {
  // User methods (unused in initial app version)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Language methods
  getLanguages(): Promise<Language[]>;
  getLanguageByCode(code: string): Promise<Language | undefined>;
  createLanguage(language: InsertLanguage): Promise<Language>;
  
  // Topic methods
  getTopics(targetLanguage: string): Promise<Topic[]>;
  getTopicById(id: number): Promise<Topic | undefined>;
  createTopic(topic: InsertTopic): Promise<Topic>;
  
  // Lesson methods
  getLessons(topicId: number): Promise<Lesson[]>;
  getLessonById(id: number): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  
  // Vocabulary methods
  getVocabulary(word: string, targetLanguage: string): Promise<Vocabulary | undefined>;
  getVocabularyByLanguage(targetLanguage: string): Promise<Vocabulary[]>;
  createVocabulary(vocabulary: InsertVocabulary): Promise<Vocabulary>;
  
  // Progress methods (unused in initial app version)
  getProgress(userId: number, lessonId: number): Promise<Progress | undefined>;
  createProgress(progress: InsertProgress): Promise<Progress>;
  updateProgress(progress: Progress): Promise<Progress>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private languages: Map<number, Language>;
  private topics: Map<number, Topic>;
  private lessons: Map<number, Lesson>;
  private vocabulary: Map<number, Vocabulary>;
  private progress: Map<number, Progress>;
  
  private currentUserId = 1;
  private currentLanguageId = 1;
  private currentTopicId = 1;
  private currentLessonId = 1;
  private currentVocabularyId = 1;
  private currentProgressId = 1;

  constructor() {
    this.users = new Map();
    this.languages = new Map();
    this.topics = new Map();
    this.lessons = new Map();
    this.vocabulary = new Map();
    this.progress = new Map();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Language methods
  async getLanguages(): Promise<Language[]> {
    return Array.from(this.languages.values());
  }
  
  async getLanguageByCode(code: string): Promise<Language | undefined> {
    return Array.from(this.languages.values()).find(
      (language) => language.code === code,
    );
  }
  
  async createLanguage(insertLanguage: InsertLanguage): Promise<Language> {
    const id = this.currentLanguageId++;
    const language: Language = { ...insertLanguage, id };
    this.languages.set(id, language);
    return language;
  }
  
  // Topic methods
  async getTopics(targetLanguage: string): Promise<Topic[]> {
    return Array.from(this.topics.values()).filter(
      (topic) => topic.targetLanguage === targetLanguage,
    );
  }
  
  async getTopicById(id: number): Promise<Topic | undefined> {
    return this.topics.get(id);
  }
  
  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const id = this.currentTopicId++;
    const topic: Topic = { ...insertTopic, id };
    this.topics.set(id, topic);
    return topic;
  }
  
  // Lesson methods
  async getLessons(topicId: number): Promise<Lesson[]> {
    return Array.from(this.lessons.values()).filter(
      (lesson) => lesson.topicId === topicId,
    );
  }
  
  async getLessonById(id: number): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }
  
  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const id = this.currentLessonId++;
    const lesson: Lesson = { ...insertLesson, id };
    this.lessons.set(id, lesson);
    return lesson;
  }
  
  // Vocabulary methods
  async getVocabulary(word: string, targetLanguage: string): Promise<Vocabulary | undefined> {
    return Array.from(this.vocabulary.values()).find(
      (vocab) => vocab.word === word && vocab.targetLanguage === targetLanguage,
    );
  }
  
  async getVocabularyByLanguage(targetLanguage: string): Promise<Vocabulary[]> {
    return Array.from(this.vocabulary.values()).filter(
      (vocab) => vocab.targetLanguage === targetLanguage,
    );
  }
  
  async createVocabulary(insertVocabulary: InsertVocabulary): Promise<Vocabulary> {
    const id = this.currentVocabularyId++;
    const vocabulary: Vocabulary = { ...insertVocabulary, id };
    this.vocabulary.set(id, vocabulary);
    return vocabulary;
  }
  
  // Progress methods
  async getProgress(userId: number, lessonId: number): Promise<Progress | undefined> {
    return Array.from(this.progress.values()).find(
      (prog) => prog.userId === userId && prog.lessonId === lessonId,
    );
  }
  
  async createProgress(insertProgress: InsertProgress): Promise<Progress> {
    const id = this.currentProgressId++;
    const progress: Progress = { ...insertProgress, id };
    this.progress.set(id, progress);
    return progress;
  }
  
  async updateProgress(updatedProgress: Progress): Promise<Progress> {
    this.progress.set(updatedProgress.id, updatedProgress);
    return updatedProgress;
  }
}

export const storage = new MemStorage();
