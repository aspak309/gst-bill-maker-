/* =========================================================
   GST BILL MAKER
   Main Application Controller
   File: app.js

   Connected Modules:
   - gst.js
   - invoice.js
   - pdf.js
========================================================= */


/* =========================================================
   IMPORT MODULES
========================================================= */

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
   DOM HELPERS
========================================================= */

const $ = (id) =>
    document.getElementById(id);

const qs = (
    selector,
    parent = document
) =>
    parent.querySelector(selector);

const qsa = (
    selector,
    parent = document
) =>
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

    const input =
        $("invoiceDate");

    if (!input) {
        return;
    }


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            today.getDate()
        ).padStart(2, "0");


    const date =
        `${year}-${month}-${day}`;


    input.value =
        date;


    state.invoiceDate =
        date;

}


/* =========================================================
   DEFAULT INVOICE NUMBER
========================================================= */

function setDefaultInvoiceNumber() {

    const input =
        $("invoiceNumber");

    if (!input) {
        return;
    }


    const counter =
        Number(
            localStorage.getItem(
                "gstBillInvoiceCounter"
            )
        ) || 1;


    const invoiceNumber =
        `INV-${String(counter).padStart(4, "0")}`;


    input.value =
        invoiceNumber;


    state.invoiceNumber =
        invoiceNumber;


    updateInvoiceNumberPreview();

}


/* =========================================================
   POPULATE STATE DROPDOWNS
========================================================= */

function populateStateSelects() {

    const selects = [

        $("sellerState"),

        $("buyerState"),

        $("placeOfSupply")

    ];


    selects.forEach(
        (select) => {

            if (!select) {
                return;
            }


            /*
             * Existing options को duplicate
             * होने से बचाने के लिए.
             */

            const existingValues =
                new Set(
                    [...select.options]
                        .map(
                            option =>
                                option.value
                        )
                );


            const fragment =
                document.createDocumentFragment();


            INDIAN_STATES.forEach(
                (stateName) => {

                    if (
                        existingValues.has(
                            stateName
                        )
                    ) {
                        return;
                    }


                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        stateName;


                    option.textContent =
                        stateName;


                    fragment.appendChild(
                        option
                    );

                }
            );


            select.appendChild(
                fragment
            );

        }
    );

}


/* =========================================================
   EVENT BINDING
========================================================= */

function bindApplicationEvents() {


    /* -------------------------------------------------------
       ADD ITEM
    ------------------------------------------------------- */

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


    /* -------------------------------------------------------
       DELETE ITEM
    ------------------------------------------------------- */

    $("itemsBody")?.addEventListener(
        "click",
        handleItemTableClick
    );


    /* -------------------------------------------------------
       DOWNLOAD PDF
    ------------------------------------------------------- */

    $("downloadPdfBtn")?.addEventListener(
        "click",
        handleDownloadPDF
    );


    /* -------------------------------------------------------
       PREVIEW
    ------------------------------------------------------- */

    $("previewInvoiceBtn")?.addEventListener(
        "click",
        handlePreview
    );


    /* -------------------------------------------------------
       CLOSE PREVIEW
    ------------------------------------------------------- */

    $("closePreviewBtn")?.addEventListener(
        "click",
        closePreview
    );


    /* -------------------------------------------------------
       CLICK OUTSIDE PREVIEW
    ------------------------------------------------------- */

    $("invoicePreviewModal")?.addEventListener(
        "click",
        (event) => {

            const modal =
                $("invoicePreviewModal");


            if (
                event.target === modal
            ) {

                closePreview();

            }

        }
    );


    /* -------------------------------------------------------
       NEW INVOICE
    ------------------------------------------------------- */

    $("clearInvoiceBtn")?.addEventListener(
        "click",
        createNewInvoice
    );


    /* -------------------------------------------------------
       ALL INPUTS
    ------------------------------------------------------- */

    document.addEventListener(
        "input",
        handleInputChange
    );


    document.addEventListener(
        "change",
        handleInputChange
    );

}


