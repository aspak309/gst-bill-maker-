/* =========================================================
   GST BILL MAKER
   Main Application Controller
   File: app.js

   IMPORTANT:
   - Invoice data is NOT stored in Firestore.
   - Logo/signature are NOT uploaded to Firebase Storage.
   - User can create invoice BEFORE login.
   - Login is optional and available after using the app.
========================================================= */

import { onAuthStateChanged } from "./firebase.js";

import {
    emailLogin,
    register,
    resetPassword,
    googleLogin,
    logout,
    sendOtp,
    verifyOtp
} from "./auth.js";

import {
    calculateInvoiceGST,
    roundMoney
} from "./gst.js";

import {
    buildInvoiceHTML,
    renderInvoicePreview
} from "./invoice.js";

import {
    generateInvoicePDF
} from "./pdf.js";


/* =========================================================
   DOM HELPER
========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   INDIAN STATES
========================================================= */

const STATES = [

    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry"

];


/* =========================================================
   GST RATES
========================================================= */

const GST_RATES = [
    0,
    5,
    12,
    18,
    28
];


/* =========================================================
   APPLICATION STATE
========================================================= */

const state = {

    items: [],

    nextItemId: 1,

    logoData: "",

    signatureData: "",

    currentUser: null,

    hasUsedApp: false,

    invoiceCreated: false

};


/* =========================================================
   APPLICATION START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);


function initializeApp() {

    populateStateSelects();

    setDefaultDates();

    addItem();

    bindEvents();

    /*
       IMPORTANT:
       App opens directly.
       Login is NOT required to start using the bill maker.
    */

    showApplication();

    updateInvoice();

}


/* =========================================================
   SHOW APPLICATION
========================================================= */

function showApplication() {

    const authScreen = $("authScreen");
    const appScreen = $("appScreen");

    if (authScreen) {

        authScreen.classList.add("hidden");

    }

    if (appScreen) {

        appScreen.classList.remove("hidden");

    }

}


/* =========================================================
   OPTIONAL LOGIN PANEL
========================================================= */

function showLoginPanel() {

    const authScreen = $("authScreen");

    if (!authScreen) return;

    authScreen.classList.remove("hidden");

    const appScreen = $("appScreen");

    if (appScreen) {

        appScreen.classList.add("hidden");

    }

}


/* =========================================================
   CLOSE / SKIP LOGIN
========================================================= */

function continueWithoutLogin() {

    showApplication();

    showToast(
        "Aap bina login ke invoice bana sakte hain."
    );

}


/* =========================================================
   STATE SELECTS
========================================================= */

function populateStateSelects() {

    const selectIds = [
        "sellerState",
        "buyerState",
        "placeOfSupply"
    ];

    selectIds.forEach((id) => {

        const select = $(id);

        if (!select) return;

        select.innerHTML =
            `<option value="">Select state</option>` +

            STATES
                .map(
                    stateName =>
                        `<option value="${escapeHTML(stateName)}">
                            ${escapeHTML(stateName)}
                        </option>`
                )
                .join("");

    });

}


/* =========================================================
   DEFAULT DATES
========================================================= */

function setDefaultDates() {

    const invoiceDate = $("invoiceDate");

    if (!invoiceDate) return;

    const now = new Date();

    const localDate =
        new Date(
            now.getTime() -
            now.getTimezoneOffset() * 60000
        )
        .toISOString()
        .slice(0, 10);

    invoiceDate.value = localDate;

}


/* =========================================================
   EVENT BINDING
========================================================= */

