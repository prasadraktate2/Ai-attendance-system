// Weekly timetable (from the college timetable). Edit here to change it.
// Class details shown on the home screen. Edit here if they change.
export const CLASS_INFO = {
  branch: "CSE",
  sem: "1",
  division: "B.Tech.(ID) - 1 - CSE"
};

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const R = { type: "Recess" };
const KHANDELWAL = "Mr. Deepak Kumar Khandelwal";
const KAKADE = "Mr. Babasaheb Gangadhar Kakade";
const JOSHI = "Dr. Kalpana Ganesh Joshi";
const BHAND = "Ms. Prajakta Shivaji Bhand";
const HIRAK = "Dr. Hirak Chatterjee";
const JADHAV = "Mr. Sachin Babulal Jadhav";

export const TIMETABLE = {
  Mon: [
    { type: "Lecture", subject: "Chemistry", start: "10:00", end: "10:55", teachers: [HIRAK] },
    { type: "Lecture", subject: "Engineering Mathematics-I", start: "10:55", end: "11:50", teachers: [BHAND] },
    R,
    { type: "Lecture", subject: "Verbal Communication Skills", start: "12:30", end: "14:30", teachers: ["Mr. Ganesh Shivaji Phopase"] },
    { type: "Lab", subject: "Chemistry", start: "14:50", end: "16:50", teachers: [HIRAK] }
  ],
  Tue: [
    { type: "Lecture", subject: "Environmental Science", start: "10:00", end: "10:55", teachers: [KAKADE] },
    { type: "Lecture", subject: "Engineering Mathematics-I", start: "10:55", end: "11:50", teachers: [BHAND] },
    R,
    { type: "Lab", subject: "Computational Thinking & Problem Solving", start: "12:30", end: "14:30", teachers: [KHANDELWAL, KAKADE] },
    { type: "Lecture", subject: "Computational Thinking & Problem Solving", start: "14:50", end: "15:50", teachers: [KHANDELWAL] },
    { type: "Lecture", subject: "Physics", start: "15:50", end: "16:50", teachers: [JOSHI] }
  ],
  Wed: [
    { type: "Other", subject: "Communication", start: "10:00", end: "10:55", teachers: [KHANDELWAL] },
    { type: "Lecture", subject: "Chemistry", start: "10:55", end: "11:50", teachers: [HIRAK] },
    R,
    { type: "Lecture", subject: "Computational Thinking & Problem Solving", start: "12:30", end: "13:30", teachers: [KHANDELWAL] },
    { type: "Lecture", subject: "Environmental Science", start: "13:30", end: "14:30", teachers: [KAKADE] },
    R,
    { type: "Lab", subject: "Yoga and Meditation", start: "14:50", end: "16:50", teachers: [JOSHI] }
  ],
  Thu: [
    { type: "Lecture", subject: "Physics", start: "10:00", end: "10:55", teachers: [JOSHI] },
    { type: "Lecture", subject: "Engineering Mathematics-I", start: "10:55", end: "11:50", teachers: [BHAND] },
    R,
    { type: "Lab", subject: "Physics", start: "12:30", end: "14:30", teachers: [JOSHI] },
    { type: "Lab", subject: "Computer Workshop Practice", start: "14:50", end: "16:50", teachers: [KHANDELWAL, KAKADE] }
  ],
  Fri: [
    { type: "Lecture", subject: "Engineering Mathematics-I", start: "10:00", end: "10:55", teachers: [BHAND] },
    { type: "Lecture", subject: "Computational Thinking & Problem Solving", start: "10:55", end: "11:50", teachers: [KHANDELWAL] },
    R,
    { type: "Lab", subject: "Computer Workshop Practice", start: "12:30", end: "14:30", teachers: [KHANDELWAL, KAKADE] },
    { type: "Lab", subject: "Introduction to AI Tools", start: "14:50", end: "16:50", teachers: [JADHAV, "Ms. Ankita Sugat Awsarmal"] }
  ],
  Sat: [
    R,
    { type: "Lab", subject: "Mandatory Course-I", start: "14:50", end: "16:50", teachers: [JADHAV] }
  ]
};

// Today's day key. Sunday has no classes, so it shows Monday.
export function todayKey() {
  const d = new Date().getDay();
  return d === 0 ? "Mon" : DAY_NAMES[d - 1];
}

export function isSunday() {
  return new Date().getDay() === 0;
}

export function fmt(t) {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return ((h % 12) || 12) + ":" + String(m).padStart(2, "0") + " " + ap;
}

function minutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Index of the slot running now in the given list, else the next one, else 0.
export function currentIndex(list) {
  const d = new Date();
  const now = d.getHours() * 60 + d.getMinutes();
  let next = -1;
  for (let i = 0; i < list.length; i++) {
    const s = minutes(list[i].start), e = minutes(list[i].end);
    if (now >= s && now < e) return i;
    if (s > now && next === -1) next = i;
  }
  return next === -1 ? 0 : next;
}
