export const GST_RATES=[0,5,12,18,28];
export const roundMoney=v=>{v=Number(v);return Number.isFinite(v)?Math.round((v+Number.EPSILON)*100)/100:0};
const n=v=>{v=Number.parseFloat(v);return Number.isFinite(v)&&v>=0?v:0};
export function calculateInvoiceGST({items=[],sellerState="",buyerState=""}={}){
 const same=!!sellerState&&!!buyerState&&sellerState===buyerState,inter=!!sellerState&&!!buyerState&&sellerState!==buyerState;
 let taxableAmount=0,cgst=0,sgst=0,igst=0;
 const calculatedItems=items.map(x=>{let qty=n(x.qty),rate=n(x.rate),gst=n(x.gst),tax=roundMoney(qty*rate),taxAmt=roundMoney(tax*gst/100),a=0,b=0,c=0;
 if(same){a=roundMoney(taxAmt/2);b=roundMoney(taxAmt-a)}else if(inter)c=taxAmt;
 taxableAmount+=tax;cgst+=a;sgst+=b;igst+=c;return {...x,taxableAmount:tax,gstRate:gst,gstAmount:taxAmt,cgst:a,sgst:b,igst:c,total:roundMoney(tax+taxAmt)}});
 cgst=roundMoney(cgst);sgst=roundMoney(sgst);igst=roundMoney(igst);taxableAmount=roundMoney(taxableAmount);const totalGST=roundMoney(cgst+sgst+igst);
 return {taxableAmount,cgst,sgst,igst,totalGST,grandTotal:roundMoney(taxableAmount+totalGST),isSameState:same,isInterState:inter,calculatedItems};
}
