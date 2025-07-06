/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import {onRequest} from "firebase-functions/v2/https";
// import *s logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//     logger.info("Hello logs!", {structuredData: true});
//     response.send("Hello from Firebase!");
// });

import {defineSecret} from "firebase-functions/params";
import {GoogleGenerativeAI} from "@google/generative-ai";
import {Request, Response} from "express";

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();
const db = admin.firestore();

// Define the secret outside the function
// This tells Firebase that your function will depend
// on a secret named "GEMINI_API_KEY"
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// --- Define Interfaces ---

// interface CreateLessonData {
//   topicId: number;
//   topicTitle: string;
// }

interface Blank {
  index: number;
  correctAnswer: string;
}

interface Exchange {
  id: string;
  speaker: string;
  speakerName: string;
  nativeText: string;
  translatedText: string;
  blanks: Blank[];
}

interface LessonDataFromAI {
  title: string;
  context: string;
  exchanges: Exchange[];
}

interface StoredLesson extends LessonDataFromAI {
  id: string;
  topicId: number;
  status: string;
  createdAt: admin.firestore.FieldValue;
}

const LESSONPROMPT_1 = [
  "You are a language learning lesson generator.",
  "Your task is to create a structured language lesson in ",
].join("\n");

const LESSONPROMPT_2 = [
  " based on this given topic: '",
].join("\n");

const LESSONPROMPT_3 = [
  "'. ",
  "The lesson should be engaging and useful for",
  "a beginner to intermediate learner.",
  "",
  "The output MUST be a single, well-formed JSON object.",
  "Do NOT include any text before or after the JSON.",
  "Do NOT include markdown backticks (```json) in the response.",
  "", // Blank line for separation
  "The JSON object must have the following structure:",
  "{",
  " \"title\": \"string\",",
  " \"context\": \"string\", // Short intro paragraph for lesson",
  " \"exchanges\": [",
  " {",
  " \"id\": \"string\", // UniqueID for exchange (e.g., \"x1\", \"x2\")",
  " \"speaker\": \"string\", // \"user\" or \"other\"",
  " \"speakerName\": \"string\", // e.g., \"You\", \"Ana\", \"Doctor\"",
  " \"nativeText\": \"string\", // Original text in English",
  " \"translatedText\": \"string\", // Translated text in Spanish",
  " \"blanks\": [",
  " {",
  " \"index\": number, // Index of the word to blank (0-based)",
  " \"correctAnswer\": \"string\" // The original word at that index",
  "        }",
  "      ]",
  "    }",
  "    // ... up to 10 exchange objects",
  "  ]",
  "}",
  "",
  "Important Rules for Lesson Content:",
  "1. **Topic:** ",
  " The lesson content must be relevant to the topic provided above.",
  "2. **Number of Exchanges:** Generate exactly 10 exchange objects.",
  "3. **Speakers:** Alternate speakers between \"user\" and \"other\".",
  "   Start with \"user\".",
  "4. **Speaker Names:** Use diverse and appropriate names ",
  "  (e.g., \"You\",",
  "   \"Maria\", \"Doctor\", \"Waiter\").",
  "5. **Native Text:** Provide clear, concise English sentences.",
  "6. **Translated Text:** Provide accurate and natural-sounding Spanish",
  "   translations.",
  "7. **Context:** The context should briefly set the scene ",
  "  for the exchanges.",
  "8. **Title:** The title should be concise ",
  "  and descriptive of the lesson.",
  "9. **Blanks:** For EACH exchange, make every word a blank.",
  // create 2 blanks.",
  // "   * Blanks should be common or key vocabulary words ",
  // "  relevant to the lesson.",
  // "   * Blanks should target a variety of grammatical categories.",
  "   * The \"index\" for \"blanks\" is the 0-based word index in the",
  "     \"translatedText\" string.",
  "   * The \"correctAnswer\" is the word found at that exact index.",
  "   * Do NOT include the blank character (e.g., \"_\") in the",
  "     \"translatedText\". The \"blanks\" array provides info for UI.",
  "",
  "Example JSON (for structure only, content should be unique ",
  "  per topic):",
  "{\"title\":\"Greetings\",",
  "\"context\":\"Learn basic greetings.\",",
  "\"exchanges\":[",
  "{\"id\":\"ex1\",",
  "\"speaker\":\"user\",",
  "\"speakerName\":\"You\",",
  "\"nativeText\":\"Hello! How are you?\",",
  "\"translatedText\":\"¡Hola! ¿Cómo estás?\",",
  "\"blanks\":[",
  "{\"index\":0,\"correctAnswer\":\"Hola\"},",
  "{\"index\":1,\"correctAnswer\":\"Cómo\"},",
  "{\"index\":2,\"correctAnswer\":\"estás\"}",
  "]",
  "},",
  "{\"id\":\"ex2\",",
  "\"speaker\":\"other\",",
  "\"speakerName\":\"Maria\",",
  "\"nativeText\":\"I am good, thank you. And you?\",",
  "\"translatedText\":\"Estoy bien, gracias. ¿Y tú?\",",
  "\"blanks\":[",
  "{\"index\":0,\"correctAnswer\":\"Estoy\"},",
  "{\"index\":1,\"correctAnswer\":\"bien\"},",
  "{\"index\":2,\"correctAnswer\":\"gracias\"},",
  "{\"index\":3,\"correctAnswer\":\"Y\"},",
  "{\"index\":4,\"correctAnswer\":\"tú\"}",
  "]",
  "}", // End of ex2
  "]}", // End of exchanges array
].join("\n");


