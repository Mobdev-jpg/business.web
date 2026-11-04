# ORVEXA DIGITAL — Firebase account and profile setup (free-plan compatible)

The ORVEXA website is hosted on GitHub Pages. Firebase Authentication manages sign-in, and Cloud Firestore stores each customer's private profile. Profile photos are compressed in the browser and stored inside the customer's own Firestore document. **This implementation does not use Firebase Storage or require Blaze billing.**

## 1. Firebase web app

The Firebase Web app configuration for project `business-bbd02` is saved in `firebase-config.js`. Do not replace it unless Firebase Project settings shows different values.

These are public web-app settings required by the browser SDK. Never commit service-account JSON, Admin SDK private keys, database passwords or other server secrets.

## 2. Authentication

In Firebase Console → Authentication:

1. Under **Sign-in method**, enable **Email/Password**.
2. Enable **Google** if you want the Google sign-in button to work and set a support email.
3. Under **Settings → Authorized domains**, make sure `mobdev-jpg.github.io` is listed.

## 3. Firestore profile database

Create the `(default)` Cloud Firestore database in Production mode.

In Firestore Database → **Rules**, paste the current contents of `firestore.rules` from this repository and click **Publish**.

Each authenticated customer has a private document at `users/{uid}`. The rules allow a customer to read and update only their own profile. The profile contains a name, email, optional business name, short bio, compressed photo data and timestamps. Passwords are never stored in Firestore.

## 4. Profile photos without Firebase Storage

This version intentionally does **not** use Cloud Storage, so you do not need to upgrade from Spark to Blaze or add a billing account for profile-photo uploads.

- Visitors can choose a JPG, PNG or WEBP file smaller than 10 MiB (10 MB).
- The browser resizes the image and converts it to compressed JPEG before saving.
- The compressed data URL must fit within 600,000 characters, leaving headroom under Firestore's 1 MiB document limit.
- The photo is stored in `users/{uid}` in the same private Firestore document as the profile. Firestore rules restrict reads and writes to that account owner.
- The original uploaded file is not retained. The stored profile photo is a smaller, optimised version.
- Large or complex pictures may be compressed substantially; the app may ask for a smaller image if it cannot meet the limit.

Firestore free tier includes 1 GiB stored data, 50,000 document reads per day and 20,000 document writes per day for one eligible database. Usage beyond the free quota can require billing or be unavailable on Spark. Monitor the Firebase Usage and billing dashboard as your site grows.

Official documentation:
- Firestore quotas and document limits: https://firebase.google.com/docs/firestore/quotas
- Firestore pricing and free quota: https://firebase.google.com/docs/firestore/pricing
- Firebase pricing plans: https://firebase.google.com/docs/projects/billing/firebase-pricing-plans

## 5. Publish the profile rules

Copy the entire `firestore.rules` file from this repository into Firebase Console → Firestore Database → **Rules** and click **Publish**. These rules are required for profile reading, editing and photo saving.

There is no `storage.rules` file in this no-Storage setup. Do not create a Firebase Storage bucket for this profile-photo feature.

## 6. Test the account workspace

1. Open https://mobdev-jpg.github.io/business.web/ and hard-refresh with Ctrl+Shift+R.
2. Sign in or create an account. The app loads the signed-in customer's own profile.
3. In **Personal details**, edit the name, business name or bio, then save.
4. Choose **Upload photo** to select a JPG, PNG or WEBP image under 10 MB. The browser compresses it before saving to Firestore.
5. Use **Security** to resend email verification or request a password-reset link.

## Password and privacy

- Passwords are sent directly to Firebase Authentication over HTTPS.
- Passwords are not stored in localStorage, Firestore or website JavaScript.
- Firestore profile documents are private to the matching Firebase Authentication UID through security rules.
- Profile photos are stored as compressed image data in that same private profile document.
- Never commit Firebase service-account files, Admin SDK secrets, private keys or database passwords.

## Current scope

The client workspace includes Overview, Personal details and Security sections; per-user profile data; private compressed profile-photo upload/removal; email verification; password reset; and sign-out. It does not yet include project/order tracking or a customer project-management dashboard.
