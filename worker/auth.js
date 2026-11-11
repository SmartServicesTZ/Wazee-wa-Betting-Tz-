import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const app = initializeApp({
  apiKey: "AIzaSyCMWh-yKE13mQ-SRA3lDugpHXV1kuVMBK8",
  authDomain: "wazee-wa-betting-tz-e7183.firebaseapp.com",
  projectId: "wazee-wa-betting-tz-e7183",
  messagingSenderId: "790161817035",
  appId: "1:790161817035:web:f217cebf1fca1dcb240a4e"
});
const auth = getAuth(app);
let currentUser = null;
const $ = (id) => document.getElementById(id);
const modal = $("authModal");
const message = (text) => window.toast ? window.toast(text) : alert(text);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
function normalizePhone(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("255") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return "255" + digits.slice(1);
  if (digits.length === 9) return "255" + digits;
  throw new Error("Weka namba sahihi ya Tanzania, mfano 0712345678.");
}
function phoneEmail(value) {
  return normalizePhone(value) + "@phone.wazee-wa-betting-tz.com";
}
function setMode(mode) {
  $("authMode").value = mode;
  $("registerFields").hidden = mode !== "register";
  $("authTitle").textContent = mode === "register" ? "Fungua akaunti" : "Ingia kwenye akaunti";
  $("authSubmit").textContent = mode === "register" ? "Jisajili" : "Ingia";
  $("authError").textContent = "";
  $("tabLogin").classList.toggle("selected", mode === "login");
  $("tabRegister").classList.toggle("selected", mode === "register");
}
function openAuth(mode = "login") {
  setMode(mode);
  modal.hidden = false;
  $("authPhone").focus();
}
window.__openWazeeAuth = () => {
  if (currentUser) {
    if (confirm("Unataka kutoka kwenye akaunti?")) signOut(auth);
  } else openAuth("login");
};
$("loginBtn").addEventListener("click", window.__openWazeeAuth);
$("tabLogin").addEventListener("click", () => setMode("login"));
$("tabRegister").addEventListener("click", () => setMode("register"));
$("closeAuth").addEventListener("click", () => { modal.hidden = true; });
modal.addEventListener("click", (event) => { if (event.target === modal) modal.hidden = true; });
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  $("loginBtn").textContent = user ? (user.displayName || "Akaunti") + " · Toka" : "Ingia / Jisajili";
  if (user) {
    try {
      const token = await user.getIdToken();
      await fetch("/api/v1/me", { headers: { Authorization: "Bearer " + token } });
    } catch (error) { console.error("Profile bootstrap failed", error); }
  }
});
$("authForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("authSubmit");
  button.disabled = true;
  $("authError").textContent = "";
  try {
    const email = phoneEmail($("authPhone").value);
    const password = $("authPassword").value;
    let credential;
    if ($("authMode").value === "register") {
      const first = $("firstName").value.trim();
      const last = $("lastName").value.trim();
      if (!first || !last) throw new Error("Jaza jina la kwanza na la mwisho.");
      if (password.length < 6) throw new Error("Password iwe na angalau herufi/namba 6.");
      credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: first + " " + last });
    } else {
      credential = await signInWithEmailAndPassword(auth, email, password);
    }
    const token = await credential.user.getIdToken();
    const response = await fetch("/api/v1/me", { headers: { Authorization: "Bearer " + token } });
    if (!response.ok) throw new Error("Imeshindikana kuanzisha profile. Jaribu tena.");
    modal.hidden = true;
    $("authPassword").value = "";
    message($("authMode").value === "register" ? "Akaunti imefunguliwa. Karibu!" : "Umeingia kikamilifu.");
  } catch (error) {
    $("authError").textContent = error?.message || "Imeshindikana. Jaribu tena.";
  } finally {
    button.disabled = false;
  }
});
async function apiRequest(path, options = {}) {
  if (!currentUser) throw new Error("Ingia kwanza.");
  const token = await currentUser.getIdToken();
  const headers = { ...(options.headers || {}), Authorization: "Bearer " + token };
  if (options.body) headers["Content-Type"] = "application/json";
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error === "seller_application_already_exists" ? "Tayari una ombi la seller." : data.error || "Ombi halikukamilika.");
  return data;
}
async function loadPosts() {
  const feed = $("feed");
  try {
    const response = await fetch("/api/v1/community/posts");
    const data = await response.json();
    feed.innerHTML = (data.items || []).map((post) => '<div class="listitem"><b>' + escapeHtml(post.author_name || "Mwanachama") + '</b><br>' + escapeHtml(post.body) + '<br><small>' + Number(post.likes_count || 0) + ' likes · ' + Number(post.comments_count || 0) + ' comments</small></div>').join("") || '<div class="empty"><h3>Karibu kwenye jamii</h3><p>Bado hakuna post. Kuwa wa kwanza kushiriki.</p></div>';
  } catch { feed.textContent = "Jamii haipatikani kwa sasa."; }
}
window.post = async () => {
  const input = $("postText");
  const body = input.value.trim();
  if (!body) return;
  if (!currentUser) { openAuth("login"); message("Ingia kwanza ili kuchapisha post."); return; }
  try {
    await apiRequest("/api/v1/community/posts", { method: "POST", body: JSON.stringify({ body }) });
    input.value = "";
    await loadPosts();
    message("Post imechapishwa.");
  } catch (error) { message(error?.message || "Imeshindikana kuchapisha."); }
};
$("sellerForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser) { openAuth("login"); message("Ingia kwanza ili kutuma maombi ya seller."); return; }
  const fields = event.currentTarget.querySelectorAll("input,textarea");
  try {
    await apiRequest("/api/v1/seller-applications", { method: "POST", body: JSON.stringify({ legal_name: fields[0].value, phone: fields[1].value, reason: fields[2].value }) });
    event.currentTarget.reset();
    message("Ombi limetumwa. Status: PENDING.");
  } catch (error) { message(error?.message || "Imeshindikana kutuma ombi."); }
});
loadPosts();
