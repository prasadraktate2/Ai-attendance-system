// ===== Lecture slot timings (edit these to match your college timetable) =====
// ENFORCE_TIME = true  -> students can scan only during the lecture time
// ENFORCE_TIME = false -> no time limit (use this only for testing)
export const ENFORCE_TIME = true;

export const SLOTS = [
  { n: 1, start: "10:00", end: "10:55" },
  { n: 2, start: "11:00", end: "11:55" },
  { n: 3, start: "12:00", end: "12:55" },
  { n: 4, start: "14:00", end: "14:55" },
  { n: 5, start: "15:00", end: "15:55" }
];

function at(hhmm, base) {
  const p = hhmm.split(":");
  const d = new Date(base);
  d.setHours(+p[0], +p[1], 0, 0);
  return d.getTime();
}

// start/end of a slot as timestamps for today
export function slotWindow(n, base) {
  const s = SLOTS.find(x => x.n === n);
  const b = base || new Date();
  return { startAt: at(s.start, b), endAt: at(s.end, b) + 59 * 1000 };
}

// slot running now, otherwise the next one, otherwise the last one
export function currentSlot() {
  const now = Date.now();
  for (const s of SLOTS) {
    const w = slotWindow(s.n);
    if (now >= w.startAt && now <= w.endAt) return s;
  }
  for (const s of SLOTS) {
    if (now < slotWindow(s.n).startAt) return s;
  }
  return SLOTS[SLOTS.length - 1];
}