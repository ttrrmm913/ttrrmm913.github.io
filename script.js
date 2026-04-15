import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc,
  getDocs, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDjWHCEJmH6BGQJAfFc__9dQk0IDMvhZuc",
  authDomain: "study-app-c1d27.firebaseapp.com",
  projectId: "study-app-c1d27"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const subjectPoints = {
  国語:4,地理:2,歴史:2,公民:3,
  数学:6,理科:2,英語:3,
  音楽:3,美術:3,家庭:3,技術:3,保体:3
};

const DAILY_GOAL = 150;

let records = [];
let selectedDate = null;

let startTime = null;
let currentSubject = null;
let timerInterval = null;

async function loadRecords() {
  const snap = await getDocs(collection(db, "records"));
  records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  render();
}

async function saveRecord(record) {
  await addDoc(collection(db, "records"), record);
  loadRecords();
}

async function deleteRecord(id) {
  await deleteDoc(doc(db, "records", id));
  loadRecords();
}

function getLocalDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}

function render() {
  renderList();
  renderCharts();
  renderCalendar();
}

function renderList() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  const display = selectedDate
    ? records.filter(r => r.date === selectedDate)
    : records;

  display.forEach(r => {
    const li = document.createElement("li");
    li.textContent = `${r.subject} ${r.points}pt`;
    list.appendChild(li);
  });
}

function startStudy() {
  const subject = document.getElementById("subject").value;
  if (!subject) return;

  startTime = new Date();
  currentSubject = subject;

  timerInterval = setInterval(() => {
    const sec = Math.floor((new Date() - startTime)/1000);
    document.getElementById("timer").textContent =
      `${Math.floor(sec/60)}分 ${sec%60}秒`;
  }, 1000);
}

async function endStudy() {
  const sec = Math.floor((new Date() - startTime)/1000);
  const time = Math.max(1, Math.floor(sec/60));

  await saveRecord({
    date: getLocalDate(),
    subject: currentSubject,
    time,
    points: time * subjectPoints[currentSubject]
  });

  clearInterval(timerInterval);
  startTime = null;
}

function renderCalendar() {
  const cal = document.getElementById("calendar");
  cal.innerHTML = "";

  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();

  for (let d=1; d<=last; d++) {
    const div = document.createElement("div");
    div.className = "day";
    div.textContent = d;
    cal.appendChild(div);
  }
}

let dailyChart = null;
let subjectChart = null;

function renderCharts() {
  const canvas1 = document.getElementById("dailyChart");
  const canvas2 = document.getElementById("subjectChart");

  // 🔥 これでnull防止
  if (!canvas1 || !canvas2) return;

  const ctx1 = canvas1.getContext("2d");
  const ctx2 = canvas2.getContext("2d");

  const target = selectedDate
    ? records.filter(r => r.date === selectedDate)
    : records;

  const daily = {};
  const subject = {};

  target.forEach(r => {
    daily[r.date] = (daily[r.date] || 0) + r.points;
    subject[r.subject] = (subject[r.subject] || 0) + r.points;
  });

  if (dailyChart) dailyChart.destroy();
  if (subjectChart) subjectChart.destroy();

  dailyChart = new Chart(ctx1, {
    type: "bar",
    data: {
      labels: Object.keys(daily),
      datasets: [{ data: Object.values(daily) }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  subjectChart = new Chart(ctx2, {
    type: "pie",
    data: {
      labels: Object.keys(subject),
      datasets: [{ data: Object.values(subject) }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

window.startStudy = startStudy;
window.endStudy = endStudy;
window.resetFilter = () => { selectedDate=null; render(); };

document.addEventListener("DOMContentLoaded", () => {
  loadRecords();
});