function bindEvents() {


    /* -------------------------------------------------------
       GENERAL INPUT
    ------------------------------------------------------- */

    document.addEventListener(
        "input",
        (event) => {

            if (
                event.target.closest(".editor")
            ) {

                state.hasUsedApp = true;

                updateInvoice();

            }

        }
    );


    /* -------------------------------------------------------
       CHANGE EVENTS
    ------------------------------------------------------- */

    document.addEventListener(
        "change",
        (event) => {

            const target = event.target;


            if (
                target.id === "logoInput" ||
                target.id === "signatureInput"
            ) {

                handleImageUpload(target);

            }


            if (
                target.closest(".editor")
            ) {

                state.hasUsedApp = true;

                updateInvoice();

            }

        }
    );


    /* -------------------------------------------------------
       ADD ITEM
    ------------------------------------------------------- */

    const addItemButton = $("addItemBtn");

    if (addItemButton) {

        addItemButton.addEventListener(
            "click",
            addItem
        );

    }


    /* -------------------------------------------------------
       DOWNLOAD PDF
    ------------------------------------------------------- */

    const downloadButton = $("downloadBtn");

    if (downloadButton) {

        downloadButton.addEventListener(
            "click",
            downloadInvoicePDF
        );

    }


    /* -------------------------------------------------------
       PREVIEW
    ------------------------------------------------------- */

    const previewButton = $("previewBtn");

    if (previewButton) {

        previewButton.addEventListener(
            "click",
            openPreview
        );

    }


    /* -------------------------------------------------------
       CLOSE PREVIEW
    ------------------------------------------------------- */

    const closePreviewButton =
        $("closePreviewBtn");

    if (closePreviewButton) {

        closePreviewButton.addEventListener(
            "click",
            closePreview
        );

    }


    /* -------------------------------------------------------
       NEW INVOICE
    ------------------------------------------------------- */

    const newInvoiceButton =
        $("newInvoiceBtn");

    if (newInvoiceButton) {

        newInvoiceButton.addEventListener(
            "click",
            resetInvoice
        );

    }


    /* -------------------------------------------------------
       LOGIN
    ------------------------------------------------------- */

    const loginForm =
        $("emailAuthForm");

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleEmailLogin
        );

    }


    /* -------------------------------------------------------
       REGISTER
    ------------------------------------------------------- */

    const registerButton =
        $("registerBtn");

    if (registerButton) {

        registerButton.addEventListener(
            "click",
            handleRegister
        );

    }


    /* -------------------------------------------------------
       PASSWORD RESET
    ------------------------------------------------------- */

    const resetButton =
        $("resetPasswordBtn");

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            handlePasswordReset
        );

    }


    /* -------------------------------------------------------
       GOOGLE LOGIN
    ------------------------------------------------------- */

    const googleButton =
        $("googleBtn");

    if (googleButton) {

        googleButton.addEventListener(
            "click",
            handleGoogleLogin
        );

    }


    /* -------------------------------------------------------
       PHONE OTP
    ------------------------------------------------------- */

    const sendOtpButton =
        $("sendOtpBtn");

    if (sendOtpButton) {

        sendOtpButton.addEventListener(
            "click",
            handleSendOTP
        );

    }


    const verifyOtpButton =
        $("verifyOtpBtn");

    if (verifyOtpButton) {

        verifyOtpButton.addEventListener(
            "click",
            handleVerifyOTP
        );

    }


    /* -------------------------------------------------------
       AUTH TABS
    ------------------------------------------------------- */

    document
        .querySelectorAll("[data-auth-tab]")
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    switchAuthTab(
                        button.dataset.authTab
                    );

                }
            );

        });


    /* -------------------------------------------------------
       LOGOUT
    ------------------------------------------------------- */

    const logoutButton =
        $("logoutBtn");

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async () => {

                try {

                    await logout();

                    showApplication();

                    showToast(
                        "Logout successful."
                    );

                } catch (error) {

                    showError(error);

                }

            }
        );

    }


    /* -------------------------------------------------------
       DELETE ITEM
    ------------------------------------------------------- */

    const itemsBody =
        $("itemsBody");

    if (itemsBody) {

        itemsBody.addEventListener(
            "click",
            handleItemActions
        );

    }


    /* -------------------------------------------------------
       UPI QR
    ------------------------------------------------------- */

    const upiInput =
        $("upiId");

    if (upiInput) {

        upiInput.addEventListener(
            "input",
            () => {

                state.hasUsedApp = true;

                renderUPIPreview();

            }
        );

    }

}


