 // PDF upload without Firebase Storage: the PDF is cut into pieces and saved in
// Firestore (free plan friendly). Works for small PDFs (up to about 4 MB).
// Needs "export const firebaseConfig" in store.js.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, deleteDoc, getDocs, collection, query, where }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const MAX_PDF_BYTES = 4 * 1024 * 1024;
const CHUNK = 700000; // characters per Firestore document (limit is about 1 MB)

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = import("./store.js").then(function (mod) {
      if (!mod.firebaseConfig) throw new Error("Write 'export' before 'const firebaseConfig' in store.js");
      const app = getApps().length ? getApp() : initializeApp(mod.firebaseConfig);
      return getFirestore(app);
    });
  }
  return dbPromise;
}

function toBase64(file) {
  return new Promise(function (resolve, reject) {
    const r = new FileReader();
    r.onload = function () { resolve(String(r.result).split(",")[1]); };
    r.onerror = function () { reject(new Error("Could not read the file")); };
    r.readAsDataURL(file);
  });
}

// Saves the PDF and returns its id.
export async function uploadPdf(file) {
  const db = await getDb();
  const data = await toBase64(file);
  const fileId = "f" + Date.now() + Math.floor(Math.random() * 1000);
  const total = Math.ceil(data.length / CHUNK);
  for (let i = 0; i < total; i++) {
    await setDoc(doc(db, "files", fileId + "_" + i), {
      fileId: fileId,
      index: i,
      total: total,
      name: file.name,
      data: data.slice(i * CHUNK, (i + 1) * CHUNK)
    });
  }
  return fileId;
}

// Rebuilds the PDF and returns it as a Blob.
export async function pdfBlob(fileId) {
  const db = await getDb();
  const snap = await getDocs(query(collection(db, "files"), where("fileId", "==", fileId)));
  const parts = snap.docs.map(function (d) { return d.data(); })
    .sort(function (a, b) { return a.index - b.index; });
  if (!parts.length) throw new Error("PDF not found");
  const bin = atob(parts.map(function (p) { return p.data; }).join(""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: "application/pdf" });
}

export async function deletePdf(fileId) {
  const db = await getDb();
  const snap = await getDocs(query(collection(db, "files"), where("fileId", "==", fileId)));
  for (const d of snap.docs) await deleteDoc(d.ref);
}
