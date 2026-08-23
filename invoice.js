/* =========================================================
   GST BILL MAKER
   Invoice HTML Generator
   File: invoice.js

   PURPOSE:
   - Professional GST invoice
   - Company logo
   - Seller details
   - Buyer details
   - Multiple contact details
   - Items
   - GST summary
   - Bank details
   - UPI details
   - UPI QR
   - Signature
   - PDF-friendly HTML
   - Preview
   - No Firebase data storage
========================================================= */

import { roundMoney } from "./gst.js";


/* =========================================================
   BASIC HELPERS
========================================================= */

const esc = (value) => {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

};


const safe = (value, fallback = "—") => {

    const text =
        String(value ?? "").trim();

    return text
        ? esc(text)
        : fallback;

};


const money = (value) => {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(Number(value) || 0);

};


/* =========================================================
   UPI PAYMENT URL
========================================================= */

function createUpiPaymentUrl({
    upiId = "",
    name = "",
    amount = 0
} = {}) {

    const pa =
        String(upiId || "").trim();

    if (!pa) {
        return "";
    }

    const params = new URLSearchParams();

    params.set("pa", pa);

    params.set(
        "pn",
        String(name || "Business")
    );

    if (Number(amount) > 0) {

        params.set(
            "am",
            roundMoney(amount).toFixed(2)
        );

    }

    params.set("cu", "INR");

    return `upi://pay?${params.toString()}`;

}


/* =========================================================
   QR IMAGE GENERATOR
   Uses QRCode library if available.
========================================================= */

async function generateQrDataUrl(text) {

    if (!text) {
        return "";
    }

    /*
       QRCode library loaded in index.html:
       qrcodejs
    */

    if (
        typeof window === "undefined" ||
        typeof window.QRCode !== "function"
    ) {

        return "";

    }


    return new Promise((resolve) => {

        try {

            const wrapper =
                document.createElement("div");

            wrapper.style.position = "fixed";
            wrapper.style.left = "-100000px";
            wrapper.style.top = "0";
            wrapper.style.width = "160px";
            wrapper.style.height = "160px";
            wrapper.style.background = "#ffffff";

            document.body.appendChild(wrapper);


            new window.QRCode(
                wrapper,
                {
                    text,
                    width: 150,
                    height: 150,
                    correctLevel:
                        window.QRCode.CorrectLevel
                            ? window.QRCode.CorrectLevel.M
                            : 0
                }
            );


            setTimeout(() => {

                const canvas =
                    wrapper.querySelector("canvas");

                const image =
                    wrapper.querySelector("img");


                let dataUrl = "";


                if (canvas) {

                    try {

                        dataUrl =
                            canvas.toDataURL(
                                "image/png"
                            );

                    } catch (error) {

                        console.error(
                            "QR canvas error:",
                            error
                        );

                    }

                }


                if (!dataUrl && image) {

                    dataUrl =
                        image.src || "";

                }


                wrapper.remove();

                resolve(dataUrl);

            }, 50);


        } catch (error) {

            console.error(
                "QR generation failed:",
                error
            );

            resolve("");

        }

    });

}


/* =========================================================
   BUILD ITEM ROWS
========================================================= */

function buildItemRows(items = []) {

    if (!Array.isArray(items) || !items.length) {

        return `
            <tr>
                <td
                    colspan="8"
                    class="empty-row"
                >
                    No items added.
                </td>
            </tr>
        `;

    }


    return items.map((item, index) => {

        const quantity =
            Number(item.qty) || 0;

        const rate =
            Number(item.rate) || 0;

        const taxable =
            Number(item.taxableAmount) ||
            roundMoney(quantity * rate);

        const gstRate =
            Number(item.gstRate ?? item.gst) || 0;

        const total =
            Number(item.total) ||
            roundMoney(
                taxable +
                Number(item.gstAmount || 0)
            );


        return `
            <tr>

                <td class="center">
                    ${index + 1}
                </td>

                <td>
                    <div class="item-name">
                        ${safe(
                            item.name,
                            "Product / Service"
                        )}
                    </div>
                </td>

                <td>
                    ${safe(item.hsn)}
                </td>

                <td class="right">
                    ${quantity}
                </td>

                <td class="right">
                    ${money(rate)}
                </td>

                <td class="right">
                    ${money(taxable)}
                </td>

                <td class="right">
                    ${gstRate}%
                </td>

                <td class="right total-cell">
                    ${money(total)}
                </td>

            </tr>
        `;

    }).join("");

}


