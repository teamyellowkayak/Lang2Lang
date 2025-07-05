// uploadLessons.cjs (renamed file)

// Use require for all imports
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Correct path for the service account key (still relative to the script, going up one level)
const serviceAccount = require('../_key/lang2lang-dev-75f3e4aea697.json'); // No assert { type: 'json' } needed

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const groceryLesson = {
  topicId: "RWO2QxULazg62qSzzJVj",
  title: "At the Supermarket",
  status: "available",
  context: "You're at a local supermarket in Madrid, looking for ingredients to cook dinner. You need help finding some items.",
  exchanges: [
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
  ]
};

const directionLesson = {
  topicId: "uz8geiXFf62JNLmxHaXo",
  title: "Finding Your Way Around",
  status: "available",
  context: "You're in Madrid and need to find the nearest subway station. You approach a local person to ask for directions.",
  exchanges: [
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
  ]
};

const bankingLesson = {
  topicId: "uz8geiXFf62JNLmxHaXo",
  title: "Opening a Bank Account",
  status: "available",
  context: "You need to open a bank account in Spain. You visit a local bank branch to talk to an employee about your options.",
  exchanges: [
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
  ]
};


async function uploadLessons() {
  try {
    await db.collection('lessons').doc('grocery-lesson').set(groceryLesson);
    console.log('Grocery lesson uploaded successfully!');

    await db.collection('lessons').doc('direction-lesson').set(directionLesson);
    console.log('Direction lesson uploaded successfully!');

    await db.collection('lessons').doc('banking-lesson').set(bankingLesson);
    console.log('Banking lesson uploaded successfully!');

  } catch (e) {
    console.error("Error uploading lessons: ", e);
  }
}

uploadLessons();