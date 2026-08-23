export const GST_RATES = [0, 5, 12, 18, 28];

export function roundMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round((n + Number.EPSILON) * 100) / 100 : 0;
}

function num(v) {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function calculateInvoiceGST({items=[], sellerState="", buyerState=""}={}) {
  const same = Boolean(sellerState && buyerState && sellerState === buyerState);
  const inter = Boolean(sellerState && buyerState && sellerState !== buyerState);
  let taxableAmount=0, cgst=0, sgst=0, igst=0;

  const calculatedItems = items.map(item => {
    const qty=num(item.qty), rate=num(item.rate), gstRate=num(item.gst);
    const taxable=roundMoney(qty*rate);
    const gst=roundMoney(taxable*gstRate/100);
    let c=0,s=0,i=0;
    if (same) { c=roundMoney(gst/2); s=roundMoney(gst-c); }
    else if (inter) i=gst;
    taxableAmount+=taxable; cgst+=c; sgst+=s; igst+=i;
    return {...item, taxableAmount:taxable, gstRate, gstAmount:gst, cgst:c, sgst:s, igst:i, total:roundMoney(taxable+gst)};
  });

  cgst=roundMoney(cgst); sgst=roundMoney(sgst); igst=roundMoney(igst);
  const totalGST=roundMoney(cgst+sgst+igst);
  const grandTotal=roundMoney(taxableAmount+totalGST);
  return {taxableAmount:roundMoney(taxableAmount), cgst, sgst, igst, totalGST, grandTotal, isSameState:same, isInterState:inter, calculatedItems};
}

