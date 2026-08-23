export async function generateInvoicePDF({html="",invoiceNumber="INV-0001"}={}){
 if(typeof window.html2pdf!=="function")throw Error("html2pdf.js is not loaded.");
 const w=document.createElement("div");w.innerHTML=html;w.style.cssText="position:fixed;left:-100000px;top:0;width:794px;background:#fff";document.body.appendChild(w);
 const filename=`Invoice-${String(invoiceNumber||"INV-0001").replace(/[<>:"/\\|?*\x00-\x1F]/g,"-")}.pdf`;
 try{await window.html2pdf().set({margin:0,filename,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:true,backgroundColor:"#fff"},jsPDF:{unit:"mm",format:"a4",orientation:"portrait",compress:true}}).from(w).save();return{success:true,filename}}finally{w.remove()}}
