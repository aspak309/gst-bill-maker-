import {
    calculateInvoiceGST
} from "./gst.js";

import {
    buildInvoiceHTML,
    renderInvoicePreview
} from "./invoice.js";

import {
    generateInvoicePDF
} from "./pdf.js";
/* =========================================================
   GST BILL MAKER
   Main Application Controller
   File: app.js
========================================================= */

import {
    calculateInvoiceGST
} from "./gst.js";


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

const qs = (selector, parent = document) =>
    parent.querySelector(selector);

const qsa = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];


/* =========================================================
   APPLICATION STATE
========================================================= */

const state = {

    items: [],

    nextItemId: 1,

    invoiceNumber: "",

    invoiceDate: "",

    seller: {
        name: "",
        address: "",
        gstin: "",
        state: ""
    },

    buyer: {
        name: "",
        address: "",
        gstin: "",
        state: ""
    },

    placeOfSupply: "",

    notes: ""

};


/* =========================================================
   INDIAN STATES
========================================================= */

const INDIAN_STATES = [

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
   GST OPTIONS
========================================================= */

const GST_RATES = [
    0,
    5,
    12,
    18,
    28
];


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);


function initializeApp() {

    setDefaultDate();

    setDefaultInvoiceNumber();

    populateStateSelects();

    bindApplicationEvents();

    addItem();

    updateApplication();

}


/* =========================================================
   DEFAULT DATE
========================================================= */

function setDefaultDate() {

    const dateInput = $("invoiceDate");

    if (!dateInput) {
        return;
    }

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    const formattedDate =
        `${year}-${month}-${day}`;

    dateInput.value = formattedDate;

    state.invoiceDate = formattedDate;

}


/* =========================================================
   DEFAULT INVOICE NUMBER
========================================================= */

function setDefaultInvoiceNumber() {

    const input = $("invoiceNumber");

    if (!input) {
        return;
    }

    const savedCounter =
        Number(
            localStorage.getItem(
                "gstBillInvoiceCounter"
            )
        ) || 1;

    const invoiceNumber =
        `INV-${String(savedCounter).padStart(4, "0")}`;

    input.value = invoiceNumber;

    state.invoiceNumber = invoiceNumber;

    updateInvoiceNumberPreview();

}


/* =========================================================
   STATE DROPDOWNS
========================================================= */

function populateStateSelects() {

    const selects = [

        $("sellerState"),
        $("buyerState"),
        $("placeOfSupply")

    ];

    selects.forEach((select) => {

        if (!select) {
            return;
        }

        const fragment =
            document.createDocumentFragment();

        INDIAN_STATES.forEach((stateName) => {

            const option =
                document.createElement("option");

            option.value = stateName;

            option.textContent = stateName;

            fragment.appendChild(option);

        });

        select.appendChild(fragment);

    });

}


/* =========================================================
   EVENT BINDING
========================================================= */

function bindApplicationEvents() {


    /* ---------------------------------------------------------
       ADD ITEM
    --------------------------------------------------------- */

    $("addItemBtn")?.addEventListener(
        "click",
        () => {

            addItem();

            showToast(
                "New item added.",
                "success"
            );

        }
    );


    /* ---------------------------------------------------------
       DOWNLOAD PDF
       PDF module बाद में connect होगा
    --------------------------------------------------------- */

    $("downloadPdfBtn")?.addEventListener(
        "click",
        handleDownloadPDF
    );


    /* ---------------------------------------------------------
       PREVIEW
    --------------------------------------------------------- */

    $("previewInvoiceBtn")?.addEventListener(
        "click",
        handlePreview
    );


    /* ---------------------------------------------------------
       CLOSE PREVIEW
    --------------------------------------------------------- */

    $("closePreviewBtn")?.addEventListener(
        "click",
        closePreview
    );


    /* ---------------------------------------------------------
       CLICK OUTSIDE MODAL
    --------------------------------------------------------- */

    $("invoicePreviewModal")?.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                $("invoicePreviewModal")
            ) {

                closePreview();

            }

        }
    );


    /* ---------------------------------------------------------
       NEW INVOICE
    --------------------------------------------------------- */

    $("clearInvoiceBtn")?.addEventListener(
        "click",
        createNewInvoice
    );


    /* ---------------------------------------------------------
       ALL FORM INPUTS
    --------------------------------------------------------- */

    document.addEventListener(
        "input",
        handleInputChange
    );


    document.addEventListener(
        "change",
        handleInputChange
    );


    /* ---------------------------------------------------------
       DELETE ITEM
    --------------------------------------------------------- */

    $("itemsBody")?.addEventListener(
        "click",
        handleItemTableClick
    );

}


