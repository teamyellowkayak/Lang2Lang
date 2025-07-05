/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// For CommonJS
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

const { GoogleGenerativeAI } = require('@google/generative-ai');

// IMPORTANT: Store your API key securely
const GEMINI_API_KEY = functions.config().gemini.apikey;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);


// import {onRequest} from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });


exports.createLesson = functions.https.onCall(async (data, context) => {
    // Optional: Authenticate the user if lessons are tied to specific users
    // if (!context.auth) {
    //     throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    // }

    const { topicId, topicTitle } = data; // topicTitle is crucial for AI prompt

    if (!topicId || !topicTitle) {
        throw new functions.https.HttpsError('invalid-argument', 'Topic ID and Title are required.');
    }

    try {
        // --- Directly proceed to generate a new lesson using AI ---
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
            Create a Spanish language lesson for intermediate learners on the topic: "${topicTitle}".
            The lesson should consist of exactly 12 exchanges (24 total sentences: 12 from "user" and 12 from "other").
            Each exchange should have:
            - id: unique identifier (e.g., "ex1", "ex2", ...)
            - speaker: "user" or "other" (alternating, starting with "user")
            - speakerName: appropriate name (e.g., "You", "Waiter", "Store Employee", "Local person", "Bank Employee", etc. specific to the topic).
            - nativeText: English translation of the sentence.
            - translatedText: Spanish translation of the sentence.
            - blanks: an array of exactly 2 objects. Each object should have:
                - index: the 0-based word index of the word to be blanked in 'translatedText'.
                - correctAnswer: the original word that was blanked. The word must be a single word without punctuation attached.
            
            Ensure the translatedText uses natural and grammatically correct Spanish phrasing for an intermediate level.
            The blanks should target key vocabulary or grammatical structures relevant to the topic.
            The response should be a JSON object containing 'title', 'context', and an 'exchanges' array.
            
            Example Format:
            {
              "title": "A New Lesson on ${topicTitle}",
              "context": "Brief context for this specific lesson on ${topicTitle}.",
              "exchanges": [
                {
                  "id": "ex1",
                  "speaker": "user",
                  "speakerName": "You",
                  "nativeText": "Excuse me, where can I find the fresh vegetables?",
                  "translatedText": "Disculpe, ¿dónde puedo encontrar las verduras frescas?",
                  "blanks": [
                    { "index": 3, "correctAnswer": "encontrar" },
                    { "index": 5, "correctAnswer": "verduras" }
                  ]
                },
                {
                  "id": "ex2",
                  "speaker": "other",
                  "speakerName": "Store Employee",
                  "nativeText": "The fresh vegetables are in aisle three, next to the fruits section.",
                  "translatedText": "Las verduras frescas están en el pasillo tres, junto a la sección de frutas.",
                  "blanks": [
                    { "index": 0, "correctAnswer": "Las" },
                    { "index": 6, "correctAnswer": "pasillo" }
                  ]
                }
                // ... 10 more exchanges
              ]
            }
            Ensure the JSON is well-formed and directly parsable.
            Prioritize specific roles for 'speakerName' relevant to the topic.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        let lessonData;
        try {
            const cleanText = text.replace(/```json\n|```/g, '').trim();
            lessonData = JSON.parse(cleanText);

            // Basic validation of AI response structure
            if (!lessonData.title || !lessonData.context || !Array.isArray(lessonData.exchanges) || lessonData.exchanges.length !== 12) {
                throw new Error("AI response did not match expected structure (title, context, 12 exchanges array).");
            }

            // Further validate each exchange
            lessonData.exchanges.forEach((ex, idx) => {
                if (!ex.id || !ex.speaker || !ex.speakerName || !ex.nativeText || !ex.translatedText || !Array.isArray(ex.blanks) || ex.blanks.length !== 2) {
                    throw new Error(`Exchange ${idx} is malformed or incomplete.`);
                }
                ex.blanks.forEach(blank => {
                    if (typeof blank.index !== 'number' || !blank.correctAnswer) {
                        throw new Error(`Blank in exchange ${idx} is malformed.`);
                    }
                    // Basic check to ensure blanked word is actually in the translated text
                    const words = ex.translatedText.split(' ');
                    // Trim punctuation for a more robust comparison
                    if (!words[blank.index] || words[blank.index].replace(/[.,?!]/g, '').toLowerCase() !== blank.correctAnswer.toLowerCase()) {
                        console.warn(`Blank validation warning for exchange ${ex.id}: Expected "${blank.correctAnswer}" at index ${blank.index}, but found "${words[blank.index]}" or mismatch.`);
                        // This warning helps debug AI output
                    }
                });
            });

        } catch (parseError) {
            console.error("Failed to parse or validate AI response JSON:", parseError);
            console.error("AI response text (raw):", text);
            throw new functions.https.HttpsError('internal', 'AI response was not valid or complete JSON. Please try again.', parseError.message);
        }

        // Add metadata to the new lesson
        const newLessonId = db.collection('lessons').doc().id; // Generate a new unique ID
        const newLesson = {
            id: newLessonId,
            topicId: topicId,
            title: lessonData.title,
            context: lessonData.context,
            status: "available", // Set status to available
            exchanges: lessonData.exchanges,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Save the new lesson to Firestore
        await db.collection('lessons').doc(newLessonId).set(newLesson);
        console.log(`Successfully generated and saved new lesson ${newLessonId} for topic ${topicTitle}`);

        // --- Return the newly created lesson ---
        return { success: true, lesson: newLesson };

    } catch (error) {
        console.error("Error generating or fetching lesson:", error);
        if (error.code && error.details) {
            throw error; // Re-throw HttpsError
        }
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred during lesson generation.', error.message);
    }
});