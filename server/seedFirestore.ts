// Lang2Lang/server/seedFirestore.ts
import { Firestore } from "@google-cloud/firestore";
import {
  type InsertLanguage,
  type InsertTopic,
  type InsertLesson,
  type InsertVocabulary,
} from "../shared/schema"; // Adjust path if your schema file is elsewhere

// Initialize Firestore client
const db = new Firestore();

// --- Data Definitions (Copy from your old routes.ts seedInitialData) ---

// Languages
const languagesToSeed: InsertLanguage[] = [
  { code: "en", name: "English", nativeName: "English", isSourceLanguage: 1 },
  { code: "es", name: "Spanish", nativeName: "Español", isSourceLanguage: 0 },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", isSourceLanguage: 0 },
  { code: "it", name: "Italian", nativeName: "Italiano", isSourceLanguage: 0 },
];

// Topics
const topicsToSeed: InsertTopic[] = [
  {
    title: "Grocery Shopping",
    description: "Learn essential vocabulary and phrases for buying groceries and navigating supermarkets.",
    category: "Daily Situations",
    difficulty: "Beginner",
    targetLanguage: "es",
    sourceLanguage: "en",
    tags: ["shopping", "food", "daily life"],
    imagePath: ""
  },
  {
    title: "Asking for Directions",
    description: "Learn how to ask for and understand directions in Spanish. Master vocabulary for locations, spatial relations, and navigating a city.",
    category: "Daily Situations",
    difficulty: "Beginner",
    targetLanguage: "es",
    sourceLanguage: "en",
    tags: ["travel", "navigation", "city"],
    imagePath: ""
  },
  {
    title: "Banking Services",
    description: "Learn vocabulary and phrases related to banking, opening accounts, and discussing financial options.",
    category: "Daily Situations",
    difficulty: "Intermediate",
    targetLanguage: "es",
    sourceLanguage: "en",
    tags: ["finance", "money", "services"],
    imagePath: ""
  },
  {
    title: "Hotel Check-in",
    description: "Learn essential phrases for checking into a hotel, requesting services, and handling common accommodation issues.",
    category: "Travel",
    difficulty: "Beginner",
    targetLanguage: "es",
    sourceLanguage: "en",
    tags: ["travel", "accommodation", "services"],
    imagePath: ""
  },
  {
    title: "Public Transportation",
    description: "Master the vocabulary needed for using buses, trains, and other public transit systems.",
    category: "Travel",
    difficulty: "Beginner",
    targetLanguage: "es",
    sourceLanguage: "en",
    tags: ["travel", "transportation", "city"],
    imagePath: ""
  },
  {
    title: "Meeting New People",
    description: "Learn how to introduce yourself, ask basic questions, and engage in small talk.",
    category: "Social",
    difficulty: "Beginner",
    targetLanguage: "es",
    sourceLanguage: "en",
    tags: ["social", "greetings", "conversation"],
    imagePath: ""
  }
];

// Also add the same topics for other languages
const allTopicsToSeed = [
  ...topicsToSeed,
  ...topicsToSeed.map(topic => ({ ...topic, targetLanguage: "sw" })),
  ...topicsToSeed.map(topic => ({ ...topic, targetLanguage: "it" }))
];

// Vocabulary
const vocabularyToSeed: InsertVocabulary[] = [
  // Directions vocabulary
  {
    word: "metro",
    translation: "subway, metro",
    partOfSpeech: "noun",
    gender: "masculine",
    definition: "An underground railway system that operates in a city.",
    examples: [
      "El metro es más rápido que el autobús. (The subway is faster than the bus.)",
      "Tomo el metro todos los días para ir al trabajo. (I take the subway every day to go to work.)"
    ],
    notes: "Unlike in English, 'metro' is always masculine in Spanish, so it uses 'el' as its article, not 'la'.",
    targetLanguage: "es",
    sourceLanguage: "en",
    relatedWords: ["estación", "tren", "transporte"]
  },
  {
    word: "estación",
    translation: "station",
    partOfSpeech: "noun",
    gender: "feminine",
    definition: "A place where trains or buses stop so that passengers can get on and off.",
    examples: [
      "La estación está cerrada los domingos. (The station is closed on Sundays.)",
      "Nos encontraremos en la estación de tren. (We will meet at the train station.)"
    ],
    notes: "",
    targetLanguage: "es",
    sourceLanguage: "en",
    relatedWords: ["metro", "tren", "parada"]
  },
  {
    word: "verduras",
    translation: "vegetables",
    partOfSpeech: "noun",
    gender: "feminine",
    definition: "A plant or part of a plant used as food.",
    examples: [
      "Necesito comprar verduras para la cena. (I need to buy vegetables for dinner.)",
      "Las verduras son buenas para la salud. (Vegetables are good for health.)"
    ],
    notes: "The singular form is 'verdura'",
    targetLanguage: "es",
    sourceLanguage: "en",
    relatedWords: ["legumbres", "frutas", "hortalizas"]
  },
];

