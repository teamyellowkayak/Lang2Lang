import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLanguageSchema, insertTopicSchema, insertLessonSchema, insertVocabularySchema } from "@shared/schema";
import { z } from "zod";
import { API_BASE_URL } from '../client/src/config';

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed initial data

  // Language routes
  app.get("/api/languages", async (req: Request, res: Response) => {
    try {
      const languages = await storage.getLanguages();
      res.json(languages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch languages" });
    }
  });

  app.get("/api/languages/:code", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const language = await storage.getLanguageByCode(code);
      
      if (!language) {
        return res.status(404).json({ message: "Language not found" });
      }
      
      res.json(language);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch language" });
    }
  });

  // Topic routes
  app.get("/api/topics", async (req: Request, res: Response) => {
    try {
      const { targetLanguage = "es" } = req.query;
      const topics = await storage.getTopics(targetLanguage as string);
      res.json(topics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch topics" });
    }
  });

  app.get("/api/topics/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;      
      const topic = await storage.getTopicById(id);
      
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      
      res.json(topic);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch topic" });
    }
  });

  // Lesson routes
  app.get("/api/lessons", async (req: Request, res: Response) => {
    try {
      const { topicId } = req.query;
      
      if (!topicId) {
        return res.status(400).json({ message: "Topic ID is required" });
      }
      
      const lessons = await storage.getLessons(topicId);
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.get("/api/topics/:topicId/next-lesson", async (req: Request, res: Response) => {
    try {
        const topicId = req.params.topicId;
        const topic = await storage.getTopicById(topicId);
    
        if (!topic) {
          return res.status(404).json({ message: "Topic not found for the given ID." });
        }
    
        const topicTitle = topic.title; 
        const lessonId = await storage.getNextLessonForTopic(topicId, topicTitle);

        if (!lessonId) {
            return res.status(404).json({ message: "No available lessons found for this topic." });
        }

        res.json({ lessonId }); // Return just the lessonId
    } catch (error) {
        console.error("Error fetching next lesson:", error);
        res.status(500).json({ message: "Failed to determine next lesson." });
    }
});

  app.get("/api/lessons/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;      
      const lesson = await storage.getLessonById(id);
      
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lesson" });
    }
  });

  // Vocabulary routes
  app.get("/api/vocabulary", async (req: Request, res: Response) => {
    try {
      const { word, targetLanguage } = req.query;
      
      if (!word || !targetLanguage) {
        return res.status(400).json({ message: "Word and target language are required" });
      }
      
      const vocabulary = await storage.getVocabulary(word as string, targetLanguage as string);
      
      if (!vocabulary) {
        return res.status(404).json({ message: "Vocabulary entry not found" });
      }
      
      res.json(vocabulary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vocabulary" });
    }
  });

  app.get("/api/vocabulary/language/:targetLanguage", async (req: Request, res: Response) => {
    try {
      const { targetLanguage } = req.params;
      
      if (!targetLanguage) {
        return res.status(400).json({ message: "Target language is required" });
      }
      
      const vocabulary = await storage.getVocabularyByLanguage(targetLanguage);
      res.json(vocabulary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vocabulary" });
    }
  });

  // Chat endpoint for word questions (simplified implementation)
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const { question, word, targetLanguage } = req.body;
      
      if (!question || !word || !targetLanguage) {
        return res.status(400).json({ 
          message: "Question, word, and target language are required" 
        });
      }
      
      // In a real implementation, this would use NLP or a language model
      // For now, we'll return a simple response based on the question
      
      const vocabulary = await storage.getVocabulary(word as string, targetLanguage as string);
      
      if (!vocabulary) {
        return res.status(404).json({ message: "Word not found" });
      }
      
      let response = "";
      
      if (question.toLowerCase().includes("how do i say")) {
        response = `You would say "${vocabulary.translation}" for "${word}" in ${targetLanguage}.`;
      } else if (question.toLowerCase().includes("example")) {
        response = vocabulary.examples && vocabulary.examples.length > 0 
          ? `Here's an example: ${vocabulary.examples[0]}` 
          : `Sorry, I don't have examples for "${word}".`;
      } else if (question.toLowerCase().includes("plural")) {
        response = `I don't have specific information about the plural form of "${word}" yet.`;
      } else {
        response = `For information about "${word}": ${vocabulary.definition}`;
      }
      
      res.json({ 
        response,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process chat request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

    
        
        
        
        
