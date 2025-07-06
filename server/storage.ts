// Lang2Lang/server/storage.ts
import { Firestore } from "@google-cloud/firestore";
// import { initializeApp, getApp, type App } from 'firebase-admin/app'; // see if needed any more
// import { getFunctions, type Functions } from 'firebase-admin/functions'; // see if needed any more
import { GoogleAuth } from 'google-auth-library';

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
  type LessonStatus,
  type InsertLesson,
  vocabulary,
  type Vocabulary,
  type InsertVocabulary,
  progress,
  type Progress,
  type InsertProgress,
  type StoredLesson,
} from "@shared/schema";

// --- Firestore Initialization ---
const db = new Firestore();

// Define the type for the data you'll pass to the createLesson Cloud Function
interface CreateLessonCloudFunctionData {
  topicId: string;
  topicTitle: string;
  topicLanguage: string;
}

// Define the expected return type from the Cloud Function
interface CreateLessonCloudFunctionResult {
  success: boolean;
  lesson: StoredLesson; // Assuming StoredLesson is the shape of the saved lesson
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

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`DEBUG: Error calling ${functionName}: HTTP ${response.status}`, errorBody);
        throw new Error(`Function call failed with status ${response.status}: ${errorBody}`);
      }

      const responseData = await response.json() as CreateLessonCloudFunctionResult;
      
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
        const targetLanguageCode = topic.targetLanguage;
        const language = await this.getLanguageByCode(targetLanguageCode);

        if (!language) {
            console.error(`[Firestore] Language with code ${targetLanguageCode} not found for topic ID ${topicId}.`);
            return null;
        }

        // 'language.name' is the full name (e.g., "Spanish")
        const fullTopicLanguageName = language.name;

        console.log(`About to create new lesson for topicId: ${topicId} with title: ${topicTitle} and language: ${fullTopicLanguageName}.`);

       // If this promise resolves, 'newLesson' will directly be the StoredLesson object.
        const newLesson = await this.createLesson({
            topicId: topicId,
            topicTitle: topicTitle,
            topicLanguage: fullTopicLanguageName,
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

  async createVocabulary(insertVocabulary: InsertVocabulary): Promise<Vocabulary> {
    const docRef = await db.collection('vocabulary').add(insertVocabulary);
    const vocabulary: Vocabulary = { id: docRef.id, ...insertVocabulary } as Vocabulary;
    return vocabulary;
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
}

// Export a single instance of your Firestore storage
export const storage = new FirestoreStorage();