// --- Cloud Function ---
/**
 * Generates a placeholder lesson based on topic ID and title.
 * @param {Object} params - Parameters for the lesson.
 * @param {string} params.topicId - ID of the topic.
 * @param {string} params.topicTitle - Title of the topic.
 * @return {Promise<Object>} A placeholder lesson object.
 */

exports.createLesson = functions
  .https.onRequest(
    {secrets: [geminiApiKey]},
    async (req: Request, res: Response) => {
      const {topicId, topicTitle, topicLanguage} = req.body;

      if (!topicId || !topicTitle) {
        res.status(400).json({success: false, message: "need TopicID & Title"});
        return;
      }

      if (!topicLanguage) {
        res.status(400).json({success: false, message: "need language"});
        return;
      }

      // 3. Access the secret's value using .value()
      const apiKey = geminiApiKey.value();

      try {
        console.log("createLesson called: topicId:", topicId);
        console.log("createLesson called: title:", topicTitle);
        console.log("createLesson called: language:", topicLanguage);

        // The console.log will now accurately reflect
        // if the secret was loaded by Firebase
        console.log("Attempting to access API Key:",
          apiKey ? "Loaded" : "Not Loaded");

        // This check is good practice
        if (!apiKey) {
          console.error("GeminiAPIKey not loaded/inaccessible in function.");
          res.status(500).json({
            success: false,
            message: "Gemini API Key is not configured.",
          });
          return;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-pro-latest",
        });

        const lessonPrompt = LESSONPROMPT_1 +
            topicLanguage +
            LESSONPROMPT_2 +
            topicTitle +
            LESSONPROMPT_3;

        // const X = `${LESSONPROMPT_1}${topicTitle}${LESSONPROMPT_2}`;
        const result = await model.generateContent(lessonPrompt);
        const response = await result.response;
        const text = response.text();

        console.log("AI Response:", text);

        let lessonData: LessonDataFromAI;
        try {
          const cleanText = text.replace(/```json\n|```/g, "").trim();
          lessonData = JSON.parse(cleanText);

          if (
            !lessonData ||
            typeof lessonData.title !== "string" ||
            typeof lessonData.context !== "string" ||
            !Array.isArray(lessonData.exchanges) ||
            lessonData.exchanges.length !== 10
          ) {
            throw new Error("AI response structure or exchange count invalid.");
          }

          for (let i = 0; i < lessonData.exchanges.length; i++) {
            const exchange = lessonData.exchanges[i];
            if (
              typeof exchange.id !== "string" ||
              typeof exchange.speaker !== "string" ||
              typeof exchange.speakerName !== "string" ||
              typeof exchange.nativeText !== "string" ||
              typeof exchange.translatedText !== "string"
              // || !Array.isArray(exchange.blanks)
              // || exchange.blanks.length !== 2
            ) {
              throw new Error(`Exchange ${i} structure or blank ct invalid.`);
            }
          }
        } catch (parseError: unknown) {
          console.error("Failed to parse/validate AI response:", parseError);
          console.error("AI response raw text:", text);

          const message = parseError instanceof Error ?
            parseError.message : String(parseError);

          res.status(500).json({
            success: false,
            message: "Invalid AI response structure. Please try again.",
            details: message,
          });
          return;
        }

        const newLessonId = db.collection("lessons").doc().id;

        const newLesson: StoredLesson = {
          id: newLessonId,
          topicId,
          title: lessonData.title,
          context: lessonData.context,
          status: "available",
          exchanges: lessonData.exchanges,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection("lessons").doc(newLessonId).set(newLesson);

        console.log(`Lesson ${newLessonId} created for topic ${topicTitle}.`);
        res.status(200).json({success: true, lesson: newLesson});
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Lesson creation failed:", message);
        res.status(500).json({success: false, message});
      }
    });

