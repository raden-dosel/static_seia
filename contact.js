(function () {
  // Initialize once
  if (window.emailjs && !emailjs.__inited) {
    emailjs.init('DcFW85dfsTEQ2FLF3'); // or window.ENV.PUBLIC_KEY
    emailjs.__inited = true;
  }

  // Simple per-email daily rate limit using localStorage
  const DAILY_LIMIT = 3;
  function normalizeEmail(v) { return String(v || '').trim().toLowerCase(); }
  function dayKey(d = new Date()) { return d.toISOString().slice(0,10); }
  function storageGet(k) { try { return window.localStorage.getItem(k); } catch { return null; } }
  function storageSet(k, v) { try { window.localStorage.setItem(k, v); } catch {} }
  function countsKeyForToday() { return `msg_counts:${dayKey()}`; }
  function loadCounts() {
    const raw = storageGet(countsKeyForToday());
    if (!raw) return {};
    try { return JSON.parse(raw) || {}; } catch { return {}; }
  }
  function saveCounts(obj) { storageSet(countsKeyForToday(), JSON.stringify(obj)); }
  function canSendToday(email) {
    const e = normalizeEmail(email);
    if (!e) return false;
    const counts = loadCounts();
    const n = Number(counts[e] || 0);
    return n < DAILY_LIMIT;
  }
  function incrementCount(email) {
    const e = normalizeEmail(email);
    if (!e) return;
    const counts = loadCounts();
    counts[e] = Number(counts[e] || 0) + 1;
    saveCounts(counts);
  }

  function wire() {
    const form = document.getElementById("contact-form");
    const submit = document.getElementById("submit-btn");
    if (!form || !submit) return false;

    // Helpers
    const getField = (id) => form.querySelector(`#${id}`);
    const setError = (id, msg) => {
      const help = form.querySelector(`.error[data-for="${id}"]`);
      const input = getField(id);
      if (help) help.textContent = msg || "";
      if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
    };
    // Track which fields the user has interacted with
    const touched = new Set();

    const validators = {
      name: (v) => v.trim().length >= 2 || "Please enter your name.",
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? true : "Enter a valid email address."),
      subject: (v) => v.trim().length > 0 || "Please add a subject.",
      message: (v) => (v.trim().length >= 10 ? true : "Message should be at least 10 characters."),
    };

    const validateField = (id, show = true) => {
      const input = getField(id);
      if (!input) return true;
      const result = validators[id](input.value);
      if (!show) return result === true;
      if (result === true) { setError(id, ""); return true; }
      setError(id, result);
      return false;
    };

    const update = () => {
      const ids = ["name","email","subject","message"];
      // Only compute validity for the button state; do not show messages here
      const ok = ids.every(id => validateField(id, false));
      submit.disabled = !ok;
      submit.classList.toggle("is-disabled", submit.disabled);
    };

    form.addEventListener("focusin", (e) => {
      const id = e.target && e.target.id;
      if (id && validators[id]) touched.add(id);
    });

    form.addEventListener("input", (e) => {
      const id = e.target && e.target.id;
      if (id && validators[id]) validateField(id, touched.has(id));
      update();
    }, true);
    form.addEventListener("blur", (e) => {
      const id = e.target && e.target.id;
      if (id && validators[id]) { touched.add(id); validateField(id, true); }
    }, true);
    form.addEventListener("change", update, true);
    update(); // initial state

    // Call sendMail on submit
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      // On submit, mark all fields as touched and reveal any errors
      ["name","email","subject","message"].forEach(id => touched.add(id));
      ["name","email","subject","message"].forEach(id => validateField(id, true));
      update();
      if (submit.disabled) return; // stop if still invalid
      // Enforce per-day (3) send limit per email address
      const emailVal = (getField('email') && getField('email').value) || '';
      if (!canSendToday(emailVal)) {
        alert("You've reached the limit of 3 messages for today. Please try again tomorrow.");
        return;
      }
      sendMail();
    });

    return true;
  }

  // Add the function inside the IIFE (above initWhenReady)
  function sendMail (){
    let params = {
      name : document.getElementById("name").value,
      email : document.getElementById("email").value,
      subject : document.getElementById("subject").value,
      message : document.getElementById("message").value
    };
    const btn = document.getElementById("submit-btn");
    const form = document.getElementById("contact-form");
    if (btn) btn.disabled = true;

    emailjs.send("service_egv0l9j","template_dbqbhxo", params)
      .then(res => {
        alert("Your message sent successfully!! " + res.status);
        // Success: increment per-day counter for this email
        incrementCount(params.email);
        // Success: clear the form values and reset validation state
        if (form) {
          form.reset();
          // Clear inline errors and set submit back to disabled until valid again
          ["name","email","subject","message"].forEach(id => {
            const help = document.querySelector(`.error[data-for="${id}"]`);
            if (help) help.textContent = "";
            const el = document.getElementById(id);
            if (el) el.setAttribute("aria-invalid", "false");
          });
        }
        if (btn) { btn.disabled = true; btn.classList.add("is-disabled"); }
      })
      .catch(err => {
        console.error(err);
        alert("Failed to send your message. Please try again later.");
        // Failure: do nothing to the form fields so user input remains
      })
      .finally(() => { if (btn) btn.disabled = false; });
  }

  function initWhenReady() {
    if (wire()) return;
    const root = document.getElementById("contact");
    if (!root) return;
    const mo = new MutationObserver(() => { if (wire()) mo.disconnect(); });
    mo.observe(root, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initWhenReady);
  } else {
    initWhenReady();
  }
})();

