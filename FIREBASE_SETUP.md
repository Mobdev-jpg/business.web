# ORVEXA DIGITAL — Firebase account setup

The website is hosted on GitHub Pages. GitHub Pages serves static files; Firebase provides the authentication and database services used by the account modal.

## 1. Create and configure Firebase

1. Open https://console.firebase.google.com/ and create a Firebase project.
2. In **Project settings → General → Your apps**, register a **Web app** and copy its web configuration.
3. In **Authentication → Sign-in method**, enable **Email/Password**. Enable **Google** only if you want the Google button to work; configure the support email when prompted.
4. In **Authentication → Settings → Authorized domains**, add `mobdev-jpg.github.io`.
5. In **Firestore Database**, create a database. Start in production mode.

## 2. Connect the web app configuration

Open `firebase-config.js` in this repository and replace the placeholder values with the Web app values for:
- `apiKey`
- `authDomain`
- `projectId`
- `appId`

These are Firebase **public web-app configuration values**, not database passwords or admin credentials. Firebase's web SDK requires them in the browser. Do not add a service-account JSON file, Admin SDK private key, database password, or other server secret to this repository.

## 3. Apply database security rules

In Firebase Console → Firestore Database → **Rules**, paste the contents of `firestore.rules` from this repository and click **Publish**.

These rules allow each signed-in user to create and access only their own `users/{uid}` profile document. Other documents are denied by default.

## 4. Test the account flow

1. Open https://mobdev-jpg.github.io/business.web/ and hard-refresh.
2. Select **Sign in** in the top navigation.
3. Create a test account with an email you can access and a password of at least 8 characters.
4. Check your inbox for the Firebase verification email, then test sign-in and password reset.

## Password and key handling

- Passwords are sent directly to Firebase Authentication over HTTPS. This site does not write passwords to localStorage, Firestore, or its own JavaScript files.
- The browser only receives Firebase's public web configuration. Firebase Authentication manages account credentials and sessions.
- Never commit Firebase service-account files, Admin SDK secrets, private keys, or database passwords.
- The Firestore security rules are essential. A public Firebase API key is not a substitute for database access rules.

## Current scope

This adds account registration, sign-in, Google sign-in (after enabling it in Firebase), password reset, email verification, persistent Firebase sessions, and a private user-profile record. It does not yet add a customer dashboard, project/order management, or shared public reviews.