/* =========================================================
   HANDLE FORM INPUT
========================================================= */

function handleInputChange(event) {

    const element =
        event.target;


    if (!element) {
        return;
    }


    /* -------------------------------------------------------
       ITEM INPUT
    ------------------------------------------------------- */

    if (
        element.closest("#itemsBody")
    ) {

        handleItemInput(
            element
        );

        updateApplication();

        return;

    }


    /* -------------------------------------------------------
       SELLER
    ------------------------------------------------------- */

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


        /* ---------------------------------------------------
           BUYER
        --------------------------------------------------- */

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


        /* ---------------------------------------------------
           INVOICE
        --------------------------------------------------- */

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
   HANDLE ITEM INPUT
========================================================= */

function handleItemInput(element) {

    const row =
        element.closest(
            "[data-item-id]"
        );


    if (!row) {
        return;
    }


    const itemId =
        Number(
            row.dataset.itemId
        );


    const item =
        state.items.find(
            entry =>
                entry.id === itemId
        );


    if (!item) {
        return;
    }


    switch (
        element.dataset.field
    ) {

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


    updateItemAmount(
        row,
        item
    );

}


/* =========================================================
   ADD ITEM
========================================================= */

function addItem() {

    const item = {

        id:
            state.nextItemId++,

        name: "",

        hsn: "",

        qty: 1,

        rate: 0,

        gst: 18

    };


    state.items.push(
        item
    );


    renderItems();

    updateApplication();

}


/* =========================================================
   DELETE ITEM
========================================================= */

function deleteItem(itemId) {

    if (
        state.items.length <= 1
    ) {

        showToast(
            "At least one item is required.",
            "warning"
        );

        return;

    }


    state.items =
        state.items.filter(
            item =>
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

    const button =
        event.target.closest(
            "[data-delete-item]"
        );


    if (!button) {
        return;
    }


    const itemId =
        Number(
            button.dataset.deleteItem
        );


    deleteItem(
        itemId
    );

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


    body.innerHTML =
        "";


    if (
        state.items.length === 0
    ) {

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

            fragment.appendChild(
                createItemRow(
                    item,
                    index
                )
            );

        }
    );


    body.appendChild(
        fragment
    );

}


/* =========================================================
   CREATE ITEM ROW
========================================================= */

function createItemRow(
    item,
    index
) {

    const row =
        document.createElement(
            "tr"
        );


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
                    rate => `

                        <option
                            value="${rate}"
                            ${
                                Number(item.gst) === rate
                                    ? "selected"
                                    : ""
                            }
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

function updateItemAmount(
    row,
    item
) {

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
            calculateItemAmount(
                item
            )
        );

}


/* =========================================================
   CALCULATE ITEM AMOUNT
========================================================= */

function calculateItemAmount(
    item
) {

    const qty =
        sanitizeNumber(
            item.qty
        );


    const rate =
        sanitizeNumber(
            item.rate
        );


    return qty * rate;

}


/* =========================================================
   GET CURRENT INVOICE DATA
========================================================= */

function getInvoiceData() {

    const result =
        calculateInvoiceGST({

            items:
                state.items,

            sellerState:
                state.seller.state,

            buyerState:
                state.buyer.state

        });


    return {

        invoiceNumber:
            state.invoiceNumber,

        invoiceDate:
            state.invoiceDate,

        placeOfSupply:
            state.placeOfSupply,

        seller:
            {
                ...state.seller
            },

        buyer:
            {
                ...state.buyer
            },

        items:
            result.calculatedItems,

        result,

        notes:
            state.notes

    };

}


/* =========================================================
   UPDATE APPLICATION
========================================================= */

function updateApplication() {

    const result =
        calculateInvoiceGST({

            items:
                state.items,

            sellerState:
                state.seller.state,

            buyerState:
                state.buyer.state

        });


    updateSummary(
        result
    );


    updateTaxMode(
        result
    );

}


/* =========================================================
   UPDATE SUMMARY
========================================================= */

function updateSummary(
    result
) {

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
   TAX MODE MESSAGE
========================================================= */

function updateTaxMode(
    result
) {

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
            "Same-state transaction detected. GST will be split into CGST and SGST.";

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
   DOWNLOAD PDF
========================================================= */

async function handleDownloadPDF() {

    try {

        const invoiceData =
            getInvoiceData();


        const html =
            buildInvoiceHTML(
                invoiceData
            );


        showToast(
            "PDF तैयार हो रहा है...",
            "success"
        );


        await generateInvoicePDF({

            html,

            invoiceNumber:
                state.invoiceNumber ||
                "INV-0001"

        });


        showToast(
            "PDF successfully downloaded.",
            "success"
        );


    } catch (error) {

        console.error(
            "PDF generation error:",
            error
        );


        showToast(
            "PDF generate नहीं हो पाया.",
            "error"
        );

    }

}


/* =========================================================
   INVOICE PREVIEW
========================================================= */

function handlePreview() {

    const modal =
        $("invoicePreviewModal");


    const container =
        $("invoicePreviewContainer");


    if (!modal || !container) {

        showToast(
            "Preview section नहीं मिला.",
            "error"
        );

        return;

    }


    const invoiceData =
        getInvoiceData();


    renderInvoicePreview(
        container,
        invoiceData
    );


    modal.classList.remove(
        "hidden"
    );


    document.body.style.overflow =
        "hidden";

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


    /* -------------------------------------------------------
       Increase invoice counter
    ------------------------------------------------------- */

    const currentCounter =
        Number(
            localStorage.getItem(
                "gstBillInvoiceCounter"
            )
        ) || 1;


    localStorage.setItem(
        "gstBillInvoiceCounter",
        String(
            currentCounter + 1
        )
    );


    /* -------------------------------------------------------
       Reset state
    ------------------------------------------------------- */

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


    /* -------------------------------------------------------
       Clear form
    ------------------------------------------------------- */

    clearFormFields();


    /* -------------------------------------------------------
       Reinitialize
    ------------------------------------------------------- */

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
   CLEAR FORM FIELDS
========================================================= */

function clearFormFields() {

    const inputs = [

        "sellerName",

        "sellerAddress",

        "sellerGSTIN",

        "buyerName",

        "buyerAddress",

        "buyerGSTIN",

        "invoiceNotes"

    ];


    inputs.forEach(
        id => {

            const element =
                $(id);


            if (element) {

                element.value =
                    "";

            }

        }
    );


    const selects = [

        "sellerState",

        "buyerState",

        "placeOfSupply"

    ];


    selects.forEach(
        id => {

            const element =
                $(id);


            if (element) {

                element.value =
                    "";

            }

        }
    );

}


/* =========================================================
   TOAST SYSTEM
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const container =
        $("toastContainer");


    if (!container) {

        console.log(
            message
        );

        return;

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast toast-${type}`;


    let icon =
        "✓";


    if (
        type === "error"
    ) {

        icon =
            "!";

    }


    if (
        type === "warning"
    ) {

        icon =
            "!";

    }


    toast.innerHTML = `

        <div
            class="
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-xl
                font-black

                ${
                    type === "success"
                        ? "bg-emerald-100 text-emerald-700"
                        : type === "error"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                }
            "
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
                () => {

                    toast.remove();

                },
                180
            );

        },
        2800
    );

}


/* =========================================================
   NUMBER SANITIZER
========================================================= */

function sanitizeNumber(
    value
) {

    const number =
        Number.parseFloat(
            value
        );


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

function formatCurrency(
    value
) {

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
    ).format(
        amount
    );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(
    value
) {

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
   GLOBAL DEBUG ACCESS
========================================================= */

window.GSTBillMaker = {

    getState() {

        return structuredClone(
            state
        );

    },


    getInvoiceData,


    addItem,


    deleteItem,


    calculateItemAmount,


    updateApplication,


    preview() {

        handlePreview();

    },


    downloadPDF() {

        return handleDownloadPDF();

    }

};


/* =========================================================
   END OF APP.JS
========================================================= */
