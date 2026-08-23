export async function generateInvoicePDF({html,invoiceNumber="INV-0001"}={}) {
  if(typeof window.html2pdf!=="function") throw new Error("html2pdf.js is not loaded.");
  const wrapper=document.createElement("div");
  wrapper.innerHTML=html;
  wrapper.style.position="fixed"; wrapper.style.left="-100000px"; wrapper.style.top="0"; wrapper.style.width="794px"; wrapper.style.background="#fff";
  document.body.appendChild(wrapper);
  try {
    const safe=String(invoiceNumber||"INV-0001").replace(/[<>:"/\\|?*\x00-\x1F]/g,"-").replace(/\s+/g,"-");
    await window.html2pdf().set({
      margin:0, filename:`Invoice-${safe}.pdf`,
      image:{type:"jpeg",quality:.98},
      html2canvas:{scale:2,useCORS:true,backgroundColor:"#fff"},
      jsPDF:{unit:"mm",format:"a4",orientation:"portrait"},
      pagebreak:{mode:["css","legacy"]}
    }).from(wrapper).save();
    return true;
  } finally { wrapper.remove(); }
}