/* =========================================================
   FORM INPUT HANDLER
========================================================= */

function handleInputChange(event) {

    const element = event.target;

    if (!element) {
        return;
    }


    /* ---------------------------------------------------------
       ITEM INPUT
    --------------------------------------------------------- */

    if (
        element.closest("#itemsBody")
    ) {

        handleItemInput(element);

        updateApplication();

        return;

    }


    /* ---------------------------------------------------------
       SELLER
    --------------------------------------------------------- */

    switch (element.id) {

        case "sellerName":

            state.seller.name =
                element.value.trim();

            break;


        case "sellerAddress":

            state.seller.address =
                element.value;

            break;


        case "sellerGSTIN":

            state.seller.gstin =
                element.value
                    .toUpperCase()
                    .replace(/\s/g, "");

            element.value =
                state.seller.gstin;

            break;


        case "sellerState":

            state.seller.state =
                element.value;

            break;


        /* -----------------------------------------------------
           BUYER
        ----------------------------------------------------- */

        case "buyerName":

            state.buyer.name =
                element.value.trim();

            break;


        case "buyerAddress":

            state.buyer.address =
                element.value;

            break;


        case "buyerGSTIN":

            state.buyer.gstin =
                element.value
                    .toUpperCase()
                    .replace(/\s/g, "");

            element.value =
                state.buyer.gstin;

            break;


        case "buyerState":

            state.buyer.state =
                element.value;

            break;


        /* -----------------------------------------------------
           INVOICE
        ----------------------------------------------------- */

        case "invoiceNumber":

            state.invoiceNumber =
                element.value.trim();

            updateInvoiceNumberPreview();

            break;


        case "invoiceDate":

            state.invoiceDate =
                element.value;

            break;


        case "placeOfSupply":

            state.placeOfSupply =
                element.value;

            break;


        case "invoiceNotes":

            state.notes =
                element.value;

            break;

    }


    updateApplication();

}


/* =========================================================
   ITEM INPUT HANDLER
========================================================= */

function handleItemInput(element) {

    const row =
        element.closest("[data-item-id]");

    if (!row) {
        return;
    }

    const itemId =
        Number(
            row.dataset.itemId
        );

    const item =
        state.items.find(
            (entry) =>
                entry.id === itemId
        );

    if (!item) {
        return;
    }


    switch (element.dataset.field) {

        case "name":

            item.name =
                element.value;

            break;


        case "hsn":

            item.hsn =
                element.value;

            break;


        case "qty":

            item.qty =
                sanitizeNumber(
                    element.value
                );

            break;


        case "rate":

            item.rate =
                sanitizeNumber(
                    element.value
                );

            break;


        case "gst":

            item.gst =
                sanitizeNumber(
                    element.value
                );

            break;

    }


    updateItemAmount(row, item);

}


/* =========================================================
   ADD ITEM
========================================================= */

function addItem() {

    const item = {

        id: state.nextItemId++,

        name: "",

        hsn: "",

        qty: 1,

        rate: 0,

        gst: 18

    };


    state.items.push(item);

    renderItems();

    updateApplication();

}


/* =========================================================
   DELETE ITEM
========================================================= */

function deleteItem(itemId) {

    if (state.items.length <= 1) {

        showToast(
            "At least one item is required.",
            "warning"
        );

        return;

    }


    state.items =
        state.items.filter(
            (item) =>
                item.id !== itemId
        );


    renderItems();

    updateApplication();

    showToast(
        "Item removed.",
        "success"
    );

}


/* =========================================================
   ITEM TABLE CLICK
========================================================= */

function handleItemTableClick(event) {

    const deleteButton =
        event.target.closest(
            "[data-delete-item]"
        );

    if (!deleteButton) {
        return;
    }

    const itemId =
        Number(
            deleteButton.dataset.deleteItem
        );

    deleteItem(itemId);

}


/* =========================================================
   RENDER ITEMS
========================================================= */

function renderItems() {

    const body =
        $("itemsBody");

    const emptyState =
        $("itemsEmptyState");

    if (!body) {
        return;
    }


    body.innerHTML = "";


    if (state.items.length === 0) {

        emptyState?.classList.remove(
            "hidden"
        );

        return;

    }


    emptyState?.classList.add(
        "hidden"
    );


    const fragment =
        document.createDocumentFragment();


    state.items.forEach(
        (item, index) => {

            const row =
                createItemRow(
                    item,
                    index
                );

            fragment.appendChild(row);

        }
    );


    body.appendChild(fragment);

}


