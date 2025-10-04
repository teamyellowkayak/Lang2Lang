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

// Re-defining for clarity within the Cloud Function context
// if not in @shared/schema
interface AiTranslatedWord {
  word: string;
  translation: string;
  partOfSpeech: string | null;
  gender: string | null;
}

export interface WordTranslationResponse {
  word: string;
  translation: string;
  partOfSpeech: string | null;
  gender: string | null;
}

export interface Language {
  id: string; // Assuming an ID from Firestore
  code: string;
  name: string;
}

interface TranslateVocabularyCloudFunctionData {
  words: string[];
  sourceLanguage: string;
  targetLanguage: string;
}

/*
interface TranslateVocabularyCloudFunctionResult {
  success: boolean;
  translations: AiTranslatedWord[];
  message?: string;
}
*/

interface ChatAboutSentenceCloudFunctionData {
  nativeText: string;
  translatedText: string;
  userQuestion: string;
  sourceLanguage: string;
  targetLanguage: string;
}

interface ChatAboutSentenceCloudFunctionResult {
  success: boolean;
  explanation: string;
}

// Prompts
const LESSONPROMPT_1 = [
  "You are a language learning lesson generator.",
  "Your task is to create a structured language lesson in ",
].join("\n");

const LESSONPROMPT_2 = [
  " using the latin alphabet version of the language and ",
  " based on this given topic: '",
].join("\n");

const LESSONPROMPT_3 = [
  "'. ",
  "Each lesson you do is unique",
  " and highly varied from past lessons or standard lessons. ",
  " To ensure randomness, showcase diverse sentence structure",
  " and unique words. Avoid using the same opening phrases. ",
  " Avoid the most obvious initial words.",
  "The lesson should be engaging and useful for a learner type: ",
].join("\n");

const LESSONPROMPT_4 = [
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
  " \"incorrectAnswers\": [\"string\"],",
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
  " with each exchange being about 5-12 words per exchange, ",
  " but they can be more or less depending on the exchange. ",
  "3. **Speakers:** Alternate speakers between \"user\" and \"other\".",
  "   Start with \"user\".",
  "4. **Speaker Names:** Use diverse and appropriate names ",
  "  (e.g., \"You\",",
  "   \"Maria\", \"Doctor\", \"Waiter\"),",
  "   but since it is a dialog ",
  "   the name should be consistent for each exchange.",
  "5. **Native Text:** Provide clear, concise English sentences.",
  "6. **Translated Text:** Provide accurate, natural-sounding translations",
  "   in the language specified above.",
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
  "10. **Incorrect Answers (for Blanks):**",
  "    * For EACH blank, provide an array of 3 'incorrectAnswers'.",
  "    * Incorrect answers must be similar in appearance or type",
  " to the 'correctAnswer', but NOT identical",
  " and they should not be considered an accepted equivalent",
  " words when translated.",
  " Incorrect and correct answers should not include punctuation ",
  " like periods, commas, semicolons, upside-down exclamation marks, ",
  " exclamation marks, upside-down question marks, or question marks. ",
  " Pay special attention to the incorrectAnswers field, ",
  " which must always be a JSON array of strings, ",
  " even if it contains only one item. ",
  " Do not include any other text or conversational elements ",
  " in your response, only the JSON. ",
  "    * Examples for Incorrect Answers:",
  "      - Nouns: if 'banana' is correct, incorrect could be ",
  " 'bandana', 'manzana', 'platano'",
  " or the plural version versus the singular version.",
  "      - Articles/Prepositions: if 'El' is correct, incorrect could be ",
  " 'del', 'la', 'le'.",
  "      - Verbs: if 'habla' (he/she/usted speaks) is correct,",
  " incorrect could be 'hablas' (you speak), 'hable' (subjunctive),",
  " 'hablaba' (imperfect), 'hablo' (I speak).",
  "      - Adjectives/Adverbs: similar gender/number variations,",
  " plural versus singular, or related words.",
  "      - General: similar looking words in the same language",
  " such as if 'como' is correct, incorrect could be 'come', 'cama'.",
  "",
  "11. **Learning level:**",
  "    * exchanges content should be appropriate for ",
  " the learning level stated above.",
  "12. **Numbers:**",
  "    * Numbers should be written out; not shown in numeric form ",
  " e.g., 'forty five' and not '45'.",
  "13. **Randomness:**",
  "    * To make this more diverse, consider recent news events ",
  " that could be added into the story ",
  " and change the nature of the dialogue. ",
  " Also consider location ",
  " as a city, town, or village that speaks the language above ",
  " that has been mentioned in the news recently. ",
  " Ensure significant differences between generated sentences. ",
  "14. **Characters:**",
  "    * correct or incorrect words should ",
  " never include characters like '[' or ']' ",
  " because they mess up the grouping of words. ",
  "",
  " Example JSON (for structure only, content should be unique ",
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
  "{\"index\":0,\"correctAnswer\":\"Hola\",",
  " \"incorrectAnswers\":[\"Holi\", \"Alo\", \"Adios\"]},",
  "{\"index\":1,\"correctAnswer\":\"Cómo\",",
  " \"incorrectAnswers\":[\"Come\", \"Cuándo\", \"Qué\"]},",
  "{\"index\":2,\"correctAnswer\":\"estás\",",
  " \"incorrectAnswers\":[\"estas\", \"este\", \"estamos\"]}",
  "]",
  "},",
  "{\"id\":\"ex2\",",
  "\"speaker\":\"other\",",
  "\"speakerName\":\"Maria\",",
  "\"nativeText\":\"I am good, thank you. And you?\",",
  "\"translatedText\":\"Estoy bien, gracias. ¿Y tú?\",",
  "\"blanks\":[",
  "{\"index\":0,\"correctAnswer\":\"Estoy\",",
  " \"incorrectAnswers\":[\"Es\", \"Está\", \"Están\"]},",
  "{\"index\":1,\"correctAnswer\":\"bien\",",
  " \"incorrectAnswers\":[\"bueno\", \"malo\", \"feliz\"]},",
  "{\"index\":2,\"correctAnswer\":\"gracias\",",
  " \"incorrectAnswers\":[\"gracia\", \"favor\", \"corazón\"]},",
  "{\"index\":3,\"correctAnswer\":\"Y\",",
  " \"incorrectAnswers\":[\"E\", \"O\", \"Pero\"]},",
  "{\"index\":4,\"correctAnswer\":\"tú\",",
  " \"incorrectAnswers\":[\"usted\", \"vos\", \"yo\"]}",
  "]",
  "},", // End of ex2
  "]}", // End of exchanges array
].join("\n");

