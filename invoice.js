/* =========================================================
   GST BILL MAKER
   Invoice Template & Preview Module
   File: invoice.js
========================================================= */


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
   CURRENCY
========================================================= */

function formatCurrency(value) {

    const amount =
        Number.isFinite(Number(value))
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
   DATE FORMAT
========================================================= */

function formatInvoiceDate(value) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return escapeHTML(value);
    }

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(date);

}


/* =========================================================
   SAFE VALUE
========================================================= */

function safe(value, fallback = "—") {

    const text =
        String(value ?? "").trim();

    return text
        ? escapeHTML(text)
        : fallback;

}


/* =========================================================
   BUILD SELLER / BUYER BOX
========================================================= */

function buildPartyBox(
    title,
    party
) {

    return `

        <div class="invoice-party">

            <div class="invoice-party-title">
                ${title}
            </div>

            <div class="invoice-party-name">
                ${safe(party?.name, "Not Provided")}
            </div>

            <div class="invoice-party-address">
                ${safe(party?.address, "Address not provided")}
            </div>

            <div class="invoice-party-row">
                <strong>GSTIN:</strong>
                <span>${safe(party?.gstin)}</span>
            </div>

            <div class="invoice-party-row">
                <strong>State:</strong>
                <span>${safe(party?.state)}</span>
            </div>

        </div>

    `;

}


/* =========================================================
   BUILD ITEMS TABLE
========================================================= */

function buildItemsTable(
    items = []
) {

    if (!Array.isArray(items) || items.length === 0) {

        return `

            <div class="invoice-empty-items">
                No items added to this invoice.
            </div>

        `;

    }


    const rows =
        items.map(
            (item, index) => {

                const qty =
                    Number(item.qty) || 0;

                const rate =
                    Number(item.rate) || 0;

                const gst =
                    Number(item.gst) || 0;

                const taxable =
                    Number.isFinite(
                        Number(item.taxableAmount)
                    )
                        ? Number(item.taxableAmount)
                        : qty * rate;

                const total =
                    Number.isFinite(
                        Number(item.total)
                    )
                        ? Number(item.total)
                        : taxable +
                          (
                              taxable *
                              gst /
                              100
                          );


                return `

                    <tr>

                        <td class="center">
                            ${index + 1}
                        </td>

                        <td>
                            <strong>
                                ${safe(
                                    item.name,
                                    "Product / Service"
                                )}
                            </strong>
                        </td>

                        <td class="center">
                            ${safe(item.hsn)}
                        </td>

                        <td class="right">
                            ${qty}
                        </td>

                        <td class="right">
                            ${formatCurrency(rate)}
                        </td>

                        <td class="right">
                            ${formatCurrency(taxable)}
                        </td>

                        <td class="center">
                            ${gst}%
                        </td>

                        <td class="right bold">
                            ${formatCurrency(total)}
                        </td>

                    </tr>

                `;

            }
        ).join("");


    return `

        <table class="invoice-items-table">

            <thead>

                <tr>

                    <th class="center">#</th>

                    <th>Item Description</th>

                    <th class="center">HSN/SAC</th>

                    <th class="right">Qty</th>

                    <th class="right">Rate</th>

                    <th class="right">Taxable</th>

                    <th class="center">GST</th>

                    <th class="right">Amount</th>

                </tr>

            </thead>

            <tbody>

                ${rows}

            </tbody>

        </table>

    `;

}


/* =========================================================
   BUILD TAX SUMMARY
========================================================= */

function buildTaxSummary(result) {

    const cgst =
        Number(result?.cgst) || 0;

    const sgst =
        Number(result?.sgst) || 0;

    const igst =
        Number(result?.igst) || 0;

    const taxable =
        Number(result?.taxableAmount) || 0;

    const totalGST =
        Number(result?.totalGST) || 0;

    const grandTotal =
        Number(result?.grandTotal) || 0;


    return `

        <div class="invoice-summary">

            <div class="invoice-summary-row">

                <span>Taxable Amount</span>

                <strong>
                    ${formatCurrency(taxable)}
                </strong>

            </div>


            ${
                cgst > 0
                    ? `
                        <div class="invoice-summary-row">
                            <span>CGST</span>
                            <strong>
                                ${formatCurrency(cgst)}
                            </strong>
                        </div>
                    `
                    : ""
            }


            ${
                sgst > 0
                    ? `
                        <div class="invoice-summary-row">
                            <span>SGST</span>
                            <strong>
                                ${formatCurrency(sgst)}
                            </strong>
                        </div>
                    `
                    : ""
            }


            ${
                igst > 0
                    ? `
                        <div class="invoice-summary-row">
                            <span>IGST</span>
                            <strong>
                                ${formatCurrency(igst)}
                            </strong>
                        </div>
                    `
                    : ""
            }


            <div class="invoice-summary-row">

                <span>Total GST</span>

                <strong>
                    ${formatCurrency(totalGST)}
                </strong>

            </div>


            <div class="invoice-grand-total">

                <span>Grand Total</span>

                <strong>
                    ${formatCurrency(grandTotal)}
                </strong>

            </div>

        </div>

    `;

}