/* =========================================================
   AUTH TAB
========================================================= */

function switchAuthTab(tab) {

    const buttons =
        document.querySelectorAll(
            "[data-auth-tab]"
        );

    buttons.forEach((button) => {

        button.classList.toggle(
            "active",
            button.dataset.authTab === tab
        );

    });


    const emailForm =
        $("emailAuthForm");

    const phonePanel =
        $("phoneAuthPanel");

    const googlePanel =
        $("googleAuthPanel");


    if (emailForm) {

        emailForm.classList.toggle(
            "hidden",
            tab !== "email"
        );

    }


    if (phonePanel) {

        phonePanel.classList.toggle(
            "hidden",
            tab !== "phone"
        );

    }


    if (googlePanel) {

        googlePanel.classList.toggle(
            "hidden",
            tab !== "google"
        );

    }


    const message =
        $("authMessage");

    if (message) {

        message.textContent = "";

    }

}


/* =========================================================
   EMAIL LOGIN
========================================================= */

async function handleEmailLogin(event) {

    event.preventDefault();

    const email =
        $("authEmail")?.value.trim();

    const password =
        $("authPassword")?.value || "";


    if (!email || !password) {

        showError(
            new Error(
                "Email aur password enter karein."
            )
        );

        return;

    }


    try {

        await emailLogin(
            email,
            password
        );

        showApplication();

        showToast(
            "Login successful."
        );

    } catch (error) {

        showError(error);

    }

}


/* =========================================================
   REGISTER
========================================================= */

async function handleRegister() {

    const email =
        $("authEmail")?.value.trim();

    const password =
        $("authPassword")?.value || "";


    if (!email || !password) {

        showError(
            new Error(
                "Account banane ke liye email aur password enter karein."
            )
        );

        return;

    }


    try {

        await register(
            email,
            password
        );

        showApplication();

        showToast(
            "Account created successfully."
        );

    } catch (error) {

        showError(error);

    }

}


/* =========================================================
   PASSWORD RESET
========================================================= */

async function handlePasswordReset() {

    const email =
        $("authEmail")?.value.trim();


    if (!email) {

        showToast(
            "Pehle email address enter karein."
        );

        return;

    }


    try {

        await resetPassword(email);

        showToast(
            "Password reset email bhej diya gaya hai."
        );

    } catch (error) {

        showError(error);

    }

}


/* =========================================================
   GOOGLE LOGIN
========================================================= */

async function handleGoogleLogin() {

    try {

        await googleLogin();

        showApplication();

        showToast(
            "Google login successful."
        );

    } catch (error) {

        showError(error);

    }

}


/* =========================================================
   SEND OTP
========================================================= */

async function handleSendOTP() {

    const phone =
        $("authPhone")?.value.trim();


    if (!phone) {

        showToast(
            "Phone number enter karein."
        );

        return;

    }


    try {

        await sendOtp(phone);

        const otp =
            $("otpCode");

        const verifyButton =
            $("verifyOtpBtn");


        if (otp) {

            otp.classList.remove(
                "hidden"
            );

        }


        if (verifyButton) {

            verifyButton.classList.remove(
                "hidden"
            );

        }


        showToast(
            "OTP bhej diya gaya hai."
        );

    } catch (error) {

        showError(error);

    }

}


/* =========================================================
   VERIFY OTP
========================================================= */

async function handleVerifyOTP() {

    const code =
        $("otpCode")?.value.trim();


    if (!code) {

        showToast(
            "OTP enter karein."
        );

        return;

    }


    try {

        await verifyOtp(code);

        showApplication();

        showToast(
            "Phone login successful."
        );

    } catch (error) {

        showError(error);

    }

}


/* =========================================================
   FIREBASE AUTH STATE
========================================================= */