const BASIC_LESSONPROMPT_1 = [
  "You are a language learning lesson generator.",
  "Your task is to create a structured language lesson in ",
].join("\n");

const BASIC_LESSONPROMPT_2 = [
  " using the latin alphabet version of the language and ",
  " using all the following sentences as exchanges: ",
  " \"one, two, three, four, five, six, seven, eight, ",
  " nine, ten, eleven, twelve \", ",
  " \"twenty, thirty, forty, fifty, sixty, seventy, ",
  " eighty, ninety, one hundred \", ",
  " \"twenty one, twenty two, thirty one\", ",
  " \"Thank you, please, excuse me.  \", ",
  " \"Good morning. Good day. Good afternoon. Good evening. \", ",
  " \"How are you? \", ",
  " \"What is your name? My name is Drew. \", ",
  " \"I'm good. I'm sick. I'm tired. \", ",
  " \"Do you have food or water? I have money, a phone, ",
  " and a passport. Can I pay in dollars?\", ",
  " \"Where are the clothes? Are they in the room? ",
  " Where is the bank?  \", ",
  " \"Where are you from? I'm from Austin, Texas. ",
  " We're from Austin, Texas.\", ",
  " \"Where are we going? Who is that person?\", ",
  " \"I would like food. I like healthy food. ",
  " Can I have some water? \", ",
  " \"This thing is to the left. This is to the right. ",
  " That is ahead of me.\", ",
  " \"This is behind me. Those are up and these are down. \", ",
  " \"My water is here next to my wife. ",
  " My food is there beside my daughter.  \", ",
  " \"What time is it? When will we leave? When will we arrive? \", ",
  " \"What is that? Is it safe? \", ",
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
  " \"incorrectAnswers\": [\"string\"],",
  "        }",
  "      ]",
  "    }",
  "    // ... the remaining exchange objects",
  "  ]",
  "}",
  "",
  "Important Rules for Lesson Content:",
  "1. **Speakers:** In this case, the speaker will always be \"You\".",
  "2. **Native Text:** Provide clear, concise English translations.",
  "3. **Translated Text:** Provide accurate, natural-sounding translations",
  "   in the language specified above.",
  "4. **Title:** The title should be concise ",
  "  and descriptive of the lesson.",
  "5. **Blanks:** For EACH exchange, make every word a blank.",
  "   * The \"index\" for \"blanks\" is the 0-based word index in the",
  "     \"translatedText\" string.",
  "   * The \"correctAnswer\" is the word found at that exact index.",
  "   * Do NOT include the blank character (e.g., \"_\") in the",
  "     \"translatedText\". The \"blanks\" array provides info for UI.",
  "6. **Incorrect Answers (for Blanks):**",
  "    * For EACH blank, provide an array of 3 'incorrectAnswers'.",
  "    * Incorrect answers must be similar in appearance or type",
  " to the 'correctAnswer', but NOT identical",
  " and they should not be considered an accepted equivalent",
  " words when translated.",
  " Incorrect and correct answers should not include punctuation ",
  " like periods, commas, semicolons, upside-down exclamation marks, ",
  " exclamation marks, upside-down question marks, or question marks. ",
  " Pay special attention to the incorrectAnswers field, ",
  " which must always be a JSON array of strings, ",
  " always with an opening '[' and closing ']', ",
  " even if it contains only one item. ",
  " Do not include any other text or conversational elements ",
  " in your response, only the JSON. ",
  "    * Examples for Incorrect Answers:",
  "      - Nouns: if 'banana' is correct, incorrect could be ",
  " 'bandana', 'manzana', 'platano'",
  " or the plural version versus the singular version.",
  "      - Articles/Prepositions: if 'El' is correct, incorrect could be ",
  " 'del', 'la', 'le'.",
  "      - Verbs: if 'habla' (he/she/usted speaks) is correct,",
  " incorrect could be 'hablas' (you speak), 'hable' (subjunctive),",
  " 'hablaba' (imperfect), 'hablo' (I speak).",
  "      - Adjectives/Adverbs: similar gender/number variations,",
  " plural versus singular, or related words.",
  "      - General: similar looking words in the same language",
  " such as if 'como' is correct, incorrect could be 'come', 'cama'.",
  "",
  "7. **Numbers:**",
  "    * Numbers should be written out; not shown in numeric form ",
  " e.g., 'forty five' and not '45'.",
  "8. **Characters:**",
  "    * correct or incorrect words should ",
  " never include characters like '[' or ']' ",
  " because they mess up the grouping of words. ",
  "",
  " Example JSON (for structure only):",
  "{\"title\":\"Greetings\",",
  "\"context\":\"Learn basic greetings.\",",
  "\"exchanges\":[",
  "{\"id\":\"ex1\",",
  "\"speaker\":\"user\",",
  "\"speakerName\":\"You\",",
  "\"nativeText\":\"Hello! How are you?\",",
  "\"translatedText\":\"¡Hola! ¿Cómo estás?\",",
  "\"blanks\":[",
  "{\"index\":0,\"correctAnswer\":\"Hola\",",
  " \"incorrectAnswers\":[\"Holi\", \"Alo\", \"Adios\"]},",
  "{\"index\":1,\"correctAnswer\":\"Cómo\",",
  " \"incorrectAnswers\":[\"Come\", \"Cuándo\", \"Qué\"]},",
  "{\"index\":2,\"correctAnswer\":\"estás\",",
  " \"incorrectAnswers\":[\"estas\", \"este\", \"estamos\"]}",
  "]",
  "},",
  "{\"id\":\"ex2\",",
  "\"speaker\":\"other\",",
  "\"speakerName\":\"Maria\",",
  "\"nativeText\":\"I am good, thank you. And you?\",",
  "\"translatedText\":\"Estoy bien, gracias. ¿Y tú?\",",
  "\"blanks\":[",
  "{\"index\":0,\"correctAnswer\":\"Estoy\",",
  " \"incorrectAnswers\":[\"Es\", \"Está\", \"Están\"]},",
  "{\"index\":1,\"correctAnswer\":\"bien\",",
  " \"incorrectAnswers\":[\"bueno\", \"malo\", \"feliz\"]},",
  "{\"index\":2,\"correctAnswer\":\"gracias\",",
  " \"incorrectAnswers\":[\"gracia\", \"favor\", \"corazón\"]},",
  "{\"index\":3,\"correctAnswer\":\"Y\",",
  " \"incorrectAnswers\":[\"E\", \"O\", \"Pero\"]},",
  "{\"index\":4,\"correctAnswer\":\"tú\",",
  " \"incorrectAnswers\":[\"usted\", \"vos\", \"yo\"]}",
  "]",
  "},", // End of ex2
  "]}", // End of exchanges array
].join("\n");

