import {
  auth, GoogleAuthProvider, RecaptchaVerifier, signInWithPopup,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signInWithPhoneNumber, signOut
} from "./firebase.js";

let confirmationResult=null;
let recaptcha=null;

export async function emailLogin(email,password){ return signInWithEmailAndPassword(auth,email,password); }
export async function register(email,password){ return createUserWithEmailAndPassword(auth,email,password); }
export async function resetPassword(email){ return sendPasswordResetEmail(auth,email); }
export async function googleLogin(){ return signInWithPopup(auth,new GoogleAuthProvider()); }
export async function logout(){ return signOut(auth); }

export function setupRecaptcha(){
  if(recaptcha) return recaptcha;
  recaptcha=new RecaptchaVerifier(auth,"recaptcha-container",{size:"normal"});
  return recaptcha;
}
export async function sendOtp(phone){
  const verifier=setupRecaptcha();
  confirmationResult=await signInWithPhoneNumber(auth,phone,verifier);
  return true;
}
export async function verifyOtp(code){
  if(!confirmationResult) throw new Error("Send OTP first.");
  return confirmationResult.confirm(code);
}
