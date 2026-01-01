# Budget Manager - Setup Guide

## Setting Up Your Password

Your Budget Manager app now uses password authentication instead of anonymous login. This means your data is tied to a single account and syncs across all your devices.

### Step 1: Enable Email/Password Authentication in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **budgetmanager-21858**
3. In the left sidebar, click **Authentication**
4. Click the **Sign-in method** tab
5. Click on **Email/Password**
6. Toggle **Enable** to ON
7. Click **Save**

### Step 2: Create Your User Account

You need to create a user account with a password. You have two options:

#### Option A: Using Firebase Console (Easiest)

1. In Firebase Console → **Authentication** → **Users** tab
2. Click **Add user**
3. Email: `user@budgetmanager.app` (must match exactly)
4. Password: Choose a strong password (you'll use this to login)
5. Click **Add user**

#### Option B: Using Firebase CLI (Advanced)

If you have Node.js installed:

```bash
npm install -g firebase-tools
firebase login
```

Then create a script `setup-user.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createUser() {
  try {
    const userRecord = await admin.auth().createUser({
      email: 'user@budgetmanager.app',
      password: 'YOUR_PASSWORD_HERE', // Replace with your password
      emailVerified: true
    });
    console.log('Successfully created user:', userRecord.uid);
  } catch (error) {
    console.log('Error creating user:', error);
  }
}

createUser();
```

Run: `node setup-user.js`

### Step 3: Update Firebase Security Rules

Since we're no longer using anonymous auth, update your Firestore security rules:

1. Go to Firebase Console → **Firestore Database** → **Rules** tab
2. Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can access their own data
    match /{document=**} {
      allow read, write: if request.auth != null 
                       && request.auth.token.email == 'user@budgetmanager.app';
    }
  }
}
```

3. Click **Publish**

### Step 4: Clear Existing Anonymous Data (Optional)

If you had any data from anonymous sessions, you should delete it:

1. Go to Firebase Console → **Firestore Database** → **Data** tab
2. Find any documents with `userId` that are NOT your new user's UID
3. Delete those collections/documents manually

**Or** delete all existing data to start fresh:
- Delete the entire `accounts` collection
- Delete the entire `transactions` collection
- Delete the entire `budgets` collection

### Step 5: Test Your Login

1. Open your Budget Manager app (locally or on GitHub Pages)
2. You should see a login screen
3. Enter your password
4. You should be logged in and see an empty dashboard

### Step 6: Using the App

**On the same device:**
- You'll stay logged in for 1 week
- After 1 week, you'll be asked to enter your password again

**On a new device:**
- Open the app URL
- Enter your password
- Your data will sync automatically from Firestore

**To logout manually:**
- Click the **Logout** button in the navigation menu

### Changing Your Password

To change your password:

1. Go to Firebase Console → **Authentication** → **Users**
2. Find your user (`user@budgetmanager.app`)
3. Click the three dots menu → **Reset password**
4. Enter your new password
5. Click **Save**

### Security Notes

- Your password is never stored in the app code
- Firebase handles all authentication securely
- Your data is encrypted in transit and at rest
- Only you (with the correct password) can access your budget data
- The app works offline and syncs when you're back online

### Troubleshooting

**"Invalid password" error:**
- Make sure you created the user account in Firebase
- Check that the email is exactly `user@budgetmanager.app`
- Verify your password is correct

**"Firebase not initialized" error:**
- Check your internet connection
- Verify the Firebase config in `js/config.js` is correct
- If offline, the app will use local storage as a fallback

**Data not syncing:**
- Make sure you're logged in (not using local storage mode)
- Check Firestore rules are published correctly
- Verify you have internet connection

**Session expired after 1 week:**
- This is normal behavior
- Just enter your password again to continue

### Mobile Usage

The app is now optimized for mobile devices:
- Responsive design works on all screen sizes
- Touch-friendly buttons (44px minimum)
- Simplified navigation on small screens
- Form inputs sized to prevent auto-zoom on iOS
- Works great on iPhone, Android, tablets, and desktop

### GitHub Pages Deployment

Your app should already be deployed. To verify:

1. Go to your GitHub repo: `https://github.com/senuli-w/Budget-Manager`
2. Settings → Pages
3. Your app should be live at: `https://senuli-w.github.io/Budget-Manager/`

Bookmark this URL on your phone and desktop for easy access!

---

**Need Help?**

If you encounter any issues, check:
1. Firebase Console for any error messages
2. Browser console (F12) for JavaScript errors
3. Firestore Rules to ensure they're published correctly