const TRANSLATEPROMPT_1 = [
  "",
  " Translate the following list of words from the original language: ",
].join("\n");

const TRANSLATEPROMPT_2 = [
  " to the target language (using the latin alphabet): ",
].join("\n");

const TRANSLATEPROMPT_3 = [
  "",
  " For each word, provide: ",
  " 1. The original word.",
  " 2. Its translation in targetLanguage stated above.",
  " 3. Its part of speech (e.g., \"noun\", \"verb\", \"adjective\",",
  " \"adverb\", \"preposition\", \"pronoun\", \"conjunction\",",
  " \"interjection\").",
  " 4. Its grammatical gender in the targetLanguage stated above ",
  " if applicable (e.g., \"masculine\", \"feminine\", \"neuter\"), ",
  " otherwise null.",
  "",
  " Return the response as a JSON array of objects. ",
  " Each object must have the following keys:",
  " \"word\", \"translation\", \"partOfSpeech\", and \"gender\".",
  " Ensure the JSON is perfectly valid and can be directly parsed.",
  " Words to translate: ",
].join("\n");

const CHAT_PROMPT_INTRO = [
  "You are an expert language tutor and explainer.",
  " Your goal is to help a ",
  " user understand the nuances of translation between languages.",
  "",
  "The original sentence is in {sourceLanguage}: \"{nativeText}\"",
  "The translated sentence is in {targetLanguage}: \"{translatedText}\"",
  "",
].join("\n");

