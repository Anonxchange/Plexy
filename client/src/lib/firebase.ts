import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAP2beA1NUfFKXRUzhbCytMNwnrGtF5EqU",
  authDomain: "pexly-4c59d.firebaseapp.com",
  projectId: "pexly-4c59d",
  storageBucket: "pexly-4c59d.firebasestorage.app",
  messagingSenderId: "801727889949",
  appId: "1:801727889949:web:e963912fea4ccfaa40bcf4",
  measurementId: "G-W3EB184Q79"
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