onAuthStateChanged(
    (user) => {

        state.currentUser =
            user || null;


        /*
           IMPORTANT:
           Login hone par hi user information
           UI mein dikhayenge.

           Invoice data Firebase mein save nahi
           kiya ja raha.
        */

        const userEmail =
            $("userEmail");

        if (userEmail) {

            if (user) {

                userEmail.textContent =
                    user.email ||
                    user.phoneNumber ||
                    "Signed in";

            } else {

                userEmail.textContent =
                    "Guest user";

            }

        }


        /*
           User logout hone par bhi
           app ko use kar sakta hai.
        */

        showApplication();

    }
);


/* =========================================================
   ADD ITEM
========================================================= */

function addItem() {

    state.items.push({

        id: state.nextItemId++,

        name: "",

        hsn: "",

        qty: 1,

        rate: 0,

        gst: 18

    });


    state.hasUsedApp = true;

    renderItems();

    updateInvoice();

}


/* =========================================================
   RENDER ITEMS
========================================================= */

function renderItems() {

    const body =
        $("itemsBody");

    if (!body) return;


    body.innerHTML =
        state.items
            .map(
                (item, index) => {

                    return `

                    <tr data-id="${item.id}">

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            <input
                                data-field="name"
                                value="${escapeHTML(item.name)}"
                                placeholder="Product / Service"
                            >
                        </td>

                        <td>
                            <input
                                data-field="hsn"
                                value="${escapeHTML(item.hsn)}"
                                placeholder="HSN/SAC"
                            >
                        </td>

                        <td>
                            <input
                                data-field="qty"
                                type="number"
                                min="0"
                                step="0.01"
                                value="${item.qty}"
                            >
                        </td>

                        <td>
                            <input
                                data-field="rate"
                                type="number"
                                min="0"
                                step="0.01"
                                value="${item.rate}"
                            >
                        </td>

                        <td>

                            <select
                                data-field="gst"
                            >

                                ${GST_RATES
                                    .map(
                                        rate => `
                                        <option
                                            value="${rate}"
                                            ${Number(item.gst) === rate ? "selected" : ""}
                                        >
                                            ${rate}%
                                        </option>
                                        `
                                    )
                                    .join("")
                                }

                            </select>

                        </td>

                        <td class="amount">
                            ${formatMoney(
                                Number(item.qty) *
                                Number(item.rate)
                            )}
                        </td>

                        <td>

                            <button
                                type="button"
                                class="icon-btn"
                                data-delete-item="${item.id}"
                                aria-label="Delete item"
                            >
                                ×
                            </button>

                        </td>

                    </tr>

                    `;

                }
            )
            .join("");


    body
        .querySelectorAll("[data-field]")
        .forEach(
            (input) => {

                input.addEventListener(
                    "input",
                    handleItemInput
                );

                input.addEventListener(
                    "change",
                    handleItemInput
                );

            }
        );

}


/* =========================================================
   ITEM INPUT
========================================================= */

function handleItemInput(event) {

    const input =
        event.target;

    const row =
        input.closest("tr");

    if (!row) return;


    const itemId =
        Number(row.dataset.id);

    const item =
        state.items.find(
            x => x.id === itemId
        );

    if (!item) return;


    const field =
        input.dataset.field;


    if (
        field === "name" ||
        field === "hsn"
    ) {

        item[field] =
            input.value;

    } else {

        item[field] =
            Number(input.value) || 0;

    }


    const amountCell =
        row.querySelector(".amount");

    if (amountCell) {

        amountCell.textContent =
            formatMoney(
                Number(item.qty) *
                Number(item.rate)
            );

    }


    state.hasUsedApp = true;

    updateInvoice();

}


/* =========================================================
   ITEM DELETE
========================================================= */

function handleItemActions(event) {

    const button =
        event.target.closest(
            "[data-delete-item]"
        );

    if (!button) return;


    const id =
        Number(
            button.dataset.deleteItem
        );


    state.items =
        state.items.filter(
            item => item.id !== id
        );


    /*
       Minimum one item always available.
    */

    if (state.items.length === 0) {

        addItem();

        return;

    }


    renderItems();

    updateInvoice();

}


