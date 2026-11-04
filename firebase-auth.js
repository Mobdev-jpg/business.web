import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, sendPasswordResetEmail, sendEmailVerification, onAuthStateChanged,
  GoogleAuthProvider, signInWithPopup, updateProfile
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const modal = document.querySelector("#auth-modal");
if (modal) {
  const form = document.querySelector("#auth-form");
  const guestPanel = document.querySelector(".auth-guest-panel");
  const userPanel = document.querySelector("[data-auth-user-panel]");
  const message = document.querySelector("[data-auth-message]");
  const submitButton = document.querySelector("[data-auth-submit]");
  const googleButton = document.querySelector("[data-auth-google]");
  const accountButtons = document.querySelectorAll("[data-auth-open]");
  const signupFields = [...document.querySelectorAll(".auth-signup-only")];
  const modeButtons = [...document.querySelectorAll("[data-auth-mode]")];
  const forgotButton = document.querySelector("[data-auth-forgot]");
  const title = document.querySelector("[data-auth-title]");
  const subtitle = document.querySelector("[data-auth-subtitle]");
  const emailView = document.querySelector("[data-auth-user-email]");
  const closeButtons = document.querySelectorAll("[data-auth-close]");
  let mode = "signin";
  let auth = null;
  let db = null;
  let configured = Boolean(
    firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("YOUR_") &&
    firebaseConfig.authDomain && !firebaseConfig.authDomain.startsWith("YOUR_") &&
    firebaseConfig.projectId && !firebaseConfig.projectId.startsWith("YOUR_") &&
    firebaseConfig.appId && !firebaseConfig.appId.startsWith("YOUR_")
  );

  const setMessage = (text, state = "") => {
    if (!message) return;
    message.textContent = text;
    message.dataset.state = state;
  };
  const openModal = () => {
    modal.hidden = false;
    document.body.classList.add("auth-open");
    modal.querySelector("[data-auth-close]")?.focus();
  };
  const closeModal = () => {
    modal.hidden = true;
    document.body.classList.remove("auth-open");
  };
  const setMode = (nextMode) => {
    mode = nextMode;
    const signup = mode === "signup";
    modeButtons.forEach(button => {
      const active = button.dataset.authMode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    signupFields.forEach(field => {
      field.hidden = !signup;
      const input = field.querySelector("input");
      if (input) input.required = signup;
    });
    const password = form.elements.password;
    password.autocomplete = signup ? "new-password" : "current-password";
    title.textContent = signup ? "Create your account." : "Welcome back.";
    subtitle.textContent = signup
      ? "Set up your ORVEXA client account."
      : "Sign in to access your account.";
    submitButton.innerHTML = signup ? "Create account <span>↗</span>" : "Sign in <span>↗</span>";
    forgotButton.hidden = signup;
    setMessage(configured ? "" : "Account backend setup is still required. Follow FIREBASE_SETUP.md in the repository.");
  };
  const friendlyError = (error) => {
    const errors = {
      "auth/email-already-in-use": "An account already exists for this email. Sign in instead.",
      "auth/invalid-email": "Enter a valid email address.",
      "auth/invalid-credential": "Email or password is incorrect.",
      "auth/user-disabled": "This account has been disabled. Contact ORVEXA.",
      "auth/weak-password": "Choose a stronger password with at least 8 characters.",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
      "auth/popup-closed-by-user": "The Google sign-in window was closed.",
      "auth/popup-blocked": "Allow pop-ups for this site and try again.",
      "auth/operation-not-allowed": "This sign-in method is not enabled in Firebase yet.",
      "auth/network-request-failed": "Network error. Check your connection and retry."
    };
    return errors[error?.code] || "We could not complete that request. Check your details and try again.";
  };
  const ensureProfile = async (user, displayName = "") => {
    const reference = doc(db, "users", user.uid);
    const existing = await getDoc(reference);
    if (!existing.exists()) {
      await setDoc(reference, {
        displayName: displayName || user.displayName || "",
        email: user.email || "",
        createdAt: serverTimestamp()
      });
    }
  };

  accountButtons.forEach(button => button.addEventListener("click", openModal));
  closeButtons.forEach(button => button.addEventListener("click", closeModal));
  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });
  modeButtons.forEach(button => button.addEventListener("click", () => setMode(button.dataset.authMode)));

  if (!configured) {
    setMode("signin");
  } else {
    try {
      const app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      onAuthStateChanged(auth, user => {
        const signedIn = Boolean(user);
        guestPanel.hidden = signedIn;
        userPanel.hidden = !signedIn;
        emailView.textContent = user?.email || "";
        accountButtons.forEach(button => {
          button.innerHTML = signedIn ? "My account" : "Sign in <span>↗</span>";
          button.setAttribute("aria-label", signedIn ? "Open account" : "Sign in");
        });
        if (signedIn) {
          setMessage("");
          document.querySelector("[data-auth-signout]")?.addEventListener("click", async event => {
            event.currentTarget.disabled = true;
            try {
              await signOut(auth);
              closeModal();
            } catch {
              setMessage("Could not sign out. Please try again.", "error");
              event.currentTarget.disabled = false;
            }
          }, { once: true });
        }
      });
      setMode("signin");
    } catch {
      configured = false;
      setMode("signin");
      setMessage("Firebase could not initialise. Check the web app configuration.", "error");
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!configured || !auth || !db) {
      setMessage("Firebase is not connected yet. Complete the setup in FIREBASE_SETUP.md.", "error");
      return;
    }
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const email = String(data.get("email")).trim();
    const password = String(data.get("password"));
    const fullName = String(data.get("fullName") || "").trim();
    if (mode === "signup" && password !== String(data.get("confirmPassword"))) {
      setMessage("The passwords do not match.", "error");
      return;
    }
    submitButton.disabled = true;
    submitButton.textContent = mode === "signup" ? "Creating account…" : "Signing in…";
    setMessage("");
    try {
      if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (fullName) await updateProfile(credential.user, { displayName: fullName });
        await ensureProfile(credential.user, fullName);
        try { await sendEmailVerification(credential.user); } catch { /* Account remains usable if mail delivery is unavailable. */ }
        setMessage("Account created. Check your inbox for an email verification link.", "success");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setMessage("Signed in successfully.", "success");
      }
      form.reset();
    } catch (error) {
      setMessage(friendlyError(error), "error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = mode === "signup" ? "Create account <span>↗</span>" : "Sign in <span>↗</span>";
    }
  });

  forgotButton.addEventListener("click", async () => {
    if (!configured || !auth) {
      setMessage("Connect Firebase first using the setup guide.", "error");
      return;
    }
    const email = String(form.elements.email.value || "").trim();
    if (!email) {
      setMessage("Enter your email address first, then select Forgot password.", "error");
      form.elements.email.focus();
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset instructions have been sent if the account exists.", "success");
    } catch (error) {
      setMessage(friendlyError(error), "error");
    }
  });

  googleButton.addEventListener("click", async () => {
    if (!configured || !auth || !db) {
      setMessage("Connect Firebase first using the setup guide.", "error");
      return;
    }
    googleButton.disabled = true;
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await ensureProfile(result.user);
      setMessage("Signed in with Google.", "success");
    } catch (error) {
      setMessage(friendlyError(error), "error");
    } finally {
      googleButton.disabled = false;
    }
  });
}
