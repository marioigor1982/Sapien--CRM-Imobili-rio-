
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB-YQV9GLZeYIX-kfzFer1943YHWDeSm8I",
  authDomain: "crm-imobiliario-7cc7a.firebaseapp.com",
  projectId: "crm-imobiliario-7cc7a",
  storageBucket: "crm-imobiliario-7cc7a.firebasestorage.app",
  messagingSenderId: "381425468298",
  appId: "1:381425468298:web:16accad652222b51fcfe73"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
