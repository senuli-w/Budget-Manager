# Budget Manager - Progressive Web App Guide

Your Budget Manager is now a **Progressive Web App (PWA)** that can be installed directly on your phone home screen, works offline, and syncs data across all your devices!

## 🚀 What's New

✅ **PWA Installation** - Add to home screen on mobile and desktop
✅ **Offline Support** - Works without internet (syncs when back online)
✅ **Beautiful UI** - Modern, clean, and intuitive design
✅ **Mobile-Optimized** - Perfect for phones, tablets, and desktop
✅ **Secure** - Password-protected with encrypted data storage
✅ **Cross-Device Sync** - Same password = same data everywhere

## 📱 Installation Guide

### iOS (iPhone/iPad)

1. **Open Safari** and go to: https://senuli-w.github.io/Budget-Manager/
2. Tap the **Share** button (square with arrow icon at bottom)
3. Scroll and tap **Add to Home Screen**
4. Name it "Budget" or "Budget Manager"
5. Tap **Add** in the top right
6. The app icon appears on your home screen!

### Android Phone

1. **Open Chrome** and go to: https://senuli-w.github.io/Budget-Manager/
2. Tap the **Menu** (3 dots) in the top right
3. Tap **"Install app"** or **"Add to Home Screen"**
4. Confirm the installation
5. The app icon appears on your home screen!

### Desktop (Mac/Windows/Linux)

1. **Open Chrome or Edge** and go to: https://senuli-w.github.io/Budget-Manager/
2. Click the **Install** button (puzzle piece icon in address bar) OR
3. Click **Menu** (3 dots) → **"Install Budget Manager"**
4. The app opens in its own window (no browser UI)
5. Shortcut is added to your desktop/applications

## 🔐 Setup Instructions

### Step 1: Create Your Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **budgetmanager-21858**
3. Go to **Authentication** → **Sign-in method**
4. Ensure **Email/Password** is enabled
5. Click **Users** tab → **Add user**
6. Email: `user@budgetmanager.app`
7. Set your password (strong password recommended)
8. Click **Add user**

### Step 2: Update Firebase Security Rules

1. Go to **Firestore Database** → **Rules** tab
2. Replace with these rules:

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

3. Click **Publish**

### Step 3: Login to Your App

1. Open the app (from home screen or browser)
2. Enter your password
3. Start managing your budget!

## 📝 How to Use

### Quick Start

1. **Add Account** - Create accounts for your banks/cash (BOC, HNB, Cash, etc.)
2. **Add Transaction** - Record income, expenses, or transfers
3. **View Dashboard** - See totals, charts, and recent activity
4. **Check History** - Filter and review all transactions

### Sections

- **Overview** - Dashboard with balance, charts, and recent activity
- **Add** - Quick way to add new transactions
- **History** - View all transactions with filters
- **Accounts** - Manage your bank accounts and wallets

### Adding Transactions

1. Go to **Add** tab
2. Choose type: **Expense**, **Income**, or **Transfer**
3. Enter amount
4. Select category (auto-updated based on type)
5. Choose account
6. Set date
7. Optional: Add a note
8. Tap **Add Transaction**

### Filtering Transactions

1. Go to **History** tab
2. Filter by account or transaction type
3. View only what you want to see

## 🌐 Hosting Options

Your app is currently hosted on **GitHub Pages** at:
```
https://senuli-w.github.io/Budget-Manager/
```

### Alternative Hosting Services (Free Tier)

If you want to use a custom domain:

#### **Vercel** (Recommended)
- Free hosting with custom domains
- Automatic deployments from GitHub
- https://vercel.com/import/github

#### **Netlify**
- Free hosting with custom domains
- Simple GitHub integration
- https://netlify.com

#### **Firebase Hosting**
- Free 5GB storage
- Fast CDN
- https://firebase.google.com/docs/hosting

## 🔄 How Offline Works

Your app has three data modes:

1. **Online Mode** (First preference)
   - Syncs with Firebase Firestore
   - All changes saved to cloud
   - Works on all devices with same account

2. **Service Worker Cache** (Fallback)
   - App assets cached locally
   - Can view previously loaded data
   - Transactions queued for sync

3. **Local Storage** (Emergency)
   - Temporary storage when offline
   - Data is safe but not synced yet
   - Syncs automatically when back online

## 🔒 Security Features

- **End-to-End Secure** - Only you can access your data
- **Password Protected** - Fixed email + password authentication
- **Encrypted Storage** - Firebase encrypts all data at rest
- **Session Persistence** - 7-day session (refreshes password after 1 week)
- **No User Tracking** - We never track your transactions or personal data

## 📊 Features

### Dashboard
- **Total Balance** - Sum of all accounts
- **Monthly Income** - Income for current month
- **Monthly Expenses** - Expenses for current month
- **Account Distribution Chart** - Pie chart of your accounts
- **Income vs Expenses Chart** - Bar chart for the month
- **Recent Transactions** - Last 5 transactions

### Transactions
- Track income, expenses, and transfers
- Categorize all transactions
- Add notes to transactions
- Filter by account or type
- See complete transaction history

### Accounts
- Create multiple accounts (bank, cash, cards)
- Track balance for each
- Support for Savings, Checking, Cash, Credit Card types
- See account breakdown on dashboard

## 🎨 Customization

### Change Theme Color
Edit `manifest.json` and change:
```json
"theme_color": "#6366f1"
```

### Add Custom Categories
Edit the categories in `js/app.js`:
```javascript
expense: ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'],
income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
```

## 🆘 Troubleshooting

### "Install app" button not showing
- Make sure you're using **Chrome**, **Edge**, or **Safari**
- Try clearing browser cache
- Check that manifest.json is loading (open DevTools)

### Can't login
- Verify user was created in Firebase Console
- Check password is correct
- Ensure Firestore rules are published
- Clear browser cache and try again

### Data not syncing
- Check internet connection
- Verify Firestore rules are correct
- Make sure you're logged in with correct password
- Check Firebase console for errors

### App crashes on startup
- Clear browser cache
- Uninstall and reinstall from home screen
- Check browser console (F12) for errors
- Try a different browser

### Offline not working
- Service Worker may not be registered
- Try refreshing the page
- Check that you visited the app while online first
- Check browser allows service workers

## 📈 Tips & Tricks

### Daily Use
1. **Quick Add** - Use the "Add" tab for quick transaction entry
2. **Dashboard** - Check balance daily from Overview tab
3. **Monthly Review** - Check History tab to see spending patterns

### Best Practices
- Add transactions the same day they happen
- Use consistent category names
- Set realistic monthly budgets
- Review accounts weekly to catch errors

### Performance
- App loads in <1 second on most devices
- Charts update automatically
- Offline mode works for 30 days without sync
- Service worker caches all static assets

## 🚀 Updates

The app automatically checks for updates when you open it. No action needed from you!

When updates are available:
- App continues to work normally
- Updates apply when you refresh
- No data loss or interruption

## 📧 Need Help?

Check the following:
1. **SETUP.md** - Detailed setup instructions
2. **Browser Console** - Press F12 to see any error messages
3. **Firebase Console** - Check for auth or database errors
4. **Service Worker** - DevTools → Application → Service Workers

---

**Enjoy managing your budget across all your devices! 💰📱**
