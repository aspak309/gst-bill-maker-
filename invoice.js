import { roundMoney } from "./gst.js";

const esc = v => String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const safe = (v,f="—") => { const s=String(v??"").trim(); return s?esc(s):f; };
const money = v => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",minimumFractionDigits:2}).format(Number(v)||0);

function qrData(upiId, name, amount) {
  if (!upiId) return "";
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name||"Business")}&am=${encodeURIComponent(roundMoney(amount).toFixed(2))}&cu=INR`;
}

export function buildInvoiceHTML(data={}) {
  const {invoiceNumber="",invoiceDate="",dueDate="",seller={},buyer={},items=[],result={},notes="",upiId="",paymentNote="",signatoryName="",logoData="",signatureData="",accountName="",bankName="",accountNumber="",ifsc="",paymentTerms=""}=data;
  const rows=items.map((x,i)=>`<tr><td>${i+1}</td><td><b>${safe(x.name,"Product / Service")}</b></td><td>${safe(x.hsn)}</td><td class="r">${x.qty||0}</td><td class="r">${money(x.rate)}</td><td class="r">${money(x.taxableAmount)}</td><td class="r">${x.gstRate||0}%</td><td class="r b">${money(x.total)}</td></tr>`).join("");
  const qr=qrData(upiId,seller.name,result.grandTotal);
  const logo=logoData?`<img class="logo" src="${logoData}" alt="Company logo">`:"";
  const sig=signatureData?`<img class="sig-img" src="${signatureData}" alt="Signature">`:"";

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;background:#eef2f7;color:#172033;font-family:Arial,sans-serif;font-size:11px}.page{width:794px;min-height:1123px;margin:auto;background:#fff;padding:34px}.top{display:flex;justify-content:space-between;gap:20px;border-bottom:3px solid #312e81;padding-bottom:18px}.brand{display:flex;gap:14px;align-items:center}.logo{width:70px;height:70px;object-fit:contain;border-radius:10px}.brand h1{margin:0;font-size:23px;color:#312e81}.muted{color:#64748b}.title{text-align:right}.title h2{margin:0;font-size:24px}.meta{margin-top:8px;line-height:1.7}.boxes{display:grid;grid-template-columns:1fr 1fr;border:1px solid #dbe3ef;margin-top:18px}.box{padding:14px}.box+.box{border-left:1px solid #dbe3ef}.label{font-size:8px;text-transform:uppercase;font-weight:800;letter-spacing:1px;color:#6366f1;margin-bottom:7px}.name{font-size:14px;font-weight:800}.line{margin-top:5px}.grid3{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #dbe3ef;margin-top:14px}.cell{padding:10px}.cell+.cell{border-left:1px solid #dbe3ef}.items{width:100%;border-collapse:collapse;margin-top:18px}.items th{background:#1e1b4b;color:#fff;padding:9px 6px;font-size:8px;text-align:left}.items td{padding:8px 6px;border-bottom:1px solid #e2e8f0}.items tr:nth-child(even){background:#f8fafc}.r{text-align:right}.b{font-weight:800}.bottom{display:grid;grid-template-columns:1fr 260px;gap:20px;margin-top:18px}.notes,.summary{border:1px solid #dbe3ef;padding:13px}.summary-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #edf2f7}.grand{display:flex;justify-content:space-between;background:#312e81;color:#fff;padding:13px;margin:13px -13px -13px;font-size:14px;font-weight:800}.pay{margin-top:18px;border:1px solid #dbe3ef;padding:13px;display:flex;justify-content:space-between;gap:20px}.qr{width:110px;height:110px}.sign{margin-top:45px;text-align:right}.sig-img{max-width:180px;max-height:55px;object-fit:contain;display:block;margin-left:auto}.footer{border-top:1px solid #dbe3ef;margin-top:30px;padding-top:9px;text-align:center;color:#94a3b8;font-size:8px}
  </style></head><body><div class="page">
  <div class="top"><div class="brand">${logo}<div><h1>${safe(seller.name,"YOUR BUSINESS")}</h1><div class="muted">GST INVOICE</div></div></div><div class="title"><h2>TAX INVOICE</h2><div class="meta">Invoice No: <b>${safe(invoiceNumber,"INV-0001")}</b><br>Invoice Date: <b>${safe(invoiceDate)}</b>${dueDate?`<br>Due Date: <b>${safe(dueDate)}</b>`:""}</div></div></div>
  <div class="boxes"><div class="box"><div class="label">Bill From / Seller</div><div class="name">${safe(seller.name,"Not Provided")}</div><div class="line">${safe(seller.address,"Address not provided")}</div><div class="line"><b>GSTIN:</b> ${safe(seller.gstin)}</div><div class="line"><b>Phone:</b> ${safe(seller.phone)}</div><div class="line"><b>Email:</b> ${safe(seller.email)}</div></div>
  <div class="box"><div class="label">Bill To / Buyer</div><div class="name">${safe(buyer.name,"Not Provided")}</div><div class="line">${safe(buyer.address,"Address not provided")}</div><div class="line"><b>GSTIN:</b> ${safe(buyer.gstin)}</div><div class="line"><b>Phone:</b> ${safe(buyer.phone)}</div><div class="line"><b>Email:</b> ${safe(buyer.email)}</div></div></div>
  <div class="grid3"><div class="cell"><div class="label">Place of Supply</div><b>${safe(data.placeOfSupply||buyer.state)}</b></div><div class="cell"><div class="label">Tax Type</div><b>${result.isSameState?"CGST + SGST":result.isInterState?"IGST":"GST"}</b></div><div class="cell"><div class="label">Payment Terms</div><b>${safe(paymentTerms,"—")}</b></div></div>
  <table class="items"><thead><tr><th>#</th><th>Item Description</th><th>HSN/SAC</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Taxable</th><th class="r">GST</th><th class="r">Amount</th></tr></thead><tbody>${rows||`<tr><td colspan="8" style="text-align:center;padding:25px">No items added.</td></tr>`}</tbody></table>
  <div class="bottom"><div class="notes"><div class="label">Notes / Terms</div><div style="white-space:pre-line;line-height:1.6">${safe(notes,"Thank you for your business.")}</div></div><div class="summary"><div class="summary-row"><span>Taxable</span><b>${money(result.taxableAmount)}</b></div>${result.cgst?`<div class="summary-row"><span>CGST</span><b>${money(result.cgst)}</b></div>`:""}${result.sgst?`<div class="summary-row"><span>SGST</span><b>${money(result.sgst)}</b></div>`:""}${result.igst?`<div class="summary-row"><span>IGST</span><b>${money(result.igst)}</b></div>`:""}<div class="summary-row"><span>Total GST</span><b>${money(result.totalGST)}</b></div><div class="grand"><span>Grand Total</span><span>${money(result.grandTotal)}</span></div></div></div>
  ${upiId||accountNumber||bankName?`<div class="pay"><div><div class="label">Payment Details</div>${upiId?`<div><b>UPI ID:</b> ${safe(upiId)}</div>`:""}${accountName?`<div><b>Account Holder:</b> ${safe(accountName)}</div>`:""}${bankName?`<div><b>Bank:</b> ${safe(bankName)}</div>`:""}${accountNumber?`<div><b>Account No:</b> ${safe(accountNumber)}</div>`:""}${ifsc?`<div><b>IFSC:</b> ${safe(ifsc)}</div>`:""}${paymentNote?`<div class="muted" style="margin-top:5px">${safe(paymentNote)}</div>`:""}</div>${qr?`<div><div id="qrcode" class="qr"></div></div>`:""}</div>`:""}
  <div class="sign">${sig}<b>${safe(signatoryName,"Authorized Signatory")}</b><div class="muted">For ${safe(seller.name,"Authorized Business")}</div></div>
  <div class="footer">This is a computer-generated tax invoice. Invoice data, logo and payment details were supplied by the user for this PDF.</div>
  ${qr?`<script>new QRCode(document.getElementById("qrcode"),{text:${JSON.stringify(qr)},width:110,height:110});<\/script>`:""}
  </div></body></html>`;
}

export function renderInvoicePreview(container,data){
  container.innerHTML="";
  const frame=document.createElement("iframe");
  frame.style.width="100%"; frame.style.height="800px"; frame.style.border="0";
  container.appendChild(frame);
  const doc=frame.contentDocument;
  doc.open(); doc.write(buildInvoiceHTML(data)); doc.close();
}

