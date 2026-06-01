import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPnGIDa3bHV5MvTL2WZYG9BtzeAhBoi28",
  authDomain: "finance-movil.firebaseapp.com",
  databaseURL: "https://finance-movil-default-rtdb.firebaseio.com",
  projectId: "finance-movil",
  storageBucket: "finance-movil.firebasestorage.app",
  messagingSenderId: "866231687504",
  appId: "1:866231687504:web:ebee370cb29f42ba10b455",
  measurementId: "G-Y98WNHB0KX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const rtdb = getDatabase(app);

// Initialize Analytics safely
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

export { app };
