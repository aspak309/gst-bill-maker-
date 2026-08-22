/* =========================================================
   GST BILL MAKER
   Firebase Configuration
   File: firebase.js
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";


/* =========================================================
   FIREBASE CONFIGURATION
========================================================= */

const firebaseConfig = {

    apiKey:
        "AIzaSyA76trG8L-GDKNuMKbtaORnuDfagRA3zY8",

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

const firebaseApp =
    initializeApp(
        firebaseConfig
    );


/* =========================================================
   EXPORT
========================================================= */

export {
    firebaseApp,
    firebaseConfig
};


/* =========================================================
   END OF FIREBASE.JS
========================================================= */
