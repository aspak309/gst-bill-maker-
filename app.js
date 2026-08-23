import {
    onAuthStateChanged
} from "./firebase.js";

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
    GST_RATES
} from "./gst.js";

import {
    buildInvoiceHTML,
    renderInvoicePreview
} from "./invoice.js";

import {
    generateInvoicePDF
} from "./pdf.js";


const $ = id =>
    document.getElementById(id);


const states = [
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


const state = {

    items: [],

    nextId: 1,

    logoData: "",

    signatureData: ""

};


/* =========================================================
   START APP
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        populateSelects();

        setDateDefaults();

        addItem();

        bindEvents();

        updateTotals();

        setupAuthState();

    }
);


/* =========================================================
   AUTH STATE
   IMPORTANT:
   DOES NOT HIDE APP
========================================================= */

function setupAuthState() {

    onAuthStateChanged(
        user => {

            const email =
                user?.email ||
                user?.phoneNumber ||
                "";

            if (user) {

                $("userEmail")
                    .textContent = email;

                $("userEmail")
                    .classList.remove("hidden");

                $("openLoginBtn")
                    .classList.add("hidden");

                $("logoutBtn")
                    .classList.remove("hidden");

            } else {

                $("userEmail")
                    .textContent = "";

                $("userEmail")
                    .classList.add("hidden");

                $("openLoginBtn")
                    .classList.remove("hidden");

                $("logoutBtn")
                    .classList.add("hidden");

            }

        }
    );

}


/* =========================================================
   SELECTS
========================================================= */

function populateSelects() {

    [
        "sellerState",
        "buyerState",
        "placeOfSupply"
    ].forEach(id => {

        const select = $(id);

        select.innerHTML =
            `<option value="">Select state</option>` +
            states
                .map(
                    stateName =>
                        `<option value="${esc(stateName)}">${esc(stateName)}</option>`
                )
                .join("");

    });

}


/* =========================================================
   DATE
========================================================= */

function setDateDefaults() {

    const now = new Date();

    const iso =
        new Date(
            now.getTime() -
            now.getTimezoneOffset() * 60000
        )
        .toISOString()
        .slice(0, 10);

    $("invoiceDate").value = iso;

}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

    document.addEventListener(
        "input",
        event => {

            if (
                event.target.closest(
                    ".editor"
                )
            ) {

                updateTotals();

            }

        }
    );


    document.addEventListener(
        "change",
        event => {

            const target =
                event.target;


            if (
                target.id === "logoInput" ||
                target.id === "signatureInput"
            ) {

                handleImage(target);

            }


            if (
                target.closest(".editor")
            ) {

                updateTotals();

            }

        }
    );


    $("addItemBtn").onclick =
        addItem;


    $("downloadBtn").onclick =
        downloadPdf;


    $("previewBtn").onclick =
        previewInvoice;


    $("newInvoiceBtn").onclick =
        resetForm;


    $("openLoginBtn").onclick =
        openAuth;


    $("closeAuthBtn").onclick =
        closeAuth;


    $("logoutBtn").onclick =
        async () => {

            try {

                await logout();

                showToast(
                    "Logged out."
                );

            } catch (error) {

                showError(error);

            }

        };


    $("closePreviewBtn").onclick =
        closePreview;


    $("registerBtn").onclick =
        registerUser;


    $("resetPasswordBtn").onclick =
        resetUserPassword;


    $("googleBtn").onclick =
        async () => {

            try {

                await googleLogin();

                closeAuth();

                showToast(
                    "Google login successful."
                );

            } catch (error) {

                showError(error);

            }

        };


    $("sendOtpBtn").onclick =
        sendPhoneOtp;


    $("verifyOtpBtn").onclick =
        verifyPhoneOtp;


    $("emailAuthForm").addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            try {

                await emailLogin(
                    $("authEmail").value.trim(),
                    $("authPassword").value
                );

                closeAuth();

                showToast(
                    "Login successful."
                );

            } catch (error) {

                showError(error);

            }

        }
    );


    document
        .querySelectorAll(
            "[data-auth-tab]"
        )
        .forEach(button => {

            button.onclick =
                () =>
                    switchAuth(
                        button.dataset.authTab
                    );

        });


    $("itemsBody").onclick =
        event => {

            const button =
                event.target.closest(
                    "[data-del]"
                );

            if (!button) {
                return;
            }

            const id =
                Number(
                    button.dataset.del
                );

            state.items =
                state.items.filter(
                    item =>
                        item.id !== id
                );

            renderItems();

            updateTotals();

        };


    $("upiId").addEventListener(
        "input",
        updateQrPreview
    );


    $("removeLogoBtn").onclick =
        removeLogo;


    $("removeSignatureBtn").onclick =
        removeSignature;

}