/* =========================================================
   SELLER DETAILS
========================================================= */

function buildSellerBlock(seller = {}) {

    return `

        <div class="party-label">
            BILL FROM / SELLER
        </div>

        <div class="party-name">
            ${safe(
                seller.name,
                "Business Name"
            )}
        </div>

        <div class="party-line">
            ${safe(
                seller.address,
                "Address not provided"
            )}
        </div>

        <div class="party-line">

            <strong>GSTIN:</strong>
            ${safe(seller.gstin)}

        </div>

        <div class="party-line">

            <strong>State:</strong>
            ${safe(seller.state)}

        </div>

        <div class="party-line">

            <strong>Phone:</strong>
            ${safe(seller.phone)}

        </div>

        <div class="party-line">

            <strong>Email:</strong>
            ${safe(seller.email)}

        </div>

    `;

}


/* =========================================================
   BUYER DETAILS
========================================================= */

function buildBuyerBlock(buyer = {}) {

    return `

        <div class="party-label">
            BILL TO / BUYER
        </div>

        <div class="party-name">
            ${safe(
                buyer.name,
                "Customer Name"
            )}
        </div>

        <div class="party-line">
            ${safe(
                buyer.address,
                "Address not provided"
            )}
        </div>

        <div class="party-line">

            <strong>GSTIN:</strong>
            ${safe(buyer.gstin)}

        </div>

        <div class="party-line">

            <strong>State:</strong>
            ${safe(buyer.state)}

        </div>

        <div class="party-line">

            <strong>Phone:</strong>
            ${safe(buyer.phone)}

        </div>

        <div class="party-line">

            <strong>Email:</strong>
            ${safe(buyer.email)}

        </div>

    `;

}


/* =========================================================
   PAYMENT DETAILS
========================================================= */

function buildPaymentDetails(data = {}) {

    const {
        upiId = "",
        accountName = "",
        bankName = "",
        accountNumber = "",
        ifsc = "",
        paymentNote = ""
    } = data;


    const hasPaymentData =
        upiId ||
        accountName ||
        bankName ||
        accountNumber ||
        ifsc ||
        paymentNote;


    if (!hasPaymentData) {

        return "";

    }


    return `

        <div class="payment-card">

            <div class="section-label">
                PAYMENT DETAILS
            </div>

            <div class="payment-grid">

                <div>

                    ${
                        upiId
                            ? `
                                <div class="payment-line">
                                    <strong>UPI ID:</strong>
                                    ${safe(upiId)}
                                </div>
                              `
                            : ""
                    }

                    ${
                        accountName
                            ? `
                                <div class="payment-line">
                                    <strong>Account Holder:</strong>
                                    ${safe(accountName)}
                                </div>
                              `
                            : ""
                    }

                    ${
                        bankName
                            ? `
                                <div class="payment-line">
                                    <strong>Bank:</strong>
                                    ${safe(bankName)}
                                </div>
                              `
                            : ""
                    }

                    ${
                        accountNumber
                            ? `
                                <div class="payment-line">
                                    <strong>Account Number:</strong>
                                    ${safe(accountNumber)}
                                </div>
                              `
                            : ""
                    }

                    ${
                        ifsc
                            ? `
                                <div class="payment-line">
                                    <strong>IFSC:</strong>
                                    ${safe(ifsc)}
                                </div>
                              `
                            : ""
                    }

                    ${
                        paymentNote
                            ? `
                                <div class="payment-note">
                                    ${safe(paymentNote)}
                                </div>
                              `
                            : ""
                    }

                </div>

                <div class="qr-area">

                    ${
                        data.qrDataUrl
                            ? `
                                <img
                                    class="qr-image"
                                    src="${data.qrDataUrl}"
                                    alt="UPI QR Code"
                                >

                                <div class="qr-caption">
                                    Scan to Pay
                                </div>
                              `
                            : `
                                <div class="qr-placeholder">
                                    QR
                                </div>
                              `
                    }

                </div>

            </div>

        </div>

    `;

}


/* =========================================================
   GST SUMMARY
========================================================= */

