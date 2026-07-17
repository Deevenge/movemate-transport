// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBush1jKXvHpiT7tt9BjXmNzAL_GgUgSeY",
  authDomain: "door2door-80fc1.firebaseapp.com",
  projectId: "door2door-80fc1",
  storageBucket: "door2door-80fc1.firebasestorage.app",
  messagingSenderId: "986153859830",
  appId: "1:986153859830:web:eb3796665abd2391788ad7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Export them
//export { db, auth, storage };