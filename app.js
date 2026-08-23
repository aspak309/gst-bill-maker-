import { onAuthStateChanged } from "./firebase.js";
import { emailLogin, register, resetPassword, googleLogin, logout, sendOtp, verifyOtp } from "./auth.js";
import { calculateInvoiceGST, GST_RATES } from "./gst.js";
import { buildInvoiceHTML, renderInvoicePreview } from "./invoice.js";
import { generateInvoicePDF } from "./pdf.js";

const $=id=>document.getElementById(id);
const states=["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"];

const state={items:[],nextId:1,logoData:"",signatureData:""};

document.addEventListener("DOMContentLoaded",()=>{
  populateSelects(); setDateDefaults(); addItem(); bind(); update();
});

function populateSelects(){
  ["sellerState","buyerState","placeOfSupply"].forEach(id=>{
    const s=$(id); s.innerHTML=`<option value="">Select state</option>`+states.map(x=>`<option>${x}</option>`).join("");
  });
}
function setDateDefaults(){
  const d=new Date(), iso=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);
  $("invoiceDate").value=iso;
}
function bind(){
  document.addEventListener("input",e=>{if(e.target.closest(".editor")) update();});
  document.addEventListener("change",e=>{
    if(e.target.id==="logoInput"||e.target.id==="signatureInput") handleImage(e.target);
    if(e.target.closest(".editor")) update();
  });
  $("addItemBtn").onclick=addItem;
  $("downloadBtn").onclick=download;
  $("previewBtn").onclick=preview;
  $("closePreviewBtn").onclick=()=>{$("previewModal").classList.add("hidden");document.body.style.overflow=""};
  $("newInvoiceBtn").onclick=resetForm;
  $("logoutBtn").onclick=()=>logout();
  $("registerBtn").onclick=()=>doRegister();
  $("resetPasswordBtn").onclick=()=>doReset();
  $("googleBtn").onclick=()=>googleLogin().catch(showError);
  $("sendOtpBtn").onclick=()=>doSendOtp();
  $("verifyOtpBtn").onclick=()=>doVerifyOtp();
  document.querySelectorAll("[data-auth-tab]").forEach(b=>b.onclick=()=>switchAuth(b.dataset.authTab));
  $("itemsBody").onclick=e=>{const b=e.target.closest("[data-del]");if(b){state.items=state.items.filter(x=>x.id!==Number(b.dataset.del));renderItems();update();}};
  $("upiId").addEventListener("input",renderQr);
}
function switchAuth(tab){
  document.querySelectorAll("[data-auth-tab]").forEach(x=>x.classList.toggle("active",x.dataset.authTab===tab));
  $("emailAuthForm").classList.toggle("hidden",tab!=="email");
  $("phoneAuthPanel").classList.toggle("hidden",tab!=="phone");
  $("googleAuthPanel").classList.toggle("hidden",tab!=="google");
  $("authMessage").textContent="";
}
$("emailAuthForm").addEventListener("submit",e=>{e.preventDefault();emailLogin($("authEmail").value.trim(),$("authPassword").value).catch(showError)});
function doRegister(){register($("authEmail").value.trim(),$("authPassword").value).catch(showError)}
function doReset(){const email=$("authEmail").value.trim();if(!email)return showToast("Enter your email first.");resetPassword(email).then(()=>showToast("Password reset email sent.")).catch(showError)}
async function doSendOtp(){try{await sendOtp($("authPhone").value.trim());$("otpCode").classList.remove("hidden");$("verifyOtpBtn").classList.remove("hidden");showToast("OTP sent.");}catch(e){showError(e)}}
async function doVerifyOtp(){try{await verifyOtp($("otpCode").value.trim());showToast("Phone verified.");}catch(e){showError(e)}}
function showError(e){console.error(e);$("authMessage").textContent=e?.message||String(e);showToast(e?.message||"Something went wrong.");}
function showToast(msg){const t=document.createElement("div");t.className="toast";t.textContent=msg;$("toastContainer").appendChild(t);setTimeout(()=>t.remove(),3200)}

onAuthStateChanged((user)=>{
  $("authScreen").classList.toggle("hidden",!!user);
  $("appScreen").classList.toggle("hidden",!user);
  if(user){$("userEmail").textContent=user.email||user.phoneNumber||"Signed in";}
});