/* =========================================================
   COLLECT FORM DATA
========================================================= */

function collectInvoiceData() {

    const value =
        (id) => {

            const element =
                $(id);

            return element
                ? element.value || ""
                : "";

        };


    const sellerState =
        value("sellerState");

    const buyerState =
        value("buyerState");


    const calculation =
        calculateInvoiceGST({

            items: state.items,

            sellerState,

            buyerState

        });


    return {

        invoiceNumber:
            value("invoiceNumber") ||
            "INV-0001",

        invoiceDate:
            value("invoiceDate"),

        dueDate:
            value("dueDate"),

        paymentTerms:
            value("paymentTerms"),


        placeOfSupply:
            value("placeOfSupply"),


        seller: {

            name:
                value("sellerName"),

            gstin:
                value("sellerGSTIN"),

            address:
                value("sellerAddress"),

            state:
                sellerState,

            phone:
                value("sellerPhone"),

            email:
                value("sellerEmail")

        },


        buyer: {

            name:
                value("buyerName"),

            gstin:
                value("buyerGSTIN"),

            address:
                value("buyerAddress"),

            state:
                buyerState,

            phone:
                value("buyerPhone"),

            email:
                value("buyerEmail")

        },


        items:
            calculation.calculatedItems,


        result:
            calculation,


        upiId:
            value("upiId"),

        accountName:
            value("accountName"),

        bankName:
            value("bankName"),

        accountNumber:
            value("accountNumber"),

        ifsc:
            value("ifsc"),

        paymentNote:
            value("paymentNote"),


        notes:
            value("invoiceNotes"),

        signatoryName:
            value("signatoryName"),


        /*
           These are temporary data URLs.
           They are NOT sent to Firebase.
        */

        logoData:
            state.logoData,

        signatureData:
            state.signatureData

    };

}


/* =========================================================
   LIVE UPDATE
========================================================= */

function updateInvoice() {

    const data =
        collectInvoiceData();


    const result =
        data.result;


    setText(
        "taxableAmount",
        formatMoney(
            result.taxableAmount
        )
    );


    setText(
        "cgstAmount",
        formatMoney(
            result.cgst
        )
    );


    setText(
        "sgstAmount",
        formatMoney(
            result.sgst
        )
    );


    setText(
        "igstAmount",
        formatMoney(
            result.igst
        )
    );


    setText(
        "grandTotal",
        formatMoney(
            result.grandTotal
        )
    );


    const taxMessage =
        $("taxModeMessage");


    if (taxMessage) {

        if (result.isSameState) {

            taxMessage.textContent =
                "Same-state: CGST + SGST";

        } else if (
            result.isInterState
        ) {

            taxMessage.textContent =
                "Inter-state: IGST";

        } else {

            taxMessage.textContent =
                "Select seller and buyer states.";

        }

    }


    renderUPIPreview();

}


/* =========================================================
   UPi PREVIEW
========================================================= */

function renderUPIPreview() {

    const box =
        $("qrPreview");

    if (!box) return;


    const upi =
        $("upiId")?.value.trim();


    if (!upi) {

        box.innerHTML =
            `<span class="muted small">
                UPI QR will appear here
             </span>`;

        return;

    }


    /*
       QR generation is intentionally local.
       qrcodejs is already loaded in index.html.
    */

    if (
        typeof window.QRCode !==
        "function"
    ) {

        box.innerHTML =
            `<span class="muted small">
                QR library loading...
             </span>`;

        return;

    }


    box.innerHTML = "";


    try {

        new window.QRCode(
            box,
            {

                text:
                    `upi://pay?pa=${encodeURIComponent(upi)}`,

                width: 150,

                height: 150,

                correctLevel:
                    window.QRCode.CorrectLevel.M

            }
        );

    } catch (error) {

        console.error(
            "QR generation error:",
            error
        );

        box.innerHTML =
            `<span class="muted small">
                QR could not be generated.
             </span>`;

    }

}


/* =========================================================
   IMAGE UPLOAD
========================================================= */