/*
      // Full, detailed prompt for lesson generation using an array of strings
      const prompt = [
        "You are a language learning lesson generator.",
        "Your task is to create a structured language lesson in Spanish",
        "based on a given topic. The lesson should be engaging and useful for",
        "a beginner to intermediate learner.",
        "",
        "The output MUST be a single, well-formed JSON object.",
        "Do NOT include any text before or after the JSON.",
        "Do NOT include markdown backticks (```json) in the response.",
        "", // Blank line for separation
        "The JSON object must have the following structure:",
        "{",
        " \"title\": \"string\",",
        " \"context\": \"string\", // Short intro paragraph for lesson",
        " \"exchanges\": [",
        " {",
        " \"id\": \"string\", // UniqueID for exchange (e.g., \"x1\", \"x2\")",
        " \"speaker\": \"string\", // \"user\" or \"other\"",
        " \"speakerName\": \"string\", // e.g., \"You\", \"Ana\", \"Doctor\"",
        " \"nativeText\": \"string\", // Original text in English",
        " \"translatedText\": \"string\", // Translated text in Spanish",
        " \"blanks\": [",
        " {",
        " \"index\": number, // Index of the word to blank (0-based)",
        " \"correctAnswer\": \"string\" // The original word at that index",
        "        }",
        "      ]",
        "    }",
        "    // ... up to 10 exchange objects",
        "  ]",
        "}",
        "",
        "Important Rules for Lesson Content:",
        "1. **Topic:** ",
        " The lesson content must be relevant to the topic '${topicTitle}'.",
        "2. **Number of Exchanges:** Generate exactly 10 exchange objects.",
        "3. **Speakers:** Alternate speakers between \"user\" and \"other\".",
        "   Start with \"user\".",
        "4. **Speaker Names:** Use diverse and appropriate names ",
        "  (e.g., \"You\",",
        "   \"Maria\", \"Doctor\", \"Waiter\").",
        "5. **Native Text:** Provide clear, concise English sentences.",
        "6. **Translated Text:** Provide accurate and natural-sounding Spanish",
        "   translations.",
        "7. **Blanks:** For EACH exchange, create 2 blanks.",
        "   * Blanks should be common or key vocabulary words ",
        "  relevant to the lesson.",
        "   * Blanks should target a variety of grammatical categories.",
        "   * The \"index\" for \"blanks\" is the 0-based word index in the",
        "     \"translatedText\" string.",
        "   * The \"correctAnswer\" is the word found at that exact index.",
        "   * Do NOT include the blank character (e.g., \"_\") in the",
        "     \"translatedText\". The \"blanks\" array provides info for UI.",
        "8. **Context:** The context should briefly set the scene ",
        "  for the exchanges.",
        "9. **Title:** The title should be concise ",
        "  and descriptive of the lesson.",
        "",
        "Example JSON (for structure only, content should be unique ",
        "  per topic):",
        "{\"title\":\"Greetings\",",
        "\"context\":\"Learn basic greetings.\",",
        "\"exchanges\":[",
        "{\"id\":\"ex1\",",
        "\"speaker\":\"user\",",
        "\"speakerName\":\"You\",",
        "\"nativeText\":\"Hello! How are you?\",",
        "\"translatedText\":\"¡Hola! ¿Cómo estás?\",",
        "\"blanks\":[",
        "{\"index\":0,\"correctAnswer\":\"Hola\"},",
        "{\"index\":2,\"correctAnswer\":\"estás\"}",
        "]},",
        "{\"id\":\"ex2\",",
        "\"speaker\":\"other\",",
        "\"speakerName\":\"Maria\",",
        "\"nativeText\":\"I am good, thank you. And you?\",",
        "\"translatedText\":\"Estoy bien, gracias. ¿Y tú?\",",
        "\"blanks\":[",
        "{\"index\":0,\"correctAnswer\":\"Estoy\"},",
        "{\"index\":2,\"correctAnswer\":\"gracias\"}",
        "]}", // End of ex2
        "]}", // End of exchanges array
      ].join("\n");

            for (let j = 0; j < exchange.blanks.length; j++) {
              const blank = exchange.blanks[j];
              const words = exchange.translatedText.split(/\s+/);
              if (
                typeof blank.index !== "number" ||
                typeof blank.correctAnswer !== "string" ||
                blank.index < 0 ||
                blank.index >= words.length ||
                words[blank.index] !== blank.correctAnswer
              ) {
                throw new Error(`Blank ${j} in exchange ${i} invalid.`);
              }
            }


*/

