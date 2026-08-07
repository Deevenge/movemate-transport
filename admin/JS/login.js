import { auth } from "../../JS/firebase-config.js";
import {
  getIdTokenResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const form = document.getElementById("adminLoginForm");
const emailInput = document.getElementById("adminEmail");
const passwordInput = document.getElementById("adminPassword");
const button = document.getElementById("adminLoginButton");
const message = document.getElementById("adminLoginMessage");

function showMessage(text, isError = true) {
  if (!message) return;

  message.hidden = false;
  message.textContent = text;
  message.classList.toggle("is-error", isError);
}

function setLoading(isLoading) {
  if (button) {
    button.disabled = isLoading;
    button.textContent = isLoading ? "Signing In..." : "Sign In";
  }
}

async function verifyAdminClaim(user) {
  const token = await getIdTokenResult(user, true);
  return token.claims.admin === true;
}

async function completeAdminLogin(user) {
  const isAdmin = await verifyAdminClaim(user);

  if (!isAdmin) {
    await signOut(auth);
    showMessage("Access Denied");
    return;
  }

  window.location.replace("dashboard.html");
}

if (new URLSearchParams(window.location.search).has("denied")) {
  showMessage("Access Denied");
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  try {
    setLoading(true);
    await completeAdminLogin(user);
  } catch (error) {
    console.error("Unable to verify administrator access:", error);
    await signOut(auth);
    showMessage("Access Denied");
  } finally {
    setLoading(false);
  }
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setLoading(true);
  showMessage("", false);
  if (message) message.hidden = true;

  try {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await completeAdminLogin(credential.user);
  } catch (error) {
    console.error("Unable to sign in administrator:", error);
    await signOut(auth).catch(() => {});
    showMessage(error?.code === "auth/invalid-credential" ? "Invalid email or password." : "Access Denied");
  } finally {
    setLoading(false);
  }
});
