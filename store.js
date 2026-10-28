// ===== SWITCH: false = DEMO (saves in this browser only), true = Firebase =====
export const USE_FIREBASE = true;

const firebaseConfig = {
  apiKey: "AIzaSyBVLCOEYS4mDX3Os-Aryup9_rEKjVGz8jc",
  authDomain: "ai-attendance-system-ce9ec.firebaseapp.com",
  projectId: "ai-attendance-system-ce9ec",
  storageBucket: "ai-attendance-system-ce9ec.firebasestorage.app",
  messagingSenderId: "497801851272",
  appId: "1:497801851272:web:edf72a228aefc1acbe0a3d"
};

let fb = null;
async function fbInit() {
  if (fb) return fb;
  const appMod = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
  const fs = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  fb = { fs, db: fs.getFirestore(appMod.initializeApp(firebaseConfig)) };
  return fb;
}

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) { return {}; }
}
function write(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

export async function saveSession(id, data) {
  if (USE_FIREBASE) {
    const { fs, db } = await fbInit();
    await fs.setDoc(fs.doc(db, "sessions", id), data, { merge: true });
    return;
  }
  const all = read("demo_sessions");
  all[id] = Object.assign({}, all[id] || {}, data);
  write("demo_sessions", all);
}

export async function getSession(id) {
  if (USE_FIREBASE) {
    const { fs, db } = await fbInit();
    const snap = await fs.getDoc(fs.doc(db, "sessions", id));
    return snap.exists() ? snap.data() : null;
  }
  return read("demo_sessions")[id] || null;
}

// Returns "ok" or "duplicate"
export async function markPresent(sessionId, student) {
  const key = sessionId + "_" + student.id;
  const record = {
    sessionId: sessionId,
    studentId: student.id,
    studentName: student.name,
    date: sessionId.slice(0, 10),
    time: Date.now()
  };
  if (USE_FIREBASE) {
    const { fs, db } = await fbInit();
    const ref = fs.doc(db, "attendance", key);
    if ((await fs.getDoc(ref)).exists()) return "duplicate";
    await fs.setDoc(ref, record);
    return "ok";
  }
  const all = read("demo_attendance");
  if (all[key]) return "duplicate";
  all[key] = record;
  write("demo_attendance", all);
  return "ok";
}

// Calls cb(count) live. Returns an unsubscribe function.
export function watchPresent(sessionId, cb) {
  if (USE_FIREBASE) {
    let unsub = null, cancelled = false;
    fbInit().then(({ fs, db }) => {
      if (cancelled) return;
      unsub = fs.onSnapshot(
        fs.query(fs.collection(db, "attendance"), fs.where("sessionId", "==", sessionId)),
        s => cb(s.size)
      );
    });
    return () => { cancelled = true; if (unsub) unsub(); };
  }
  const tick = () => {
    cb(Object.values(read("demo_attendance")).filter(x => x.sessionId === sessionId).length);
  };
  tick();
  const t = setInterval(tick, 1000);
  return () => clearInterval(t);
}

// Live count of attendance records for a date (optionally for one student).
export function watchToday(date, studentId, cb) {
  if (USE_FIREBASE) {
    let unsub = null, cancelled = false;
    fbInit().then(({ fs, db }) => {
      if (cancelled) return;
      const conds = [fs.where("date", "==", date)];
      if (studentId) conds.push(fs.where("studentId", "==", studentId));
      unsub = fs.onSnapshot(
        fs.query(fs.collection(db, "attendance"), ...conds),
        s => cb(s.size)
      );
    });
    return () => { cancelled = true; if (unsub) unsub(); };
  }
  const tick = () => {
    cb(Object.values(read("demo_attendance")).filter(x =>
      x.date === date && (!studentId || x.studentId === studentId)).length);
  };
  tick();
  const t = setInterval(tick, 2000);
  return () => clearInterval(t);
}

// ---------- Students roster (staff adds, IDs are created here) ----------
function byId(a, b) {
  return a.id.localeCompare(b.id, undefined, { numeric: true });
}

export async function saveStudents(list) {
  if (USE_FIREBASE) {
    const { fs, db } = await fbInit();
    for (let i = 0; i < list.length; i += 400) {
      const batch = fs.writeBatch(db);
      list.slice(i, i + 400).forEach(s =>
        batch.set(fs.doc(db, "students", s.id),
          { id: s.id, name: s.name, password: s.password || "",
            roll: s.roll || "", batch: s.batch || "" }));
      await batch.commit();
    }
    return;
  }
  const all = read("demo_students");
  list.forEach(s => {
    all[s.id] = {
      id: s.id, name: s.name, password: s.password || "",
      roll: s.roll || "", batch: s.batch || ""
    };
  });
  write("demo_students", all);
}

export async function getStudents() {
  if (USE_FIREBASE) {
    const { fs, db } = await fbInit();
    const snap = await fs.getDocs(fs.collection(db, "students"));
    return snap.docs.map(d => d.data()).sort(byId);
  }
  return Object.values(read("demo_students")).sort(byId);
}

export async function getStudent(id) {
  if (USE_FIREBASE) {
    const { fs, db } = await fbInit();
    const snap = await fs.getDoc(fs.doc(db, "students", id));
    return snap.exists() ? snap.data() : null;
  }
  return read("demo_students")[id] || null;
}

export async function deleteStudent(id) {
  if (USE_FIREBASE) {
    const { fs, db } = await fbInit();
    await fs.deleteDoc(fs.doc(db, "students", id));
    return;
  }
  const all = read("demo_students");
  delete all[id];
  write("demo_students", all);
}

// ---------- Posts: academic calendar, LMS material, notifications ----------
export async function addPost(type, data) {
  const post = {
    type: type,
    title: data.title,
    body: data.body || "",
    link: data.link || "",
    tag: data.tag || "",
    date: data.date || "",
    by: data.by || "",
    createdAt: Date.now()
  };
  if (USE_FIREBASE) {
    const { fs, db } = await fbInit();
    await fs.addDoc(fs.collection(db, "posts"), post);
    return;
  }
  const all = read("demo_posts");
  const id = "p" + Date.now() + Math.floor(Math.random() * 1000);
  all[id] = Object.assign({ id: id }, post);
  write("demo_posts", all);
}

export async function getPosts(type) {
  if (USE_FIREBASE) {
    const { fs, db } = await fbInit();
    const snap = await fs.getDocs(
      fs.query(fs.collection(db, "posts"), fs.where("type", "==", type)));
    return snap.docs.map(d => Object.assign({ id: d.id }, d.data()));
  }
  return Object.values(read("demo_posts")).filter(p => p.type === type);
}

export async function deletePost(id) {
  if (USE_FIREBASE) {
    const { fs, db } = await fbInit();
    await fs.deleteDoc(fs.doc(db, "posts", id));
    return;
  }
  const all = read("demo_posts");
  delete all[id];
  write("demo_posts", all);
}