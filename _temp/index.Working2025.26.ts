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

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();
const db = admin.firestore();

const GEMINI_API_KEY = functions.config().gemini.apikey;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);


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

exports.createLesson = functions.https.onCall(
  async (request: CallableRequest<CreateLessonData>) => {
    const {data} = request;
    const {topicId, topicTitle} = data;

    if (!topicId || !topicTitle) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Topic ID and Title are required."
      );
    }

    try {
      // Initialize the Gemini model
      const model = genAI.getGenerativeModel({model: "gemini-pro"});

      // Shortened prompt for initial testing of AI interaction
      const prompt = `
        Generate a very short Spanish language lesson for topic "${topicTitle}".
        Provide exactly 2 exchanges in JSON format.
        Each exchange must have id, speaker, speakerName, nativeText,
        translatedText, and blanks (array of 2).
        Example: { "title": "Test", "context": "Test", "exchanges":
        [{ "id": "ex1", "speaker": "user", "speakerName": "You",
        "nativeText": "Hi", "translatedText": "Hola", "blanks":
        [{ "index": 0, "correctAnswer": "Hola" }, { "index": 0,
        "correctAnswer": "Hola" }]}]}.
        Ensure the JSON is well-formed.
      `; // eslint-disable-line max-len

      // Generate content from the model
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let lessonData: LessonDataFromAI;
      try {
        // Attempt to parse the AI's response text as JSON
        const cleanText = text.replace(/```json\n|```/g, "").trim();
        lessonData = JSON.parse(cleanText);

        // Basic validation of AI response structure
        if (!lessonData.title ||
            !lessonData.context ||
            !Array.isArray(lessonData.exchanges) ||
            lessonData.exchanges.length !== 2) {
          throw new Error(
            "AI response <> expected struct (title, context, " +
            "2 exchanges array)."
          );
        }
        // No deeper validation yet, we'll add that back in later
      } catch (parseError: unknown) {
        console.error("Failed parse validate AI response JSON:", parseError);
        console.error("AI response text (raw):", text);
        if (parseError instanceof functions.https.HttpsError) {
          throw parseError; // Re-throw HttpsError directly
        } else if (parseError instanceof Error) {
          throw new functions.https.HttpsError(
            "internal",
            "AI response was not valid or complete JSON. Please try again.",
            parseError.message
          );
        } else {
          throw new functions.https.HttpsError(
            "internal",
            "AI response was not valid or complete JSON. Please try again.",
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
        `for topic ${topicTitle}` // eslint-disable-line max-len
      );

      return {success: true, lesson: newLesson};
    } catch (error: unknown) {
      console.error("Error creating lesson:", error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      } else if (error instanceof Error) {
        throw new functions.https.HttpsError(
          "internal",
          "Unexpected error creating lesson.",
          error.message
        );
      } else {
        throw new functions.https.HttpsError(
          "internal",
          "Unexpected error creating lesson.",
          String(error)
        );
      }
    }
  }
);
