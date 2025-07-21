// Lang2Lang/server/storage.ts

import { Firestore } from "@google-cloud/firestore";
// import { initializeApp, getApp, type App } from 'firebase-admin/app'; // see if needed any more
// import { getFunctions, type Functions } from 'firebase-admin/functions'; // see if needed any more
import { GoogleAuth } from 'google-auth-library';
import * as dotenv from 'dotenv';

import {
  type User,
  type InsertUser,
  type Language,
  type InsertLanguage,
  type Topic,
  type InsertTopic,
  type Lesson,
  type LessonStatus,
  type InsertLesson,
  type Vocabulary, // This type definition is crucial
  type InsertVocabulary,
  type Progress,
  type InsertProgress,
  type StoredLesson,
  type AiTranslatedWord,
} from "@shared/schema";

// Loads local variables from .env into process.env
dotenv.config();

// --- Firestore Initialization ---
const db = new Firestore();

// Define the type for the data you'll pass to the createLesson Cloud Function
interface CreateLessonCloudFunctionData {
  topicId: string;
  topicTitle: string;
  topicLanguage: string;
  topicLevel: string;
}

// Define the expected return type from the Cloud Function
interface CreateLessonCloudFunctionResult {
  success: boolean;
  lesson: StoredLesson; // Assuming StoredLesson is the shape of the saved lesson
}

interface TranslateVocabularyCloudFunctionData {
  words: string[];
  sourceLanguage: string;
  targetLanguage: string;
}

interface TranslateVocabularyCloudFunctionResult {
  success: boolean;
  translations: AiTranslatedWord[];
  message?: string; // Optional message in case of partial success or specific error
}

// NOTE: This interface is for internal use in the `saveVocabularyEntry` method if you wish to define it strictly.
// The `Vocabulary` type from @shared/schema is used for the actual data passed around.
// interface VocabularyEntry {
//   word: string;
//   translation: string; // comma-separated
//   sourceLanguage: string;
//   targetLanguage: string;
//   partOfSpeech: string | null; // comma-separated
//   gender: string | null; // null if not applicable or unknown
// }

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

// --- Firestore Storage Class ---
export class FirestoreStorage {
  private auth: GoogleAuth;

  constructor() {
    this.auth = new GoogleAuth();
  }