/* =========================================================
   AUTH MODAL
========================================================= */

function openAuth() {

    $("authModal")
        .classList.remove("hidden");

    document.body.style.overflow =
        "hidden";

}


function closeAuth() {

    $("authModal")
        .classList.add("hidden");

    document.body.style.overflow =
        "";

    $("authMessage")
        .textContent = "";

}


function switchAuth(tab) {

    document
        .querySelectorAll(
            "[data-auth-tab]"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.authTab === tab
            );

        });


    $("emailAuthForm")
        .classList.toggle(
            "hidden",
            tab !== "email"
        );


    $("phoneAuthPanel")
        .classList.toggle(
            "hidden",
            tab !== "phone"
        );


    $("googleAuthPanel")
        .classList.toggle(
            "hidden",
            tab !== "google"
        );


    $("authMessage")
        .textContent = "";

}


/* =========================================================
   AUTH ACTIONS
========================================================= */

async function registerUser() {

    try {

        await register(
            $("authEmail").value.trim(),
            $("authPassword").value
        );

        closeAuth();

        showToast(
            "Account created successfully."
        );

    } catch (error) {

        showError(error);

    }

}


async function resetUserPassword() {

    const email =
        $("authEmail")
            .value
            .trim();

    if (!email) {

        showToast(
            "पहले email डालें।"
        );

        return;

    }


    try {

        await resetPassword(
            email
        );

        showToast(
            "Password reset email भेज दिया गया।"
        );

    } catch (error) {

        showError(error);

    }

}


async function sendPhoneOtp() {

    try {

        await sendOtp(
            $("authPhone")
                .value
                .trim()
        );

        $("otpCode")
            .classList
            .remove("hidden");

        $("verifyOtpBtn")
            .classList
            .remove("hidden");

        showToast(
            "OTP भेज दिया गया।"
        );

    } catch (error) {

        showError(error);

    }

}


async function verifyPhoneOtp() {

    try {

        await verifyOtp(
            $("otpCode")
                .value
                .trim()
        );

        closeAuth();

        showToast(
            "Phone login successful."
        );

    } catch (error) {

        showError(error);

    }

}


/* =========================================================
   ITEMS
========================================================= */

function addItem() {

    state.items.push({

        id: state.nextId++,

        name: "",

        hsn: "",

        qty: 1,

        rate: 0,

        gst: 18

    });


    renderItems();

}


