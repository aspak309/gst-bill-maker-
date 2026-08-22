/* =========================================================
   GST BILL MAKER
   PDF Generation Module
   File: pdf.js

   Dependency:
   html2pdf.js
========================================================= */


/* =========================================================
   CHECK HTML2PDF
========================================================= */

function checkHtml2Pdf() {

    if (typeof window.html2pdf === "function") {
        return true;
    }

    console.error(
        "html2pdf.js is not loaded."
    );

    return false;
}


/* =========================================================
   SAFE FILE NAME
========================================================= */

function safeFileName(value) {

    const name =
        String(value || "INV-0001")
            .trim()
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
            .replace(/\s+/g, "-");

    return name || "INV-0001";
}


/* =========================================================
   CREATE PDF CONTAINER
========================================================= */

function createPdfContainer(html) {

    const wrapper =
        document.createElement("div");

    wrapper.innerHTML = html;

    wrapper.style.position = "fixed";
    wrapper.style.left = "-100000px";
    wrapper.style.top = "0";
    wrapper.style.width = "794px";
    wrapper.style.background = "#ffffff";
    wrapper.style.zIndex = "-1";

    document.body.appendChild(wrapper);

    return wrapper;
}


/* =========================================================
   GENERATE PDF
========================================================= */

export async function generateInvoicePDF({
    html = "",
    invoiceNumber = "INV-0001"
} = {}) {

    if (!checkHtml2Pdf()) {

        throw new Error(
            "PDF library is not available. Please load html2pdf.js in index.html."
        );

    }


    if (!html) {

        throw new Error(
            "Invoice HTML is empty."
        );

    }


    const filename =
        `Invoice-${safeFileName(invoiceNumber)}.pdf`;


    const container =
        createPdfContainer(html);


    try {

        const pdfOptions = {

            margin: 0,

            filename,

            image: {
                type: "jpeg",
                quality: 0.98
            },

            html2canvas: {

                scale: 2,

                useCORS: true,

                allowTaint: false,

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
                    "css",
                    "legacy"
                ]

            }

        };


        await window
            .html2pdf()
            .set(pdfOptions)
            .from(container)
            .save();


        return {

            success: true,

            filename

        };

    } finally {

        container.remove();

    }

}


/* =========================================================
   GENERATE PDF FROM INVOICE DATA
========================================================= */

export async function generateInvoicePDFFromData({
    invoiceData = {},
    buildInvoiceHTML
} = {}) {


    if (
        typeof buildInvoiceHTML !==
        "function"
    ) {

        throw new Error(
            "buildInvoiceHTML function is required."
        );

    }


    const html =
        buildInvoiceHTML(
            invoiceData
        );


    return generateInvoicePDF({

        html,

        invoiceNumber:
            invoiceData.invoiceNumber

    });

}


/* =========================================================
   PDF LIBRARY STATUS
========================================================= */

export function isPdfLibraryReady() {

    return checkHtml2Pdf();

}


/* =========================================================
   END OF PDF.JS
========================================================= */
