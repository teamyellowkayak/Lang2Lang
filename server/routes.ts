// Lang2Lang/server/routes.ts

import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
 insertLanguageSchema,
 insertTopicSchema,
 insertLessonSchema,
 insertVocabularySchema, 
 type Vocabulary
} from "@shared/schema";
import { z } from "zod";
import * as dotenv from 'dotenv';

dotenv.config();

/*
function authenticateLocalPassword(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'OPTIONS') {
    // For preflight requests, the browser is just asking for permission.
    // It does NOT send custom headers yet. Allow it to pass through.
    return next();
  }
  const incomingPassword = req.headers["x-access-password"] as string;
  const expectedPassword = process.env.SHARED_ACCESS_PASSWORD;

  if (!expectedPassword) {
    console.error("SHARED_ACCESS_PASSWORD is not set in .env!");
    return res.status(500).json({ success: false, message: "Server configuration error." });
  }
  console.log(incomingPassword, " ");
  if (incomingPassword && incomingPassword === expectedPassword) {
    next();
  } else {
    console.warn("Unauthorized local backend access attempt: Invalid password.");
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
}
*/


// DELETE this section and replace with the one above-------------------
function authenticateLocalPassword(req: Request, res: Response, next: NextFunction) {
  const requestId = Math.random().toString(36).substring(2, 8); // Unique ID for this request in logs
  console.log(`\n--- BACKEND AUTH MIDDLEWARE START (${requestId}) ---`);
  console.log(`  Method: ${req.method}, URL: ${req.originalUrl}`);
  console.log(`  Timestamp: ${new Date().toISOString()}`);

  if (req.method === 'OPTIONS') {
    console.log(`  [${requestId}] Handling OPTIONS (Preflight). Bypassing authentication.`);
    // Crucially, you might need to explicitly set CORS headers for OPTIONS requests
    // if your main CORS middleware isn't catching them before this,
    // or if the browser expects specific headers in the preflight response.
    // However, for typical setups, the main CORS middleware should handle it.
    // If you're using 'cors' npm package, ensure it's placed *before* this middleware.
    // Example (only if needed and your main CORS setup is insufficient):
    // res.header('Access-Control-Allow-Origin', '*'); // Or your specific frontend origin
    // res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    // res.header('Access-Control-Allow-Headers', 'Content-Type,X-Access-Password'); // Crucial for custom headers
    // res.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
    return next(); // Proceed to the next middleware (likely your main CORS middleware)
  }

  const incomingPassword = req.headers["x-access-password"] as string;
  const expectedPassword = process.env.SHARED_ACCESS_PASSWORD;

  if (!expectedPassword) {
    console.error(`  [${requestId}] ERROR: SHARED_ACCESS_PASSWORD is NOT set in .env! Returning 500.`);
    return res.status(500).json({ success: false, message: "Server configuration error: Password not set." });
  }

  console.log(`  [${requestId}] Processing actual request. Password check:`);
  console.log(`    Incoming (X-Access-Password): "${incomingPassword}"`); // Log the full string
  console.log(`    Are they equal? ${incomingPassword === expectedPassword}`);
  console.log(`    Full Request Headers: ${JSON.stringify(req.headers, null, 2)}`); // Dump all headers

  if (incomingPassword && incomingPassword === expectedPassword) {
    console.log(`  [${requestId}] AUTH SUCCESS: Passwords match. Calling next().`);
    next();
  } else {
    console.warn(`  [${requestId}] AUTH FAILED: Invalid or missing password. Returning 401.`);
    res.status(401).json({ success: false, message: "Unauthorized: Invalid or missing access password." });
  }
  console.log(`--- BACKEND AUTH MIDDLEWARE END (${requestId}) ---`);
}





const vocabularyLookupSchema = z.object({
  nativeText: z.string().min(1, "Native text cannot be empty"),
  sourceLanguage: z.string().min(1, "Source language cannot be empty"),
  targetLanguage: z.string().min(1, "Target language cannot be empty"),
});