function renderItems() {

    $("itemsBody").innerHTML =
        state.items
            .map(
                (item, index) => `

<tr data-id="${item.id}">

<td>
    ${index + 1}
</td>

<td>
    <input
        data-f="name"
        value="${esc(item.name)}"
        placeholder="Product / Service"
    >
</td>

<td>
    <input
        data-f="hsn"
        value="${esc(item.hsn)}"
        placeholder="HSN/SAC"
    >
</td>

<td>
    <input
        data-f="qty"
        type="number"
        min="0"
        step="0.01"
        value="${item.qty}"
    >
</td>

<td>
    <input
        data-f="rate"
        type="number"
        min="0"
        step="0.01"
        value="${item.rate}"
    >
</td>

<td>

<select data-f="gst">

${
    GST_RATES
        .map(
            rate =>
                `<option value="${rate}" ${
                    Number(item.gst) === Number(rate)
                        ? "selected"
                        : ""
                }>${rate}%</option>`
        )
        .join("")
}

</select>

</td>

<td class="amount">
    ${money(item.qty * item.rate)}
</td>

<td>

<button
    class="icon-btn"
    type="button"
    data-del="${item.id}"
>
    ×
</button>

</td>

</tr>

`
            )
            .join("");


    $("itemsBody")
        .querySelectorAll(
            "[data-f]"
        )
        .forEach(
            element => {

                element.oninput =
                    () => {

                        const row =
                            element.closest(
                                "tr"
                            );

                        const item =
                            state.items.find(
                                x =>
                                    x.id ===
                                    Number(
                                        row.dataset.id
                                    )
                            );

                        if (!item) {
                            return;
                        }


                        const field =
                            element.dataset.f;


                        if (
                            field === "name" ||
                            field === "hsn"
                        ) {

                            item[field] =
                                element.value;

                        } else {

                            item[field] =
                                Number(
                                    element.value
                                ) || 0;

                        }


                        row.querySelector(
                            ".amount"
                        ).textContent =
                            money(
                                item.qty *
                                item.rate
                            );


                        updateTotals();

                    };

            }
        );

}


/* =========================================================
   COLLECT DATA
========================================================= */

function collect() {

    const value =
        id =>
            $(id)?.value || "";


    const result =
        calculateInvoiceGST({

            items:
                state.items,

            sellerState:
                value("sellerState"),

            buyerState:
                value("buyerState")

        });


    return {

        invoiceNumber:
            value("invoiceNumber"),

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

            address:
                value("sellerAddress"),

            gstin:
                value("sellerGSTIN"),

            state:
                value("sellerState"),

            phone:
                value("sellerPhone"),

            email:
                value("sellerEmail")

        },


        buyer: {

            name:
                value("buyerName"),

            address:
                value("buyerAddress"),

            gstin:
                value("buyerGSTIN"),

            state:
                value("buyerState"),

            phone:
                value("buyerPhone"),

            email:
                value("buyerEmail")

        },


        items:
            result.calculatedItems,


        result,


        notes:
            value("invoiceNotes"),

        signatoryName:
            value("signatoryName"),

        upiId:
            value("upiId"),

        paymentNote:
            value("paymentNote"),

        accountName:
            value("accountName"),

        bankName:
            value("bankName"),

        accountNumber:
            value("accountNumber"),

        ifsc:
            value("ifsc"),

        logoData:
            state.logoData,

        signatureData:
            state.signatureData

    };

}


/* =========================================================
   TOTALS
========================================================= */

function updateTotals() {

    const data =
        collect();

    const result =
        data.result;


    $("taxableAmount")
        .textContent =
            money(
                result.taxableAmount
            );


    $("cgstAmount")
        .textContent =
            money(
                result.cgst
            );


    $("sgstAmount")
        .textContent =
            money(
                result.sgst
            );


    $("igstAmount")
        .textContent =
            money(
                result.igst
            );


    $("grandTotal")
        .textContent =
            money(
                result.grandTotal
            );


    $("taxModeMessage")
        .textContent =
            result.isSameState
                ? "Same-state: CGST + SGST"
                : result.isInterState
                    ? "Inter-state: IGST"
                    : "Select both states to calculate GST";

}


/* =========================================================
   PDF
========================================================= */

async function downloadPdf() {

    try {

        showToast(
            "PDF तैयार हो रहा है..."
        );


        const data =
            collect();


        const html =
            await buildInvoiceHTML(
                data
            );


        await generateInvoicePDF({

            html,

            invoiceNumber:
                data.invoiceNumber

        });


        showToast(
            "PDF तैयार हो गया।"
        );

    } catch (error) {

        showError(error);

    }

}


/* =========================================================
   PREVIEW
========================================================= */

