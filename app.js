// ============================================================
// PREMIUM GST BILL MAKER
// app.js
// Firebase Google Login + GST Calculator + PDF Generator
//
// IMPORTANT:
// Google Login uses signInWithRedirect()
// Result uses getRedirectResult()
// signInWithPopup() is NOT used.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyA76trG8L-GDKNuMKbtaORnuDfagRA3zY8",
  authDomain: "gst-bill-maker-d7956.firebaseapp.com",
  projectId: "gst-bill-maker-d7956",
  storageBucket: "gst-bill-maker-d7956.firebasestorage.app",
  messagingSenderId: "564339961180",
  appId: "1:564339961180:web:0e9ff371695d0beeade599"
};


// ============================================================
// FIREBASE INITIALIZATION
// ============================================================

const firebaseApp = initializeApp(firebaseConfig);

const auth = initializeAuth(firebaseApp, {
  persistence: [
    browserLocalPersistence,
    browserSessionPersistence
  ]
});

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account"
});


// ============================================================
// HELPER
// ============================================================

const $ = (id) => document.getElementById(id);


function setText(id, value) {
  const element = $(id);

  if (element) {
    element.textContent = value;
  }
}


function money(value) {

  const number = Number(value) || 0;

  return `₹${number.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}


function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function getToday() {

  const date = new Date();

  const localDate = new Date(
    date.getTime() -
    date.getTimezoneOffset() * 60000
  );

  return localDate
    .toISOString()
    .slice(0, 10);
}


function formatDate(dateValue) {

  if (!dateValue) {
    return "-";
  }

  const parts = dateValue.split("-");

  if (parts.length !== 3) {
    return dateValue;
  }

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}


// ============================================================
// SCREEN MANAGEMENT
// ============================================================

function showScreen(screen) {

  const loading = $("loadingScreen");
  const login = $("loginScreen");
  const application = $("app");

  loading?.classList.add("hidden");

  login?.classList.add("hidden");
  login?.classList.remove("flex");

  application?.classList.add("hidden");


  if (screen === "loading") {

    loading?.classList.remove("hidden");

  }


  if (screen === "login") {

    login?.classList.remove("hidden");
    login?.classList.add("flex");

  }


  if (screen === "app") {

    application?.classList.remove("hidden");

  }
}


// ============================================================
// LOGIN ERROR
// ============================================================

function showLoginError(message) {

  const errorBox = $("loginError");

  if (!errorBox) {
    return;
  }

  errorBox.textContent = message;

  errorBox.classList.remove("hidden");
}


function clearLoginError() {

  const errorBox = $("loginError");

  if (!errorBox) {
    return;
  }

  errorBox.textContent = "";

  errorBox.classList.add("hidden");
}


// ============================================================
// INDIAN STATES
// ============================================================

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


const GST_RATES = [
  0,
  5,
  12,
  18,
  28
];


// ============================================================
// STATE DROPDOWNS
// ============================================================

function setupStateDropdowns() {

  const dropdowns = [
    "sellerState",
    "buyerState",
    "placeOfSupply"
  ];

  dropdowns.forEach(id => {

    const select = $(id);

    if (!select) {
      return;
    }

    select.innerHTML = `
      <option value="">Select State</option>

      ${STATES.map(state => `
        <option value="${escapeHTML(state)}">
          ${escapeHTML(state)}
        </option>
      `).join("")}
    `;

  });

}


// ============================================================
// ITEMS
// ============================================================

let items = [];


function createItem() {

  return {

    id:
      Date.now().toString() +
      Math.random().toString(36).substring(2),

    name: "",

    hsn: "",

    qty: 1,

    rate: 0,

    gst: 18

  };

}


// ============================================================
// RENDER ITEMS
// ============================================================

function renderItems() {

  const body = $("itemsBody");

  if (!body) {
    return;
  }


  body.innerHTML = items.map((item, index) => {

    const total =
      Number(item.qty || 0) *
      Number(item.rate || 0);


    return `

      <tr
        data-item-id="${escapeHTML(item.id)}"
        class="border-b border-slate-100"
      >

        <td class="px-3 py-3 font-bold text-slate-400">
          ${index + 1}
        </td>


        <td class="px-3 py-3">

          <input
            data-field="name"
            value="${escapeHTML(item.name)}"
            placeholder="Product / Service"
            class="input-field w-full rounded-xl border border-slate-200 px-3 py-2"
          >

        </td>


        <td class="px-3 py-3">

          <input
            data-field="hsn"
            value="${escapeHTML(item.hsn)}"
            placeholder="HSN / SAC"
            class="input-field w-full rounded-xl border border-slate-200 px-3 py-2"
          >

        </td>


        <td class="px-3 py-3">

          <input
            data-field="qty"
            type="number"
            min="0"
            step="0.01"
            value="${item.qty}"
            class="input-field w-full rounded-xl border border-slate-200 px-3 py-2"
          >

        </td>


        <td class="px-3 py-3">

          <input
            data-field="rate"
            type="number"
            min="0"
            step="0.01"
            value="${item.rate}"
            class="input-field w-full rounded-xl border border-slate-200 px-3 py-2"
          >

        </td>


        <td class="px-3 py-3">

          <select
            data-field="gst"
            class="input-field w-full rounded-xl border border-slate-200 px-3 py-2"
          >

            ${GST_RATES.map(rate => `

              <option
                value="${rate}"
                ${Number(item.gst) === rate ? "selected" : ""}
              >
                ${rate}%
              </option>

            `).join("")}

          </select>

        </td>


        <td
          class="item-total px-3 py-3 text-right font-bold"
        >
          ${money(total)}
        </td>


        <td class="px-3 py-3 text-center">

          <button
            type="button"
            data-delete
            class="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600"
          >
            Delete
          </button>

        </td>

      </tr>

    `;

  }).join("");


  body.querySelectorAll("tr").forEach(row => {

    const itemId = row.dataset.itemId;


    row
      .querySelectorAll("[data-field]")
      .forEach(input => {

        input.addEventListener("input", () => {

          updateItem(row, itemId);

        });


        input.addEventListener("change", () => {

          updateItem(row, itemId);

        });

      });


    row
      .querySelector("[data-delete]")
      ?.addEventListener("click", () => {

        deleteItem(itemId);

      });

  });

}


// ============================================================
// UPDATE ITEM
// ============================================================

function updateItem(row, itemId) {

  const item =
    items.find(x => x.id === itemId);

  if (!item) {
    return;
  }


  item.name =
    row.querySelector('[data-field="name"]')?.value || "";


  item.hsn =
    row.querySelector('[data-field="hsn"]')?.value || "";


  item.qty =
    Math.max(
      0,
      Number(
        row.querySelector('[data-field="qty"]')?.value || 0
      )
    );


  item.rate =
    Math.max(
      0,
      Number(
        row.querySelector('[data-field="rate"]')?.value || 0
      )
    );


  item.gst =
    Number(
      row.querySelector('[data-field="gst"]')?.value || 0
    );


  const totalCell =
    row.querySelector(".item-total");


  if (totalCell) {

    totalCell.textContent =
      money(item.qty * item.rate);

  }


  calculateGST();

}


// ============================================================
// DELETE ITEM
// ============================================================

function deleteItem(itemId) {

  if (items.length === 1) {

    items = [
      createItem()
    ];

  } else {

    items =
      items.filter(item => item.id !== itemId);

  }


  renderItems();

  calculateGST();

}


// ============================================================
// ADD ITEM
// ============================================================

function addItem() {

  items.push(
    createItem()
  );

  renderItems();

  calculateGST();

}


// ============================================================
// GST CALCULATION
// ============================================================

function calculateGST() {

  let taxableAmount = 0;

  let cgst = 0;

  let sgst = 0;

  let igst = 0;


  const sellerState =
    $("sellerState")?.value || "";


  const buyerState =
    $("buyerState")?.value || "";


  items.forEach(item => {

    const taxable =
      Number(item.qty || 0) *
      Number(item.rate || 0);


    taxableAmount += taxable;


    const gstAmount =
      taxable *
      Number(item.gst || 0) /
      100;


    if (
      sellerState &&
      buyerState &&
      sellerState === buyerState
    ) {

      cgst += gstAmount / 2;

      sgst += gstAmount / 2;

    }


    else if (
      sellerState &&
      buyerState &&
      sellerState !== buyerState
    ) {

      igst += gstAmount;

    }

  });


  const grandTotal =
    taxableAmount +
    cgst +
    sgst +
    igst;


  setText(
    "taxableAmount",
    money(taxableAmount)
  );


  setText(
    "cgstAmount",
    money(cgst)
  );


  setText(
    "sgstAmount",
    money(sgst)
  );


  setText(
    "igstAmount",
    money(igst)
  );


  setText(
    "grandTotal",
    money(grandTotal)
  );


  const sameState =
    sellerState &&
    buyerState &&
    sellerState === buyerState;


  const differentState =
    sellerState &&
    buyerState &&
    sellerState !== buyerState;


  if ($("cgstLabel")) {

    $("cgstLabel").style.opacity =
      sameState ? "1" : "0.45";

  }


  if ($("sgstLabel")) {

    $("sgstLabel").style.opacity =
      sameState ? "1" : "0.45";

  }


  if ($("igstLabel")) {

    $("igstLabel").style.opacity =
      differentState ? "1" : "0.45";

  }


  if ($("taxModeMessage")) {

    if (sameState) {

      $("taxModeMessage").textContent =
        "Intra-state supply: GST split into CGST + SGST.";

    }

    else if (differentState) {

      $("taxModeMessage").textContent =
        "Inter-state supply: full GST applied as IGST.";

    }

    else {

      $("taxModeMessage").textContent =
        "Select Seller State and Buyer State to calculate GST.";

    }

  }


  updatePDF(
    taxableAmount,
    cgst,
    sgst,
    igst,
    grandTotal
  );

}


// ============================================================
// AMOUNT IN WORDS
// ============================================================

function amountInWords(number) {

  number =
    Math.round(
      Number(number) || 0
    );


  if (number === 0) {

    return "Zero Rupees Only";

  }


  const ones = [

    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen"

  ];


  const tens = [

    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety"

  ];


  function twoDigits(n) {

    if (n < 20) {

      return ones[n];

    }

    return (
      tens[Math.floor(n / 10)] +
      (n % 10
        ? " " + ones[n % 10]
        : "")
    );

  }


  function threeDigits(n) {

    if (n < 100) {

      return twoDigits(n);

    }

    return (
      ones[Math.floor(n / 100)] +
      " Hundred" +
      (
        n % 100
          ? " " + twoDigits(n % 100)
          : ""
      )
    );

  }


  let result = "";


  const crore =
    Math.floor(number / 10000000);

  number %= 10000000;


  const lakh =
    Math.floor(number / 100000);

  number %= 100000;


  const thousand =
    Math.floor(number / 1000);

  number %= 1000;


  if (crore) {

    result +=
      `${threeDigits(crore)} Crore `;

  }


  if (lakh) {

    result +=
      `${threeDigits(lakh)} Lakh `;

  }


  if (thousand) {

    result +=
      `${threeDigits(thousand)} Thousand `;

  }


  if (number) {

    result +=
      `${threeDigits(number)} `;

  }


  return (
    result.trim() +
    " Rupees Only"
  );

}


// ============================================================
// UPDATE PDF TEMPLATE
// ============================================================

function updatePDF(
  taxable,
  cgst,
  sgst,
  igst,
  grandTotal
) {

  setText(
    "pdfSellerName",
    $("sellerName")?.value ||
    "YOUR COMPANY"
  );


  setText(
    "pdfSellerAddress",
    $("sellerAddress")?.value ||
    "-"
  );


  setText(
    "pdfSellerGSTIN",
    $("sellerGSTIN")?.value ||
    "-"
  );


  setText(
    "pdfBuyerName",
    $("buyerName")?.value ||
    "-"
  );


  setText(
    "pdfBuyerAddress",
    $("buyerAddress")?.value ||
    "-"
  );


  setText(
    "pdfBuyerGSTIN",
    $("buyerGSTIN")?.value ||
    "-"
  );


  setText(
    "pdfBuyerState",
    $("buyerState")?.value ||
    "-"
  );


  setText(
    "pdfInvoiceNumber",
    $("invoiceNumber")?.value ||
    "-"
  );


  setText(
    "pdfInvoiceDate",
    formatDate(
      $("invoiceDate")?.value || ""
    )
  );


  setText(
    "pdfPlaceOfSupply",
    $("placeOfSupply")?.value ||
    "-"
  );


  setText(
    "pdfSignatoryCompany",
    $("sellerName")?.value ||
    "YOUR COMPANY"
  );


  const pdfItems =
    $("pdfItemsBody");


  if (pdfItems) {

    pdfItems.innerHTML =
      items.map((item, index) => `

        <tr>

          <td>
            ${index + 1}
          </td>

          <td>
            ${escapeHTML(item.name || "-")}
          </td>

          <td>
            ${escapeHTML(item.hsn || "-")}
          </td>

          <td>
            ${item.qty}
          </td>

          <td>
            ${money(item.rate)}
          </td>

          <td>
            ${item.gst}%
          </td>

          <td style="text-align:right">
            ${money(
              Number(item.qty) *
              Number(item.rate)
            )}
          </td>

        </tr>

      `).join("");

  }


  setText(
    "pdfTaxable",
    money(taxable)
  );


  setText(
    "pdfCGST",
    money(cgst)
  );


  setText(
    "pdfSGST",
    money(sgst)
  );


  setText(
    "pdfIGST",
    money(igst)
  );


  setText(
    "pdfGrandTotal",
    money(grandTotal)
  );


  setText(
    "pdfAmountWords",
    amountInWords(grandTotal)
  );


  const sellerState =
    $("sellerState")?.value || "";


  const buyerState =
    $("buyerState")?.value || "";


  const sameState =
    sellerState &&
    buyerState &&
    sellerState === buyerState;


  if ($("pdfCGSTRow")) {

    $("pdfCGSTRow").style.display =
      sameState ? "" : "none";

  }


  if ($("pdfSGSTRow")) {

    $("pdfSGSTRow").style.display =
      sameState ? "" : "none";

  }


  if ($("pdfIGSTRow")) {

    $("pdfIGSTRow").style.display =
      sameState ? "none" : "";

  }

}


// ============================================================
// APP INPUT SETUP
// ============================================================

function setupInputs() {

  if ($("invoiceDate") &&
      !$("invoiceDate").value) {

    $("invoiceDate").value =
      getToday();

  }


  if ($("invoiceNumber") &&
      !$("invoiceNumber").value) {

    const date =
      new Date();


    const year =
      String(
        date.getFullYear()
      ).slice(-2);


    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");


    const day =
      String(
        date.getDate()
      ).padStart(2, "0");


    $("invoiceNumber").value =
      `INV-${year}${month}${day}-001`;

  }


  const fields = [

    "sellerName",
    "sellerAddress",
    "sellerGSTIN",
    "sellerState",

    "buyerName",
    "buyerAddress",
    "buyerGSTIN",
    "buyerState",

    "invoiceNumber",
    "invoiceDate",
    "placeOfSupply"

  ];


  fields.forEach(id => {

    const element = $(id);

    if (!element) {
      return;
    }


    element.addEventListener(
      "input",
      calculateGST
    );


    element.addEventListener(
      "change",
      calculateGST
    );

  });


  $("sellerGSTIN")
    ?.addEventListener(
      "input",
      event => {

        event.target.value =
          event.target.value.toUpperCase();

      }
    );


  $("buyerGSTIN")
    ?.addEventListener(
      "input",
      event => {

        event.target.value =
          event.target.value.toUpperCase();

      }
    );


  $("addItemBtn")
    ?.addEventListener(
      "click",
      addItem
    );


  $("downloadPdfBtn")
    ?.addEventListener(
      "click",
      downloadPDF
    );


  $("logoutBtn")
    ?.addEventListener(
      "click",
      logout
    );


  setText(
    "currentYear",
    new Date().getFullYear()
  );

}


// ============================================================
// GOOGLE LOGIN
// ============================================================

async function loginWithGoogle() {

  clearLoginError();


  const button =
    $("googleLoginBtn");


  if (button) {

    button.disabled = true;

    button.textContent =
      "Opening Google...";

  }


  try {

    /*
      IMPORTANT:

      Redirect login only.

      DO NOT change this to signInWithPopup().
    */

    await signInWithRedirect(
      auth,
      googleProvider,
      browserPopupRedirectResolver
    );

  }


  catch (error) {

    console.error(
      "Google Login Error:",
      error
    );


    if (button) {

      button.disabled = false;

      button.textContent =
        "Continue with Google";

    }


    showLoginError(
      `${error.code || "Login Error"}: ${
        error.message ||
        "Google login could not start."
      }`
    );

  }

}


// ============================================================
// GET REDIRECT RESULT
// ============================================================

async function checkRedirectResult() {

  try {

    const result =
      await getRedirectResult(auth);


    if (result?.user) {

      showUser(
        result.user
      );

    }

  }


  catch (error) {

    console.error(
      "Redirect Result Error:",
      error
    );


    const message =
      String(
        error.message || ""
      ).toLowerCase();


    if (
      message.includes(
        "missing initial state"
      )
    ) {

      showLoginError(
        "Firebase Login redirect state lost. Firebase Authentication में आपकी website का domain और redirect setup करना जरूरी है."
      );

    }

    else {

      showLoginError(
        `${error.code || "Authentication Error"}: ${
          error.message ||
          "Google login failed."
        }`
      );

    }


    showScreen("login");

  }

}


// ============================================================
// AUTH STATE
// ============================================================

function showUser(user) {

  setText(
    "userName",
    user.displayName ||
    "Google User"
  );


  setText(
    "userEmail",
    user.email ||
    ""
  );


  const photo =
    $("userPhoto");


  if (
    photo &&
    user.photoURL
  ) {

    photo.src =
      user.photoURL;

    photo.classList.remove(
      "hidden"
    );

  }


  showScreen("app");

}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

  try {

    await signOut(auth);

    showScreen("login");

  }

  catch (error) {

    console.error(
      "Logout Error:",
      error
    );

    alert(
      "Logout failed. Please try again."
    );

  }

}


// ============================================================
// PDF DOWNLOAD
// ============================================================

async function downloadPDF() {

  if (
    typeof window.html2pdf !==
    "function"
  ) {

    alert(
      "PDF library अभी load हो रही है. थोड़ी देर बाद फिर try करें."
    );

    return;

  }


  calculateGST();


  const invoice =
    $("invoicePdf");


  if (!invoice) {

    alert(
      "Invoice PDF template नहीं मिला. index.html check करें."
    );

    return;

  }


  const invoiceNumber =
    $("invoiceNumber")?.value ||
    "Invoice";


  const safeName =
    invoiceNumber.replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    );


  const button =
    $("downloadPdfBtn");


  if (button) {

    button.disabled = true;

  }


  try {

    await window.html2pdf()
      .set({

        margin: 0,

        filename:
          `Invoice-${safeName}.pdf`,

        image: {

          type: "jpeg",

          quality: 0.98

        },

        html2canvas: {

          scale: 2,

          useCORS: true,

          backgroundColor:
            "#ffffff"

        },

        jsPDF: {

          unit: "mm",

          format: "a4",

          orientation:
            "portrait"

        }

      })

      .from(invoice)

      .save();

  }


  catch (error) {

    console.error(
      "PDF Error:",
      error
    );


    alert(
      "PDF generate नहीं हो सका. फिर से try करें."
    );

  }


  finally {

    if (button) {

      button.disabled = false;

    }

  }

}


// ============================================================
// START APPLICATION
// ============================================================

async function startApp() {

  showScreen("loading");


  setupStateDropdowns();


  setupInputs();


  items = [
    createItem()
  ];


  renderItems();


  calculateGST();


  /*
    VERY IMPORTANT:

    Check redirect result immediately
    when the page loads.
  */

  await checkRedirectResult();


  onAuthStateChanged(
    auth,
    user => {

      if (user) {

        showUser(user);

      }

      else {

        showScreen("login");

      }

    }
  );


  $("googleLoginBtn")
    ?.addEventListener(
      "click",
      loginWithGoogle
    );

}


startApp()
  .catch(error => {

    console.error(
      "Application Error:",
      error
    );


    showScreen("login");


    showLoginError(
      "Application start नहीं हो पाई. Page refresh करके फिर try करें."
    );

  });