const CHAT_PROMPT_QUESTION_PREFIX = "Here is the user question: ";

const CHAT_PROMPT_GUIDANCE = [
  "Please provide a clear, concise, and helpful explanation. ",
  "Focus on linguistic reasons, grammar, vocabulary, or cultural context. ",
  "Avoid conversational filler. If you cannot answer based on the provided ",
  "context, state that clearly.",
].join("\n");


// Defines allowed origins for CORS.
const allowedOrigins = [
  "http://localhost:5173",
  "[https://storage.googleapis.com/lang2lang-dev_frontend](https://storage.googleapis.com/lang2lang-dev_frontend)",
  "[https://storage.googleapis.com](https://storage.googleapis.com)",
  // Add other production domains if applicable
];

// --- Cloud Function ---
/**
 * Generates a placeholder lesson based on topic ID and title.
 * @param {Object} params - Parameters for the lesson.
 * @param {string} params.topicId - ID of the topic.
 * @param {string} params.topicTitle - Title of the topic.
 * @param {string} params.topicLanguage - Language of the topic.
 * @param {string} params.topicLevel - Level of the topic.
 * @return {Promise<Object>} A placeholder lesson object.
 */

exports.createLesson = functions
  .https.onRequest(
    {secrets: [geminiApiKey]},
    async (req: Request, res: Response) => {
      const origin = req.headers.origin;
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      }
      res.setHeader("Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, DELETE");
      res.setHeader("Access-Control-Allow-Headers",
        "Content-Type, Authorization");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Max-Age", "3600");

      // Handle preflight OPTIONS request
      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }
      const {topicId, topicTitle, topicLanguage, topicLevel} = req.body;

      if (!topicId || !topicTitle) {
        res.status(400).json({success: false, message: "need TopicID & Title"});
        return;
      }

      if (!topicLanguage) {
        res.status(400).json({success: false, message: "need language"});
        return;
      }

      if (!topicLevel) {
        res.status(400).json({success: false, message: "need topic level"});
        return;
      }

      // 3. Access the secret's value using .value()
      const apiKey = geminiApiKey.value();

      try {
        console.log("createLesson called: topicId:", topicId);
        console.log("createLesson called: title:", topicTitle);
        console.log("createLesson called: language:", topicLanguage);
        console.log("createLesson called: level:", topicLevel);

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
          model: "gemini-2.5-pro",
        });

        const isBasic = topicTitle.toLowerCase().includes("drew basics");
        const lessonPromptD = LESSONPROMPT_1 +
            topicLanguage +
            LESSONPROMPT_2 +
            topicTitle +
            LESSONPROMPT_3 +
            topicLevel +
            LESSONPROMPT_4;
        const lessonPromptB = BASIC_LESSONPROMPT_1 +
              topicLanguage +
              BASIC_LESSONPROMPT_2;
        const lessonPrompt = isBasic ? lessonPromptB : lessonPromptD;

        const generationConfig = {
          temperature: 0.95,
          topP: 0.9,
          topK: 1000,
        };

        // maxOutputTokens: 2048,

        const requestPrompt = {
          contents: [{role: "user", parts: [{text: lessonPrompt}]}],
          generationConfig: generationConfig,
        };

        const result = await model.generateContent(
          requestPrompt
        );
        const response = await result.response;
        const text = response.text();

        let lessonData: LessonDataFromAI;
        try {
          const cleanText = text.replace(/```json\n|```/g, "").trim();
          const fixedJsonText = fixAIJsonResponse(cleanText);
          console.log("AI Response fixedJsonText:", fixedJsonText);
          lessonData = JSON.parse(fixedJsonText);

          if (
            !lessonData ||
            typeof lessonData.title !== "string" ||
            typeof lessonData.context !== "string" ||
            !Array.isArray(lessonData.exchanges)
            // || lessonData.exchanges.length !== 10
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
          console.error("AI response test:", text);

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

/**
 * Attempts to fix known JSON formatting issues from AI responses.
 * Specifically, it fixes cases where 'incorrectAnswers'
 * might be a comma-separated string list instead of a JSON array.
 * @param {string} rawJsonString - The raw string response from the AI.
 * @return {string} A string w common JSON errors fixed as necessary.
 */
function fixAIJsonResponse(rawJsonString: string): string {
  // Pattern to find: "incorrectAnswers": "val1", "val2", "val3"
  // It looks for "incorrectAnswers": followed by a string in quotes,
  // and then optionally more quoted strings separated by ", "
  // until a non-quote/non-comma/non-space char or end of line.
  const start = /("incorrectAnswers":\s*)/;
  // ("[^"]*"(?:,\s*"[^"]*")*)(?=[,}\n])/g;
  const content = /("([^"]*)",\s*"([^"]*)",\s*"([^"]*)")/;
  const regex = new RegExp(start.source + content.source, "g");
  const fixedString = rawJsonString.replace(regex, (match, p1, p2) => {
    return `${p1}[${p2}]`;
  });

  return fixedString;
}

exports.translateVocabulary = functions
  .https.onRequest(
    {secrets: [geminiApiKey]},
    async (req: Request, res: Response) => {
      const origin = req.headers.origin;
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      }
      res.setHeader("Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, DELETE");
      res.setHeader("Access-Control-Allow-Headers",
        "Content-Type, Authorization");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Max-Age", "3600");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        res.status(405).json({
          success: false,
          message: "Method Not Allowed. Only POST is supported.",
        });
        return;
      }

      // 3. Parse and validate the request body
      const {
        words,
        sourceLanguage,
        targetLanguage,
      } = req.body as TranslateVocabularyCloudFunctionData;

      if (
        !words ||
        !Array.isArray(words) ||
        words.length === 0 ||
        !sourceLanguage ||
        !targetLanguage
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid request payload." +
            " Requires \"words\" (array)," +
            " \"sourceLanguage\", and \"targetLanguage\".",
        });
        return;
      }

      // 4. Access the Gemini API key securely
      const apiKey = geminiApiKey.value();
      if (!apiKey) {
        console.error(
          "GeminiAPIKey not loaded/inaccessible in" +
          " translateVocabulary function."
        );
        res.status(500).json({
          success: false,
          message: "Gemini API Key is not configured for translation service.",
        });
        return;
      }

      // 5. Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro", // Or your preferred model
      });

      try {
        console.log(
          "translateVocabulary called for ${words.length} words " +
          "(${sourceLanguage} to ${targetLanguage})."
        );
        console.log("Words to translate:", words.join(", "));

        // 6. Construct AI prompt for word translation w/ grammatical info
        const translationPrompt = TRANSLATEPROMPT_1 +
            sourceLanguage +
            TRANSLATEPROMPT_2 +
            targetLanguage +
            TRANSLATEPROMPT_3 +
            JSON.stringify(words);

        const result = await model.generateContent(translationPrompt);
        const response = await result.response;
        const text = response.text();

        console.log("AI Raw Response for Vocabulary:", text);

        let translations: AiTranslatedWord[];
        try {
          // Clean text by removing markdown code block delimiters if present
          const cleanText = text.replace(/```json\n|```/g, "").trim();
          translations = JSON.parse(cleanText) as AiTranslatedWord[];

          // *** START OF CRITICAL NEW LOGGING ***
          console.log("[CF translateVocabulary] Start detailed validation...");
          if (!Array.isArray(translations)) {
            console.error(
              "[CF translateVocabulary] ERROR: " +
              "\"translations\" is not an array after JSON.parse. " +
              "Value:", translations
            );
            // Custom error for this case
            throw new Error("Parsed AI response is not an array.");
          }

          // Basic validation of the parsed array
          if (!Array.isArray(translations) || translations.some((item) =>
            typeof item.word !== "string" ||
            typeof item.translation !== "string" ||
            // `typeof null` is "object", so include "object" here
            !["string", "object"].includes(typeof item.partOfSpeech) ||
            // `typeof null` is "object", so include "object" here
            !["string", "object"].includes(typeof item.gender)
          )) {
            throw new Error(
              "AI response structure or type validation failed" +
              " for translations array."
            );
          }
        } catch (parseError: unknown) {
          console.error(
            "Failed to parse/validate AI translation response:",
            parseError
          );
          console.error("AI response raw text:", text);
          const message =
            parseError instanceof Error ?
              parseError.message :
              String(parseError);
          res.status(500).json({
            success: false,
            message: "Invalid AI response structure for vocabulary" +
              "translation. Please try again.",
            details: message,
          });
          return;
        }
        // 7. Send success response
        res.status(200).json({
          success: true,
          translations: translations,
        });
        return;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Vocabulary translation failed:", message);
        res.status(500).json({
          success: false,
          message: "Translation service error: ${message}",
        });
        return;
      }
    }
  );

