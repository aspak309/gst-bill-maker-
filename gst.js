/* =========================================================
   GST BILL MAKER
   GST Calculation Engine
   File: gst.js

   यह फाइल सिर्फ GST calculation संभालेगी।
========================================================= */


/* =========================================================
   MAIN GST CALCULATOR
========================================================= */

export function calculateInvoiceGST({
    items = [],
    sellerState = "",
    buyerState = ""
} = {}) {

    /* -------------------------------------------------------
       TAXABLE AMOUNT
    ------------------------------------------------------- */

    let taxableAmount = 0;

    let totalCGST = 0;

    let totalSGST = 0;

    let totalIGST = 0;


    /* -------------------------------------------------------
       CHECK TRANSACTION TYPE
    ------------------------------------------------------- */

    const hasStates =
        Boolean(sellerState && buyerState);


    const isSameState =
        hasStates &&
        sellerState === buyerState;


    const isInterState =
        hasStates &&
        sellerState !== buyerState;


    /* -------------------------------------------------------
       CALCULATE EACH ITEM
    ------------------------------------------------------- */

    const calculatedItems =
        items.map((item) => {

            const quantity =
                toPositiveNumber(item.qty);


            const rate =
                toPositiveNumber(item.rate);


            const gstRate =
                toPositiveNumber(item.gst);


            /* -----------------------------------------------
               BASIC ITEM VALUE
            ------------------------------------------------ */

            const itemTaxable =
                roundMoney(
                    quantity * rate
                );


            /* -----------------------------------------------
               GST AMOUNT
            ------------------------------------------------ */

            const itemGST =
                roundMoney(
                    itemTaxable *
                    gstRate /
                    100
                );


            let itemCGST = 0;

            let itemSGST = 0;

            let itemIGST = 0;


            /* -----------------------------------------------
               SAME STATE
               GST = CGST + SGST
            ------------------------------------------------ */

            if (isSameState) {

                itemCGST =
                    roundMoney(
                        itemGST / 2
                    );


                itemSGST =
                    roundMoney(
                        itemGST - itemCGST
                    );

            }


            /* -----------------------------------------------
               DIFFERENT STATE
               GST = IGST
            ------------------------------------------------ */

            else if (isInterState) {

                itemIGST =
                    itemGST;

            }


            /* -----------------------------------------------
               IF STATES NOT SELECTED
            ------------------------------------------------ */

            else {

                /*
                    जब तक states select नहीं होते,
                    GST को summary में अलग tax के रूप में
                    नहीं दिखाया जाएगा।
                */

                itemCGST = 0;

                itemSGST = 0;

                itemIGST = 0;

            }


            taxableAmount += itemTaxable;

            totalCGST += itemCGST;

            totalSGST += itemSGST;

            totalIGST += itemIGST;


            return {

                ...item,

                taxableAmount: itemTaxable,

                gstRate,

                gstAmount: itemGST,

                cgst: itemCGST,

                sgst: itemSGST,

                igst: itemIGST,

                total:
                    roundMoney(
                        itemTaxable +
                        itemGST
                    )

            };

        });


    /* -------------------------------------------------------
       ROUND TOTALS
    ------------------------------------------------------- */

    taxableAmount =
        roundMoney(
            taxableAmount
        );


    totalCGST =
        roundMoney(
            totalCGST
        );


    totalSGST =
        roundMoney(
            totalSGST
        );


    totalIGST =
        roundMoney(
            totalIGST
        );


    /* -------------------------------------------------------
       TOTAL GST
    ------------------------------------------------------- */

    const totalGST =
        roundMoney(
            totalCGST +
            totalSGST +
            totalIGST
        );


    /* -------------------------------------------------------
       GRAND TOTAL
    ------------------------------------------------------- */

    const grandTotal =
        roundMoney(
            taxableAmount +
            totalGST
        );


    /* -------------------------------------------------------
       RETURN COMPLETE RESULT
    ------------------------------------------------------- */

    return {

        taxableAmount,

        cgst:
            totalCGST,

        sgst:
            totalSGST,

        igst:
            totalIGST,

        totalGST,

        grandTotal,

        isSameState,

        isInterState,

        calculatedItems

    };

}


/* =========================================================
   SINGLE ITEM GST CALCULATOR
   दूसरे modules भी इसे इस्तेमाल कर सकते हैं।
========================================================= */

export function calculateItemGST({
    quantity = 0,
    rate = 0,
    gstRate = 0,
    sameState = false
} = {}) {

    const qty =
        toPositiveNumber(quantity);


    const itemRate =
        toPositiveNumber(rate);


    const gst =
        toPositiveNumber(gstRate);


    const taxableAmount =
        roundMoney(
            qty * itemRate
        );


    const gstAmount =
        roundMoney(
            taxableAmount *
            gst /
            100
        );


    let cgst = 0;

    let sgst = 0;

    let igst = 0;


    if (sameState) {

        cgst =
            roundMoney(
                gstAmount / 2
            );


        sgst =
            roundMoney(
                gstAmount - cgst
            );

    } else {

        igst =
            gstAmount;

    }


    return {

        taxableAmount,

        gstAmount,

        cgst,

        sgst,

        igst,

        total:
            roundMoney(
                taxableAmount +
                gstAmount
            )

    };

}


/* =========================================================
   GST RATE VALIDATOR
========================================================= */

export function isValidGSTRate(rate) {

    const validRates = [
        0,
        5,
        12,
        18,
        28
    ];


    return validRates.includes(
        Number(rate)
    );

}


/* =========================================================
   NUMBER HELPER
========================================================= */

function toPositiveNumber(value) {

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
   MONEY ROUNDING
========================================================= */

export function roundMoney(value) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return 0;

    }


    return Math.round(
        (number + Number.EPSILON) *
        100
    ) / 100;

}


/* =========================================================
   END OF GST.JS
========================================================= */
