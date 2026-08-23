/* =========================================================
   GST BILL MAKER
   Firebase Configuration
   File: firebase.js

   Authentication only.
   Invoice/customer/logo/UPI/bank data is NOT stored here.
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

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


/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {

    apiKey:
        "AIzaSyA76trg8L-GDKNuMKbtaORnuDfagRA3zY8",

    authDomain:
        "gst-bill-maker-d7956.firebaseapp.com",

    projectId:
        "gst-bill-maker-d7956",

    storageBucket:
        "gst-bill-maker-d7956.firebasestorage.app",

    messagingSenderId:
        "564339961180",

    appId:
        "1:564339961180:web:0e9ff371695d0beeade599"

};


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app =
    initializeApp(firebaseConfig);


/* =========================================================
   INITIALIZE FIREBASE AUTH
========================================================= */

const auth =
    getAuth(app);


/* =========================================================
   GOOGLE PROVIDER
========================================================= */

const googleProvider =
    new GoogleAuthProvider();

googleProvider.setCustomParameters({
    prompt: "select_account"
});


/* =========================================================
   EXPORT
========================================================= */

export {

    app,

    auth,

    googleProvider,

    GoogleAuthProvider,

    RecaptchaVerifier,

    signInWithPopup,

    signInWithEmailAndPassword,

    createUserWithEmailAndPassword,

    sendPasswordResetEmail,

    signInWithPhoneNumber,

    signOut,

    onAuthStateChanged

};


/* =========================================================
   END OF FIREBASE.JS
========================================================= */