function buildSummary(result = {}) {

    const taxable =
        Number(result.taxableAmount) || 0;

    const cgst =
        Number(result.cgst) || 0;

    const sgst =
        Number(result.sgst) || 0;

    const igst =
        Number(result.igst) || 0;

    const totalGST =
        Number(result.totalGST) || 0;

    const grandTotal =
        Number(result.grandTotal) || 0;


    return `

        <div class="summary-card">

            <div class="summary-row">

                <span>
                    Taxable Amount
                </span>

                <strong>
                    ${money(taxable)}
                </strong>

            </div>

            ${
                cgst
                    ? `
                        <div class="summary-row">
                            <span>CGST</span>
                            <strong>
                                ${money(cgst)}
                            </strong>
                        </div>
                      `
                    : ""
            }

            ${
                sgst
                    ? `
                        <div class="summary-row">
                            <span>SGST</span>
                            <strong>
                                ${money(sgst)}
                            </strong>
                        </div>
                      `
                    : ""
            }

            ${
                igst
                    ? `
                        <div class="summary-row">
                            <span>IGST</span>
                            <strong>
                                ${money(igst)}
                            </strong>
                        </div>
                      `
                    : ""
            }

            <div class="summary-row">

                <span>
                    Total GST
                </span>

                <strong>
                    ${money(totalGST)}
                </strong>

            </div>

            <div class="grand-total">

                <span>
                    GRAND TOTAL
                </span>

                <strong>
                    ${money(grandTotal)}
                </strong>

            </div>

        </div>

    `;

}


/* =========================================================
   BUILD INVOICE HTML
========================================================= */

