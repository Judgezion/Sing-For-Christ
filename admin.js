// admin.js
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  startAfter,
  limit
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const tableBody = document.querySelector("#registrationsTable tbody");
const adminMessage = document.getElementById("adminMessage");
const refreshBtn = document.getElementById("refreshBtn");
const exportBtn = document.getElementById("exportBtn");
const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearBtn");

let allRows = []; // local cache

async function loadRegistrations() {
  adminMessage.textContent = "Loading...";
  tableBody.innerHTML = "";
  allRows = [];

  try {
    const q = query(collection(db, "registrations"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      adminMessage.textContent = "No registrations yet.";
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      // createdAt may be null if serverTimestamp hasn't resolved yet — handle it
      const createdAt = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : null;
      allRows.push({
        id: doc.id,
        fullname: data.fullname || "",
        age: data.age || "",
        dob: data.dob || "",
        church: data.church || "",
        phone: data.phone || "",
        email: data.email || "",
        category: data.category || "",
        notes: data.notes || "",
        createdAt
      });
    });

    renderTable(allRows);
    adminMessage.textContent = `Loaded ${allRows.length} registrations.`;
  } catch (err) {
    console.error("Error loading registrations:", err);
    adminMessage.textContent = "Failed to load registrations. Check console.";
  }
}

function renderTable(rows) {
  tableBody.innerHTML = "";
  if (!rows.length) {
    tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:18px;color:var(--muted)">No results</td></tr>`;
    return;
  }

  const rowsHtml = rows.map(r => {
    const created = r.createdAt ? r.createdAt.toLocaleString() : "—";
    return `<tr>
      <td>${escapeHtml(r.fullname)}</td>
      <td>${escapeHtml(String(r.age))}</td>
      <td>${escapeHtml(r.dob || "")}</td>
      <td>${escapeHtml(r.church)}</td>
      <td>${escapeHtml(r.phone)}</td>
      <td>${escapeHtml(r.email)}</td>
      <td>${escapeHtml(r.category)}</td>
      <td>${escapeHtml(r.notes)}</td>
      <td>${escapeHtml(created)}</td>
    </tr>`;
  }).join("");
  tableBody.innerHTML = rowsHtml;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Basic client-side search
searchInput.addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) {
    renderTable(allRows);
    return;
  }
  const filtered = allRows.filter(r =>
    (r.fullname || "").toLowerCase().includes(q) ||
    (r.church || "").toLowerCase().includes(q) ||
    (r.phone || "").toLowerCase().includes(q) ||
    (r.email || "").toLowerCase().includes(q) ||
    (r.category || "").toLowerCase().includes(q)
  );
  renderTable(filtered);
});

// Export CSV
exportBtn.addEventListener("click", () => {
  if (!allRows.length) return;
  const headers = ["Full name","Age","DOB","Church","Phone","Email","Category","Notes","Registered at"];
  const csvRows = [headers.join(",")];

  allRows.forEach(r => {
    const created = r.createdAt ? r.createdAt.toISOString() : "";
    const row = [
      quoteCsv(r.fullname),
      quoteCsv(String(r.age)),
      quoteCsv(r.dob || ""),
      quoteCsv(r.church),
      quoteCsv(r.phone),
      quoteCsv(r.email),
      quoteCsv(r.category),
      quoteCsv(r.notes),
      quoteCsv(created)
    ];
    csvRows.push(row.join(","));
  });

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `registrations-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

function quoteCsv(str) {
  if (str == null) return '""';
  return `"${String(str).replace(/"/g, '""')}"`;
}

refreshBtn.addEventListener("click", loadRegistrations);
clearBtn.addEventListener("click", () => { allRows = []; tableBody.innerHTML = ""; adminMessage.textContent = ""; });

// initial load
loadRegistrations();