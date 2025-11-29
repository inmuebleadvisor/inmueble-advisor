// src/firebase/config.js

// 1. Importamos las funciones necesarias de la librería que instalamos
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth'; // Para el login
import { getFirestore } from 'firebase/firestore';           // Para la base de datos
import { getStorage } from 'firebase/storage';               // Para las fotos
import { getAnalytics, isSupported } from 'firebase/analytics'; // Opcional

// 2. Leemos las "Llaves Secretas" del archivo .env.local
// Vite usa "import.meta.env" para leer estas variables.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 3. Inicializamos la conexión ("Encendemos el interruptor")
const app = initializeApp(firebaseConfig);

// 4. Exportamos las herramientas listas para usar en el resto de la app
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configuración opcional de Analytics (solo si el navegador lo soporta)
export let analytics = null;
isSupported().then(supported => {
  if (supported) analytics = getAnalytics(app);
});

export default app;