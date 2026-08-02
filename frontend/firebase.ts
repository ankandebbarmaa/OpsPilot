import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "ai-studio-applet-webapp-c42df",
  appId: "1:819295080947:web:2c7938e863537d7ad10286",
  storageBucket: "ai-studio-applet-webapp-c42df.firebasestorage.app",
  apiKey: "AIzaSyBRJdP8LllJbdKqrLPwIXcfSENDydRCuxU",
  authDomain: "ai-studio-applet-webapp-c42df.firebaseapp.com",
  messagingSenderId: "819295080947",
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore targeting the custom 'db-fresh-start-999' database
export const db = getFirestore(app, "db-fresh-start-999");
