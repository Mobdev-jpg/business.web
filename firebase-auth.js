import { firebaseConfig } from "./firebase-config.js?v=20261104-profile";
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, sendPasswordResetEmail, sendEmailVerification, onAuthStateChanged,
  GoogleAuthProvider, signInWithPopup, updateProfile
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp
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
  const closeButtons = document.querySelectorAll("[data-auth-close]");
  const signOutButton = document.querySelector("[data-auth-signout]");
  const profileTabs = [...document.querySelectorAll("[data-profile-tab]")];
  const profileViews = [...document.querySelectorAll("[data-profile-view]")];
  const profileName = document.querySelector("[data-profile-name]");
  const profileEmail = document.querySelector("[data-profile-email-input]");
  const profileBusiness = document.querySelector("[data-profile-business]");
  const profileBio = document.querySelector("[data-profile-bio]");
  const profileForm = document.querySelector("[data-profile-form]");
  const profileSaveButton = document.querySelector("[data-profile-save]");
  const profileFileInput = document.querySelector("#profile-avatar-file");
  const profilePickButton = document.querySelector("[data-profile-pick]");
  const profileRemoveButton = document.querySelector("[data-profile-remove]");
  const profileAvatar = document.querySelector("[data-profile-avatar]");
  const profileFallback = document.querySelector("[data-profile-avatar-fallback]");
  const profileMiniAvatar = document.querySelector("[data-profile-mini-avatar]");
  const profileStatus = document.querySelector("[data-profile-status]");
  const profileFormStatus = document.querySelector("[data-profile-form-status]");
  const profileSecurityStatus = document.querySelector("[data-profile-security-status]");
  const profileCurrentSection = document.querySelector("[data-profile-current-section]");
  const MAX_AVATAR_BYTES = 10 * 1024 * 1024;
  const MAX_STORED_AVATAR_CHARS = 600000;
  const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

  let mode = "signin";
  let auth = null;
  let db = null;
  let currentUser = null;
  let currentProfile = null;
  let profileLoadCounter = 0;

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

  const setStatus = (element, text, state = "") => {
    if (!element) return;
    element.textContent = text;
    element.dataset.state = state;
  };

  const displayNameFor = (user, profile = {}) =>
    profile.displayName || user?.displayName || (user?.email ? user.email.split("@")[0] : "Client");

  const initialsFor = (value) => {
    const words = String(value || "ORVEXA").trim().split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map(word => word[0].toUpperCase()).join("") || "OD";
  };

  const showAvatarFallback = (user, profile = {}) => {
    const initials = initialsFor(displayNameFor(user, profile));
    if (profileFallback) {
      profileFallback.textContent = initials;
      profileFallback.hidden = false;
    }
    if (profileMiniAvatar) profileMiniAvatar.textContent = initials;
    if (profileAvatar) {
      profileAvatar.hidden = true;
      profileAvatar.removeAttribute("src");
    }
  };

  const renderAvatarFromData = (data, user, profile = {}) => {
    if (typeof data !== "string" || data.length > MAX_STORED_AVATAR_CHARS ||
        !data.startsWith("data:image/jpeg;base64,")) {
      showAvatarFallback(user, profile);
      return false;
    }
    if (profileAvatar) {
      profileAvatar.src = data;
      profileAvatar.hidden = false;
    }
    if (profileFallback) profileFallback.hidden = true;
    if (profileMiniAvatar) profileMiniAvatar.textContent = initialsFor(displayNameFor(user, profile));
    return true;
  };

  const renderProfileFields = (user, profile) => {
    const displayName = displayNameFor(user, profile);
    if (profileName) profileName.value = profile.displayName || user.displayName || "";
    if (profileEmail) profileEmail.value = user.email || profile.email || "";
    if (profileBusiness) profileBusiness.value = profile.businessName || "";
    if (profileBio) profileBio.value = profile.bio || "";

    document.querySelectorAll("[data-profile-side-name]").forEach(el => el.textContent = displayName);
    document.querySelectorAll("[data-profile-side-email]").forEach(el => el.textContent = user.email || "");
    document.querySelectorAll("[data-profile-greeting]").forEach(el => el.textContent = displayName.split(/\s+/)[0] || "there");

    const createdAt = profile.createdAt?.toDate
      ? profile.createdAt.toDate()
      : (user.metadata?.creationTime ? new Date(user.metadata.creationTime) : null);
    const memberSince = createdAt && !Number.isNaN(createdAt.getTime())
      ? new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(createdAt)
      : "Recently";
    document.querySelectorAll("[data-profile-member-since]").forEach(el => el.textContent = memberSince);

    const verified = Boolean(user.emailVerified);
    document.querySelectorAll("[data-profile-verification]").forEach(el => el.textContent = verified ? "Verified" : "Pending");
    document.querySelectorAll("[data-profile-verification-note]").forEach(el => el.textContent = verified ? "Your email is confirmed" : "Verify your email for extra security");
    document.querySelectorAll("[data-profile-security-email]").forEach(el => el.textContent = verified ? "Your email address has been verified." : "Your email address has not been verified yet.");
    document.querySelectorAll("[data-profile-security-badge]").forEach(el => {
      el.textContent = verified ? "VERIFIED" : "PENDING";
      el.classList.toggle("is-verified", verified);
    });

    if (!renderAvatarFromData(profile.avatarData, user, profile)) showAvatarFallback(user, profile);
    if (profileRemoveButton) profileRemoveButton.hidden = !profile.avatarData;
  };

  const setProfileView = (viewName) => {
    profileTabs.forEach(button => {
      const active = button.dataset.profileTab === viewName;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
    profileViews.forEach(view => {
      view.hidden = view.dataset.profileView !== viewName;
    });
    if (profileCurrentSection) {
      const names = { overview: "Overview", details: "Personal details", security: "Security" };
      profileCurrentSection.textContent = names[viewName] || "Overview";
    }
  };

  const openModal = () => {
    modal.hidden = false;
    document.body.classList.add("auth-open");
    if (currentUser) setProfileView("overview");
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
      "auth/email-already-in-use": "This email already has an account. Switch to Sign in or reset your password.",
      "auth/invalid-email": "Enter a valid email address.",
      "auth/invalid-credential": "Email or password is incorrect.",
      "auth/user-not-found": "No account was found for this email. Create an account first.",
      "auth/wrong-password": "The password is incorrect. Try again or reset your password.",
      "auth/user-disabled": "This account has been disabled. Contact ORVEXA.",
      "auth/weak-password": "Choose a stronger password with at least 8 characters.",
      "auth/too-many-requests": "Too many attempts. Wait a little and try again.",
      "auth/popup-closed-by-user": "The Google sign-in window was closed before completion.",
      "auth/popup-blocked": "Allow pop-ups for this website, then try Google sign-in again.",
      "auth/operation-not-allowed": "This sign-in method is disabled. Enable it under Firebase → Authentication → Sign-in method.",
      "auth/unauthorized-domain": "Add mobdev-jpg.github.io under Firebase → Authentication → Settings → Authorized domains.",
      "auth/configuration-not-found": "Firebase Authentication is not configured. Check your Firebase project settings.",
      "auth/api-key-not-valid": "Firebase rejected the web API key. Check its API restrictions and project association.",
      "auth/invalid-api-key": "Firebase rejected the web API key. Check its API restrictions and project association.",
      "auth/network-request-failed": "The request could not reach Firebase. Check your connection and browser extensions.",
      "permission-denied": "Firestore denied this profile action. Publish the latest firestore.rules file from the repository.",
      "unavailable": "Firestore is temporarily unavailable. Try again in a moment.",
      "resource-exhausted": "Firestore's free storage or document-write quota has been reached. Try again later or reduce stored profile data.",
      "invalid-argument": "Firestore rejected this profile update. The compressed image may still be too large.",
      "failed-precondition": "Firestore needs a project setup change before it can save this profile."
    };
    return (errors[code] || "Firebase could not complete the request.") + " (Error code: " + code + ")";
  };

  const profileReference = (user) => doc(db, "users", user.uid);

  const ensureUserProfile = async (user) => {
    if (!db) throw new Error("Firestore is not initialised.");
    const reference = profileReference(user);
    let snapshot = await getDoc(reference);
    if (!snapshot.exists()) {
      await setDoc(reference, {
        displayName: user.displayName || "",
        email: user.email || "",
        businessName: "",
        bio: "",
        avatarData: "",
        avatarType: "",
        createdAt: serverTimestamp()
      });
      snapshot = await getDoc(reference);
    } else {
      // Migrate profile documents created by the earlier login-only version.
      const existing = snapshot.data() || {};
      const migration = {};
      if (typeof existing.businessName !== "string") migration.businessName = "";
      if (typeof existing.bio !== "string") migration.bio = "";
      if (typeof existing.avatarData !== "string") migration.avatarData = "";
      if (typeof existing.avatarType !== "string") migration.avatarType = "";
      // Old Storage paths are no longer used by the free Firestore-based avatar flow.
      if (typeof existing.avatarPath === "string" && existing.avatarPath) migration.avatarPath = "";
      if (Object.keys(migration).length) {
        migration.updatedAt = serverTimestamp();
        await updateDoc(reference, migration);
        snapshot = await getDoc(reference);
      }
    }
    return snapshot.data() || {};
  };

  const loadPrivateAvatar = async (user, profile, requestId) => {
    if (requestId !== profileLoadCounter || currentUser?.uid !== user.uid) return false;
    if (!profile.avatarData) {
      showAvatarFallback(user, profile);
      if (profileRemoveButton) profileRemoveButton.hidden = true;
      return true;
    }
    const rendered = renderAvatarFromData(profile.avatarData, user, profile);
    if (profileRemoveButton) profileRemoveButton.hidden = !rendered;
    if (!rendered) {
      setStatus(profileStatus, "This saved profile photo is not in the supported format. Upload a new photo.", "error");
    }
    return rendered;
  };

  const loadAccountProfile = async (user) => {
    const requestId = ++profileLoadCounter;
    currentProfile = null;
    setStatus(profileStatus, "Loading your private profile…");
    try {
      const profile = await ensureUserProfile(user);
      if (requestId !== profileLoadCounter || currentUser?.uid !== user.uid) return;
      currentProfile = profile;
      renderProfileFields(user, profile);
      const avatarLoaded = await loadPrivateAvatar(user, profile, requestId);
      if (requestId === profileLoadCounter && !profile.avatarData) {
        setStatus(profileStatus, "Your private account is ready.");
      } else if (requestId === profileLoadCounter && avatarLoaded) {
        setStatus(profileStatus, "Your account and profile photo are loaded.");
      }
    } catch (error) {
      console.error("ORVEXA profile load failed:", error?.code || error);
      setStatus(profileStatus, "Your login is active, but profile data could not load. " + friendlyError(error), "error");
    }
  };

  const updateAccountButtons = (user) => {
    accountButtons.forEach(button => {
      button.innerHTML = user ? "My account <span>↗</span>" : "Sign in <span>↗</span>";
      button.setAttribute("aria-label", user ? "Open my account" : "Sign in");
    });
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
  profileTabs.forEach(button => button.addEventListener("click", () => setProfileView(button.dataset.profileTab)));

  if (!configured) {
    setMode("signin");
  } else {
    try {
      const app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);

      onAuthStateChanged(auth, async user => {
        currentUser = user || null;
        const signedIn = Boolean(user);
        guestPanel.hidden = signedIn;
        userPanel.hidden = !signedIn;
        updateAccountButtons(user);

        if (signedIn) {
          await loadAccountProfile(user);
          if (profileSecurityStatus) setStatus(profileSecurityStatus, "");
        } else {
          profileLoadCounter++;
          currentProfile = null;
          if (profileAvatar) {
            profileAvatar.hidden = true;
            profileAvatar.removeAttribute("src");
          }
          if (profileFallback) profileFallback.hidden = false;
          setStatus(profileStatus, "");
          setStatus(profileFormStatus, "");
          setStatus(profileSecurityStatus, "");
        }
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
        closeModal();
      } catch (error) {
        setStatus(profileStatus, friendlyError(error), "error");
      } finally {
        signOutButton.disabled = false;
      }
    });
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!configured || !auth) {
      setMessage("Firebase is not connected. Check firebase-config.js and Firebase Authentication settings.", "error");
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
          try { await updateProfile(credential.user, { displayName: fullName }); }
          catch (error) { console.error("ORVEXA display name update failed:", error?.code || error); }
        }
        try {
          await sendEmailVerification(credential.user);
          setStatus(profileStatus, "Account created. A verification link has been sent to your email.", "success");
        } catch (error) {
          setStatus(profileStatus, "Account created. Email verification could not be sent right now.", "error");
        }
        form.reset();
        resetPasswordVisibility();
        // onAuthStateChanged opens this user's own profile automatically.
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        form.reset();
        resetPasswordVisibility();
        // onAuthStateChanged loads the signed-in user's private profile.
      }
    } catch (error) {
      setMessage(friendlyError(error), "error");
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = mode === "signup" ? "Create account <span>↗</span>" : "Sign in <span>↗</span>";
    }
  });

  if (profileForm) {
    profileForm.addEventListener("submit", async event => {
      event.preventDefault();
      if (!currentUser || !db) {
        setStatus(profileFormStatus, "Sign in again to update your profile.", "error");
        return;
      }
      if (!profileForm.reportValidity()) return;
      const displayName = String(profileName.value || "").trim();
      const businessName = String(profileBusiness.value || "").trim();
      const bio = String(profileBio.value || "").trim();
      if (!displayName) {
        setStatus(profileFormStatus, "Enter your name before saving.", "error");
        return;
      }

      profileSaveButton.disabled = true;
      profileSaveButton.textContent = "Saving…";
      setStatus(profileFormStatus, "");
      try {
        await updateProfile(currentUser, { displayName });
        await updateDoc(profileReference(currentUser), {
          displayName,
          businessName,
          bio,
          updatedAt: serverTimestamp()
        });
        currentProfile = { ...(currentProfile || {}), displayName, businessName, bio };
        renderProfileFields(currentUser, currentProfile);
        setStatus(profileFormStatus, "Your profile has been saved.", "success");
      } catch (error) {
        console.error("ORVEXA profile update failed:", error?.code || error);
        setStatus(profileFormStatus, friendlyError(error), "error");
      } finally {
        profileSaveButton.disabled = false;
        profileSaveButton.innerHTML = "Save changes <span>↗</span>";
      }
    });
  }

  const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("The image could not be read by this browser."));
    reader.readAsDataURL(blob);
  });

  const canvasToJpeg = (canvas, quality) => new Promise(resolve => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });

  const compressProfilePhoto = async (file) => {
    const bitmap = await createImageBitmap(file);
    try {
      const sizes = [640, 560, 480, 400, 320, 256];
      const qualities = [0.82, 0.72, 0.62, 0.52, 0.42, 0.34];
      for (const maxSide of sizes) {
        const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("This browser cannot process the selected image.");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(bitmap, 0, 0, width, height);

        for (const quality of qualities) {
          const blob = await canvasToJpeg(canvas, quality);
          if (!blob) continue;
          const dataUrl = await blobToDataUrl(blob);
          if (dataUrl.length <= MAX_STORED_AVATAR_CHARS) {
            return { dataUrl, type: "image/jpeg" };
          }
        }
      }
    } finally {
      bitmap.close?.();
    }
    throw new Error("This image could not be compressed small enough. Choose a smaller or simpler picture.");
  };

  if (profilePickButton && profileFileInput) {
    profilePickButton.addEventListener("click", () => profileFileInput.click());
    profileFileInput.addEventListener("change", async () => {
      const file = profileFileInput.files?.[0];
      profileFileInput.value = "";
      if (!file) return;
      if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
        setStatus(profileStatus, "Choose a JPG, PNG or WEBP image.", "error");
        return;
      }
      if (file.size >= MAX_AVATAR_BYTES) {
        setStatus(profileStatus, "Choose an image smaller than 10 MB.", "error");
        return;
      }
      if (!currentUser || !db) {
        setStatus(profileStatus, "Sign in to save your profile photo.", "error");
        return;
      }

      profilePickButton.disabled = true;
      profilePickButton.textContent = "Processing…";
      setStatus(profileStatus, "Compressing your photo for secure, no-Storage saving…");
      try {
        const compressed = await compressProfilePhoto(file);
        await ensureUserProfile(currentUser);
        await updateDoc(profileReference(currentUser), {
          avatarData: compressed.dataUrl,
          avatarType: compressed.type,
          updatedAt: serverTimestamp()
        });
        currentProfile = {
          ...(currentProfile || {}),
          avatarData: compressed.dataUrl,
          avatarType: compressed.type,
          avatarPath: ""
        };
        renderAvatarFromData(compressed.dataUrl, currentUser, currentProfile);
        if (profileRemoveButton) profileRemoveButton.hidden = false;
        setStatus(
          profileStatus,
          "Profile photo saved privately to your account (" + Math.round(compressed.dataUrl.length / 1024) + " KB compressed).",
          "success"
        );
      } catch (error) {
        console.error("ORVEXA Firestore avatar save failed:", error?.code || error?.message || error);
        setStatus(profileStatus, error?.code ? friendlyError(error) : error.message, "error");
      } finally {
        profilePickButton.disabled = false;
        profilePickButton.textContent = "Change photo";
      }
    });
  }

  if (profileRemoveButton) {
    profileRemoveButton.addEventListener("click", async () => {
      if (!currentUser || !currentProfile?.avatarData || !db) return;
      profileRemoveButton.disabled = true;
      setStatus(profileStatus, "Removing your profile photo…");
      try {
        await updateDoc(profileReference(currentUser), {
          avatarData: "",
          avatarType: "",
          updatedAt: serverTimestamp()
        });
        currentProfile.avatarData = "";
        currentProfile.avatarType = "";
        currentProfile.avatarPath = "";
        showAvatarFallback(currentUser, currentProfile);
        profileRemoveButton.hidden = true;
        setStatus(profileStatus, "Your profile photo has been removed.", "success");
      } catch (error) {
        console.error("ORVEXA avatar removal failed:", error?.code || error);
        setStatus(profileStatus, friendlyError(error), "error");
      } finally {
        profileRemoveButton.disabled = false;
      }
    });
  }

  const resetPasswordForCurrentUser = async () => {
    if (!currentUser?.email || !auth) {
      setStatus(profileSecurityStatus, "Your account email is unavailable. Sign in again.", "error");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      setStatus(profileSecurityStatus, "A password reset link has been sent if the email address is registered.", "success");
    } catch (error) {
      setStatus(profileSecurityStatus, friendlyError(error), "error");
    }
  };

  document.querySelector("[data-profile-reset]")?.addEventListener("click", resetPasswordForCurrentUser);
  document.querySelector("[data-profile-verify]")?.addEventListener("click", async () => {
    if (!currentUser) return;
    if (currentUser.emailVerified) {
      setStatus(profileSecurityStatus, "Your email is already verified.", "success");
      return;
    }
    try {
      await sendEmailVerification(currentUser);
      setStatus(profileSecurityStatus, "Verification email sent. Check your inbox.", "success");
    } catch (error) {
      setStatus(profileSecurityStatus, friendlyError(error), "error");
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
      await signInWithPopup(auth, new GoogleAuthProvider());
      // onAuthStateChanged loads the Google user's own profile document.
    } catch (error) {
      setMessage(friendlyError(error), "error");
    } finally {
      googleButton.disabled = false;
    }
  });

  setProfileView("overview");
}
