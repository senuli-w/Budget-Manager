# Budget Manager - Setup Guide

## PIN-first Login (PIN: 1644)

Budget Manager uses a single shared PIN (`1644`) so you can unlock the app from any device without managing usernames. The PIN is simply the password for the Firebase user `user@budgetmanager.app`, and it lives only in Firebase (the app only references it for documentation purposes).

### Step 1: Enable Email/Password Authentication in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **budgetmanager-21858**
3. Open the **Authentication** section
4. Switch to the **Sign-in method** tab
5. Turn on **Email/Password**
6. Click **Save**

### Step 2: Ensure the shared account uses PIN 1644

The app expects a single Firebase user with the email `user@budgetmanager.app` and the PIN `1644` as the password. Configure the account using one of these options:

#### Option A: Firebase Console (recommended)

1. Visit Authentication → Users in Firebase
2. Click **Add user** (or edit the existing user)
3. Email: `user@budgetmanager.app`
4. Password: `1644`
5. Save the user

If the user already exists, edit the record and reset the password to `1644` so every device can reuse the same PIN.

#### Option B: Firebase CLI (advanced)

1. Install Firebase tools:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
2. Create `setup-user.js`:
   ```javascript
   const admin = require('firebase-admin');
   const serviceAccount = require('./path/to/serviceAccountKey.json');

   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount)
   });

   async function updatePin() {
     try {
       await admin.auth().updateUser('user@budgetmanager.app', {
         password: '1644'
       });
       console.log('PIN reset to 1644');
     } catch (error) {
       console.error('Failed to update PIN', error);
     }
   }

   updatePin();
   ```
3. Run `node setup-user.js` to reset the PIN in Firebase.

### Step 3: Update Firestore security rules

Paste the following rules in the **Rules** tab so only the authenticated user may access the data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null
                       && request.auth.token.email == 'user@budgetmanager.app';
    }
  }
}
```

Click **Publish**.

### Step 4: (Optional) Clear any anonymous data

If you previously used anonymous storage, delete any documents whose `userId` does not match the new Firebase user. You may also delete the entire `accounts`, `transactions`, and `budgets` collections and start fresh.

### Step 5: Test the PIN login

1. Open the Budget Manager app (locally or via https://senuli-w.github.io/Budget-Manager/)
2. The login screen now prompts for a PIN
3. Enter **1644**
4. You should see your synced dashboard and data

### Step 6: Daily usage

- Sessions persist for 1 week; after that the app will ask for PIN 1644 again.
- New devices work instantly—open the app, enter PIN 1644, and your data syncs from Firestore.
- Use the Logout button in the header to sign out manually.

### Updating the PIN

1. Go to Firebase Console → Authentication → Users
2. Locate `user@budgetmanager.app`
3. Click the overflow menu → **Reset password**
4. Enter the new PIN (e.g., `1644`)
5. Update the PIN in `js/config.js` (`USER_PIN` + any references) so the app keeps in sync with Firebase.

### Security notes

- The PIN only exists in Firebase; the app never sends it elsewhere or stores it in plaintext locally.
- Firebase always encrypts your data in transit and at rest.
- Only the user with the PIN can read or write your budget data.
- Offline support keeps your data available; it syncs as soon as you go online.

### Troubleshooting

- **Invalid PIN** → verify that the Firebase user exists and that the password is `1644`.
- **Firebase not initialized** → check the config in `js/config.js` and your internet connection.
- **Data not syncing** → confirm you are logged in and the security rules are published.
- **Session expired** → enter PIN 1644 again; this happens automatically every 7 days.

### Mobile and deployment notes

- The UI is mobile-first and installable as a PWA.
- The same PIN works in the browser and inside the installed app.
- Your live deployment is available at https://senuli-w.github.io/Budget-Manager/.

Need more help? Check the browser console, Firebase rules, or open `PWA_GUIDE.md` for detailed troubleshooting steps.
