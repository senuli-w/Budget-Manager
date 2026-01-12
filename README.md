# 💰 Budget Manager - PWA

A beautiful, simple, and secure budget management app that works on your phone, tablet, and desktop!

## ✨ Key Features

- 📱 **Install on Home Screen** - Works like a native app
- 🔐 **Secure** - Username + password protected
- 🌐 **Works Offline** - Full functionality without internet
- 📊 **Analytics** - Beautiful charts and summaries
- 🔄 **Sync Everywhere** - Same data across all devices
- ⚡ **Fast** - Instant load times
- 🎨 **Beautiful UI** - Modern, mobile-first design

## 🚀 Quick Start

### 1. Visit the App
Go to: https://senuli-w.github.io/Budget-Manager/

### 2. Login / Signup
Create an account with a username + password, then use the same credentials on every device. See [SETUP.md](SETUP.md).

### 3. Install on Home Screen
- **iPhone**: Share → Add to Home Screen
- **Android**: Menu (3 dots) → Install App
- **Desktop**: Menu (3 dots) → Install

### 4. Start Budgeting!
Add accounts → Add transactions → Track your money

## 📚 Documentation

- **[SETUP.md](SETUP.md)** - Initial setup and Firebase configuration
- **[PWA_GUIDE.md](PWA_GUIDE.md)** - Complete PWA guide and features

## 🏗️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication (Username mapped to email)
- **Charts**: Chart.js
- **Icons**: Bootstrap Icons
- **Hosting**: GitHub Pages (or Vercel/Netlify)
- **Type**: Progressive Web App (PWA)

## 📋 App Features

### Dashboard
- Total balance across all accounts
- Monthly income and expenses
- Account distribution chart
- Income vs expenses chart
- Recent transactions preview

### Transactions
- Add income, expenses, or transfers
- Categorized transactions
- Transaction history with filters
- Notes for each transaction
- Date tracking

### Accounts
- Create multiple accounts
- Track individual balances
- Account types (Savings, Checking, Cash, Credit)
- Account summary on dashboard

## 📱 Device Compatibility

| Device | Browser | Install |
|--------|---------|---------|
| iPhone | Safari | Share → Add to Home Screen |
| iPad | Safari | Share → Add to Home Screen |
| Android | Chrome | Menu → Install App |
| Android | Firefox | Menu → Install App |
| Windows | Chrome/Edge | Install Button in Address Bar |
| Mac | Chrome/Safari | Install Button in Address Bar |
| Linux | Chrome/Firefox | Install Button in Address Bar |

## 🔐 Security

- ✅ Username + password authentication
- ✅ End-to-end encrypted with Firebase
- ✅ No personal data tracking
- ✅ 7-day session timeout for extra security
- ✅ Data stored encrypted in Firebase Firestore

## 💾 Data Storage

Your data is stored securely in:
- **Firebase Firestore** (Cloud database)
- **Local Cache** (Offline functionality)
- **Service Worker** (App assets)

No data is ever shared with third parties.

## 🌐 Hosting

Currently hosted on GitHub Pages. You can also deploy to:
- **Vercel** - Free custom domains
- **Netlify** - Simple GitHub integration
- **Firebase Hosting** - 5GB free storage

See [PWA_GUIDE.md](PWA_GUIDE.md#-hosting-options) for details.

## 🔄 Offline Support

The app works completely offline:
- View all your data
- Add new transactions (syncs when online)
- All charts and analytics work
- Automatic sync when connection returns

## 🎯 How It Works

```
┌─────────────────────────────────────┐
│    Budget Manager App               │
│  (PWA - Progressive Web App)        │
└────────┬────────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
Firebase   Local
Firestore  Storage
(Cloud)    (Offline)
    │         │
    └────┬────┘
         ▼
   Your Device
(Phone, Tablet, PC)
```

## 📊 Database Schema

### Accounts Collection
```javascript
{
  id: string,
  name: string,        // "BOC Savings"
  type: string,        // "savings", "checking", "cash", "credit"
  balance: number,
  timestamp: string,
  userId: string       // Auto-set by Firebase Auth
}
```

### Transactions Collection
```javascript
{
  id: string,
  type: string,        // "income", "expense", "transfer"
  amount: number,
  category: string,
  account: string,     // Account ID
  toAccount: string,   // For transfers
  date: string,        // YYYY-MM-DD
  note: string,
  timestamp: string,
  userId: string       // Auto-set by Firebase Auth
}
```

## 🎨 UI Components

- **Stat Cards** - Balance, income, expenses summary
- **Charts** - Doughnut and bar charts
- **Transaction List** - Clean, scrollable list
- **Modal Dialogs** - Add accounts/transactions
- **Toast Notifications** - Feedback messages
- **Navigation Tabs** - Bottom tab bar

## ⚡ Performance

- **Load Time**: < 1 second
- **Offline**: Full functionality
- **Cache Size**: ~ 2 MB
- **Database Queries**: Optimized indexes
- **Charts**: Rendered efficiently

## 🐛 Known Limitations

- Currently supports one user per installation
- Category list is fixed (can be customized)
- No recurring transactions yet
- No transaction tags/labels
- No export to CSV/PDF yet

## 🔮 Future Features

- [ ] Budget limits and alerts
- [ ] Recurring transactions
- [ ] Transaction tags
- [ ] Multi-user support
- [ ] Export to CSV/PDF
- [ ] More chart types
- [ ] Spending categories analysis
- [ ] Mobile app (React Native)

## 🤝 Contributing

Want to improve the app? You can:
1. Fork the repository
2. Make your changes
3. Submit a pull request

The code is organized as:
```
├── index.html          # Main HTML
├── manifest.json       # PWA manifest
├── service-worker.js   # Offline support
├── css/
│   └── style.css       # All styles
└── js/
    ├── app.js          # Main app logic
    ├── db.js           # Firebase database layer
    └── config.js       # Configuration
```

## 📝 License

This project is open source. Feel free to use and modify for personal use.

## 📞 Support

If you encounter issues:
1. Check [PWA_GUIDE.md](PWA_GUIDE.md#-troubleshooting)
2. Check [SETUP.md](SETUP.md)
3. Clear browser cache and try again
4. Check Firebase Console for errors

## 🎉 Enjoy!

Your personal budget tracker is ready to use on any device, anytime, anywhere!

**App URL:** https://senuli-w.github.io/Budget-Manager/

---

Built with ❤️ for managing your finances
