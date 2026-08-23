import {doc,getDoc,setDoc} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {ref,uploadBytes,getDownloadURL,deleteObject} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";
import {db,storage} from "./firebase.js";
const profile=uid=>doc(db,"users",uid,"settings","profile");
export async function loadCompanySettings(uid){const s=await getDoc(profile(uid));return s.exists()?s.data():{}}
export const saveCompanySettings=(uid,data)=>setDoc(profile(uid),data,{merge:true});
export async function uploadCompanyImage(uid,file,type){if(!file||!file.type.startsWith("image/"))throw Error("Please select an image.");if(file.size>3*1024*1024)throw Error("Image must be 3 MB or smaller.");const ext=(file.name.split(".").pop()||"jpg").toLowerCase(),r=ref(storage,`users/${uid}/${type}.${ext}`);await uploadBytes(r,file,{contentType:file.type});return getDownloadURL(r)}
export async function deleteCompanyImage(uid,type){for(const e of ["png","jpg","jpeg","webp"]){await deleteObject(ref(storage,`users/${uid}/${type}.${e}`)).catch(()=>{})}}
