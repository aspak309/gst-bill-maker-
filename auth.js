import {signInWithPopup,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {auth,googleProvider} from "./firebase.js";
export const loginWithGoogle=()=>signInWithPopup(auth,googleProvider);
export const logout=()=>signOut(auth);
export const watchAuth=fn=>onAuthStateChanged(auth,fn);
