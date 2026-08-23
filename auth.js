import {
    auth,
    GoogleAuthProvider,
    RecaptchaVerifier,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithPhoneNumber,
    signOut
} from "./firebase.js";


let confirmationResult = null;
let recaptchaVerifier = null;


/* =========================================================
   EMAIL LOGIN
========================================================= */

export async function emailLogin(email, password) {

    const cleanEmail =
        String(email || "").trim();

    if (!cleanEmail || !password) {
        throw new Error(
            "Email और password डालें।"
        );
    }

    return signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
    );
}


/* =========================================================
   CREATE ACCOUNT
========================================================= */

export async function register(email, password) {

    const cleanEmail =
        String(email || "").trim();

    if (!cleanEmail || !password) {
        throw new Error(
            "Email और password डालें।"
        );
    }

    if (password.length < 6) {
        throw new Error(
            "Password कम से कम 6 characters का होना चाहिए।"
        );
    }

    return createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
    );
}


/* =========================================================
   PASSWORD RESET
========================================================= */

export async function resetPassword(email) {

    const cleanEmail =
        String(email || "").trim();

    if (!cleanEmail) {
        throw new Error(
            "Password reset के लिए email डालें।"
        );
    }

    return sendPasswordResetEmail(
        auth,
        cleanEmail
    );
}


/* =========================================================
   GOOGLE LOGIN
========================================================= */

export async function googleLogin() {

    const provider =
        new GoogleAuthProvider();

    provider.setCustomParameters({
        prompt: "select_account"
    });

    return signInWithPopup(
        auth,
        provider
    );
}


/* =========================================================
   LOGOUT
========================================================= */

export async function logout() {

    return signOut(auth);

}


/* =========================================================
   RECAPTCHA
========================================================= */

export function setupRecaptcha() {

    if (recaptchaVerifier) {
        return recaptchaVerifier;
    }

    const container =
        document.getElementById(
            "recaptcha-container"
        );

    if (!container) {
        throw new Error(
            "reCAPTCHA container नहीं मिला।"
        );
    }

    recaptchaVerifier =
        new RecaptchaVerifier(
            auth,
            container,
            {
                size: "normal"
            }
        );

    return recaptchaVerifier;
}


/* =========================================================
   SEND OTP
========================================================= */

export async function sendOtp(phone) {

    const cleanPhone =
        String(phone || "").trim();

    if (!cleanPhone) {
        throw new Error(
            "Phone number डालें।"
        );
    }

    const verifier =
        setupRecaptcha();

    confirmationResult =
        await signInWithPhoneNumber(
            auth,
            cleanPhone,
            verifier
        );

    return true;
}


/* =========================================================
   VERIFY OTP
========================================================= */

export async function verifyOtp(code) {

    const cleanCode =
        String(code || "").trim();

    if (!confirmationResult) {
        throw new Error(
            "पहले OTP भेजें।"
        );
    }

    if (!/^\d{6}$/.test(cleanCode)) {
        throw new Error(
            "6 digit OTP डालें।"
        );
    }

    return confirmationResult.confirm(
        cleanCode
    );
}