/* =========================================================
   CREATE ITEM ROW
========================================================= */

function createItemRow(item, index) {

    const row =
        document.createElement("tr");

    row.dataset.itemId =
        item.id;


    row.innerHTML = `

        <td class="text-center text-xs font-bold text-slate-400">
            ${index + 1}
        </td>


        <td>

            <input
                type="text"
                class="app-input"
                data-field="name"
                value="${escapeHTML(item.name)}"
                placeholder="Product / Service"
            >

        </td>


        <td>

            <input
                type="text"
                class="app-input"
                data-field="hsn"
                value="${escapeHTML(item.hsn)}"
                placeholder="HSN / SAC"
            >

        </td>


        <td>

            <input
                type="number"
                min="0"
                step="0.01"
                class="app-input text-center"
                data-field="qty"
                value="${item.qty}"
            >

        </td>


        <td>

            <input
                type="number"
                min="0"
                step="0.01"
                class="app-input"
                data-field="rate"
                value="${item.rate}"
                placeholder="0.00"
            >

        </td>


        <td>

            <select
                class="app-input"
                data-field="gst"
            >

                ${GST_RATES.map(
                    (rate) => `
                        <option
                            value="${rate}"
                            ${Number(item.gst) === rate ? "selected" : ""}
                        >
                            ${rate}%
                        </option>
                    `
                ).join("")}

            </select>

        </td>


        <td class="text-right">

            <span
                class="item-amount text-sm font-black text-slate-900"
            >
                ${formatCurrency(
                    calculateItemAmount(item)
                )}
            </span>

        </td>


        <td class="text-center">

            <button
                type="button"
                class="item-delete-btn"
                data-delete-item="${item.id}"
                title="Delete item"
                aria-label="Delete item"
            >
                ×
            </button>

        </td>

    `;


    return row;

}


/* =========================================================
   UPDATE ITEM AMOUNT
========================================================= */

function updateItemAmount(row, item) {

    const amountElement =
        qs(
            ".item-amount",
            row
        );

    if (!amountElement) {
        return;
    }


    amountElement.textContent =
        formatCurrency(
            calculateItemAmount(item)
        );

}


/* =========================================================
   CALCULATE ITEM AMOUNT
========================================================= */

function calculateItemAmount(item) {

    const qty =
        sanitizeNumber(item.qty);

    const rate =
        sanitizeNumber(item.rate);

    return qty * rate;

}


/* =========================================================
   UPDATE APPLICATION
========================================================= */

function updateApplication() {

    const result =
        calculateInvoiceGST({

            items: state.items,

            sellerState:
                state.seller.state,

            buyerState:
                state.buyer.state

        });


    updateSummary(result);

    updateTaxMode(result);

}


/* =========================================================
   UPDATE SUMMARY
========================================================= */

function updateSummary(result) {

    if (!result) {
        return;
    }


    if ($("taxableAmount")) {

        $("taxableAmount").textContent =
            formatCurrency(
                result.taxableAmount
            );

    }


    if ($("cgstAmount")) {

        $("cgstAmount").textContent =
            formatCurrency(
                result.cgst
            );

    }


    if ($("sgstAmount")) {

        $("sgstAmount").textContent =
            formatCurrency(
                result.sgst
            );

    }


    if ($("igstAmount")) {

        $("igstAmount").textContent =
            formatCurrency(
                result.igst
            );

    }


    if ($("grandTotal")) {

        $("grandTotal").textContent =
            formatCurrency(
                result.grandTotal
            );

    }

}


/* =========================================================
   UPDATE TAX MODE
========================================================= */

function updateTaxMode(result) {

    const message =
        $("taxModeMessage");

    if (!message) {
        return;
    }


    if (
        !state.seller.state ||
        !state.buyer.state
    ) {

        message.textContent =
            "Select Seller State and Buyer State to calculate CGST, SGST or IGST.";

        return;

    }


    if (
        state.seller.state ===
        state.buyer.state
    ) {

        message.textContent =
            "Same-state transaction detected. GST will be split equally into CGST and SGST.";

    } else {

        message.textContent =
            "Inter-state transaction detected. Full GST will be applied as IGST.";

    }

}


/* =========================================================
   INVOICE NUMBER PREVIEW
========================================================= */

function updateInvoiceNumberPreview() {

    const preview =
        $("invoiceNumberPreview");

    if (!preview) {
        return;
    }


    preview.textContent =
        state.invoiceNumber ||
        "INV-0001";

}