// Lessons (these will need to be associated with topic IDs after topics are seeded)
const lessonsToSeed: Omit<InsertLesson, 'topicId'>[] = [
  {
    title: "Basic Greetings",
    status: "available",
    context: "Learn how to greet people and introduce yourself.",
    exchanges: [
      {
        id: "ex1",
        speaker: "user",
        speakerName: "You",
        nativeText: "Hello!",
        translatedText: "¡Hola!",
      },
      {
        id: "ex2",
        speaker: "other",
        speakerName: "Maria",
        nativeText: "How are you?",
        translatedText: "¿Cómo estás?",
      },
      {
        id: "ex3",
        speaker: "user",
        speakerName: "You",
        nativeText: "I'm good, thank you.",
        translatedText: "Estoy bien, gracias.",
      },
    ],
  },
  {
    title: "Ordering at a Cafe",
    status: "available",
    context: "Essential phrases for ordering food and drinks.",
    exchanges: [
      {
        id: "cafe1",
        speaker: "user",
        speakerName: "You",
        nativeText: "I would like a coffee, please.",
        translatedText: "Quisiera un café, por favor.",
      },
      {
        id: "cafe2",
        speaker: "other",
        speakerName: "Waiter",
        nativeText: "Small, medium or large?",
        translatedText: "¿Pequeño, mediano o grande?",
      },
      {
        id: "cafe3",
        speaker: "user",
        speakerName: "You",
        nativeText: "Large, please.",
        translatedText: "Grande, por favor.",
      },
    ],
  },
];


// --- Seeding Function ---

async function seedFirestore() {
  console.log("Starting Firestore seeding...");

  try {
    // 1. Seed Languages
    console.log("Seeding languages...");
    for (const lang of languagesToSeed) {
      // Check if language already exists by code to prevent duplicates on re-runs
      const existingLang = await db.collection('languages').where('code', '==', lang.code).limit(1).get();
      if (existingLang.empty) {
        await db.collection('languages').add(lang);
        console.log(`Added language: ${lang.name}`);
      } else {
        console.log(`Language already exists, skipping: ${lang.name}`);
      }
    }
    console.log("Languages seeded.");

    // 2. Seed Topics
    console.log("Seeding topics...");
    const seededTopics: { [key: string]: string } = {}; // To store topic title -> Firestore ID mapping
    for (const topic of allTopicsToSeed) {
      // Check for existing topics by title and target language
      const existingTopic = await db.collection('topics')
        .where('title', '==', topic.title)
        .where('targetLanguage', '==', topic.targetLanguage)
        .limit(1)
        .get();

      if (existingTopic.empty) {
        const docRef = await db.collection('topics').add(topic);
        seededTopics[`${topic.title}-${topic.targetLanguage}`] = docRef.id; // Store ID
        console.log(`Added topic: ${topic.title} (${topic.targetLanguage})`);
      } else {
        seededTopics[`${topic.title}-${topic.targetLanguage}`] = existingTopic.docs[0].id; // Get existing ID
        console.log(`Topic already exists, skipping: ${topic.title} (${topic.targetLanguage})`);
      }
    }
    console.log("Topics seeded.");

    // 3. Seed Vocabulary
    console.log("Seeding vocabulary...");
    for (const vocab of vocabularyToSeed) {
      // Check for existing vocabulary by word and target language
      const existingVocab = await db.collection('vocabulary')
        .where('word', '==', vocab.word)
        .where('targetLanguage', '==', vocab.targetLanguage)
        .limit(1)
        .get();

      if (existingVocab.empty) {
        await db.collection('vocabulary').add(vocab);
        console.log(`Added vocabulary: ${vocab.word} (${vocab.targetLanguage})`);
      } else {
        console.log(`Vocabulary already exists, skipping: ${vocab.word} (${vocab.targetLanguage})`);
      }
    }
    console.log("Vocabulary seeded.");


    // 4. Seed Lessons (requires topic IDs from previously seeded topics)
    console.log("Seeding lessons...");
    // Map lessons to appropriate topics based on your logic (e.g., first "Meeting New People" topic in Spanish)
    const spanishMeetingPeopleTopicId = seededTopics['Meeting New People-es'];
    const spanishGroceryShoppingTopicId = seededTopics['Grocery Shopping-es'];


    if (spanishMeetingPeopleTopicId) {
        // Associate "Basic Greetings" lesson with "Meeting New People" topic
        const basicGreetingsLesson: InsertLesson = {
            ...lessonsToSeed[0], // "Basic Greetings"
            topicId: spanishMeetingPeopleTopicId,
        };
        const existingLesson = await db.collection('lessons')
            .where('title', '==', basicGreetingsLesson.title)
            .where('topicId', '==', basicGreetingsLesson.topicId)
            .limit(1)
            .get();
        if (existingLesson.empty) {
            await db.collection('lessons').add(basicGreetingsLesson);
            console.log(`Added lesson: ${basicGreetingsLesson.title} for topic ${basicGreetingsLesson.topicId}`);
        } else {
            console.log(`Lesson already exists, skipping: ${basicGreetingsLesson.title}`);
        }
    } else {
        console.warn("Spanish 'Meeting New People' topic not found, skipping 'Basic Greetings' lesson.");
    }

    if (spanishGroceryShoppingTopicId) {
      const cafeLesson: InsertLesson = {
        ...lessonsToSeed[1], // "Ordering at a Cafe"
        topicId: spanishGroceryShoppingTopicId,
      };
      const existingCafeLesson = await db.collection('lessons')
          .where('title', '==', cafeLesson.title)
          .where('topicId', '==', cafeLesson.topicId)
          .limit(1)
          .get();
      if (existingCafeLesson.empty) {
        await db.collection('lessons').add(cafeLesson);
        console.log(`Added lesson: ${cafeLesson.title} for topic ${cafeLesson.topicId}`);
      } else {
        console.log(`Lesson already exists, skipping: ${cafeLesson.title}`);
      }
    } else {
        console.warn("Spanish 'Grocery Shopping' topic not found, skipping 'Ordering at a Cafe' lesson.");
    }

    console.log("Lessons seeded.");

    console.log("Firestore seeding complete!");

  } catch (error) {
    console.error("Error during Firestore seeding:", error);
    process.exit(1); // Exit with error code
  }
}

// Execute the seeding function
seedFirestore();