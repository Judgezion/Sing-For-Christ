// firebase.js

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Your Firebase config
export const firebaseConfig = {
  apiKey: "AIzaSyDUFV-gY6ZYnxCKDBem1CW_lvcuRDq8RcQ",
  authDomain: "event-registration-2d62d.firebaseapp.com",
  projectId: "event-registration-2d62d",
  storageBucket: "event-registration-2d62d.firebasestorage.app",
  messagingSenderId: "710940309024",
  appId: "1:710940309024:web:2918213fe9a59e74bfee45",
  measurementId: "G-0SPC1MQSHG"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);