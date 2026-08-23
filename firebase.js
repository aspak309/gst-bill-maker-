import {initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {getAuth,GoogleAuthProvider} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {getFirestore} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {getStorage} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";
const firebaseConfig={apiKey:"AIzaSyA76trG8L-GDKNuMKbtaORnuDfagRA3zY8",authDomain:"gst-bill-maker-d7956.firebaseapp.com",projectId:"gst-bill-maker-d7956",storageBucket:"gst-bill-maker-d7956.firebasestorage.app",messagingSenderId:"564339961180",appId:"1:564339961180:web:0e9ff371695d0beeade599"};
const app=initializeApp(firebaseConfig);
export const auth=getAuth(app); export const googleProvider=new GoogleAuthProvider(); export const db=getFirestore(app); export const storage=getStorage(app);
