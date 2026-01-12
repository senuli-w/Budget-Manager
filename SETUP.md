# Budget Manager - Setup Guide

## Username + Password Login

Budget Manager now supports signup/login with a **username** (not an email) and a password. Under the hood, the app maps your username to a synthetic email (example: `senuli` → `senuli@budgetmanager.app`) because Firebase Auth requires an email for email/password accounts.

### Step 1: Enable Email/Password Authentication in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **budgetmanager-21858**
3. Open the **Authentication** section
4. Switch to the **Sign-in method** tab
5. Turn on **Email/Password**
6. Click **Save**

### Step 2: Enable users to sign up

No manual user creation is required.

1. Open the app
2. Tap **Create account**
3. Enter a username and password
4. Use the same username + password on every device

### Step 3: Update Firestore security rules

Paste the following rules in the **Rules** tab so each user can only access their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }

    match /{document=**} {
      allow create: if signedIn() && request.resource.data.userId == request.auth.uid;
      allow read: if signedIn() && resource.data.userId == request.auth.uid;
      allow update: if signedIn()
                    && resource.data.userId == request.auth.uid
                    && request.resource.data.userId == request.auth.uid;
      allow delete: if signedIn() && resource.data.userId == request.auth.uid;
    }
  }
}
```

Click **Publish**.

### Step 4: (Optional) Clear any anonymous data

If you previously used anonymous storage, delete any documents whose `userId` does not match the new Firebase user. You may also delete the entire `accounts`, `transactions`, and `budgets` collections and start fresh.

### Step 5: Test login

1. Open the Budget Manager app (locally or via https://senuli-w.github.io/Budget-Manager/)
2. Create an account (or login)
3. Use the same username + password on your phone and laptop
4. You should see your synced dashboard and data

### Step 6: Daily usage

- Sessions persist for 1 week; after that the app will ask you to login again.
- New devices work instantly—open the app, login, and your data syncs from Firestore.
- Use the Logout button in the header to sign out manually.

### Changing your password

You can reset a user's password from Firebase Console → Authentication → Users.

### Security notes

- Your password is handled by Firebase; the app does not store it locally.
- Firebase always encrypts your data in transit and at rest.
- Only the user with the PIN can read or write your budget data.
- Offline support keeps your data available; it syncs as soon as you go online.

### Troubleshooting

- **Login failed** → verify username and password.
- **Firebase not initialized** → check the config in `js/config.js` and your internet connection.
- **Data not syncing** → confirm you are logged in and the security rules are published.
- **Session expired** → enter PIN 1644 again; this happens automatically every 7 days.

### Mobile and deployment notes

- The UI is mobile-first and installable as a PWA.
- The same PIN works in the browser and inside the installed app.
- Your live deployment is available at https://senuli-w.github.io/Budget-Manager/.

Need more help? Check the browser console, Firebase rules, or open `PWA_GUIDE.md` for detailed troubleshooting steps.
