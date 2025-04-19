import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLanguageSchema, insertTopicSchema, insertLessonSchema, insertVocabularySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed initial data
  await seedInitialData();

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
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid topic ID" });
      }
      
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
      
      if (!topicId || isNaN(parseInt(topicId as string))) {
        return res.status(400).json({ message: "Topic ID is required" });
      }
      
      const lessons = await storage.getLessons(parseInt(topicId as string));
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.get("/api/lessons/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid lesson ID" });
      }
      
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

// Function to seed initial data
async function seedInitialData() {
  // Seed languages
  const languages = [
    { code: "en", name: "English", nativeName: "English", isSourceLanguage: 1 },
    { code: "es", name: "Spanish", nativeName: "Español", isSourceLanguage: 0 },
    { code: "sw", name: "Swahili", nativeName: "Kiswahili", isSourceLanguage: 0 },
    { code: "it", name: "Italian", nativeName: "Italiano", isSourceLanguage: 0 },
  ];

  for (const language of languages) {
    const existing = await storage.getLanguageByCode(language.code);
    if (!existing) {
      const validated = insertLanguageSchema.parse(language);
      await storage.createLanguage(validated);
    }
  }

  // Seed topics
  const topics = [
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
  const allTopics = [
    ...topics,
    ...topics.map(topic => ({ ...topic, targetLanguage: "sw" })),
    ...topics.map(topic => ({ ...topic, targetLanguage: "it" }))
  ];

  for (const topic of allTopics) {
    const validated = insertTopicSchema.parse(topic);
    await storage.createTopic(validated);
  }

  // Seed Spanish vocabulary
  const vocabulary = [
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
      word: "decirme",
      translation: "to tell me",
      partOfSpeech: "verb",
      gender: null,
      definition: "To communicate information to the speaker.",
      examples: [
        "¿Puede decirme la hora? (Can you tell me the time?)",
        "Quiero que me digas la verdad. (I want you to tell me the truth.)"
      ],
      notes: "This is the infinitive 'decir' (to tell/say) with the pronoun 'me' (to me) attached.",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["decir", "hablar", "comunicar"]
    },
    {
      word: "cercana",
      translation: "nearby, close",
      partOfSpeech: "adjective",
      gender: "feminine",
      definition: "Located a short distance away; nearby.",
      examples: [
        "La farmacia más cercana está a dos calles. (The nearest pharmacy is two streets away.)",
        "Vivo en una zona cercana al centro. (I live in an area close to downtown.)"
      ],
      notes: "The masculine form is 'cercano'",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["cerca", "próxima", "lejana"]
    },
    {
      word: "derecha",
      translation: "right (direction)",
      partOfSpeech: "noun",
      gender: "feminine",
      definition: "The direction corresponding to the side of the body where the heart is not located.",
      examples: [
        "Dobla a la derecha en la próxima calle. (Turn right at the next street.)",
        "Mi casa está a la derecha del parque. (My house is to the right of the park.)"
      ],
      notes: "",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["izquierda", "dirección", "lado"]
    },
    {
      word: "tiempo",
      translation: "time",
      partOfSpeech: "noun",
      gender: "masculine",
      definition: "The indefinite continued progress of existence and events in the past, present, and future.",
      examples: [
        "No tengo tiempo para esperar. (I don't have time to wait.)",
        "¿Cuánto tiempo tardará? (How long will it take?)"
      ],
      notes: "Also can mean 'weather' in Spanish.",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["hora", "minuto", "segundo"]
    },
    {
      word: "caminar",
      translation: "to walk",
      partOfSpeech: "verb",
      gender: null,
      definition: "To move at a regular pace by lifting and setting down each foot in turn.",
      examples: [
        "Me gusta caminar por el parque. (I like walking through the park.)",
        "Camino al trabajo todos los días. (I walk to work every day.)"
      ],
      notes: "",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["andar", "pasear", "correr"]
    },
    
    // Grocery shopping vocabulary
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
    {
      word: "encontrar",
      translation: "to find",
      partOfSpeech: "verb",
      gender: null,
      definition: "To discover or locate something or someone.",
      examples: [
        "No puedo encontrar mis llaves. (I can't find my keys.)",
        "¿Dónde puedo encontrar la leche? (Where can I find the milk?)"
      ],
      notes: "",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["buscar", "localizar", "hallar"]
    },
    {
      word: "pasillo",
      translation: "aisle",
      partOfSpeech: "noun",
      gender: "masculine",
      definition: "A passage between rows of shelves in a supermarket or store.",
      examples: [
        "El arroz está en el pasillo tres. (The rice is in aisle three.)",
        "Los productos de limpieza están en el último pasillo. (Cleaning products are in the last aisle.)"
      ],
      notes: "",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["sección", "estantería", "supermercado"]
    },
    {
      word: "productos",
      translation: "products",
      partOfSpeech: "noun",
      gender: "masculine",
      definition: "Items that are made to be sold.",
      examples: [
        "Estos productos son orgánicos. (These products are organic.)",
        "¿Tienen productos sin gluten? (Do you have gluten-free products?)"
      ],
      notes: "The singular form is 'producto'",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["artículos", "mercancía", "bienes"]
    },
    {
      word: "trasera",
      translation: "back, rear",
      partOfSpeech: "adjective",
      gender: "feminine",
      definition: "At or toward the back or rear.",
      examples: [
        "La puerta trasera está cerrada. (The back door is closed.)",
        "Los artículos en oferta están en la parte trasera de la tienda. (Sale items are at the back of the store.)"
      ],
      notes: "The masculine form is 'trasero'",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["posterior", "delantera", "atrás"]
    },
    {
      word: "aceite",
      translation: "oil",
      partOfSpeech: "noun",
      gender: "masculine",
      definition: "A viscous liquid derived from petroleum, plants, or animal fat, used for cooking, fuel, or lubrication.",
      examples: [
        "El aceite de oliva es saludable. (Olive oil is healthy.)",
        "Necesito comprar aceite para cocinar. (I need to buy oil for cooking.)"
      ],
      notes: "",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["oliva", "vegetal", "cocina"]
    },
    {
      word: "cocina",
      translation: "kitchen, cooking",
      partOfSpeech: "noun",
      gender: "feminine",
      definition: "A room or area where food is prepared and cooked; also refers to the act of cooking or a style of cooking.",
      examples: [
        "Me gusta la cocina italiana. (I like Italian cuisine.)",
        "La cocina de mi casa es grande. (The kitchen in my house is big.)"
      ],
      notes: "Can refer to both the room and the art of cooking",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["chef", "receta", "comida"]
    },
    {
      word: "sección",
      translation: "section",
      partOfSpeech: "noun",
      gender: "feminine",
      definition: "A distinct part or division of something.",
      examples: [
        "La sección de frutas está a la entrada. (The fruit section is at the entrance.)",
        "¿Dónde está la sección de lácteos? (Where is the dairy section?)"
      ],
      notes: "",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["departamento", "área", "zona"]
    },
    {
      word: "pan",
      translation: "bread",
      partOfSpeech: "noun",
      gender: "masculine",
      definition: "A staple food made from flour, water, and yeast, mixed together and baked.",
      examples: [
        "Me gusta el pan recién horneado. (I like freshly baked bread.)",
        "Compré una barra de pan. (I bought a loaf of bread.)"
      ],
      notes: "",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["baguette", "panadería", "harina"]
    },
    {
      word: "derecha",
      translation: "right",
      partOfSpeech: "noun",
      gender: "feminine",
      definition: "The direction that is on the side of your body with the hand that most people write with.",
      examples: [
        "Gire a la derecha en la próxima calle. (Turn right at the next street.)",
        "El banco está a la derecha del hotel. (The bank is to the right of the hotel.)"
      ],
      notes: "When referring to direction, it's usually preceded by 'a la' (to the right).",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["izquierda", "dirección", "giro"]
    },
    {
      word: "manzana",
      translation: "block (in a city), apple",
      partOfSpeech: "noun",
      gender: "feminine",
      definition: "A square area in a city surrounded by streets. Also means 'apple' in Spanish.",
      examples: [
        "El restaurante está a dos manzanas de aquí. (The restaurant is two blocks from here.)",
        "Me comí una manzana para el desayuno. (I ate an apple for breakfast.)"
      ],
      notes: "This is a word with multiple meanings. Context will determine whether it refers to a city block or the fruit.",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["calle", "cuadra", "fruta"]
    },
    {
      word: "gire",
      translation: "turn (command form)",
      partOfSpeech: "verb",
      gender: "",
      definition: "The imperative form of 'girar', used to give a command to turn or rotate in a particular direction.",
      examples: [
        "Gire a la izquierda en el semáforo. (Turn left at the traffic light.)",
        "Gire la llave para abrir la puerta. (Turn the key to open the door.)"
      ],
      notes: "This is the formal imperative (command) form. For informal situations, use 'gira'.",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["girar", "doblar", "torcer"]
    },
    {
      word: "farmacia",
      translation: "pharmacy, drugstore",
      partOfSpeech: "noun",
      gender: "feminine",
      definition: "A store where medications are sold, and where prescriptions can be filled.",
      examples: [
        "Necesito ir a la farmacia para comprar medicamentos. (I need to go to the pharmacy to buy medications.)",
        "Hay una farmacia en la esquina. (There is a pharmacy on the corner.)"
      ],
      notes: "",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["medicamento", "botica", "medicina"]
    },
    {
      word: "decirme",
      translation: "to tell me",
      partOfSpeech: "verb",
      gender: "",
      definition: "The combination of the verb 'decir' (to tell) with the pronoun 'me' (me).",
      examples: [
        "¿Puede decirme la hora? (Can you tell me the time?)",
        "Intenta decirme qué sucedió. (Try to tell me what happened.)"
      ],
      notes: "This is the infinitive form combined with the indirect object pronoun 'me'.",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["decir", "hablar", "informar"]
    },
    
    // Banking vocabulary
    {
      word: "cuenta",
      translation: "account",
      partOfSpeech: "noun",
      gender: "feminine",
      definition: "An arrangement with a bank to keep your money there and allow you to take it out when you need it.",
      examples: [
        "Necesito abrir una cuenta bancaria. (I need to open a bank account.)",
        "Mi cuenta tiene un saldo negativo. (My account has a negative balance.)"
      ],
      notes: "In banking, 'cuenta' is often used with qualifiers like 'cuenta corriente' (checking account) or 'cuenta de ahorros' (savings account)",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["banco", "dinero", "saldo"]
    },
    {
      word: "abrir",
      translation: "to open",
      partOfSpeech: "verb",
      gender: null,
      definition: "To make something open or start using something that was previously closed or unused.",
      examples: [
        "Quiero abrir una cuenta nueva. (I want to open a new account.)",
        "Por favor, abra la ventana. (Please open the window.)"
      ],
      notes: "",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["cerrar", "iniciar", "empezar"]
    },
    {
      word: "ayudarle",
      translation: "to help you",
      partOfSpeech: "verb",
      gender: null,
      definition: "The combination of the verb 'ayudar' (to help) with the pronoun 'le' (formal 'you').",
      examples: [
        "Puedo ayudarle con su solicitud. (I can help you with your application.)",
        "¿Cómo puedo ayudarle hoy? (How can I help you today?)"
      ],
      notes: "This is the formal way to say 'help you' in Spanish, suitable for professional contexts.",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["ayudar", "asistir", "apoyar"]
    },
    {
      word: "mente",
      translation: "mind",
      partOfSpeech: "noun",
      gender: "feminine",
      definition: "The part of a person that makes them able to be aware of things, to think, and to feel.",
      examples: [
        "Tengo muchas ideas en mente. (I have many ideas in mind.)",
        "Es importante mantener la mente activa. (It's important to keep the mind active.)"
      ],
      notes: "",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["pensamiento", "cerebro", "idea"]
    },
    {
      word: "diarias",
      translation: "daily (feminine plural)",
      partOfSpeech: "adjective",
      gender: "feminine",
      definition: "Happening or done every day or on each day.",
      examples: [
        "Mis actividades diarias incluyen ejercicio. (My daily activities include exercise.)",
        "Las transacciones diarias están limitadas a 1000 euros. (Daily transactions are limited to 1000 euros.)"
      ],
      notes: "Masculine form is 'diarios', singular forms are 'diario' (m) and 'diaria' (f)",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["cotidiano", "cada día", "diariamente"]
    },
    {
      word: "comisiones",
      translation: "fees",
      partOfSpeech: "noun",
      gender: "feminine",
      definition: "Money charged by a bank for their services.",
      examples: [
        "Este banco no cobra comisiones por retiradas de efectivo. (This bank doesn't charge fees for cash withdrawals.)",
        "Las comisiones bancarias pueden ser muy altas. (Bank fees can be very high.)"
      ],
      notes: "The singular form is 'comisión'",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["cargo", "tarifa", "costo"]
    },
    {
      word: "pasaporte",
      translation: "passport",
      partOfSpeech: "noun",
      gender: "masculine",
      definition: "An official document that identifies you as a citizen of a particular country, which you may need to show when you enter or leave a country.",
      examples: [
        "Necesitas un pasaporte válido para viajar al extranjero. (You need a valid passport to travel abroad.)",
        "Mi pasaporte expira el próximo año. (My passport expires next year.)"
      ],
      notes: "",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["documento", "identificación", "visa"]
    },
    {
      word: "empleo",
      translation: "employment, job",
      partOfSpeech: "noun",
      gender: "masculine",
      definition: "Work that you do to earn money.",
      examples: [
        "Estoy buscando empleo en el sector bancario. (I'm looking for employment in the banking sector.)",
        "Mi empleo actual es muy estresante. (My current job is very stressful.)"
      ],
      notes: "",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["trabajo", "ocupación", "profesión"]
    },
    {
      word: "pedir",
      translation: "to ask for, to request",
      partOfSpeech: "verb",
      gender: null,
      definition: "To express the need or desire for something.",
      examples: [
        "Necesito pedir una cita con el director. (I need to make an appointment with the director.)",
        "¿Puedo pedir un préstamo? (Can I request a loan?)"
      ],
      notes: "",
      targetLanguage: "es",
      sourceLanguage: "en",
      relatedWords: ["solicitar", "requerir", "preguntar"]
    }
  ];

  for (const vocab of vocabulary) {
    const validated = insertVocabularySchema.parse(vocab);
    await storage.createVocabulary(validated);
  }

  // Seed lessons for different topics
  
  // TOPIC 1: GROCERY SHOPPING
  const groceryLesson = {
    topicId: 1,
    title: "At the Supermarket",
    context: "You're at a local supermarket in Madrid, looking for ingredients to cook dinner. You need help finding some items.",
    exchanges: JSON.stringify([
      {
        id: "ex1",
        speaker: "user",
        speakerName: "You",
        nativeText: "Excuse me, where can I find the fresh vegetables?",
        translatedText: "Disculpe, ¿dónde puedo encontrar las verduras frescas?",
        blanks: [
          { index: 3, correctAnswer: "encontrar" },
          { index: 5, correctAnswer: "verduras" }
        ]
      },
      {
        id: "ex2",
        speaker: "other",
        speakerName: "Store Employee",
        nativeText: "The fresh vegetables are in aisle three, next to the fruits section.",
        translatedText: "Las verduras frescas están en el pasillo tres, junto a la sección de frutas.",
        blanks: [
          { index: 0, correctAnswer: "Las" },
          { index: 5, correctAnswer: "pasillo" }
        ]
      },
      {
        id: "ex3",
        speaker: "user",
        speakerName: "You",
        nativeText: "Thank you. Do you also sell organic products?",
        translatedText: "Gracias. ¿También venden productos orgánicos?",
        blanks: [
          { index: 1, correctAnswer: "También" },
          { index: 3, correctAnswer: "productos" }
        ]
      },
      {
        id: "ex4",
        speaker: "other",
        speakerName: "Store Employee",
        nativeText: "Yes, we have an organic section at the back of the store.",
        translatedText: "Sí, tenemos una sección orgánica en la parte trasera de la tienda.",
        blanks: [
          { index: 1, correctAnswer: "tenemos" },
          { index: 6, correctAnswer: "trasera" }
        ]
      },
      {
        id: "ex5",
        speaker: "user",
        speakerName: "You",
        nativeText: "Can you tell me where I can find olive oil?",
        translatedText: "¿Puede decirme dónde puedo encontrar aceite de oliva?",
        blanks: [
          { index: 1, correctAnswer: "decirme" },
          { index: 5, correctAnswer: "aceite" }
        ]
      },
      {
        id: "ex6",
        speaker: "other",
        speakerName: "Store Employee",
        nativeText: "The olive oil is in aisle five with other cooking oils.",
        translatedText: "El aceite de oliva está en el pasillo cinco con otros aceites de cocina.",
        blanks: [
          { index: 1, correctAnswer: "aceite" },
          { index: 10, correctAnswer: "cocina" }
        ]
      },
      {
        id: "ex7",
        speaker: "user",
        speakerName: "You",
        nativeText: "And where is the bread section?",
        translatedText: "¿Y dónde está la sección de pan?",
        blanks: [
          { index: 4, correctAnswer: "sección" },
          { index: 6, correctAnswer: "pan" }
        ]
      }
    ])
  };

  // TOPIC 2: ASKING FOR DIRECTIONS
  const directionLesson = {
    topicId: 2,
    title: "Finding Your Way Around",
    context: "You're in Madrid and need to find the nearest subway station. You approach a local person to ask for directions.",
    exchanges: JSON.stringify([
      {
        id: "ex1",
        speaker: "user",
        speakerName: "You",
        nativeText: "Excuse me, could you tell me where the nearest subway station is?",
        translatedText: "Disculpe, ¿podría decirme dónde está la estación de metro más cercana?",
        blanks: [
          { index: 2, correctAnswer: "decirme" },
          { index: 7, correctAnswer: "metro" }
        ]
      },
      {
        id: "ex2",
        speaker: "other",
        speakerName: "Local person",
        nativeText: "Of course. The nearest subway station is two blocks away. Walk straight ahead and then turn right at the pharmacy.",
        translatedText: "Claro. La estación de metro más cercana está a dos manzanas. Camine recto y luego gire a la derecha en la farmacia.",
        blanks: [
          { index: 5, correctAnswer: "cercana" },
          { index: 13, correctAnswer: "derecha" }
        ]
      },
      {
        id: "ex3",
        speaker: "user",
        speakerName: "You",
        nativeText: "Is it the Sol station or Callao station?",
        translatedText: "¿Es la estación Sol o la estación Callao?",
        blanks: [
          { index: 2, correctAnswer: "estación" },
          { index: 5, correctAnswer: "estación" }
        ]
      },
      {
        id: "ex4",
        speaker: "other",
        speakerName: "Local person",
        nativeText: "It's Sol station. It's very central and many metro lines pass through there.",
        translatedText: "Es la estación Sol. Es muy céntrica y muchas líneas de metro pasan por allí.",
        blanks: [
          { index: 3, correctAnswer: "Sol" },
          { index: 9, correctAnswer: "pasan" }
        ]
      },
      {
        id: "ex5",
        speaker: "user",
        speakerName: "You",
        nativeText: "How long does it take to walk there?",
        translatedText: "¿Cuánto tiempo se tarda en caminar hasta allí?",
        blanks: [
          { index: 1, correctAnswer: "tiempo" },
          { index: 5, correctAnswer: "caminar" }
        ]
      },
      {
        id: "ex6",
        speaker: "other",
        speakerName: "Local person",
        nativeText: "About 5 minutes, not long at all.",
        translatedText: "Unos 5 minutos, no es mucho tiempo.",
        blanks: [
          { index: 1, correctAnswer: "minutos" },
          { index: 5, correctAnswer: "tiempo" }
        ]
      },
      {
        id: "ex7",
        speaker: "user",
        speakerName: "You",
        nativeText: "Thank you very much for your help!",
        translatedText: "¡Muchas gracias por su ayuda!",
        blanks: [
          { index: 0, correctAnswer: "Muchas" },
          { index: 3, correctAnswer: "ayuda" }
        ]
      }
    ])
  };

  // TOPIC 3: BANKING SERVICES
  const bankingLesson = {
    topicId: 3,
    title: "Opening a Bank Account",
    context: "You need to open a bank account in Spain. You visit a local bank branch to talk to an employee about your options.",
    exchanges: JSON.stringify([
      {
        id: "ex1",
        speaker: "user",
        speakerName: "You",
        nativeText: "Good morning. I'd like to open a bank account, please.",
        translatedText: "Buenos días. Me gustaría abrir una cuenta bancaria, por favor.",
        blanks: [
          { index: 3, correctAnswer: "abrir" },
          { index: 5, correctAnswer: "cuenta" }
        ]
      },
      {
        id: "ex2",
        speaker: "other",
        speakerName: "Bank Employee",
        nativeText: "Good morning. Of course, I can help you with that. Do you have any particular type of account in mind?",
        translatedText: "Buenos días. Por supuesto, puedo ayudarle con eso. ¿Tiene algún tipo particular de cuenta en mente?",
        blanks: [
          { index: 5, correctAnswer: "ayudarle" },
          { index: 12, correctAnswer: "mente" }
        ]
      },
      {
        id: "ex3",
        speaker: "user",
        speakerName: "You",
        nativeText: "I need a basic account for daily transactions and maybe savings.",
        translatedText: "Necesito una cuenta básica para transacciones diarias y tal vez ahorros.",
        blanks: [
          { index: 4, correctAnswer: "para" },
          { index: 6, correctAnswer: "diarias" }
        ]
      },
      {
        id: "ex4",
        speaker: "other",
        speakerName: "Bank Employee",
        nativeText: "I'd recommend our Basic Plus account. It has no monthly fees and includes online banking.",
        translatedText: "Le recomendaría nuestra cuenta Básica Plus. No tiene comisiones mensuales e incluye banca en línea.",
        blanks: [
          { index: 0, correctAnswer: "Le" },
          { index: 7, correctAnswer: "comisiones" }
        ]
      },
      {
        id: "ex5",
        speaker: "user",
        speakerName: "You",
        nativeText: "That sounds good. What documents do I need to open it?",
        translatedText: "Eso suena bien. ¿Qué documentos necesito para abrirla?",
        blanks: [
          { index: 1, correctAnswer: "suena" },
          { index: 5, correctAnswer: "para" }
        ]
      },
      {
        id: "ex6",
        speaker: "other",
        speakerName: "Bank Employee",
        nativeText: "You'll need your passport, proof of address, and proof of income or employment.",
        translatedText: "Necesitará su pasaporte, comprobante de domicilio y comprobante de ingresos o empleo.",
        blanks: [
          { index: 2, correctAnswer: "pasaporte" },
          { index: 7, correctAnswer: "empleo" }
        ]
      },
      {
        id: "ex7",
        speaker: "user",
        speakerName: "You",
        nativeText: "Do I need to make an appointment to open the account?",
        translatedText: "¿Necesito pedir una cita para abrir la cuenta?",
        blanks: [
          { index: 2, correctAnswer: "pedir" },
          { index: 6, correctAnswer: "abrir" }
        ]
      }
    ])
  };

  // Create all lessons
  await storage.createLesson(insertLessonSchema.parse(groceryLesson));
  await storage.createLesson(insertLessonSchema.parse(directionLesson));
  await storage.createLesson(insertLessonSchema.parse(bankingLesson));
}