function handleImageUpload(input) {

    const file =
        input.files?.[0];


    if (!file) return;


    const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/webp"
    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        showToast(
            "Sirf PNG, JPG ya WEBP image allowed hai."
        );

        input.value = "";

        return;

    }


    /*
       2 MB limit
    */

    if (
        file.size >
        2 * 1024 * 1024
    ) {

        showToast(
            "Image 2MB se chhoti rakhein."
        );

        input.value = "";

        return;

    }


    const reader =
        new FileReader();


    reader.onload = () => {

        const data =
            reader.result;


        if (
            input.id ===
            "logoInput"
        ) {

            state.logoData =
                data;


            const thumb =
                $("logoThumb");


            if (thumb) {

                thumb.src =
                    data;

                thumb.classList.remove(
                    "hidden"
                );

            }


            const removeButton =
                $("removeLogoBtn");


            if (removeButton) {

                removeButton.classList.remove(
                    "hidden"
                );

            }

        } else {

            state.signatureData =
                data;


            const thumb =
                $("signatureThumb");


            if (thumb) {

                thumb.src =
                    data;

                thumb.classList.remove(
                    "hidden"
                );

            }


            const removeButton =
                $("removeSignatureBtn");


            if (removeButton) {

                removeButton.classList.remove(
                    "hidden"
                );

            }

        }


        state.hasUsedApp = true;

        showToast(
            "Image invoice ke liye ready hai."
        );

    };


    reader.onerror = () => {

        showToast(
            "Image read nahi ho saki."
        );

    };


    reader.readAsDataURL(file);

}


/* =========================================================
   REMOVE LOGO
========================================================= */

function removeLogo() {

    state.logoData = "";


    const input =
        $("logoInput");

    const thumb =
        $("logoThumb");

    const button =
        $("removeLogoBtn");


    if (input) {

        input.value = "";

    }


    if (thumb) {

        thumb.src = "";

        thumb.classList.add(
            "hidden"
        );

    }


    if (button) {

        button.classList.add(
            "hidden"
        );

    }


    updateInvoice();

}


/* =========================================================
   REMOVE SIGNATURE
========================================================= */

function removeSignature() {

    state.signatureData = "";


    const input =
        $("signatureInput");

    const thumb =
        $("signatureThumb");

    const button =
        $("removeSignatureBtn");


    if (input) {

        input.value = "";

    }


    if (thumb) {

        thumb.src = "";

        thumb.classList.add(
            "hidden"
        );

    }


    if (button) {

        button.classList.add(
            "hidden"
        );

    }


    updateInvoice();

}


/* =========================================================
   OPTIONAL REMOVE BUTTONS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const logoButton =
            $("removeLogoBtn");

        if (logoButton) {

            logoButton.addEventListener(
                "click",
                removeLogo
            );

        }


        const signatureButton =
            $("removeSignatureBtn");

        if (signatureButton) {

            signatureButton.addEventListener(
                "click",
                removeSignature
            );

        }

    }
);


/* =========================================================
   DOWNLOAD PDF
========================================================= */

async function downloadInvoicePDF() {

    try {

        state.invoiceCreated = true;

        state.hasUsedApp = true;


        showToast(
            "PDF तैयार हो रहा है..."
        );


        /*
           Give browser time to finish
           QR/image rendering.
        */

        await wait(100);


        const data =
            collectInvoiceData();


        const html =
            buildInvoiceHTML(
                data
            );


        await generateInvoicePDF({

            html,

            invoiceNumber:
                data.invoiceNumber

        });


        showToast(
            "PDF तैयार हो गया."
        );


        /*
           IMPORTANT:
           PDF ke baad login option offer kar sakte hain.
           Invoice ko Firebase mein save nahi karte.
        */

        offerOptionalLogin();


    } catch (error) {

        showError(error);

    }

}


/* =========================================================
   OPTIONAL LOGIN OFFER
========================================================= */

