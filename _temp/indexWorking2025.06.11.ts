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

import {GoogleGenerativeAI} from "@google/generative-ai";
import {CallableRequest} from "firebase-functions/v2/https";
import {Request, Response} from "express";

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();
const db = admin.firestore();

// const GEMINI_API_KEY = functions.config().gemini.apikey;
// const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// --- Define Interfaces ---

interface CreateLessonData {
  topicId: number;
  topicTitle: string;
}

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

// --- Cloud Function ---
/**
 * Generates a placeholder lesson based on topic ID and title.
 * @param {Object} params - Parameters for the lesson.
 * @param {string} params.topicId - ID of the topic.
 * @param {string} params.topicTitle - Title of the topic.
 * @return {Promise<Object>} A placeholder lesson object.
 */
async function generateLesson({topicId, topicTitle}:
{topicId: string, topicTitle: string}) {
  return {
    id: "lesson123",
    topicId,
    title: topicTitle,
    content: "This is a placeholder lesson.",
  };
}

exports.createLessonRequest = functions
  .https.onRequest(async (req: Request, res: Response) => {
    const {topicId, topicTitle} = req.body;

    if (!topicId || !topicTitle) {
      res.status(400).json({success: false, message: "need TopicID & Title"});
      return;
    }

    try {
      // Optionally validate IAM token via req.headers.authorization
      console.log("createLesson HTTP function called by backend.");

      // Do your lesson creation logic here
      const lesson = await generateLesson({topicId, topicTitle});

      res.status(200).json({success: true, lesson});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Lesson creation failed:", message);
      res.status(500).json({success: false, message});
    }
  });

exports.createLesson = functions.https.onCall(
  {
    serviceAccount:
    "lang2lang-frontend-caller@lang2lang-dev.iam.gserviceaccount.com",
    // Other options like region, memory, timeout, etc. can go here
  },
  async (request: CallableRequest<CreateLessonData>) => {
    // Correct destructuring for v2 CallableRequest:
    // 'request' itself is the context, and 'data' is a property on it.
    const {data} = request;
    const {topicId, topicTitle} = data;

    // Access context properties directly from 'request' for v2 functions
    if (request.auth) { // 'request.auth' now correctly references auth context
      console.log("Function called by authenticated user:", request.auth.uid);
    } else {
      console.log("Function called by unauthenticated user.");
    }

    if (!topicId || !topicTitle) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Topic ID and Title are required."
      );
    }

    try {
      // Initialize Gemini API Key and client *inside* the function call
      // This ensures functions.config() is fully loaded and available
      const GEMINI_API_KEY = functions.config().gemini.apikey;
      // Added a check for the API key being available before use
      if (!GEMINI_API_KEY) {
        throw new functions.https.HttpsError(
          "unavailable",
          "Gemini API Key is not configured."
        );
      }
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({model: "gemini-pro"});

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

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

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
          throw new Error(
            "AI rsp didnt match expected top-level structure/exchange count."
          );
        }

        for (let i = 0; i < lessonData.exchanges.length; i++) {
          const exchange = lessonData.exchanges[i];
          if (
            typeof exchange.id !== "string" ||
            typeof exchange.speaker !== "string" ||
            typeof exchange.speakerName !== "string" ||
            typeof exchange.nativeText !== "string" ||
            typeof exchange.translatedText !== "string" ||
            !Array.isArray(exchange.blanks) ||
            exchange.blanks.length !== 2
          ) {
            throw new Error(
              `Exchange ${i} did not match expected structure or blank count.`
            );
          }

          for (let j = 0; j < exchange.blanks.length; j++) {
            const blank = exchange.blanks[j];
            if (
              typeof blank.index !== "number" ||
              typeof blank.correctAnswer !== "string"
            ) {
              throw new Error(
                `Blank ${j} in Exchange ${i} did not match expected structure.`
              );
            }

            const words = exchange.translatedText.split(/\s+/);
            if (
              blank.index < 0 ||
              blank.index >= words.length ||
              words[blank.index] !== blank.correctAnswer
            ) {
              throw new Error(
                `Blank ${j} Exchange ${i}: bad index / correctAnswer mismatch.`
              );
            }
          }
        }
      } catch (parseError: unknown) {
        console.error("Failed parse validate AI response JSON:", parseError);
        console.error("AI response text (raw):", text);
        if (parseError instanceof functions.https.HttpsError) {
          throw parseError;
        } else if (parseError instanceof Error) {
          throw new functions.https.HttpsError(
            "internal",
            "AI response was not valid or complete JSON. " +
              "Please try again or contact support if the issue persists.",
            parseError.message
          );
        } else {
          throw new functions.https.HttpsError(
            "internal",
            "AI response was not valid or complete JSON. " +
              "Please try again or contact support if the issue persists.",
            String(parseError)
          );
        }
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

      console.log(
        `Successfully generated and saved new lesson ${newLessonId} ` +
          `for topic ${topicTitle}`
      );

      return {success: true, lesson: newLesson};
    } catch (error: unknown) {
      console.error("Error creating lesson:", error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      } else if (error instanceof Error) {
        throw new functions.https.HttpsError(
          "internal",
          "Unexpected error creating lesson. " +
            "Please try again or contact support if the issue persists.",
          error.message
        );
      } else {
        throw new functions.https.HttpsError(
          "internal",
          "Unexpected error creating lesson. " +
            "Please try again or contact support if the issue persists.",
          String(error)
        );
      }
    }
  }
);
