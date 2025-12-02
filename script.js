// script.js
import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Helper: retry a promise-returning function with exponential backoff
async function withRetry(fn, attempts = 3, baseDelay = 500, onAttempt) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    const attemptNum = i + 1;
    if (typeof onAttempt === "function") {
      try { onAttempt(attemptNum); } catch (e) { }
    }
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const code = err && err.code ? String(err.code).toLowerCase() : "";
      const msg = err && err.message ? String(err.message).toLowerCase() : "";
      const isTransient = /unavailable|deadline-exceeded|resource-exhausted|aborted|internal|network|reset/.test(code + " " + msg);
      if (!isTransient) throw err;

      const delay = baseDelay * Math.pow(2, i) + Math.floor(Math.random() * 200);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw lastErr;
}

const form = document.getElementById("registrationForm");
const submitBtn = document.getElementById("submitBtn");
const formMessage = document.getElementById("formMessage");

// Debug: Check if form element is found
console.log("Form loaded:", form);

function validateForm(values) {
  const { fullname, age, dob, church, phone, email, category } = values;
  if (!fullname.trim()) return "Please enter full name.";
  if (!age || isNaN(age) || age < 13 || age > 17) return "Age must be between 13 and 17.";
  if (!dob) return "Please provide date of birth.";
  if (!church.trim()) return "Please enter church or parish.";
  if (!phone.trim()) return "Please enter phone number.";
  if (!email.trim()) return "Please enter email address.";
  if (!category) return "Please select a category.";
  return null;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  console.log("🚀 Form SUBMIT triggered");

  submitBtn.disabled = true;
  formMessage.textContent = "Registering...";
  formMessage.style.color = "var(--muted)";
  const originalBtnText = submitBtn.textContent;
  submitBtn.textContent = "Registering…";
  form.setAttribute("aria-busy", "true");

  const slowTimer = setTimeout(() => {
    if (formMessage.textContent === "Registering...") {
      formMessage.textContent = "Still working — this may take a moment.";
    }
  }, 4000);

  const values = {
    fullname: document.getElementById("fullname").value.trim(),
    age: Number(document.getElementById("age").value),
    dob: document.getElementById("dob").value,
    church: document.getElementById("church").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    category: document.getElementById("category").value,
    notes: document.getElementById("notes").value.trim()
  };

  // Debug: Show collected form values
  console.log("Collected values:", values);

  const error = validateForm(values);
  if (error) {
    console.log("❌ Validation error:", error);
    formMessage.textContent = error;
    formMessage.style.color = "crimson";
    submitBtn.disabled = false;
    return;
  }

  try {
    if (!navigator.onLine) {
      console.log("❌ Offline detected!");
      throw new Error("offline");
    }

    console.log("🔥 Attempting to write to Firestore...");

    await withRetry(() =>
      addDoc(collection(db, "registrations"), {
        fullname: values.fullname,
        age: values.age,
        dob: values.dob,
        church: values.church,
        phone: values.phone,
        email: values.email,
        category: values.category,
        notes: values.notes || "",
        createdAt: serverTimestamp()
      })
    , 3, 700, (attempt) => {
      console.log(`⏳ Firestore attempt ${attempt}`);
      formMessage.textContent = `Submitting — attempt ${attempt}...`;
    });

    console.log("✅ Successfully saved to Firestore!");

    formMessage.textContent = `Registration successful — thanks, ${values.fullname.split(" ")[0] || ""}!`;
    formMessage.style.color = "green";
    form.reset();
  } catch (err) {
    console.error("🔥 Firestore addDoc error:", err);

    if (err.message === "offline") {
      formMessage.textContent = "You appear to be offline. Please check your connection and try again.";
    } else {
      formMessage.textContent = `Failed to submit (${err.code || "error"}): ${err.message}`;
    }
    formMessage.style.color = "crimson";
  } finally {
    clearTimeout(slowTimer);
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
    form.removeAttribute("aria-busy");
    setTimeout(() => { formMessage.textContent = ""; }, 8000);
  }
});