async function previewInvoice() {

    try {

        const data =
            collect();


        await renderInvoicePreview(
            $("previewContainer"),
            data
        );


        $("previewModal")
            .classList
            .remove("hidden");


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

    $("previewModal")
        .classList
        .add("hidden");

    document.body.style.overflow =
        "";

}


/* =========================================================
   IMAGE HANDLING
========================================================= */

function handleImage(input) {

    const file =
        input.files?.[0];

    if (!file) {
        return;
    }


    if (
        ![
            "image/png",
            "image/jpeg",
            "image/webp"
        ].includes(file.type)
    ) {

        showToast(
            "केवल PNG, JPG या WEBP image डालें।"
        );

        input.value = "";

        return;

    }


    if (
        file.size >
        2 * 1024 * 1024
    ) {

        showToast(
            "Image 2MB से छोटी रखें।"
        );

        input.value = "";

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        () => {

            if (
                input.id ===
                "logoInput"
            ) {

                state.logoData =
                    reader.result;


                $("logoThumb").src =
                    reader.result;


                $("logoThumb")
                    .classList
                    .remove("hidden");


                $("removeLogoBtn")
                    .classList
                    .remove("hidden");

            } else {

                state.signatureData =
                    reader.result;


                $("signatureThumb").src =
                    reader.result;


                $("signatureThumb")
                    .classList
                    .remove("hidden");


                $("removeSignatureBtn")
                    .classList
                    .remove("hidden");

            }

        };


    reader.readAsDataURL(file);

}


/* =========================================================
   REMOVE LOGO
========================================================= */

function removeLogo() {

    state.logoData = "";

    $("logoInput").value = "";

    $("logoThumb")
        .classList
        .add("hidden");

    $("removeLogoBtn")
        .classList
        .add("hidden");

}


/* =========================================================
   REMOVE SIGNATURE
========================================================= */

function removeSignature() {

    state.signatureData = "";

    $("signatureInput").value = "";

    $("signatureThumb")
        .classList
        .add("hidden");

    $("removeSignatureBtn")
        .classList
        .add("hidden");

}


/* =========================================================
   QR PREVIEW
========================================================= */

function updateQrPreview() {

    const box =
        $("qrPreview");

    const upi =
        $("upiId")
            .value
            .trim();


    if (!upi) {

        box.innerHTML =
            `<span class="muted small">
                UPI QR will appear in preview/PDF
            </span>`;

        return;

    }


    box.innerHTML =
        `<span class="muted small">
            UPI QR ready
        </span>`;

}


/* =========================================================
   RESET
========================================================= */

function resetForm() {

    const confirmed =
        confirm(
            "Current invoice details clear करें?"
        );


    if (!confirmed) {
        return;
    }


    document
        .querySelectorAll(
            ".editor input, .editor textarea"
        )
        .forEach(
            element => {

                if (
                    element.type !==
                    "file"
                ) {

                    element.value = "";

                }

            }
        );


    document
        .querySelectorAll(
            ".editor select"
        )
        .forEach(
            element =>
                element.value = ""
        );


    state.items = [];

    state.nextId = 1;

    state.logoData = "";

    state.signatureData = "";


    $("logoInput").value = "";

    $("signatureInput").value = "";


    $("logoThumb")
        .classList
        .add("hidden");


    $("signatureThumb")
        .classList
        .add("hidden");


    $("removeLogoBtn")
        .classList
        .add("hidden");


    $("removeSignatureBtn")
        .classList
        .add("hidden");


    $("invoiceNumber")
        .value = "INV-0001";


    addItem();

    setDateDefaults();

    updateTotals();

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        "toast";

    toast.textContent =
        message;


    $("toastContainer")
        .appendChild(toast);


    setTimeout(
        () =>
            toast.remove(),
        3200
    );

}


/* =========================================================
   ERROR
========================================================= */

function showError(error) {

    console.error(
        error
    );


    const message =
        error?.message ||
        "Something went wrong.";


    $("authMessage")
        .textContent =
            message;


    showToast(
        message
    );

}


/* =========================================================
   MONEY
========================================================= */

function money(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2
        }
    ).format(
        Number(value) || 0
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function esc(value) {

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
