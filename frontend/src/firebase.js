// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAEINb6CLXYG7xdF6JvfyZP6xbyptK-yFM",
  authDomain: "speechscore-4df8f.firebaseapp.com",
  projectId: "speechscore-4df8f",
  storageBucket: "speechscore-4df8f.firebasestorage.app",
  messagingSenderId: "620875607554",
  appId: "1:620875607554:web:4c1ea75aa5194ca782c11b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

export const loginWithGoogle = async () => signInWithPopup(auth, provider);
export const logout = async () => signOut(auth);