export async function buildInvoiceHTML(data = {}) {

    const {
        invoiceNumber = "",
        invoiceDate = "",
        dueDate = "",
        paymentTerms = "",
        placeOfSupply = "",
        seller = {},
        buyer = {},
        items = [],
        result = {},
        notes = "",
        signatoryName = "",
        logoData = "",
        signatureData = ""
    } = data;


    /* -------------------------------------------------------
       QR
    ------------------------------------------------------- */

    let qrDataUrl = "";

    if (data.upiId) {

        const upiUrl =
            createUpiPaymentUrl({
                upiId: data.upiId,
                name: seller.name,
                amount: result.grandTotal
            });


        qrDataUrl =
            await generateQrDataUrl(
                upiUrl
            );

    }


    const invoiceData = {

        ...data,

        qrDataUrl

    };


    /* -------------------------------------------------------
       Logo
    ------------------------------------------------------- */

    const logo =
        logoData
            ? `
                <img
                    class="company-logo"
                    src="${logoData}"
                    alt="Company Logo"
                >
              `
            : `
                <div class="logo-placeholder">
                    GB
                </div>
              `;


    /* -------------------------------------------------------
       Signature
    ------------------------------------------------------- */

    const signature =
        signatureData
            ? `
                <img
                    class="signature-image"
                    src="${signatureData}"
                    alt="Authorized Signature"
                >
              `
            : "";


    const itemRows =
        buildItemRows(items);


    const sellerHtml =
        buildSellerBlock(seller);


    const buyerHtml =
        buildBuyerBlock(buyer);


    const paymentHtml =
        buildPaymentDetails(
            invoiceData
        );


    const summaryHtml =
        buildSummary(result);


    const taxType =
        result.isSameState
            ? "CGST + SGST"
            : result.isInterState
                ? "IGST"
                : "GST";


    return `

<!doctype html>

<html lang="en">

<head>

<meta charset="utf-8">

<style>

* {
    box-sizing: border-box;
}

html,
body {
    margin: 0;
    padding: 0;
}

body {

    background: #eef2f7;

    color: #172033;

    font-family:
        Arial,
        Helvetica,
        sans-serif;

    font-size: 10px;

}

.page {

    width: 794px;

    min-height: 1123px;

    margin: 0 auto;

    padding: 32px;

    background: #ffffff;

}

.top-header {

    display: flex;

    justify-content: space-between;

    align-items: flex-start;

    gap: 20px;

    padding-bottom: 18px;

    border-bottom:
        3px solid #312e81;

}

.brand {

    display: flex;

    align-items: center;

    gap: 13px;

}

.company-logo,
.logo-placeholder {

    width: 68px;

    height: 68px;

    flex-shrink: 0;

    border-radius: 10px;

}

.company-logo {

    object-fit: contain;

}

.logo-placeholder {

    display: flex;

    align-items: center;

    justify-content: center;

    background: #312e81;

    color: #ffffff;

    font-size: 20px;

    font-weight: 800;

}

.company-name {

    margin: 0;

    font-size: 21px;

    font-weight: 800;

    color: #312e81;

}

.company-subtitle {

    margin-top: 4px;

    color: #64748b;

    font-size: 9px;

    letter-spacing: 1px;

}

.invoice-title {

    text-align: right;

}

.invoice-title h1 {

    margin: 0;

    font-size: 25px;

    color: #1e1b4b;

}

.invoice-meta {

    margin-top: 7px;

    line-height: 1.7;

    color: #475569;

}

.invoice-meta b {

    color: #172033;

}

.parties {

    display: grid;

    grid-template-columns: 1fr 1fr;

    margin-top: 18px;

    border:
        1px solid #dbe3ef;

}

.party {

    min-height: 150px;

    padding: 14px;

}

.party + .party {

    border-left:
        1px solid #dbe3ef;

}

.party-label,
.section-label {

    margin-bottom: 8px;

    color: #6366f1;

    font-size: 8px;

    font-weight: 800;

    letter-spacing: 1px;

}

.party-name {

    margin-bottom: 7px;

    font-size: 14px;

    font-weight: 800;

    color: #172033;

}

.party-line {

    margin-top: 5px;

    line-height: 1.45;

}

.info-grid {

    display: grid;

    grid-template-columns:
        repeat(3, 1fr);

    margin-top: 14px;

    border:
        1px solid #dbe3ef;

}

.info-cell {

    padding: 10px;

    min-height: 50px;

}

.info-cell + .info-cell {

    border-left:
        1px solid #dbe3ef;

}

.info-label {

    margin-bottom: 4px;

    color: #64748b;

    font-size: 8px;

    text-transform: uppercase;

    font-weight: 700;

}

.items {

    width: 100%;

    margin-top: 18px;

    border-collapse: collapse;

}

.items th {

    padding: 9px 6px;

    background: #1e1b4b;

    color: #ffffff;

    font-size: 8px;

    text-align: left;

}

.items td {

    padding: 8px 6px;

    border-bottom:
        1px solid #e2e8f0;

    vertical-align: top;

}

.items tr:nth-child(even) {

    background: #f8fafc;

}

.item-name {

    font-weight: 700;

}

.center {

    text-align: center;

}

.right {

    text-align: right;

}

.total-cell {

    font-weight: 800;

}

.empty-row {

    padding: 30px !important;

    text-align: center;

    color: #64748b;

}

.bottom-section {

    display: grid;

    grid-template-columns:
        1fr 260px;

    gap: 18px;

    margin-top: 18px;

}

.notes-card {

    min-height: 150px;

    padding: 13px;

    border:
        1px solid #dbe3ef;

}

.notes-content {

    line-height: 1.65;

    white-space: pre-line;

}

.summary-card {

    padding: 13px;

    border:
        1px solid #dbe3ef;

}

.summary-row {

    display: flex;

    justify-content: space-between;

    gap: 10px;

    padding: 8px 0;

    border-bottom:
        1px solid #edf2f7;

}

.grand-total {

    display: flex;

    justify-content: space-between;

    gap: 10px;

    margin:
        13px -13px -13px;

    padding: 13px;

    background: #312e81;

    color: #ffffff;

    font-size: 13px;

    font-weight: 800;

}

.payment-card {

    margin-top: 18px;

    padding: 13px;

    border:
        1px solid #dbe3ef;

}

.payment-grid {

    display: grid;

    grid-template-columns: 1fr 150px;

    gap: 15px;

    align-items: center;

}

.payment-line {

    margin-top: 6px;

    line-height: 1.45;

}

.payment-note {

    margin-top: 9px;

    color: #64748b;

    line-height: 1.5;

}

.qr-area {

    text-align: center;

}

.qr-image {

    width: 120px;

    height: 120px;

    object-fit: contain;

    display: block;

    margin: auto;

}

.qr-placeholder {

    width: 120px;

    height: 120px;

    margin: auto;

    display: flex;

    align-items: center;

    justify-content: center;

    border:
        1px dashed #94a3b8;

    color: #94a3b8;

    font-size: 12px;

}

.qr-caption {

    margin-top: 5px;

    color: #475569;

    font-size: 8px;

    font-weight: 700;

}

.signature-section {

    margin-top: 45px;

    text-align: right;

}

.signature-image {

    display: block;

    max-width: 170px;

    max-height: 60px;

    margin-left: auto;

    margin-bottom: 6px;

    object-fit: contain;

}

.signature-name {

    font-weight: 800;

}

.signature-business {

    margin-top: 4px;

    color: #64748b;

}

.footer {

    margin-top: 28px;

    padding-top: 9px;

    border-top:
        1px solid #dbe3ef;

    text-align: center;

    color: #94a3b8;

    font-size: 8px;

}

</style>

</head>

<body>

<div class="page">


    <!-- HEADER -->

    <div class="top-header">

        <div class="brand">

            ${logo}

            <div>

                <h2 class="company-name">
                    ${safe(
                        seller.name,
                        "YOUR BUSINESS"
                    )}
                </h2>

                <div class="company-subtitle">
                    GST INVOICE
                </div>

            </div>

        </div>


        <div class="invoice-title">

            <h1>
                TAX INVOICE
            </h1>

            <div class="invoice-meta">

                Invoice No:
                <b>
                    ${safe(
                        invoiceNumber,
                        "INV-0001"
                    )}
                </b>

                <br>

                Invoice Date:
                <b>
                    ${safe(invoiceDate)}
                </b>

                ${
                    dueDate
                        ? `
                            <br>
                            Due Date:
                            <b>
                                ${safe(dueDate)}
                            </b>
                          `
                        : ""
                }

            </div>

        </div>

    </div>


    <!-- SELLER / BUYER -->

    <div class="parties">

        <div class="party">

            ${sellerHtml}

        </div>


        <div class="party">

            ${buyerHtml}

        </div>

    </div>


    <!-- INFORMATION -->

    <div class="info-grid">

        <div class="info-cell">

            <div class="info-label">
                Place of Supply
            </div>

            <b>
                ${safe(
                    placeOfSupply ||
                    buyer.state
                )}
            </b>

        </div>


        <div class="info-cell">

            <div class="info-label">
                Tax Type
            </div>

            <b>
                ${taxType}
            </b>

        </div>


        <div class="info-cell">

            <div class="info-label">
                Payment Terms
            </div>

            <b>
                ${safe(
                    paymentTerms
                )}
            </b>

        </div>

    </div>


    <!-- ITEMS -->

    <table class="items">

        <thead>

            <tr>

                <th>
                    #
                </th>

                <th>
                    Item Description
                </th>

                <th>
                    HSN/SAC
                </th>

                <th class="right">
                    Qty
                </th>

                <th class="right">
                    Rate
                </th>

                <th class="right">
                    Taxable
                </th>

                <th class="right">
                    GST
                </th>

                <th class="right">
                    Amount
                </th>

            </tr>

        </thead>


        <tbody>

            ${itemRows}

        </tbody>

    </table>


    <!-- TOTALS -->

    <div class="bottom-section">


        <div class="notes-card">

            <div class="section-label">
                NOTES / TERMS
            </div>

            <div class="notes-content">

                ${safe(
                    notes,
                    "Thank you for your business."
                )}

            </div>

        </div>


        ${summaryHtml}

    </div>


    <!-- PAYMENT -->

    ${paymentHtml}


    <!-- SIGNATURE -->

    <div class="signature-section">

        ${signature}

        <div class="signature-name">

            ${safe(
                signatoryName,
                "Authorized Signatory"
            )}

        </div>

        <div class="signature-business">

            For
            ${safe(
                seller.name,
                "Authorized Business"
            )}

        </div>

    </div>


    <!-- FOOTER -->

    <div class="footer">

        This is a computer-generated tax invoice.

        Invoice information, customer information,
        logo, signature and payment details are supplied
        by the user for generating this document.

    </div>


</div>

</body>

</html>

    `;

}


/* =========================================================
   PREVIEW
========================================================= */

export async function renderInvoicePreview(
    container,
    data = {}
) {

    if (!container) {

        throw new Error(
            "Preview container not found."
        );

    }


    container.innerHTML = "";


    const loading =
        document.createElement("div");

    loading.style.padding = "30px";

    loading.style.textAlign = "center";

    loading.textContent =
        "Preparing invoice preview...";

    container.appendChild(loading);


    try {

        const html =
            await buildInvoiceHTML(data);


        container.innerHTML = "";


        const frame =
            document.createElement("iframe");


        frame.style.width = "100%";

        frame.style.height = "820px";

        frame.style.border = "0";

        frame.style.background =
            "#eef2f7";


        container.appendChild(frame);


        const doc =
            frame.contentDocument ||
            frame.contentWindow.document;


        doc.open();

        doc.write(html);

        doc.close();


    } catch (error) {

        console.error(
            "Invoice preview error:",
            error
        );


        container.innerHTML = `

            <div
                style="
                    padding:30px;
                    text-align:center;
                    color:#b91c1c;
                "
            >

                Invoice preview तैयार नहीं हो सका।

            </div>

        `;

        throw error;

    }

}


/* =========================================================
   END OF INVOICE.JS
========================================================= */