/* =========================================================
   CREATE NEW INVOICE
========================================================= */

function createNewInvoice() {

    const confirmed =
        window.confirm(
            "Start a new invoice? Current invoice data will be cleared."
        );


    if (!confirmed) {
        return;
    }


    state.items = [];

    state.nextItemId = 1;


    state.invoiceNumber = "";

    state.invoiceDate = "";

    state.seller = {
        name: "",
        address: "",
        gstin: "",
        state: ""
    };


    state.buyer = {
        name: "",
        address: "",
        gstin: "",
        state: ""
    };


    state.placeOfSupply = "";

    state.notes = "";


    clearFormFields();

    setDefaultDate();

    setDefaultInvoiceNumber();

    addItem();

    updateApplication();


    showToast(
        "New invoice created.",
        "success"
    );

}


/* =========================================================
   CLEAR FORM
========================================================= */

function clearFormFields() {

    const fields = [

        "sellerName",
        "sellerAddress",
        "sellerGSTIN",
        "buyerName",
        "buyerAddress",
        "buyerGSTIN",
        "invoiceNotes"

    ];


    fields.forEach(
        (id) => {

            const element =
                $(id);

            if (element) {
                element.value = "";
            }

        }
    );


    const selects = [

        "sellerState",
        "buyerState",
        "placeOfSupply"

    ];


    selects.forEach(
        (id) => {

            const element =
                $(id);

            if (element) {
                element.value = "";
            }

        }
    );

}


/* =========================================================
   PDF HANDLER
========================================================= */

async function handleDownloadPDF() {

    showToast(
        "PDF module will generate the invoice here.",
        "warning"
    );

}


/* =========================================================
   PREVIEW HANDLER
========================================================= */

function handlePreview() {

    const modal =
        $("invoicePreviewModal");

    if (!modal) {
        return;
    }


    modal.classList.remove(
        "hidden"
    );


    document.body.style.overflow =
        "hidden";


    const container =
        $("invoicePreviewContainer");


    if (container) {

        container.innerHTML = `

            <div
                class="flex min-h-[500px] items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm"
            >

                <div>

                    <div
                        class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 font-black text-brand-600"
                    >
                        GST
                    </div>

                    <h3
                        class="mt-4 font-black text-slate-900"
                    >
                        Invoice Preview
                    </h3>

                    <p
                        class="mt-2 text-sm text-slate-500"
                    >
                        Professional invoice template will be rendered here.
                    </p>

                </div>

            </div>

        `;

    }

}


/* =========================================================
   CLOSE PREVIEW
========================================================= */

function closePreview() {

    const modal =
        $("invoicePreviewModal");

    if (!modal) {
        return;
    }


    modal.classList.add(
        "hidden"
    );


    document.body.style.overflow =
        "";

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const container =
        $("toastContainer");

    if (!container) {
        return;
    }


    const toast =
        document.createElement("div");

    toast.className =
        `toast toast-${type}`;


    let icon = "✓";

    if (type === "error") {
        icon = "!";
    }

    if (type === "warning") {
        icon = "!";
    }


    toast.innerHTML = `

        <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl
            ${
                type === "success"
                    ? "bg-emerald-100 text-emerald-700"
                    : type === "error"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
            }
            font-black"
        >
            ${icon}
        </div>


        <div class="min-w-0">

            <p
                class="text-sm font-bold text-slate-800"
            >
                ${escapeHTML(message)}
            </p>

        </div>

    `;


    container.appendChild(
        toast
    );


    window.setTimeout(
        () => {

            toast.style.animation =
                "toastOut 180ms ease forwards";

            window.setTimeout(
                () => toast.remove(),
                180
            );

        },
        2800
    );

}


/* =========================================================
   NUMBER SANITIZER
========================================================= */

function sanitizeNumber(value) {

    const number =
        Number.parseFloat(value);

    if (
        !Number.isFinite(number) ||
        number < 0
    ) {
        return 0;
    }


    return number;

}


/* =========================================================
   CURRENCY FORMAT
========================================================= */

function formatCurrency(value) {

    const amount =
        Number.isFinite(
            Number(value)
        )
            ? Number(value)
            : 0;


    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(amount);

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   DEBUG ACCESS
   Browser console में state देख सकते हैं
========================================================= */

window.GSTBillMaker = {

    getState() {
        return structuredClone(state);
    },

    addItem,

    deleteItem,

    calculateItemAmount,

    updateApplication

};


/* =========================================================
   END OF APP.JS
========================================================= */
