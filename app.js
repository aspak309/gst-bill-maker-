// ============================================================
// PREMIUM GST BILL MAKER
// Firebase v10.14.1
// Google Authentication using signInWithRedirect()
// ============================================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";


// ============================================================
// FIREBASE CONFIGURATION
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
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account"
});


// ============================================================
// DOM HELPERS
// ============================================================

const $ = (id) => document.getElementById(id);


// ============================================================
// APPLICATION STATE
// ============================================================

let items = [];

let itemIdCounter = 1;


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


// ============================================================
// GST RATES
// ============================================================

const GST_RATES = [0, 5, 12, 18, 28];


// ============================================================
// FORMAT CURRENCY
// ============================================================

function formatINR(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(number);
}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(dateString) {

  if (!dateString) {
    return "-";
  }

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}


// ============================================================
// TODAY
// ============================================================

function getToday() {

  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


// ============================================================
// GENERATE INVOICE NUMBER
// ============================================================

function generateInvoiceNumber() {

  const random = Math.floor(
    1000 + Math.random() * 9000
  );

  const year = new Date().getFullYear();

  return `INV-${year}-${random}`;
}


// ============================================================
// POPULATE STATE SELECTS
// ============================================================

function populateStates() {

  const selects = [
    $("sellerState"),
    $("buyerState"),
    $("placeOfSupply")
  ];

  selects.forEach((select) => {

    select.innerHTML =
      `<option value="">Select State</option>`;

    STATES.forEach((state) => {

      const option =
        document.createElement("option");

      option.value = state;
      option.textContent = state;

      select.appendChild(option);

    });

  });
}


// ============================================================
// CREATE NEW ITEM
// ============================================================

function createItem() {

  return {
    id: itemIdCounter++,
    name: "",
    hsn: "",
    qty: 1,
    rate: 0,
    gst: 18
  };

}


// ============================================================
// ADD ITEM
// ============================================================

function addItem() {

  items.push(createItem());

  renderItems();

  calculateInvoice();

}


// ============================================================
// DELETE ITEM
// ============================================================

function deleteItem(id) {

  if (items.length === 1) {

    items[0] = createItem();

  } else {

    items = items.filter(
      item => item.id !== id
    );

  }

  renderItems();

  calculateInvoice();

}


// ============================================================
// RENDER ITEMS
// ============================================================

function renderItems() {

  const body = $("itemsBody");

  body.innerHTML = "";

  items.forEach((item, index) => {

    const row =
      document.createElement("tr");

    row.className =
      "hover:bg-slate-50 transition";

    const total =
      Number(item.qty || 0) *
      Number(item.rate || 0);

    row.innerHTML = `

      <td class="px-4 py-3 text-sm font-semibold text-slate-500">
        ${index + 1}
      </td>

      <td class="px-4 py-3">

        <input
          type="text"
          class="input-field item-input"
          data-id="${item.id}"
          data-field="name"
          value="${escapeHTML(item.name)}"
          placeholder="Product / Service"
        >

      </td>


      <td class="px-4 py-3">

        <input
          type="text"
          class="input-field item-input"
          data-id="${item.id}"
          data-field="hsn"
          value="${escapeHTML(item.hsn)}"
          placeholder="HSN/SAC"
        >

      </td>


      <td class="px-4 py-3">

        <input
          type="number"
          min="0"
          step="0.01"
          class="input-field item-input"
          data-id="${item.id}"
          data-field="qty"
          value="${item.qty}"
        >

      </td>


      <td class="px-4 py-3">

        <input
          type="number"
          min="0"
          step="0.01"
          class="input-field item-input"
          data-id="${item.id}"
          data-field="rate"
          value="${item.rate}"
        >

      </td>


      <td class="px-4 py-3">

        <select
          class="input-field item-input"
          data-id="${item.id}"
          data-field="gst"
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
        class="px-4 py-3 text-right text-sm font-bold text-slate-800"
      >
        ${formatINR(total)}
      </td>


      <td class="px-4 py-3 text-center">

        <button
          type="button"
          class="delete-item rounded-xl px-3 py-2 text-red-500 transition hover:bg-red-50"
          data-id="${item.id}"
          title="Delete item"
        >
          🗑️
        </button>

      </td>

    `;

    body.appendChild(row);

  });

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ============================================================
// ITEM INPUT HANDLER
// ============================================================

$("itemsBody").addEventListener(
  "input",
  (event) => {

    const target = event.target;

    const id = Number(
      target.dataset.id
    );

    const field =
      target.dataset.field;

    if (!id || !field) {
      return;
    }

    const item =
      items.find(
        current => current.id === id
      );

    if (!item) {
      return;
    }

    if (
      field === "qty" ||
      field === "rate" ||
      field === "gst"
    ) {

      item[field] =
        Number(target.value) || 0;

    } else {

      item[field] =
        target.value;

    }

    calculateInvoice();

    updateRowTotal(target.closest("tr"), item);

  }
);


// ============================================================
// ITEM SELECT HANDLER
// ============================================================

$("itemsBody").addEventListener(
  "change",
  (event) => {

    const target = event.target;

    const id = Number(
      target.dataset.id
    );

    const field =
      target.dataset.field;

    if (!id || !field) {
      return;
    }

    const item =
      items.find(
        current => current.id === id
      );

    if (!item) {
      return;
    }

    item[field] =
      Number(target.value) || 0;

    calculateInvoice();

    updateRowTotal(
      target.closest("tr"),
      item
    );

  }
);


// ============================================================
// UPDATE TABLE TOTAL
// ============================================================

function updateRowTotal(row, item) {

  if (!row) {
    return;
  }

  const total =
    Number(item.qty || 0) *
    Number(item.rate || 0);

  const cells =
    row.querySelectorAll("td");

  if (cells.length >= 8) {

    cells[6].textContent =
      formatINR(total);

  }

}


// ============================================================
// DELETE BUTTON HANDLER
// ============================================================

$("itemsBody").addEventListener(
  "click",
  (event) => {

    const button =
      event.target.closest(".delete-item");

    if (!button) {
      return;
    }

    const id =
      Number(button.dataset.id);

    deleteItem(id);

  }
);


// ============================================================
// CALCULATE INVOICE
// ============================================================

function calculateInvoice() {

  let taxableAmount = 0;

  let cgst = 0;

  let sgst = 0;

  let igst = 0;

  let totalTax = 0;


  const sellerState =
    $("sellerState").value;

  const buyerState =
    $("buyerState").value;


  const isSameState =
    sellerState &&
    buyerState &&
    sellerState === buyerState;


  items.forEach((item) => {

    const qty =
      Math.max(
        0,
        Number(item.qty) || 0
      );

    const rate =
      Math.max(
        0,
        Number(item.rate) || 0
      );

    const gstRate =
      Math.max(
        0,
        Number(item.gst) || 0
      );


    const itemTaxable =
      qty * rate;

    const itemTax =
      itemTaxable *
      gstRate /
      100;


    taxableAmount += itemTaxable;

    totalTax += itemTax;


    if (isSameState) {

      cgst += itemTax / 2;

      sgst += itemTax / 2;

    } else {

      igst += itemTax;

    }

  });


  const grandTotal =
    taxableAmount +
    totalTax;


  $("taxableAmount").textContent =
    formatINR(taxableAmount);

  $("cgstAmount").textContent =
    formatINR(cgst);

  $("sgstAmount").textContent =
    formatINR(sgst);

  $("igstAmount").textContent =
    formatINR(igst);

  $("grandTotal").textContent =
    formatINR(grandTotal);


  updateTaxLabels(isSameState);

  updateTaxModeMessage(
    sellerState,
    buyerState,
    isSameState
  );


  updatePDFFileName();

  return {
    taxableAmount,
    cgst,
    sgst,
    igst,
    totalTax,
    grandTotal,
    isSameState
  };

}


// ============================================================
// TAX LABELS
// ============================================================

function updateTaxLabels(isSameState) {

  if (isSameState) {

    $("cgstLabel").textContent =
      "CGST";

    $("sgstLabel").textContent =
      "SGST";

    $("igstLabel").textContent =
      "IGST";

  } else {

    $("cgstLabel").textContent =
      "CGST";

    $("sgstLabel").textContent =
      "SGST";

    $("igstLabel").textContent =
      "IGST";

  }

}


// ============================================================
// TAX MESSAGE
// ============================================================

function updateTaxModeMessage(
  sellerState,
  buyerState,
  isSameState
) {

  const message =
    $("taxModeMessage");


  if (!sellerState || !buyerState) {

    message.className =
      "mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-700";

    message.textContent =
      "Select both seller and buyer states to calculate CGST, SGST or IGST.";

    return;

  }


  if (isSameState) {

    message.className =
      "mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-5 text-emerald-700";

    message.textContent =
      `Seller and Buyer are in ${sellerState}. Applying CGST + SGST equally.`;

  } else {

    message.className =
      "mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-700";

    message.textContent =
      `Seller (${sellerState}) and Buyer (${buyerState}) are in different states. Applying IGST.`;

  }

}


// ============================================================
// INPUT EVENTS
// ============================================================

const formInputs = [
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


formInputs.forEach((id) => {

  const element = $(id);

  if (!element) {
    return;
  }

  element.addEventListener(
    "input",
    () => {

      calculateInvoice();

    }
  );

  element.addEventListener(
    "change",
    () => {

      calculateInvoice();

    }
  );

});


// ============================================================
// ADD ITEM BUTTON
// ============================================================

$("addItemBtn").addEventListener(
  "click",
  addItem
);


// ============================================================
// DEFAULT DATA
// ============================================================

function initializeDefaults() {

  populateStates();

  $("invoiceNumber").value =
    generateInvoiceNumber();

  $("invoiceDate").value =
    getToday();

  $("sellerState").value =
    "Punjab";

  $("buyerState").value =
    "Punjab";

  $("placeOfSupply").value =
    "Punjab";


  items = [
    {
      id: itemIdCounter++,
      name: "",
      hsn: "",
      qty: 1,
      rate: 0,
      gst: 18
    }
  ];


  renderItems();

  calculateInvoice();

  $("currentYear").textContent =
    new Date().getFullYear();

}


// ============================================================
// UPDATE PDF FILE NAME
// ============================================================

function updatePDFFileName() {

  const number =
    $("invoiceNumber").value.trim();

  const safeNumber =
    sanitizeFileName(
      number || "Invoice"
    );

  $("pdfFileName").textContent =
    `Invoice-${safeNumber}.pdf`;

}


// ============================================================
// SANITIZE FILE NAME
// ============================================================

function sanitizeFileName(value) {

  return String(value)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 100);

}


// ============================================================
// NUMBER TO INDIAN RUPEE WORDS
// ============================================================

function numberToWords(number) {

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


  function underThousand(num) {

    let result = "";


    if (num >= 100) {

      result +=
        ones[Math.floor(num / 100)] +
        " Hundred ";

      num %= 100;

    }


    if (num >= 20) {

      result +=
        tens[Math.floor(num / 10)] +
        " ";

      num %= 10;

    }


    if (num > 0) {

      result +=
        ones[num] +
        " ";

    }


    return result.trim();

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
      underThousand(crore) +
      " Crore ";

  }


  if (lakh) {

    result +=
      underThousand(lakh) +
      " Lakh ";

  }


  if (thousand) {

    result +=
      underThousand(thousand) +
      " Thousand ";

  }


  if (number) {

    result +=
      underThousand(number);

  }


  return (
    result.trim() +
    " Rupees Only"
  );

}


// ============================================================
// PREPARE PDF
// ============================================================

function preparePDF() {

  const totals =
    calculateInvoice();


  $("pdfSellerName").textContent =
    $("sellerName").value.trim() ||
    "Your Company";


  $("pdfSellerAddress").textContent =
    $("sellerAddress").value.trim() ||
    "-";


  $("pdfSellerGSTIN").textContent =
    $("sellerGSTIN").value.trim() ||
    "-";


  $("pdfBuyerName").textContent =
    $("buyerName").value.trim() ||
    "-";


  $("pdfBuyerAddress").textContent =
    $("buyerAddress").value.trim() ||
    "-";


  $("pdfBuyerGSTIN").textContent =
    $("buyerGSTIN").value.trim() ||
    "-";


  $("pdfBuyerState").textContent =
    $("buyerState").value ||
    "-";


  $("pdfInvoiceNumber").textContent =
    $("invoiceNumber").value.trim() ||
    "-";


  $("pdfInvoiceDate").textContent =
    formatDate(
      $("invoiceDate").value
    );


  $("pdfPlaceOfSupply").textContent =
    $("placeOfSupply").value ||
    "-";


  $("pdfSignatoryCompany").textContent =
    $("sellerName").value.trim() ||
    "Your Company";


  $("pdfTaxable").textContent =
    formatINR(
      totals.taxableAmount
    );


  $("pdfCGST").textContent =
    formatINR(
      totals.cgst
    );


  $("pdfSGST").textContent =
    formatINR(
      totals.sgst
    );


  $("pdfIGST").textContent =
    formatINR(
      totals.igst
    );


  $("pdfGrandTotal").textContent =
    formatINR(
      totals.grandTotal
    );


  $("pdfAmountWords").textContent =
    numberToWords(
      totals.grandTotal
    );


  if (totals.isSameState) {

    $("pdfCGSTRow").style.display =
      "";

    $("pdfSGSTRow").style.display =
      "";

    $("pdfIGSTRow").style.display =
      totals.igst > 0
        ? ""
        : "none";

  } else {

    $("pdfCGSTRow").style.display =
      "none";

    $("pdfSGSTRow").style.display =
      "none";

    $("pdfIGSTRow").style.display =
      "";

  }


  const pdfBody =
    $("pdfItemsBody");

  pdfBody.innerHTML = "";


  items.forEach(
    (item, index) => {

      const tr =
        document.createElement("tr");


      const taxable =
        Number(item.qty || 0) *
        Number(item.rate || 0);


      tr.innerHTML = `

        <td>${index + 1}</td>

        <td>
          ${escapeHTML(
            item.name || "-"
          )}
        </td>

        <td>
          ${escapeHTML(
            item.hsn || "-"
          )}
        </td>

        <td>
          ${Number(item.qty || 0)}
        </td>

        <td style="text-align:right;">
          ${Number(item.rate || 0).toFixed(2)}
        </td>

        <td style="text-align:center;">
          ${Number(item.gst || 0)}%
        </td>

        <td style="text-align:right;">
          ${taxable.toFixed(2)}
        </td>

      `;

      pdfBody.appendChild(tr);

    }
  );

}


// ============================================================
// DOWNLOAD PDF
// ============================================================

$("downloadPdfBtn").addEventListener(
  "click",
  async () => {

    try {

      if (
        typeof window.html2pdf !==
        "function"
      ) {

        alert(
          "PDF library is still loading. Please try again in a moment."
        );

        return;

      }


      preparePDF();


      const invoiceNumber =
        $("invoiceNumber").value.trim() ||
        "Invoice";


      const safeNumber =
        sanitizeFileName(
          invoiceNumber
        );


      const element =
        $("invoicePdf");


      const options = {

        margin: 0,

        filename:
          `Invoice-${safeNumber}.pdf`,

        image: {
          type: "jpeg",
          quality: 0.98
        },

        html2canvas: {

          scale: 2,

          useCORS: true,

          backgroundColor: "#ffffff",

          logging: false

        },

        jsPDF: {

          unit: "mm",

          format: "a4",

          orientation: "portrait",

          compress: true

        },

        pagebreak: {
          mode: [
            "avoid-all",
            "css",
            "legacy"
          ]
        }

      };


      const button =
        $("downloadPdfBtn");


      const originalHTML =
        button.innerHTML;


      button.disabled = true;


      button.innerHTML = `
        <div class="flex items-center justify-center gap-3">
          <span class="animate-spin">◌</span>
          <span>Generating PDF...</span>
        </div>
      `;


      await window.html2pdf()
        .set(options)
        .from(element)
        .save();


      button.disabled = false;

      button.innerHTML =
        originalHTML;


    } catch (error) {

      console.error(
        "PDF generation error:",
        error
      );


      $("downloadPdfBtn").disabled =
        false;


      alert(
        "PDF generate नहीं हो पाया। कृपया दोबारा कोशिश करें।"
      );

    }

  }
);


// ============================================================
// GOOGLE LOGIN
// STRICTLY REDIRECT
// ============================================================

$("googleLoginBtn").addEventListener(
  "click",
  async () => {

    try {

      $("loginError").classList.add(
        "hidden"
      );


      const button =
        $("googleLoginBtn");


      button.disabled = true;


      button.innerHTML = `
        <span class="animate-pulse">
          Redirecting to Google...
        </span>
      `;


      await signInWithRedirect(
        auth,
        googleProvider
      );


    } catch (error) {

      console.error(
        "Google login error:",
        error
      );


      showLoginError(
        getAuthErrorMessage(error)
      );


      $("googleLoginBtn").disabled =
        false;


      $("googleLoginBtn").innerHTML =
        "Continue with Google";

    }

  }
);


// ============================================================
// REDIRECT RESULT
// ============================================================

async function handleRedirectResult() {

  try {

    await getRedirectResult(auth);

  } catch (error) {

    console.error(
      "Redirect result error:",
      error
    );


    if (error?.code) {

      showLoginError(
        getAuthErrorMessage(error)
      );

    }

  }

}


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
  auth,
  (user) => {

    $("loadingScreen").classList.add(
      "hidden"
    );


    if (user) {

      showApp(user);

    } else {

      showLogin();

    }

  }
);


// ============================================================
// SHOW APP
// ============================================================

function showApp(user) {

  $("loginScreen").classList.add(
    "hidden"
  );

  $("loginScreen").classList.remove(
    "flex"
  );


  $("app").classList.remove(
    "hidden"
  );


  $("userName").textContent =
    user.displayName ||
    "Google User";


  $("userEmail").textContent =
    user.email ||
    "";


  if (user.photoURL) {

    $("userPhoto").src =
      user.photoURL;

    $("userPhoto").classList.remove(
      "hidden"
    );

  } else {

    $("userPhoto").classList.add(
      "hidden"
    );

  }

}


// ============================================================
// SHOW LOGIN
// ============================================================

function showLogin() {

  $("app").classList.add(
    "hidden"
  );


  $("loginScreen").classList.remove(
    "hidden"
  );

  $("loginScreen").classList.add(
    "flex"
  );

}


// ============================================================
// LOGOUT
// ============================================================

$("logoutBtn").addEventListener(
  "click",
  async () => {

    try {

      await signOut(auth);

    } catch (error) {

      console.error(
        "Logout error:",
        error
      );

      alert(
        "Logout failed. Please try again."
      );

    }

  }
);


// ============================================================
// LOGIN ERROR
// ============================================================

function showLoginError(message) {

  const errorBox =
    $("loginError");

  errorBox.textContent =
    message;

  errorBox.classList.remove(
    "hidden"
  );

}


// ============================================================
// FIREBASE ERROR MESSAGES
// ============================================================

function getAuthErrorMessage(error) {

  const code =
    error?.code || "";


  const messages = {

    "auth/popup-blocked":
      "Google sign-in was blocked by the browser.",

    "auth/unauthorized-domain":
      "This website domain is not authorized in Firebase Authentication.",

    "auth/operation-not-allowed":
      "Google Login is not enabled in Firebase Authentication.",

    "auth/network-request-failed":
      "Network error. Please check your internet connection.",

    "auth/too-many-requests":
      "Too many requests. Please wait and try again."

  };


  return (
    messages[code] ||
    error?.message ||
    "Google Login failed. Please try again."
  );

}


// ============================================================
// START APPLICATION
// ============================================================

initializeDefaults();

handleRedirectResult();