  /**
   * Creates a new lesson by invoking the 'createLesson' Cloud Function.
   * @param payload The data required by the Cloud Function.
   * @returns A Promise that resolves with the newly created StoredLesson.
   */
  async createLesson(payload: CreateLessonCloudFunctionData): Promise<StoredLesson> {
    const functionName = "createLesson";
    const projectId = process.env.GCLOUD_PROJECT;
    const region = process.env.FUNCTION_REGION;

    if (!projectId || !region) {
      throw new Error("Project ID or Function Region is not configured in Cloud Run environment variables.");
    }

    const functionUrl = `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;
    const targetAudience = functionUrl;
    let idToken: string | null = null;

    try {
      const client = await this.auth.getIdTokenClient(targetAudience);
      const headers = await client.getRequestHeaders();
      idToken = headers['Authorization']?.split('Bearer ')[1];
      if (!idToken) throw new Error('Failed to obtain ID token.');
    } catch (error: any) {
      console.error("DEBUG: Error obtaining ID token:", error.message);
      throw new Error(`Failed to obtain ID token: ${error.message}`);
    }

    try {
      console.log("Sending to createLesson:", JSON.stringify(payload));
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const rawResponseText = await response.text();
      console.log("DEBUG: Raw AI response received:", rawResponseText); // This is the crucial log

      if (!response.ok) {
        const errorBody = rawResponseText; // await response.text();
        console.error(`DEBUG: Error calling ${functionName}: HTTP ${response.status}`, errorBody);
        throw new Error(`Function call failed with status ${response.status}: ${errorBody}`);
      }

      console.log("DEBUG: Corrected JSON string:", rawResponseText);
      const responseDataJson = JSON.parse(rawResponseText);
      const responseData = responseDataJson as CreateLessonCloudFunctionResult;

      // The actual return value is nested inside the 'result' property
      if (responseData.success && responseData.lesson) {
        console.log("DEBUG: Lesson creation successful via function call.");
        return responseData.lesson;
      } else {
        console.error("DEBUG: Unexpected function response:", responseData);
        throw new Error('Function call did not indicate success or returned an unexpected payload.');
      }
    } catch (error: any) {
      console.error(`DEBUG: Exception during HTTP call to ${functionName}:`, error.message);
      throw error;
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> { // ID is string in Firestore
    const docRef = db.collection('users').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return undefined;
    }
    // Cast to User type. Firestore data is untyped, so explicit casting or validation is needed.
    return { id: doc.id, ...doc.data() } as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const snapshot = await db.collection('users').where('username', '==', username).limit(1).get();
    if (snapshot.empty) {
      return undefined;
    }
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Firestore generates ID automatically on add() or you can set it with doc(id).set()
    const docRef = await db.collection('users').add(insertUser);
    const user: User = { id: docRef.id, ...insertUser } as User;
    return user;
  }

  // Language methods
  async getLanguages(): Promise<Language[]> {
    const snapshot = await db.collection('languages').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Language[];
  }

  async getLanguageByCode(code: string): Promise<Language | undefined> {
    const snapshot = await db.collection('languages').where('code', '==', code).limit(1).get();
    if (snapshot.empty) {
      return undefined;
    }
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Language;
  }

  async createLanguage(insertLanguage: InsertLanguage): Promise<Language> {
    const docRef = await db.collection('languages').add(insertLanguage);
    const language: Language = { id: docRef.id, ...insertLanguage } as Language;
    return language;
  }

  // Topic methods
  async getTopics(targetLanguage: string): Promise<Topic[]> {
    const snapshot = await db.collection('topics').where('targetLanguage', '==', targetLanguage).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Topic[];
  }

  async getTopicById(id: string): Promise<Topic | undefined> { // ID is string
    const docRef = db.collection('topics').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return undefined;
    }
    return { id: doc.id, ...doc.data() } as Topic;
  }

  async createTopic(insertTopic: InsertTopic): Promise<Topic> {
    const docRef = await db.collection('topics').add(insertTopic);
    const topic: Topic = { id: docRef.id, ...insertTopic } as Topic;
    return topic;
  }

  // Lesson methods
  async getLessons(topicId: string): Promise<Lesson[]> {
    const snapshot = await db.collection('lessons').where('topicId', '==', topicId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Lesson[];
  }

  async getLessonById(id: string): Promise<Lesson | undefined> { // ID is string
    console.log(`[Firestore] Attempting to fetch lesson by DOCUMENT ID: ${id}`);
    const docRef = db.collection('lessons').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      console.warn(`[Firestore] Lesson with DOCUMENT ID ${id} NOT FOUND.`);
      return undefined;
    }
    return { id: doc.id, ...doc.data() } as Lesson;
  }

  async getNextLessonForTopic(topicId: string, topicTitle: string): Promise<string | null> {
    console.log(`[Firestore] Storage.ts Searching for next lesson for topicId: ${topicId}. v2025.07.05a with title: ${topicTitle}.`);
    topicTitle = topicTitle ?? 'New lesson without a topicTitle';
    const lessonsRef = db.collection('lessons');

    // 1. Try to find a lesson already 'in progress' for this topicId
    const inProgressSnapshot = await lessonsRef
      .where('topicId', '==', topicId)
      .where('status', '==', 'in progress')
      .limit(1)
      .get();

    if (!inProgressSnapshot.empty) {
      const docId = inProgressSnapshot.docs[0].id;
      console.log(`[Firestore] Found lesson in progress for topicId ${topicId}: ${docId}`);
      return docId; // Return the ID of the in-progress lesson
    }

    // 2. If no lesson is 'in progress', find the first 'available' lesson
    const availableSnapshot = await lessonsRef
      .where('topicId', '==', topicId)
      .where('status', '==', 'available')
      .orderBy('title') // Or any other field to ensure consistent ordering
      .limit(1)
      .get();

    if (!availableSnapshot.empty) {
      const docId = availableSnapshot.docs[0].id;
      console.log(`[Firestore] Found available lesson for topicId ${topicId}: ${docId}. Setting to 'in progress'.`);
      // Update its status to 'in progress'
      await lessonsRef.doc(docId).update({ status: 'in progress' });
      return docId; // Return the ID of the newly in-progress lesson
    }

    // 3. If no 'available' or 'in progress' lesson is found, GENERATE a new one
    console.log(`[Firestore] No available or in-progress lessons found for topicId: ${topicId}. Calling Cloud Function to create a new one.`);

    try {

      const topic = await this.getTopicById(topicId);
      if (!topic) {
        console.error(`[Firestore] Topic with ID ${topicId} not found when trying to create new lesson.`);
        return null;
      }

      // 'targetLanguage' is the code (e.g., "es")
      const topicLevel = topic.difficulty;
      const targetLanguageCode = topic.targetLanguage;
      const language = await this.getLanguageByCode(targetLanguageCode);

      if (!language) {
        console.error(`[Firestore] Language with code ${targetLanguageCode} not found for topic ID ${topicId}.`);
        return null;
      }

      // 'language.name' is the full name (e.g., "Spanish")
      const fullTopicLanguageName = language.name;

      console.log(`About to create new lesson for topicId: ${topicId} with title: ${topicTitle} language: ${fullTopicLanguageName} level: ${topicLevel}.`);

      // If this promise resolves, 'newLesson' will directly be the StoredLesson object.
      const newLesson = await this.createLesson({
        topicId: topicId,
        topicTitle: topicTitle,
        topicLanguage: fullTopicLanguageName,
        topicLevel: topicLevel,
      });


      // At this point, newLesson is guaranteed to be a StoredLesson if no error was thrown by createLesson.
      console.log(`[Firestore] Successfully created new lesson with ID: ${newLesson.id}`);

      // Set the newly created lesson to 'in progress' status immediately
      await lessonsRef.doc(newLesson.id).update({ status: 'in progress' });

      return newLesson.id; // Return the ID of the newly created and set lesson

    } catch (error) {
      console.error(`[Firestore] Error calling createLesson Cloud Function:`, error);
      // This 'error' object could be:
      // - An HttpsError from the Cloud Function (if it threw one and your fetch logic captured it)
      // - A regular Error from your createLesson method (e.g., failed ID token, bad HTTP response)
      return null; // Indicate failure to create a new lesson
    }
  }


  // Vocabulary methods
  async getVocabulary(word: string, targetLanguage: string): Promise<Vocabulary | undefined> {
    const snapshot = await db.collection('vocabulary')
      .where('word', '==', word)
      .where('targetLanguage', '==', targetLanguage)
      .limit(1)
      .get();
    if (snapshot.empty) {
      return undefined;
    }
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Vocabulary;
  }

  async getVocabularyByLanguage(targetLanguage: string): Promise<Vocabulary[]> {
    const snapshot = await db.collection('vocabulary').where('targetLanguage', '==', targetLanguage).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Vocabulary[];
  }

  /**
   * Looks up a vocabulary entry using word, source language, and target language.
   * This is intended for the specific lookup in the Phrase Help feature,
   * where source language is crucial for uniqueness.
   * @param word The word to look up (normalized).
   * @param sourceLanguage The source language code (e.g., 'en').
   * @param targetLanguage The target language code (e.g., 'es').
   * @returns The Vocabulary object if found, otherwise undefined.
   */
  async getVocabularyEntrySpecific(
    word: string, // `word` here should be normalized before calling this.
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<Vocabulary | undefined> {
    try {
      const querySnapshot = await db.collection('vocabulary')
        .where('word', '==', word) // Ensure the 'word' stored in DB is normalized
        .where('sourceLanguage', '==', sourceLanguage)
        .where('targetLanguage', '==', targetLanguage)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return undefined;
      }
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Vocabulary;
    } catch (error) {
      console.error('Error fetching specific vocabulary entry:', error);
      return undefined; // Consistent error handling
    }
  }


  /**
   * Saves a new vocabulary entry to the database. If an entry for the word already exists (based on word, source, target),
   * it updates the existing entry by merging the new combined fields. Otherwise, it creates a new one.
   * @param entryToSave The Vocabulary object with potentially combined strings for translation, etc.
   * @returns The newly created or updated Vocabulary object including its ID, or null on error.
   */
  async saveVocabularyEntry(entryToSave: Omit<Vocabulary, 'id'>): Promise<Vocabulary | null> {
    try {
      // Normalize the word from the entryToSave for consistent querying and storage
      const normalizedWordToSave = this.normalizeText(entryToSave.word);

      const collectionRef = db.collection('vocabulary');
      const existingDocQuery = await collectionRef
        .where('word', '==', normalizedWordToSave) // Query by normalized word
        .where('sourceLanguage', '==', entryToSave.sourceLanguage)
        .where('targetLanguage', '==', entryToSave.targetLanguage)
        .limit(1)
        .get();

      if (!existingDocQuery.empty) {
        const docRef = existingDocQuery.docs[0].ref;
        const existingData = existingDocQuery.docs[0].data() as Vocabulary;

        // --- START OF MODIFIED LOGIC ---
        // Merge translations, partsOfSpeech, and genders
        // Use Set to ensure uniqueness of individual parts before joining
        const mergeStrings = (existing: string | null, newVals: string | null): string | null => {
            const parts = new Set<string>();
            if (existing) existing.split(',').forEach(p => parts.add(p.trim()));
            if (newVals) newVals.split(',').forEach(p => parts.add(p.trim()));
            const result = Array.from(parts).filter(Boolean).sort().join(', '); // Filter Boolean to remove empty strings, sort for consistency
            return result === "" ? null : result;
        };

        const mergedTranslation = mergeStrings(existingData.translation, entryToSave.translation);
        const mergedPartOfSpeech = mergeStrings(existingData.partOfSpeech, entryToSave.partOfSpeech);
        const mergedGender = mergeStrings(existingData.gender, entryToSave.gender);

        await docRef.update({
          translation: mergedTranslation,
          partOfSpeech: mergedPartOfSpeech,
          gender: mergedGender,
        });

        // Return the updated entry from the database
        const updatedDoc = await docRef.get();
        return { id: updatedDoc.id, ...updatedDoc.data() } as Vocabulary;
        // --- END OF MODIFIED LOGIC ---
      } else {
        // Create a new document if no existing entry
        const newDocRef = collectionRef.doc();
        const newEntry: Vocabulary = {
          ...entryToSave,
          id: newDocRef.id,
          // Ensure word is stored normalized for consistency in DB queries
          word: normalizedWordToSave
        };
        await newDocRef.set(newEntry);
        console.log('Vocabulary entry added with ID:', newDocRef.id);
        return newEntry;
      }
    } catch (error) {
      console.error('Error saving vocabulary entry:', error);
      return null;
    }
  }

  private async translateVocabularyWithCloudFunction(
    payload: TranslateVocabularyCloudFunctionData
  ): Promise<TranslateVocabularyCloudFunctionResult> {
    const functionName = "translateVocabulary"; // This is the name of your new Cloud Function
    const projectId = process.env.GCLOUD_PROJECT;
    const region = process.env.FUNCTION_REGION;

    console.log("[BACKEND] Start: 202507090200");

    if (!projectId || !region) {
      throw new Error("Project ID or Function Region is not configured for Cloud Functions (for AI).");
    }

    const functionUrl = `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;
    const targetAudience = functionUrl;
    let idToken: string | null = null;

    try {
      const client = await this.auth.getIdTokenClient(targetAudience);
      const headers = await client.getRequestHeaders();
      idToken = headers['Authorization']?.split('Bearer ')[1];
      if (!idToken) throw new Error('Failed to obtain ID token for AI Cloud Function.');
    } catch (error: any) {
      console.error("DEBUG: Error obtaining ID token for AI Cloud Function:", error.message);
      throw new Error(`Failed to obtain ID token for AI Cloud Function: ${error.message}`);
    }

    console.log("[BACKEND] translateVocabularyWithCloudFunction middle");

    try {
      console.log("[BACKEND] translateVocabularyWithCloudFunction before await fetch");


      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("[BACKEND] translateVocabularyWithCloudFunction after await fetch");
      console.log("[BACKEND] Cloud Function HTTP Status:", response.status); // Log status

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[BACKEND] Cloud Function returned !response.ok. Error body:", errorText); // Log error body if not OK
        throw new Error(`Cloud Function call to ${functionName} failed: ${response.status} - ${errorText}`);
      }

      console.log("[BACKEND] translateVocabularyWithCloudFunction about to read response text.");
      const rawResponseText = await response.text(); // <-- CRITICAL CHANGE: Read as text first!
      console.log("[BACKEND] Raw response text from Cloud Function 'translateVocabulary':", rawResponseText); // Log raw text

      try {
        const rawCloudFunctionResponse = JSON.parse(rawResponseText); // <-- Now try to parse the text
        console.log("[BACKEND] Parsed JSON from Cloud Function 'translateVocabulary':", JSON.stringify(rawCloudFunctionResponse, null, 2));
        return rawCloudFunctionResponse as TranslateVocabularyCloudFunctionResult;
      } catch (jsonParseError: any) {
        console.error(`[BACKEND] JSON parsing failed for response from Cloud Function ${functionName}:`, jsonParseError);
        // Re-throw with more context
        throw new Error(`Invalid JSON response from Cloud Function ${functionName}: ${jsonParseError.message}. Raw text: "${rawResponseText.substring(0, 200)}..."`);
      }

    } catch (error) {
      console.error(`Error calling Cloud Function ${functionName}:`, error);
      // Re-throw to allow higher-level handling (e.g., in lookupAndTranslateVocabulary)
      throw error;
    }
  }

  /**
   * Orchestrates the lookup, AI translation (via Cloud Function), and saving of vocabulary words.
   * This method encapsulates the core logic for the Phrase Help feature.
   * @param nativeText The input text phrase in the source language.
   * @param sourceLanguage The source language code.
   * @param targetLanguage The target language code.
   * @returns A Promise resolving to an array of translated words for the frontend.
   */
  async lookupAndTranslateVocabulary(
    nativeText: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<Vocabulary[]> {
    const originalWords = nativeText.split(/\s+/).filter(Boolean); // Split by spaces, filter empty
    const uniqueNormalizedWords = new Set<string>();
    const wordOriginalCasingMap = new Map<string, string>(); // Map normalized word back to original casing

    originalWords.forEach(word => {
      const normalized = this.normalizeText(word); // Use class method
      if (normalized) {
        uniqueNormalizedWords.add(normalized);
        if (!wordOriginalCasingMap.has(normalized)) {
          wordOriginalCasingMap.set(normalized, word);
        }
      }
    });

    const wordsToProcess = Array.from(uniqueNormalizedWords);

    // --- START OF MODIFIED LOGIC ---
    // This map will hold the final consolidated Vocabulary object for each normalized word,
    // whether from DB or AI.
    const consolidatedResults: Map<string, Vocabulary> = new Map();
    // --- END OF MODIFIED LOGIC ---


    // 1. Look up words in the vocabulary database first
    const wordsToTranslateByAI: string[] = [];
    for (const normalizedWord of wordsToProcess) {
      // Use normalizeText when querying the DB as the 'word' field in DB should be normalized
      const dbEntry = await this.getVocabularyEntrySpecific(normalizedWord, sourceLanguage, targetLanguage);
      if (dbEntry) {
        // --- START OF MODIFIED LOGIC ---
        // Use the original word casing for the frontend display, but keep normalized word as key
        consolidatedResults.set(normalizedWord, { ...dbEntry, word: wordOriginalCasingMap.get(normalizedWord) || normalizedWord });
        // --- END OF MODIFIED LOGIC ---
      } else {
        wordsToTranslateByAI.push(normalizedWord);
      }
    }

    // 2. Call AI Cloud Function for words not found in the database
    // --- START OF MODIFIED LOGIC ---
    if (wordsToTranslateByAI.length > 0) {
      try {
        const aiResponse = await this.translateVocabularyWithCloudFunction({
          words: wordsToTranslateByAI,
          sourceLanguage: sourceLanguage,
          targetLanguage: targetLanguage,
        });

        if (aiResponse.success) {
          // Temporarily collect all AI results for each word before combining
          const aiDefinitionsMap = new Map<string, { translations: string[], partsOfSpeech: (string | null)[], genders: (string | null)[] }>();

          for (const aiResult of aiResponse.translations) {
            const normalizedAiWord = this.normalizeText(aiResult.word);
            if (!aiDefinitionsMap.has(normalizedAiWord)) {
              aiDefinitionsMap.set(normalizedAiWord, { translations: [], partsOfSpeech: [], genders: [] });
            }
            const currentDef = aiDefinitionsMap.get(normalizedAiWord)!;
            // Only add valid translations (not "[undefined]") to the temporary map
            if (aiResult.translation && aiResult.translation !== "[undefined]") {
                currentDef.translations.push(aiResult.translation);
                currentDef.partsOfSpeech.push(aiResult.partOfSpeech);
                currentDef.genders.push(aiResult.gender);
            }
          }

          // 3. Combine AI definitions into single strings and save/add to consolidated results
          for (const [normalizedAiWord, defs] of aiDefinitionsMap.entries()) {
            const originalWordCasing = wordOriginalCasingMap.get(normalizedAiWord) || normalizedAiWord;

            // Filter out nulls/empty strings and duplicates, then join
            // Using a helper function to avoid repetition
            const combineAndClean = (arr: (string | null)[]): string | null => {
                const uniqueParts = Array.from(new Set(arr.filter(Boolean).map(s => s?.trim()))).filter(Boolean);
                const result = uniqueParts.sort().join(', '); // Sort for consistent order
                return result === "" ? null : result;
            };

            const combinedTranslation = combineAndClean(defs.translations);
            const combinedPartOfSpeech = combineAndClean(defs.partsOfSpeech);
            const combinedGender = combineAndClean(defs.genders);

            const aiVocabularyEntry: Omit<Vocabulary, 'id'> = {
              word: originalWordCasing, // Keep original casing for this object, but save normalized in DB
              translation: combinedTranslation || "[undefined]", // Default if no valid translation
              partOfSpeech: combinedPartOfSpeech,
              gender: combinedGender,
              sourceLanguage: sourceLanguage,
              targetLanguage: targetLanguage,
            };

            // Save the combined AI entry to the database (this will merge if already exists)
            // Only save if there's at least one valid translation
            if (aiVocabularyEntry.translation !== "[undefined]") {
                const savedEntry = await this.saveVocabularyEntry(aiVocabularyEntry);
                if (savedEntry) {
                    // Update consolidatedResults with the (potentially merged) saved entry from DB
                    consolidatedResults.set(normalizedAiWord, { ...savedEntry, word: originalWordCasing });
                }
            }
          }
        } else {
          console.warn("AI Cloud Function reported failure:", aiResponse.message);
        }
      } catch (aiError) {
        console.error("Error calling AI Cloud Function or processing AI results:", aiError);
        // Words for which AI failed will remain as "[undefined]" in the final response.
      }
    }
    // --- END OF MODIFIED LOGIC ---


    // 4. Assemble the final response for the frontend, preserving original word order and casing
    const finalTranslations: Vocabulary[] = [];
    for (const originalWord of originalWords) {
      const normalizedWord = this.normalizeText(originalWord);
      const foundEntry = consolidatedResults.get(normalizedWord);

      if (foundEntry) {
        // Ensure the word casing matches the original input for the frontend display
        finalTranslations.push({ ...foundEntry, word: originalWord });
      } else {
        // If still not found (e.g., AI failed, not in DB, or no valid translation after merge),
        // push a default "undefined" entry with the correct casing
        finalTranslations.push({
          word: originalWord,
          translation: "[undefined]",
          partOfSpeech: null,
          gender: null,
          sourceLanguage: sourceLanguage,
          targetLanguage: targetLanguage,
        });
      }
    }
    return finalTranslations;
  }

  // --- Helper method: normalizeText (made a class method for consistency) ---
  private normalizeText(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[.,!?¿'`;:()]/g, ""); // Remove punctuation
  }

  async chatAboutSentenceWithCloudFunction(
    payload: ChatAboutSentenceCloudFunctionData
  ): Promise<ChatAboutSentenceCloudFunctionResult> {
    const functionName = "chatAboutSentence"; // Name of your new Cloud Function
    const projectId = process.env.GCLOUD_PROJECT;
    const region = process.env.FUNCTION_REGION; // Ensure this env var is set (e.g., us-central1)

    if (!projectId || !region) {
      throw new Error("Project ID or Function Region is not configured for Chat Cloud Function (for AI).");
    }

    const functionUrl = `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;
    const targetAudience = functionUrl;
    let idToken: string | null = null;

    try {
      // Assuming this.auth is your Firebase Admin Auth instance or similar
      // It's crucial for secure Cloud Function calls
      const client = await this.auth.getIdTokenClient(targetAudience);
      const headers = await client.getRequestHeaders();
      idToken = headers["Authorization"]?.split("Bearer ")[1] || null; // Use null for clarity
      if (!idToken) throw new Error("Failed to obtain ID token for Chat Cloud Function.");
    } catch (error: any) {
      console.error("DEBUG: Error obtaining ID token for Chat Cloud Function:", error.message);
      throw new Error(`Failed to obtain ID token for Chat Cloud Function: ${error.message}`);
    }

    try {
      console.log("[BACKEND] chatAboutSentenceWithCloudFunction before await fetch");
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("[BACKEND] chatAboutSentenceWithCloudFunction after await fetch");
      console.log("[BACKEND] Chat Cloud Function HTTP Status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[BACKEND] Chat Cloud Function returned !response.ok. Error body:", errorText);
        throw new Error(`Chat Cloud Function call to ${functionName} failed: ${response.status} - ${errorText}`);
      }

      const rawCloudFunctionResponse: ChatAboutSentenceCloudFunctionResult =
        await response.json();
      console.log("[BACKEND] Raw response from Chat Cloud Function:", JSON.stringify(rawCloudFunctionResponse, null, 2));

      // Basic validation of the Cloud Function's successful response
      if (!rawCloudFunctionResponse.success || typeof rawCloudFunctionResponse.explanation !== "string") {
        throw new Error("Invalid response structure from Chat Cloud Function.");
      }

      return rawCloudFunctionResponse;

    } catch (error) {
      console.error(`Error calling Chat Cloud Function ${functionName}:`, error);
      throw error;
    }
  }

  // Progress methods
  async getProgress(userId: string, lessonId: string): Promise<Progress | undefined> { // IDs are strings
    const snapshot = await db.collection('progress')
      .where('userId', '==', userId)
      .where('lessonId', '==', lessonId)
      .limit(1)
      .get();
    if (snapshot.empty) {
      return undefined;
    }
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Progress;
  }

  async createProgress(insertProgress: InsertProgress): Promise<Progress> {
    const docRef = await db.collection('progress').add(insertProgress);
    const progress: Progress = { id: docRef.id, ...insertProgress } as Progress;
    return progress;
  }

  async updateProgress(updatedProgress: Progress): Promise<Progress> {
    // Assuming updatedProgress has the 'id' from Firestore
    const docRef = db.collection('progress').doc(updatedProgress.id);
    await docRef.set(updatedProgress, { merge: true }); // Use merge:true to update fields without overwriting entire doc
    return updatedProgress;
  }

  async markLessonAsDone(lessonId: string): Promise<void> {
    if (!lessonId) {
      throw new Error("Lesson ID is required to mark a lesson as done.");
    }

    // Get a reference to the lesson document in the 'lessons' collection.
    const lessonRef = db.collection('lessons').doc(lessonId);

    try {
      // Update the 'status' field to 'done' and set a server timestamp for 'completedAt'.
      // If the document with lessonId does not exist, this operation will throw an error.
      await lessonRef.update({
        status: 'done' as LessonStatus, // Cast to LessonStatus to ensure type safety
        // completedAt: Firestore.FieldValue.serverTimestamp(), // Get timestamp from Firestore server
      });
      console.log(`FirestoreStorage: Lesson ${lessonId} successfully marked as done.`);
    } catch (error: any) {
      console.error(`FirestoreStorage: Error marking lesson ${lessonId} as done:`, error);
      // Re-throw the error so it can be caught and handled by the calling route (routes.ts)
      throw new Error(`Failed to mark lesson ${lessonId} as done: ${error.message || 'Unknown error'}`);
    }
  }
}

// Export a single instance of your Firestore storage
export const storage = new FirestoreStorage();