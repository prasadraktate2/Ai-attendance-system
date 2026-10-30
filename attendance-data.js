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

// Old sessions have no "presentCount". This counts the attendance records of each
// one and saves the number, so the app knows whether attendance was really taken.
// saveFn is saveSession from store.js. Returns how many sessions were updated.
export async function backfillPresentCounts(saveFn) {
  const db = await getDb();
  const snap = await getDocs(collection(db, "sessions"));
  const old = snap.docs.filter(function (d) { return d.data().presentCount === undefined; });
  for (const d of old) {
    const a = await getDocs(query(collection(db, "attendance"), where("sessionId", "==", d.id)));
    await saveFn(d.id, { presentCount: a.size });
  }
  return old.length;
}

// A session left "active" (staff did not press Stop) is closed once its lecture
// time is over or the day has passed. saveFn is saveSession from store.js.
export async function closeStaleSessions(saveFn) {
  const db = await getDb();
  const d = new Date();
  const today = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
  const nowMin = d.getHours() * 60 + d.getMinutes();
  const snap = await getDocs(collection(db, "sessions"));
  let closed = 0;
  for (const doc of snap.docs) {
    const s = doc.data();
    if (!s.active) continue;
    const date = s.date || doc.id.slice(0, 10);
    const t = (s.time || "").split("-");
    const over = date < today ||
      (date === today && t.length === 2 && nowMin >= Number(t[1].slice(0, 2)) * 60 + Number(t[1].slice(3)) + 2);
    if (over) {
      await saveFn(doc.id, { active: false, token: "", prevToken: "", tokenExpiresAt: 0, endedAt: Date.now() });
      closed++;
    }
  }
  return closed;
}
