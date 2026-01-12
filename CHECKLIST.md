# 🎯 Budget Manager - Setup Checklist

Complete these steps to get your PWA fully set up and ready to use!

## ✅ Firebase Setup (Required)

- [ ] Go to [Firebase Console](https://console.firebase.google.com)
- [ ] Select project: **budgetmanager-21858**
- [ ] Go to **Authentication**
- [ ] Ensure **Email/Password** is enabled
- [ ] Create user:
  - Email: `user@budgetmanager.app`
  - Password: (your strong password)
- [ ] Go to **Firestore Database → Rules**
- [ ] Paste the updated rules:
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
- [ ] Click **Publish**

## 📱 Installation Setup

### iOS/iPad
- [ ] Open Safari
- [ ] Go to: `https://senuli-w.github.io/Budget-Manager/`
- [ ] Tap **Share** button
- [ ] Tap **Add to Home Screen**
- [ ] Tap **Add** in top right

### Android
- [ ] Open Chrome
- [ ] Go to: `https://senuli-w.github.io/Budget-Manager/`
- [ ] Tap **Menu** (3 dots)
- [ ] Tap **Install app**
- [ ] Confirm installation

### Desktop
- [ ] Open Chrome or Edge
- [ ] Go to: `https://senuli-w.github.io/Budget-Manager/`
- [ ] Click **Install** button in address bar OR
- [ ] Menu → **Install Budget Manager**

## 🔐 First Login

- [ ] Open the app (from home screen or browser)
- [ ] Enter your password: `user@budgetmanager.app`
- [ ] Click **Login**
- [ ] See empty dashboard
- [ ] Success! ✨

## 🏦 Create Your First Account

- [ ] Go to **Accounts** tab
- [ ] Click **+** button
- [ ] Add account:
  - Name: `BOC Savings` (or your bank name)
  - Type: `Savings`
  - Initial Balance: `0` (or your actual balance)
- [ ] Click **Add Account**
- [ ] Repeat for other accounts (HNB, Cash, etc.)

## 💳 Add Your First Transaction

- [ ] Go to **Add** tab
- [ ] Select Type: **Expense**
- [ ] Amount: `500`
- [ ] Category: `Food`
- [ ] From Account: Select your account
- [ ] Date: Today
- [ ] Click **Add Transaction**
- [ ] See transaction in **History**

## 📊 Verify Dashboard

- [ ] Go to **Overview** tab
- [ ] Check **Total Balance** shows your accounts
- [ ] Check **Monthly Expenses** shows your transaction
- [ ] Check **Recent Transactions** shows your transaction
- [ ] Verify charts are displaying

## 🌐 Test Offline Mode

- [ ] Put phone in Airplane Mode
- [ ] Open the app
- [ ] Verify you can still see all data
- [ ] Add a transaction while offline
- [ ] Turn Airplane Mode off
- [ ] Refresh the app
- [ ] Verify transaction synced to cloud

## 🔄 Test Cross-Device Sync

- [ ] Login on another device with same password
- [ ] Verify same accounts and transactions appear
- [ ] Add a transaction on Device 1
- [ ] Refresh on Device 2
- [ ] Verify new transaction appears

## 📖 Optional - Read Documentation

- [ ] Read [PWA_GUIDE.md](PWA_GUIDE.md) for features
- [ ] Read [SETUP.md](SETUP.md) for password changes
- [ ] Read [README.md](README.md) for tech details

## 🎉 You're All Set!

Your Budget Manager is now ready to use! 

### Quick Tips
- **Daily Use**: Add transactions same day they happen
- **Weekly**: Check your spending in History tab
- **Monthly**: Review your income vs expenses on Dashboard
- **Security**: Your password is never shared, never stored in code

### Need Help?
- 🔗 App: https://senuli-w.github.io/Budget-Manager/
- 📝 Docs: Check PWA_GUIDE.md for troubleshooting
- 🐛 Issues: Check browser console (F12) for errors

---

**Happy budgeting! 💰**

Last updated: January 12, 2026
