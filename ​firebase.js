import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPhoneNumber,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA76trg8L-GDKNuMKbtaORnuDfagRA3zY8",
  authDomain: "gst-bill-maker-d7956.firebaseapp.com",
  projectId: "gst-bill-maker-d7956",
  storageBucket: "gst-bill-maker-d7956.firebasestorage.app",
  messagingSenderId: "564339961180",
  appId: "1:564339961180:web:0e9ff371695d0beeade599"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export {
  app, auth, GoogleAuthProvider, RecaptchaVerifier,
  signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, sendPasswordResetEmail,
  signInWithPhoneNumber, signOut, onAuthStateChanged
};

