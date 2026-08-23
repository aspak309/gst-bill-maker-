/* =========================================================
   GST BILL MAKER
   GST Calculation Engine
   File: gst.js

   IMPORTANT:
   - GST calculation only.
   - No Firebase.
   - No Firestore.
   - No Storage.
   - No invoice data saving.
========================================================= */


/* =========================================================
   ALLOWED GST RATES
========================================================= */

export const GST_RATES = [
    0,
    5,
    12,
    18,
    28
];


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
        (number + Number.EPSILON) * 100
    ) / 100;

}


/* =========================================================
   SAFE NUMBER
========================================================= */

function toNumber(value) {

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
   GST RATE VALIDATOR
========================================================= */

export function isValidGSTRate(rate) {

    return GST_RATES.includes(
        Number(rate)
    );

}


/* =========================================================
   MAIN GST CALCULATOR
========================================================= */

export function calculateInvoiceGST({

    items = [],

    sellerState = "",

    buyerState = ""

} = {}) {


    /* -------------------------------------------------------
       TRANSACTION TYPE
    ------------------------------------------------------- */

    const hasBothStates =
        Boolean(
            sellerState &&
            buyerState
        );


    const isSameState =
        hasBothStates &&
        sellerState === buyerState;


    const isInterState =
        hasBothStates &&
        sellerState !== buyerState;


    /* -------------------------------------------------------
       TOTALS
    ------------------------------------------------------- */

    let taxableAmount = 0;

    let totalCGST = 0;

    let totalSGST = 0;

    let totalIGST = 0;


    /* -------------------------------------------------------
       ITEM CALCULATION
    ------------------------------------------------------- */

    const calculatedItems =
        Array.isArray(items)
            ? items.map(
                (item) => {

                    const quantity =
                        toNumber(
                            item?.qty
                        );


                    const rate =
                        toNumber(
                            item?.rate
                        );


                    let gstRate =
                        toNumber(
                            item?.gst
                        );


                    /*
                       Only supported GST rates.
                    */

                    if (
                        !GST_RATES.includes(
                            gstRate
                        )
                    ) {

                        gstRate = 0;

                    }


                    /* ---------------------------------------
                       TAXABLE VALUE
                    --------------------------------------- */

                    const itemTaxable =
                        roundMoney(
                            quantity * rate
                        );


                    /* ---------------------------------------
                       GST
                    --------------------------------------- */

                    const itemGST =
                        roundMoney(
                            itemTaxable *
                            gstRate /
                            100
                        );


                    let itemCGST = 0;

                    let itemSGST = 0;

                    let itemIGST = 0;


                    /* ---------------------------------------
                       SAME STATE
                    --------------------------------------- */

                    if (
                        isSameState
                    ) {

                        itemCGST =
                            roundMoney(
                                itemGST / 2
                            );


                        /*
                           Remaining paisa goes to SGST
                           so CGST + SGST always equals GST.
                        */

                        itemSGST =
                            roundMoney(
                                itemGST -
                                itemCGST
                            );

                    }


                    /* ---------------------------------------
                       INTER STATE
                    --------------------------------------- */

                    else if (
                        isInterState
                    ) {

                        itemIGST =
                            itemGST;

                    }


                    /* ---------------------------------------
                       ADD TO TOTALS
                    --------------------------------------- */

                    taxableAmount +=
                        itemTaxable;

                    totalCGST +=
                        itemCGST;

                    totalSGST +=
                        itemSGST;

                    totalIGST +=
                        itemIGST;


                    /* ---------------------------------------
                       RETURN ITEM
                    --------------------------------------- */

                    return {

                        ...item,

                        qty:
                            quantity,

                        rate:
                            rate,

                        gstRate:
                            gstRate,

                        taxableAmount:
                            itemTaxable,

                        gstAmount:
                            itemGST,

                        cgst:
                            itemCGST,

                        sgst:
                            itemSGST,

                        igst:
                            itemIGST,

                        total:
                            roundMoney(
                                itemTaxable +
                                itemGST
                            )

                    };

                }
            )
            : [];


    /* -------------------------------------------------------
       FINAL TOTALS
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
       FINAL RESULT
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
========================================================= */

export function calculateItemGST({

    quantity = 0,

    rate = 0,

    gstRate = 0,

    sameState = false

} = {}) {


    const qty =
        toNumber(quantity);


    const itemRate =
        toNumber(rate);


    let gst =
        toNumber(gstRate);


    if (
        !GST_RATES.includes(gst)
    ) {

        gst = 0;

    }


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

        gstRate:
            gst,

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
   END OF GST.JS
========================================================= */