export async function registerRoutes(app: Express): Promise<Server> {
  // All routes defined below this line that have an "/api" prefix
  // will first pass through this authentication check.
  app.use("/api", authenticateLocalPassword);
  
  // Language routes
  app.get("/api/languages", async (req: Request, res: Response) => {
      // DELETE this 4 lines-------------------
      console.log("--- TEST HEADERS ROUTE ---");
      console.log("Headers received:", JSON.stringify(req.headers, null, 2));
      console.log("X-Access-Password header:", req.headers["x-access-password"]);

    try {
      const languages = await storage.getLanguages();
      res.json(languages);
    } catch (error) {
      console.error("Failed to fetch languages:", error);
      res.status(500).json({ message: "Failed to fetch languages" });
    }
  });

// server/routes.ts or server/index.ts  // DELETE this section of 8 lines-------------------
app.get("/api/test-headers", (req: Request, res: Response) => {
  console.log("--- TEST HEADERS ROUTE ---");
  console.log("Headers received:", JSON.stringify(req.headers, null, 2));
  console.log("X-Access-Password header:", req.headers["x-access-password"]);
  res.json({ message: "Headers checked", receivedHeaders: req.headers });
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
      console.error("Failed to fetch languages:", error);
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

  app.post("/api/vocabulary-lookup", async (req: Request, res: Response) => {
    try {
      // 1. Validate the request body using Zod
      const parseResult = vocabularyLookupSchema.safeParse(req.body);

      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid request body",
          errors: parseResult.error.errors,
        });
      }

      const { nativeText, sourceLanguage, targetLanguage } = parseResult.data;

      // 2. Delegate the core lookup, AI call, and saving logic to the storage layer
      const finalTranslations: Vocabulary[] = await storage.lookupAndTranslateVocabulary(
        nativeText,
        sourceLanguage,
        targetLanguage
      );

      // 3. Send the structured response back to the frontend
      res.json(finalTranslations);

    } catch (error) {
      console.error("Error in /api/vocabulary-lookup route:", error);
      // Return a generic 500 error, as specific handling is now within storage.ts
      res.status(500).json({ message: "Failed to process vocabulary lookup", error: (error as Error).message });
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

  app.patch("/api/lessons/:id/status", async (req: Request, res: Response) => {
    try {
      const { id } = req.params; // The ID of the lesson/topic to mark as done
      
      if (!id) {
        return res.status(400).json({ message: "Lesson ID is required." });
      }
      await storage.markLessonAsDone(id); 
      res.status(200).json({ message: `Lesson ${id} status updated to 'done'.` });
    } catch (error: any) { // Catch potential errors from storage.markLessonAsDone
      console.error(`Error marking lesson ${req.params.id} as done:`, error);
      
      // You might want to differentiate error types if storage.ts throws specific errors
      // For example, if 'markLessonAsDone' throws an error indicating the lesson was not found:
      // if (error.message.includes("not found")) { // This assumes a specific error message
      //   return res.status(404).json({ message: "Lesson not found." });
      // }
      
      res.status(500).json({ message: `Failed to mark lesson as done: ${error.message || 'Internal server error'}` });
    }
  });

    app.post("/api/chat-about-sentence", async (req, res) => {
      try {
        const {
          nativeText,
          translatedText,
          userQuestion,
          sourceLanguage,
          targetLanguage,
        } = req.body;
    
        // Basic validation of incoming request body
        if (
          !nativeText ||
          !translatedText ||
          !userQuestion ||
          !sourceLanguage ||
          !targetLanguage
        ) {
          return res.status(400).json({
            success: false,
            message: "Missing required chat parameters.",
          });
        }
    
        // Call the storage service to interact with the Cloud Function
        const chatResponse = await storage.chatAboutSentenceWithCloudFunction({
          nativeText,
          translatedText,
          userQuestion,
          sourceLanguage,
          targetLanguage,
        });
    
        // Send the explanation back to the frontend
        res.json({ success: true, explanation: chatResponse.explanation });
    
      } catch (error: any) {
        console.error("Error in /api/chat-about-sentence:", error);
        res.status(500).json({
          success: false,
          message: error.message || "An unexpected error occurred during chat.",
        });
      }
    });

  const httpServer = createServer(app);
  return httpServer;
}

    
        
        
        
        
