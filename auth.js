/* =========================================================
   GST BILL MAKER
   Firebase Authentication Module
   File: auth.js

   Supports:
   1. Email + Password Login
   2. Email + Password Registration
   3. Forgot Password
   4. Google Login
   5. Phone Number + OTP Login
   6. Logout

   IMPORTANT:
   Invoice/business/customer/payment data is NOT stored
   by this module.
========================================================= */

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


/* =========================================================
   INTERNAL STATE
========================================================= */

let confirmationResult = null;
let recaptchaVerifier = null;


/* =========================================================
   ERROR MESSAGE HELPER
========================================================= */

function getAuthErrorMessage(error) {

    const code = error?.code || "";

    switch (code) {

        case "auth/invalid-email":
            return "Email address is not valid.";

        case "auth/user-not-found":
            return "No account found with this email.";

        case "auth/wrong-password":
        case "auth/invalid-credential":
            return "Email or password is incorrect.";

        case "auth/email-already-in-use":
            return "This email is already registered.";

        case "auth/weak-password":
            return "Password must contain at least 6 characters.";

        case "auth/popup-closed-by-user":
            return "Google login was cancelled.";

        case "auth/popup-blocked":
            return "Please allow popups in your browser.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        case "auth/invalid-phone-number":
            return "Enter a valid phone number with country code.";

        case "auth/missing-phone-number":
            return "Please enter your phone number.";

        case "auth/invalid-verification-code":
            return "The OTP is incorrect.";

        case "auth/code-expired":
            return "The OTP has expired. Please request a new OTP.";

        case "auth/captcha-check-failed":
            return "reCAPTCHA verification failed.";

        case "auth/quota-exceeded":
            return "OTP limit reached. Please try again later.";

        case "auth/network-request-failed":
            return "Network error. Check your internet connection.";

        default:
            return error?.message || "Authentication failed.";
    }
}


/* =========================================================
   EMAIL LOGIN
========================================================= */

export async function emailLogin(
    email,
    password
) {

    try {

        if (!email || !password) {
            throw new Error(
                "Email and password are required."
            );
        }

        return await signInWithEmailAndPassword(
            auth,
            email.trim(),
            password
        );

    } catch (error) {

        console.error("Email login error:", error);

        throw new Error(
            getAuthErrorMessage(error)
        );
    }
}


/* =========================================================
   CREATE EMAIL ACCOUNT
========================================================= */

export async function register(
    email,
    password
) {

    try {

        if (!email || !password) {
            throw new Error(
                "Email and password are required."
            );
        }

        if (password.length < 6) {
            throw new Error(
                "Password must contain at least 6 characters."
            );
        }

        return await createUserWithEmailAndPassword(
            auth,
            email.trim(),
            password
        );

    } catch (error) {

        console.error("Registration error:", error);

        throw new Error(
            getAuthErrorMessage(error)
        );
    }
}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

export async function resetPassword(
    email
) {

    try {

        if (!email) {
            throw new Error(
                "Enter your email address first."
            );
        }

        await sendPasswordResetEmail(
            auth,
            email.trim()
        );

        return true;

    } catch (error) {

        console.error(
            "Password reset error:",
            error
        );

        throw new Error(
            getAuthErrorMessage(error)
        );
    }
}


/* =========================================================
   GOOGLE LOGIN
========================================================= */

export async function googleLogin() {

    try {

        const provider =
            new GoogleAuthProvider();

        provider.setCustomParameters({
            prompt: "select_account"
        });

        return await signInWithPopup(
            auth,
            provider
        );

    } catch (error) {

        console.error(
            "Google login error:",
            error
        );

        throw new Error(
            getAuthErrorMessage(error)
        );
    }
}


/* =========================================================
   CREATE / RESET PHONE RECAPTCHA
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
            "reCAPTCHA container was not found."
        );
    }

    recaptchaVerifier =
        new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
                size: "normal",

                callback: () => {

                    console.log(
                        "reCAPTCHA verified."
                    );

                },

                "expired-callback": () => {

                    console.log(
                        "reCAPTCHA expired."
                    );

                    clearRecaptcha();

                }
            }
        );

    return recaptchaVerifier;
}


/* =========================================================
   CLEAR RECAPTCHA
========================================================= */

export function clearRecaptcha() {

    if (recaptchaVerifier) {

        try {
            recaptchaVerifier.clear();
        } catch (error) {
            console.warn(
                "Unable to clear reCAPTCHA:",
                error
            );
        }

        recaptchaVerifier = null;
    }
}


/* =========================================================
   SEND PHONE OTP
========================================================= */

export async function sendOtp(
    phone
) {

    try {

        if (!phone) {

            throw new Error(
                "Enter your phone number."
            );
        }

        const cleanPhone =
            phone.trim();

        /*
          Firebase phone numbers should normally
          include the country code.

          Example:
          +919876543210
        */

        if (!cleanPhone.startsWith("+")) {

            throw new Error(
                "Enter phone number with country code, for example +91XXXXXXXXXX."
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

    } catch (error) {

        console.error(
            "Send OTP error:",
            error
        );

        clearRecaptcha();

        confirmationResult = null;

        throw new Error(
            getAuthErrorMessage(error)
        );
    }
}


/* =========================================================
   VERIFY PHONE OTP
========================================================= */

export async function verifyOtp(
    code
) {

    try {

        if (!confirmationResult) {

            throw new Error(
                "Please request an OTP first."
            );
        }

        if (!code) {

            throw new Error(
                "Enter the OTP."
            );
        }

        const cleanCode =
            String(code).trim();

        if (!/^\d{6}$/.test(cleanCode)) {

            throw new Error(
                "OTP must contain 6 digits."
            );
        }

        const result =
            await confirmationResult.confirm(
                cleanCode
            );

        confirmationResult = null;

        clearRecaptcha();

        return result;

    } catch (error) {

        console.error(
            "OTP verification error:",
            error
        );

        throw new Error(
            getAuthErrorMessage(error)
        );
    }
}


/* =========================================================
   LOGOUT
========================================================= */

export async function logout() {

    try {

        await signOut(auth);

        confirmationResult = null;

        clearRecaptcha();

        return true;

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        throw new Error(
            getAuthErrorMessage(error)
        );
    }
}


/* =========================================================
   AUTHENTICATION STATE HELPER
========================================================= */

export function getCurrentUser() {

    return auth.currentUser || null;

}


/* =========================================================
   END OF AUTH.JS
========================================================= */
