 // Read helpers for the Attendance screens (reads Firestore directly).
// Needs "export const firebaseConfig" in store.js.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

// All sessions of one day (YYYY-MM-DD), sorted by lecture number.
export async function sessionsOn(date) {
  const db = await getDb();
  const snap = await getDocs(collection(db, "sessions"));
  return snap.docs
    .map(function (d) { return Object.assign({ id: d.id }, d.data()); })
    .filter(function (s) { return s.date === date || (s.id || "").startsWith(date); })
    .sort(function (a, b) { return (a.lecture || 0) - (b.lecture || 0); });
}

// Set of sessionIds this student has attended.
export async function attendedSessionIds(studentId) {
  const db = await getDb();
  const snap = await getDocs(query(collection(db, "attendance"), where("studentId", "==", studentId)));
  return new Set(snap.docs.map(function (d) { return d.data().sessionId; }));
}

// Attendance records of one session.
export async function attendanceForSession(sessionId) {
  const db = await getDb();
  const snap = await getDocs(query(collection(db, "attendance"), where("sessionId", "==", sessionId)));
  return snap.docs.map(function (d) { return d.data(); });
}
