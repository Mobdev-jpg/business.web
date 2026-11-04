import { firebaseConfig } from "./firebase-config.js?v=20261104-2";
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
  const accountStatus = document.querySelector("[data-auth-user-status]");
  const closeButtons = document.querySelectorAll("[data-auth-close]");
  const signOutButton = document.querySelector("[data-auth-signout]");
  let mode = "signin";
  let auth = null;
  let db = null;
  let configured = Boolean(
    firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("YOUR_") &&
    firebaseConfig.authDomain && !firebaseConfig.authDomain.startsWith("YOUR_") &&
    firebaseConfig.projectId && !firebaseConfig.projectId.startsWith("YOUR_") &&
    firebaseConfig.appId && !firebaseConfig.appId.startsWith("YOUR_")
  );
  let accountStatusText = "Signed in.";

  const setMessage = (text, state = "") => {
    if (!message) return;
    message.textContent = text;
    message.dataset.state = state;
  };

  const setAccountStatus = (text) => {
    accountStatusText = text;
    if (accountStatus) accountStatus.textContent = text;
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

  const resetPasswordVisibility = () => {
    document.querySelectorAll("[data-password-toggle]").forEach(button => {
      const fieldName = button.dataset.passwordToggle;
      const input = form.elements.namedItem(fieldName);
      const icons = button.querySelectorAll("svg");
      if (input) input.type = "password";
      if (icons[0]) icons[0].hidden = false;
      if (icons[1]) icons[1].hidden = true;
      const label = fieldName === "confirmPassword" ? "confirmation password" : "password";
      button.setAttribute("aria-label", "Show " + label);
      button.title = "Show " + label;
    });
  };

  document.querySelectorAll("[data-password-toggle]").forEach(button => {
    button.addEventListener("click", () => {
      const fieldName = button.dataset.passwordToggle;
      const input = form.elements.namedItem(fieldName);
      if (!input) return;
      const visible = input.type === "password";
      input.type = visible ? "text" : "password";
      const icons = button.querySelectorAll("svg");
      if (icons[0]) icons[0].hidden = visible;
      if (icons[1]) icons[1].hidden = !visible;
      const label = fieldName === "confirmPassword" ? "confirmation password" : "password";
      button.setAttribute("aria-label", (visible ? "Hide " : "Show ") + label);
      button.title = (visible ? "Hide " : "Show ") + label;
    });
  });

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
    form.elements.password.autocomplete = signup ? "new-password" : "current-password";
    title.textContent = signup ? "Create your account." : "Welcome back.";
    subtitle.textContent = signup
      ? "Set up your ORVEXA client account."
      : "Sign in to access your account.";
    submitButton.innerHTML = signup ? "Create account <span>↗</span>" : "Sign in <span>↗</span>";
    forgotButton.hidden = signup;
    resetPasswordVisibility();
    setMessage(configured ? "" : "Firebase is not connected. Check firebase-config.js.");
  };

  const friendlyError = (error) => {
    const code = error?.code || "unknown";
    const errors = {
      "auth/email-already-in-use": "This email already has an account. Switch to Sign in and use the same password, or reset it.",
      "auth/invalid-email": "Enter a valid email address.",
      "auth/invalid-credential": "Email or password is incorrect.",
      "auth/user-not-found": "No account was found for this email. Create an account first.",
      "auth/wrong-password": "The password is incorrect. Try again or reset your password.",
      "auth/user-disabled": "This account has been disabled. Contact ORVEXA.",
      "auth/weak-password": "Choose a stronger password with at least 8 characters.",
      "auth/too-many-requests": "Too many attempts. Wait a little and try again.",
      "auth/popup-closed-by-user": "The Google sign-in window was closed before completion.",
      "auth/popup-blocked": "Allow pop-ups for this website, then try Google sign-in again.",
      "auth/operation-not-allowed": "This sign-in method is disabled. In Firebase, open Authentication → Sign-in method and enable it.",
      "auth/unauthorized-domain": "Firebase rejected this website domain. Add mobdev-jpg.github.io under Authentication → Settings → Authorized domains.",
      "auth/configuration-not-found": "Firebase Authentication is not configured. Check the project's Authentication settings.",
      "auth/api-key-not-valid": "The Firebase API key is invalid. Check firebase-config.js against Project settings → Your apps.",
      "auth/invalid-api-key": "The Firebase API key is invalid. Check firebase-config.js against Project settings → Your apps.",
      "auth/network-request-failed": "The request could not reach Firebase. Check your internet connection, browser extensions and network restrictions.",
      "auth/email-change-needs-verification": "Firebase needs you to verify the email address before changing it.",
      "permission-denied": "Firebase Authentication may have created the account, but Firestore denied the profile save. Check that the ORVEXA Firestore rules were published.",
      "unavailable": "Firestore is temporarily unavailable. Your sign-in may still work; please try again."
    };
    return (errors[code] || "Firebase could not complete the request.") + " (Error code: " + code + ")";
  };

  const ensureProfile = async (user, displayName = "") => {
    if (!db) throw new Error("Firestore is not initialised.");
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

  const trySaveProfile = async (user, displayName = "") => {
    try {
      await ensureProfile(user, displayName);
      return true;
    } catch (error) {
      // Authentication must not be reported as failed if profile storage is unavailable.
      console.error("ORVEXA profile save failed:", error?.code || error?.message || error);
      return false;
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
      try {
        db = getFirestore(app);
      } catch (error) {
        console.error("ORVEXA Firestore initialisation failed:", error?.code || error);
      }

      onAuthStateChanged(auth, user => {
        const signedIn = Boolean(user);
        guestPanel.hidden = signedIn;
        userPanel.hidden = !signedIn;
        emailView.textContent = user?.email || "";
        if (signedIn) setAccountStatus(accountStatusText);
        accountButtons.forEach(button => {
          button.innerHTML = signedIn ? "My account" : "Sign in <span>↗</span>";
          button.setAttribute("aria-label", signedIn ? "Open account" : "Sign in");
        });
      }, error => {
        setMessage(friendlyError(error), "error");
      });

      setMode("signin");
    } catch (error) {
      configured = false;
      setMode("signin");
      setMessage("Firebase could not initialise. " + friendlyError(error), "error");
    }
  }

  if (signOutButton) {
    signOutButton.addEventListener("click", async () => {
      signOutButton.disabled = true;
      try {
        await signOut(auth);
        setAccountStatus("You have signed out.");
        closeModal();
      } catch (error) {
        setAccountStatus(friendlyError(error));
      } finally {
        signOutButton.disabled = false;
      }
    });
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!configured || !auth) {
      setMessage("Firebase is not connected. Check firebase-config.js and the Firebase web app settings.", "error");
      return;
    }
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    const fullName = String(data.get("fullName") || "").trim();

    if (mode === "signup" && password !== String(data.get("confirmPassword") || "")) {
      setMessage("The passwords do not match.", "error");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = mode === "signup" ? "Creating account…" : "Signing in…";
    setMessage("");

    try {
      if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(auth, email, password);

        if (fullName) {
          try {
            await updateProfile(credential.user, { displayName: fullName });
          } catch (error) {
            console.error("ORVEXA display name update failed:", error?.code || error);
          }
        }

        const profileSaved = await trySaveProfile(credential.user, fullName);
        let verificationSent = false;
        try {
          await sendEmailVerification(credential.user);
          verificationSent = true;
        } catch (error) {
          console.error("ORVEXA verification email could not be sent:", error?.code || error);
        }

        form.reset();
        resetPasswordVisibility();
        setAccountStatus(
          "Account created successfully. " +
          (verificationSent ? "Check your inbox to verify your email. " : "Email verification could not be sent right now. ") +
          (profileSaved ? "Your private profile is saved." : "Your login works, but profile storage needs a Firestore rules check.")
        );
      } else {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        setAccountStatus("Signed in successfully. " + (credential.user.emailVerified ? "Your email is verified." : "Your email is not verified yet."));
        form.reset();
        resetPasswordVisibility();
      }
    } catch (error) {
      setMessage(friendlyError(error), "error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = mode === "signup" ? "Create account <span>↗</span>" : "Sign in <span>↗</span>";
    }
  });

  forgotButton.addEventListener("click", async () => {
    if (!configured || !auth) {
      setMessage("Firebase is not connected. Check firebase-config.js.", "error");
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
      setMessage("If an account exists for this email, password reset instructions have been sent.", "success");
    } catch (error) {
      setMessage(friendlyError(error), "error");
    }
  });

  googleButton.addEventListener("click", async () => {
    if (!configured || !auth) {
      setMessage("Firebase is not connected. Check firebase-config.js.", "error");
      return;
    }
    googleButton.disabled = true;
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const profileSaved = await trySaveProfile(result.user);
      setAccountStatus("Signed in with Google. " + (profileSaved ? "Your private profile is saved." : "Profile storage needs a Firestore rules check."));
    } catch (error) {
      setMessage(friendlyError(error), "error");
    } finally {
      googleButton.disabled = false;
    }
  });
}