function addItem(){state.items.push({id:state.nextId++,name:"",hsn:"",qty:1,rate:0,gst:18});renderItems();}
function renderItems(){
  $("itemsBody").innerHTML=state.items.map((x,i)=>`<tr data-id="${x.id}">
    <td>${i+1}</td><td><input data-f="name" value="${esc(x.name)}" placeholder="Product / Service"></td>
    <td><input data-f="hsn" value="${esc(x.hsn)}" placeholder="HSN/SAC"></td>
    <td><input data-f="qty" type="number" min="0" step=".01" value="${x.qty}"></td>
    <td><input data-f="rate" type="number" min="0" step=".01" value="${x.rate}"></td>
    <td><select data-f="gst">${GST_RATES.map(r=>`<option ${r==x.gst?"selected":""}>${r}</option>`).join("")}</select></td>
    <td class="amount">₹${(x.qty*x.rate).toFixed(2)}</td>
    <td><button class="icon-btn" data-del="${x.id}" type="button">×</button></td></tr>`).join("");
  $("itemsBody").querySelectorAll("[data-f]").forEach(el=>el.oninput=()=>{const row=el.closest("tr"),it=state.items.find(x=>x.id===Number(row.dataset.id));it[el.dataset.f]=el.dataset.f==="name"||el.dataset.f==="hsn"?el.value:Number(el.value)||0;row.querySelector(".amount").textContent=money(it.qty*it.rate);update();});
}
function collect(){
  const val=id=>$(id)?.value||"";
  const result=calculateInvoiceGST({items:state.items,sellerState:val("sellerState"),buyerState:val("buyerState")});
  return {invoiceNumber:val("invoiceNumber"),invoiceDate:val("invoiceDate"),dueDate:val("dueDate"),paymentTerms:val("paymentTerms"),placeOfSupply:val("placeOfSupply"),
    seller:{name:val("sellerName"),address:val("sellerAddress"),gstin:val("sellerGSTIN"),state:val("sellerState"),phone:val("sellerPhone"),email:val("sellerEmail")},
    buyer:{name:val("buyerName"),address:val("buyerAddress"),gstin:val("buyerGSTIN"),state:val("buyerState"),phone:val("buyerPhone"),email:val("buyerEmail")},
    items:result.calculatedItems,result,notes:val("invoiceNotes"),signatoryName:val("signatoryName"),upiId:val("upiId"),paymentNote:val("paymentNote"),accountName:val("accountName"),bankName:val("bankName"),accountNumber:val("accountNumber"),ifsc:val("ifsc"),logoData:state.logoData,signatureData:state.signatureData};
}
function update(){
  const r=collect().result;
  $("taxableAmount").textContent=money(r.taxableAmount);$("cgstAmount").textContent=money(r.cgst);$("sgstAmount").textContent=money(r.sgst);$("igstAmount").textContent=money(r.igst);$("grandTotal").textContent=money(r.grandTotal);
  $("taxModeMessage").textContent=r.isSameState?"Same-state: CGST + SGST":r.isInterState?"Inter-state: IGST":"Select both states to calculate GST";
}
async function download(){try{showToast("PDF तैयार हो रहा है...");await new Promise(r=>setTimeout(r,100));const d=collect();await generateInvoicePDF({html:buildInvoiceHTML(d),invoiceNumber:d.invoiceNumber});showToast("PDF downloaded.");}catch(e){showError(e)}}
function preview(){renderInvoicePreview($("previewContainer"),collect());$("previewModal").classList.remove("hidden");document.body.style.overflow="hidden";}
function resetForm(){if(!confirm("Current invoice details clear करें?"))return;document.querySelectorAll(".editor input,.editor textarea").forEach(x=>{if(x.type!=="file")x.value=""});document.querySelectorAll(".editor select").forEach(x=>x.value="");state.items=[];state.nextId=1;state.logoData="";state.signatureData="";$("logoThumb").classList.add("hidden");$("signatureThumb").classList.add("hidden");$("logoInput").value="";$("signatureInput").value="";addItem();setDateDefaults();update();}
function handleImage(input){const file=input.files?.[0];if(!file)return;if(file.size>2*1024*1024){showToast("Image 2MB से छोटी रखें.");input.value="";return}const reader=new FileReader();reader.onload=()=>{if(input.id==="logoInput"){state.logoData=reader.result;$("logoThumb").src=reader.result;$("logoThumb").classList.remove("hidden");}else{state.signatureData=reader.result;$("signatureThumb").src=reader.result;$("signatureThumb").classList.remove("hidden");}};reader.readAsDataURL(file);}
function renderQr(){/* QR is generated inside the final PDF; this placeholder keeps the editor storage-free. */}
function money(v){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",minimumFractionDigits:2}).format(Number(v)||0)}
function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}