function offerOptionalLogin() {

    /*
       Agar user already login hai
       to kuch nahi karna.
    */

    if (state.currentUser) {

        return;

    }


    /*
       Login ko force nahi karna.
       Agar HTML mein login button/modal later add kiya
       jayega to yahin se open hoga.
    */

    showToast(
        "Invoice ready hai. Agar chahein to ab account se login kar sakte hain."
    );

}


/* =========================================================
   PREVIEW
========================================================= */

function openPreview() {

    try {

        const data =
            collectInvoiceData();


        renderInvoicePreview(
            $("previewContainer"),
            data
        );


        const modal =
            $("previewModal");


        if (modal) {

            modal.classList.remove(
                "hidden"
            );

        }


        document.body.style.overflow =
            "hidden";


    } catch (error) {

        showError(error);

    }

}


/* =========================================================
   CLOSE PREVIEW
========================================================= */

function closePreview() {

    const modal =
        $("previewModal");


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }


    document.body.style.overflow =
        "";

}


/* =========================================================
   RESET INVOICE
========================================================= */

function resetInvoice() {

    const confirmed =
        window.confirm(
            "Current invoice details clear karna hai?"
        );


    if (!confirmed) return;


    /*
       Text fields
    */

    document
        .querySelectorAll(
            ".editor input:not([type='file']), .editor textarea"
        )
        .forEach(
            element => {

                element.value = "";

            }
        );


    /*
       Selects
    */

    document
        .querySelectorAll(
            ".editor select"
        )
        .forEach(
            element => {

                element.value = "";

            }
        );


    /*
       Items
    */

    state.items = [];

    state.nextItemId = 1;


    /*
       Images
    */

    state.logoData = "";

    state.signatureData = "";


    const logoInput =
        $("logoInput");

    const signatureInput =
        $("signatureInput");


    if (logoInput) {

        logoInput.value = "";

    }


    if (signatureInput) {

        signatureInput.value = "";

    }


    const logoThumb =
        $("logoThumb");

    const signatureThumb =
        $("signatureThumb");


    if (logoThumb) {

        logoThumb.src = "";

        logoThumb.classList.add(
            "hidden"
        );

    }


    if (signatureThumb) {

        signatureThumb.src = "";

        signatureThumb.classList.add(
            "hidden"
        );

    }


    const removeLogoButton =
        $("removeLogoBtn");

    const removeSignatureButton =
        $("removeSignatureBtn");


    if (removeLogoButton) {

        removeLogoButton.classList.add(
            "hidden"
        );

    }


    if (removeSignatureButton) {

        removeSignatureButton.classList.add(
            "hidden"
        );

    }


    /*
       New item
    */

    addItem();


    setDefaultDates();


    /*
       Default invoice number
    */

    const invoiceNumber =
        $("invoiceNumber");

    if (invoiceNumber) {

        invoiceNumber.value =
            "INV-0001";

    }


    updateInvoice();


    showToast(
        "New invoice ready."
    );

}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function showError(error) {

    console.error(
        "GST Bill Maker Error:",
        error
    );


    const message =
        error?.message ||
        "Something went wrong.";


    const authMessage =
        $("authMessage");


    if (authMessage) {

        authMessage.textContent =
            message;

    }


    showToast(
        message
    );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    const container =
        $("toastContainer");


    if (!container) {

        console.log(message);

        return;

    }


    const toast =
        document.createElement("div");


    toast.className =
        "toast";


    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.remove();

        },
        3500
    );

}


/* =========================================================
   TEXT HELPER
========================================================= */

function setText(id, value) {

    const element =
        $(id);


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   MONEY FORMAT
========================================================= */

function formatMoney(value) {

    const number =
        Number(value) || 0;


    return new Intl.NumberFormat(
        "en-IN",
        {

            style: "currency",

            currency: "INR",

            minimumFractionDigits: 2,

            maximumFractionDigits: 2

        }
    ).format(number);

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   WAIT
========================================================= */

function wait(milliseconds) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );

}


/* =========================================================
   END OF APP.JS
========================================================= */