/* =========================================================
   BUILD COMPLETE INVOICE
========================================================= */

export function buildInvoiceHTML({
    invoiceNumber = "",
    invoiceDate = "",
    placeOfSupply = "",
    seller = {},
    buyer = {},
    items = [],
    result = {},
    notes = ""
} = {}) {


    const invoiceNo =
        safe(
            invoiceNumber,
            "INV-0001"
        );


    const date =
        formatInvoiceDate(
            invoiceDate
        );


    const supply =
        safe(
            placeOfSupply ||
            buyer.state,
            "—"
        );


    return `

<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<title>Tax Invoice ${invoiceNo}</title>

<style>

    * {
        box-sizing: border-box;
    }

    body {
        margin: 0;
        padding: 0;
        background: #eef2f7;
        color: #172033;
        font-family:
            Arial,
            Helvetica,
            sans-serif;
        font-size: 12px;
    }

    .invoice-page {
        width: 794px;
        min-height: 1123px;
        margin: 0 auto;
        background: #ffffff;
        padding: 38px;
    }

    .invoice-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 3px solid #312e81;
        padding-bottom: 22px;
    }

    .brand-name {
        font-size: 24px;
        font-weight: 900;
        color: #312e81;
        letter-spacing: -0.5px;
    }

    .brand-subtitle {
        margin-top: 5px;
        color: #64748b;
        font-size: 10px;
        letter-spacing: 1px;
        text-transform: uppercase;
    }

    .tax-invoice {
        text-align: right;
    }

    .tax-invoice-title {
        font-size: 25px;
        font-weight: 900;
        color: #111827;
        letter-spacing: 1px;
    }

    .tax-invoice-meta {
        margin-top: 8px;
        color: #64748b;
        line-height: 1.7;
    }

    .tax-invoice-meta strong {
        color: #111827;
    }

    .party-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        border: 1px solid #dbe3ef;
        margin-top: 24px;
    }

    .invoice-party {
        padding: 18px;
        min-height: 150px;
    }

    .invoice-party + .invoice-party {
        border-left: 1px solid #dbe3ef;
    }

    .invoice-party-title {
        color: #6366f1;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 1px;
        text-transform: uppercase;
        margin-bottom: 10px;
    }

    .invoice-party-name {
        font-size: 15px;
        font-weight: 900;
        color: #111827;
        margin-bottom: 7px;
    }

    .invoice-party-address {
        color: #64748b;
        line-height: 1.5;
        white-space: pre-line;
        min-height: 36px;
    }

    .invoice-party-row {
        display: flex;
        gap: 8px;
        margin-top: 8px;
        color: #475569;
    }

    .invoice-party-row strong {
        color: #111827;
        min-width: 45px;
    }

    .invoice-meta-grid {
        display: grid;
        grid-template-columns:
            repeat(3, 1fr);
        margin-top: 18px;
        border: 1px solid #dbe3ef;
    }

    .meta-box {
        padding: 12px 15px;
    }

    .meta-box + .meta-box {
        border-left: 1px solid #dbe3ef;
    }

    .meta-label {
        color: #64748b;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 5px;
    }

    .meta-value {
        font-weight: 800;
        color: #111827;
    }

    .items-section {
        margin-top: 25px;
    }

    .invoice-items-table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
    }

    .invoice-items-table th {
        background: #1e1b4b;
        color: #ffffff;
        padding: 10px 7px;
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: .4px;
    }

    .invoice-items-table td {
        border-bottom: 1px solid #e2e8f0;
        padding: 10px 7px;
        vertical-align: middle;
    }

    .invoice-items-table tbody tr:nth-child(even) {
        background: #f8fafc;
    }

    .invoice-items-table th:nth-child(1) {
        width: 5%;
    }

    .invoice-items-table th:nth-child(2) {
        width: 25%;
    }

    .invoice-items-table th:nth-child(3) {
        width: 12%;
    }

    .invoice-items-table th:nth-child(4) {
        width: 7%;
    }

    .invoice-items-table th:nth-child(5) {
        width: 12%;
    }

    .invoice-items-table th:nth-child(6) {
        width: 13%;
    }

    .invoice-items-table th:nth-child(7) {
        width: 8%;
    }

    .invoice-items-table th:nth-child(8) {
        width: 18%;
    }

    .center {
        text-align: center;
    }

    .right {
        text-align: right;
    }

    .bold {
        font-weight: 800;
    }

    .invoice-empty-items {
        padding: 25px;
        text-align: center;
        border: 1px solid #dbe3ef;
        color: #64748b;
    }

    .bottom-grid {
        display: grid;
        grid-template-columns: 1fr 290px;
        gap: 25px;
        margin-top: 25px;
    }

    .notes-box {
        border: 1px solid #dbe3ef;
        padding: 16px;
        min-height: 130px;
    }

    .section-label {
        color: #6366f1;
        font-size: 9px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 9px;
    }

    .notes-text {
        color: #64748b;
        white-space: pre-line;
        line-height: 1.6;
    }

    .invoice-summary {
        border: 1px solid #dbe3ef;
    }

    .invoice-summary-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 13px;
        border-bottom: 1px solid #edf2f7;
    }

    .invoice-summary-row span {
        color: #64748b;
    }

    .invoice-summary-row strong {
        color: #111827;
    }

    .invoice-grand-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 13px;
        background: #312e81;
        color: #ffffff;
        font-size: 15px;
        font-weight: 900;
    }

    .signatory {
        margin-top: 65px;
        display: flex;
        justify-content: flex-end;
    }

    .signatory-box {
        width: 220px;
        text-align: center;
    }

    .signature-space {
        height: 45px;
        border-bottom: 1px solid #94a3b8;
        margin-bottom: 9px;
    }

    .signatory-name {
        font-weight: 900;
        color: #111827;
    }

    .signatory-label {
        color: #64748b;
        font-size: 9px;
        margin-top: 4px;
        text-transform: uppercase;
    }

    .invoice-footer {
        margin-top: 45px;
        padding-top: 12px;
        border-top: 1px solid #dbe3ef;
        text-align: center;
        color: #94a3b8;
        font-size: 9px;
    }

    @media print {

        body {
            background: #ffffff;
        }

        .invoice-page {
            margin: 0;
        }

    }

</style>

</head>

<body>

<div class="invoice-page">


    <!-- HEADER -->

    <div class="invoice-header">

        <div>

            <div class="brand-name">
                ${safe(
                    seller.name,
                    "YOUR BUSINESS"
                )}
            </div>

            <div class="brand-subtitle">
                GST BILL MAKER
            </div>

        </div>


        <div class="tax-invoice">

            <div class="tax-invoice-title">
                TAX INVOICE
            </div>

            <div class="tax-invoice-meta">

                <div>
                    Invoice No:
                    <strong>${invoiceNo}</strong>
                </div>

                <div>
                    Invoice Date:
                    <strong>${date}</strong>
                </div>

            </div>

        </div>

    </div>


    <!-- SELLER / BUYER -->

    <div class="party-grid">

        ${buildPartyBox(
            "Bill From / Seller",
            seller
        )}

        ${buildPartyBox(
            "Bill To / Buyer",
            buyer
        )}

    </div>


    <!-- META -->

    <div class="invoice-meta-grid">

        <div class="meta-box">

            <div class="meta-label">
                Place of Supply
            </div>

            <div class="meta-value">
                ${supply}
            </div>

        </div>


        <div class="meta-box">

            <div class="meta-label">
                Tax Type
            </div>

            <div class="meta-value">

                ${
                    result?.isSameState
                        ? "CGST + SGST"
                        : result?.isInterState
                        ? "IGST"
                        : "GST"
                }

            </div>

        </div>


        <div class="meta-box">

            <div class="meta-label">
                Currency
            </div>

            <div class="meta-value">
                Indian Rupee (INR)
            </div>

        </div>

    </div>


    <!-- ITEMS -->

    <div class="items-section">

        ${buildItemsTable(items)}

    </div>


    <!-- BOTTOM -->

    <div class="bottom-grid">


        <div class="notes-box">

            <div class="section-label">
                Notes / Terms
            </div>

            <div class="notes-text">
                ${
                    safe(
                        notes,
                        "Thank you for your business."
                    )
                }
            </div>

        </div>


        ${buildTaxSummary(result)}

    </div>


    <!-- SIGNATURE -->

    <div class="signatory">

        <div class="signatory-box">

            <div class="signature-space"></div>

            <div class="signatory-name">
                Authorized Signatory
            </div>

            <div class="signatory-label">
                For ${safe(
                    seller.name,
                    "Authorized Business"
                )}
            </div>

        </div>

    </div>


    <!-- FOOTER -->

    <div class="invoice-footer">

        This is a computer-generated tax invoice.
        No physical signature is required unless applicable.

    </div>


</div>

</body>

</html>

    `;

}


/* =========================================================
   RENDER INVOICE PREVIEW
========================================================= */

export function renderInvoicePreview(
    container,
    invoiceData
) {

    if (!container) {
        return false;
    }


    const html =
        buildInvoiceHTML(
            invoiceData
        );


    container.innerHTML = "";


    const frame =
        document.createElement("iframe");

    frame.title =
        "Invoice Preview";


    frame.style.width =
        "100%";

    frame.style.height =
        "850px";

    frame.style.border =
        "0";

    frame.style.background =
        "#eef2f7";


    container.appendChild(
        frame
    );


    const frameDocument =
        frame.contentDocument ||
        frame.contentWindow.document;


    frameDocument.open();

    frameDocument.write(html);

    frameDocument.close();


    return true;

}


/* =========================================================
   GET PRINTABLE INVOICE HTML
========================================================= */

export function getPrintableInvoiceHTML(
    invoiceData
) {

    return buildInvoiceHTML(
        invoiceData
    );

}


/* =========================================================
   END OF INVOICE.JS
========================================================= */
