# ORVEXA DIGITAL — Firebase account and profile setup

The public website is hosted on GitHub Pages. Firebase Authentication handles sign-in, Firestore stores each customer's private profile, and Cloud Storage stores profile photos.

## 1. Firebase web app

The Firebase Web app configuration for project `business-bbd02` is already saved in `firebase-config.js`. Do not replace it unless Firebase Project settings shows a different web app.

These are public web-app settings required by the browser SDK. Never commit service-account JSON, Admin SDK private keys, database passwords or other server secrets.

## 2. Authentication

In Firebase Console → Authentication:

1. Under **Sign-in method**, enable **Email/Password**.
2. Enable **Google** if you want the Google sign-in button to work and set a support email.
3. Under **Settings → Authorized domains**, make sure `mobdev-jpg.github.io` is listed.

## 3. Firestore profile database

Create the `(default)` Firestore database in Production mode.

In Firestore Database → **Rules**, paste the contents of `firestore.rules` from this repository and click **Publish**.

Each authenticated customer has a document at `users/{uid}`. Rules allow the customer to read and update only their own profile. The profile stores a display name, email, optional business name, short bio, profile-photo path/type and account timestamps. Passwords are never stored in Firestore.

## 4. Profile-photo Storage setup

The profile editor accepts JPG, PNG and WEBP photos smaller than 10 MiB (10 × 1024 × 1024 bytes). The browser validates the file before upload, and Storage rules enforce the same size and image-type limits. Avatar files are kept under `users/{uid}/profile/avatar` and are read through authenticated Firebase requests; the app does not create public download links.

**Billing requirement (important):** This Firebase project was shown on the Spark plan. As of 2026, Cloud Storage for Firebase requires the pay-as-you-go **Blaze** plan, including for new default buckets. Firebase's documentation states that Storage requests from Spark projects can return 402/403 and the bucket will not be accessible. Blaze includes defined no-cost usage allowances, but usage above included allowances can be charged. Review the pricing and link a billing account only if you accept that arrangement. Set a budget alert before enabling it.

Official information:
- https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024
- https://firebase.google.com/pricing

After you are ready to enable Storage:

1. In Firebase Console → **Build → Storage**, choose **Get started** and create the default bucket. Select a location you can keep long-term; the bucket location cannot be changed later.
2. Open Storage → **Rules**.
3. Paste the contents of `storage.rules` from this repository and click **Publish**.
4. Confirm that the bucket name matches `storageBucket` in `firebase-config.js` (currently `business-bbd02.firebasestorage.app`).

Until Storage is activated on a billing-linked project and its rules are published, account sign-in and Firestore profile editing can work, but profile-photo uploads will not.

## 5. Test the account workspace

1. Open https://mobdev-jpg.github.io/business.web/ and hard-refresh with Ctrl+Shift+R.
2. Sign in or create an account. The app opens the signed-in user's own client profile workspace.
3. In **Personal details**, edit the display name, business name or bio, then save.
4. In the left profile area, choose **Upload photo** to select a JPG, PNG or WEBP image smaller than 10 MiB.
5. Use **Security** to resend email verification or request a password-reset link.

## Password and key handling

- Passwords are sent directly to Firebase Authentication over HTTPS.
- Passwords are not written to localStorage, Firestore or the website's JavaScript files.
- Firestore user documents are protected by UID-based rules.
- Profile photos are private to the signed-in UID through Storage rules.
- Never commit Firebase service-account files, Admin SDK secrets, private keys or database passwords.

## Current scope

The client workspace includes Overview, Personal details and Security sections; per-user profile data; private profile-photo upload/removal; email verification; password reset; and sign-out. It is not yet a project-management dashboard and does not claim to show project orders or enquiry history.
