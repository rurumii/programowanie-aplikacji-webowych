import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAwkWavBf4gj1GU-dlunKTVmlJUHXxUXYQ",
  authDomain: "manageme-lab.firebaseapp.com",
  projectId: "manageme-lab",
  storageBucket: "manageme-lab.firebasestorage.app",
  messagingSenderId: "388072472321",
  appId: "1:388072472321:web:6c58fce51754ac0dbce500"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();