exports.chatAboutSentence = functions
  .https.onRequest(
    {secrets: [geminiApiKey]},
    async (req: Request, res: Response) => {
      const origin = req.headers.origin;
      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      }
      res.setHeader("Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, DELETE");
      res.setHeader("Access-Control-Allow-Headers",
        "Content-Type, Authorization");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Max-Age", "3600");

      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      // 2. Ensure it is a POST request
      if (req.method !== "POST") {
        res.status(405).json({
          success: false,
          message: "Method Not Allowed. Only POST is supported.",
        });
        return;
      }

      // 3. Parse and validate the request body
      const {
        nativeText,
        translatedText,
        userQuestion,
        sourceLanguage,
        targetLanguage,
      } = req.body as ChatAboutSentenceCloudFunctionData;

      if (
        !nativeText ||
        !translatedText ||
        !userQuestion ||
        !sourceLanguage ||
        !targetLanguage
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid request payload. " +
                   "Requires \"nativeText\", \"translatedText\", " +
                   "\"userQuestion\", \"sourceLanguage\", " +
                   "and \"targetLanguage\".",
        });
        return;
      }

      // 4. Access the Gemini API key securely
      const apiKey = geminiApiKey.value();
      if (!apiKey) {
        console.error(
          "GeminiAPIKey not loaded/inaccessible in " +
          "chatAboutSentence function."
        );
        res.status(500).json({
          success: false,
          message: "Gemini API Key is not configured for chat service.",
        });
        return;
      }

      // 5. Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
      });

      try {
        console.log("chatAboutSentence called for text analysis.");
        console.log("Native:", nativeText, "Translated:", translatedText);
        console.log("Question:", userQuestion);

        // 6. Construct the AI prompt
        const chatPrompt = CHAT_PROMPT_INTRO
          .replace("{sourceLanguage}", sourceLanguage)
          .replace("{nativeText}", nativeText)
          .replace("{targetLanguage}", targetLanguage)
          .replace("{translatedText}", translatedText) +
          CHAT_PROMPT_QUESTION_PREFIX + userQuestion + "\n\n" +
          CHAT_PROMPT_GUIDANCE;

        console.log("AI Chat Prompt:", chatPrompt);

        const result = await model.generateContent(chatPrompt);
        const response = await result.response;
        const text = response.text(); // The AI's explanation

        console.log("AI Chat Response:", text);

        // 7. Send success response
        const chatResponse: ChatAboutSentenceCloudFunctionResult = {
          success: true,
          explanation: text,
        };
        res.status(200).json(chatResponse);
        return;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Chat about sentence failed:", message, err);
        res.status(500).json({
          success: false,
          message: `Chat service error: ${message}`,
        });
        return;
      }
    }
  );
