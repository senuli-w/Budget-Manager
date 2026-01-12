# Budget Manager

A simple, personal budget management application built with HTML, CSS, and JavaScript. Designed for static hosting (GitHub Pages) with Firebase Firestore + Anonymous Auth for cloud sync, and automatic local-storage fallback when offline or unconfigured.

![Budget Manager](https://img.shields.io/badge/Budget-Manager-blue)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?logo=bootstrap&logoColor=white)

## Features

### 📊 Dashboard
- Overview of total balance across all accounts
- Monthly income and expenses summary
- Visual charts showing account distribution and income vs expenses
- Quick view of account balances
- Recent transactions list

### 🏦 Account Management
- Add multiple accounts (Bank accounts, Cash, Credit Cards, Savings, etc.)
- Customize account colors for easy identification
- Track balance for each account
- Edit and delete accounts

### 💳 Transactions
- Record income and expenses
- Transfer money between accounts
- Categorize transactions with pre-defined categories
- Filter transactions by account, type, and date range
- Delete transactions (automatically adjusts account balance)

### 📈 Budget Planner
- Set monthly budgets for expense categories
- Visual progress bars showing budget usage
- Track spending against budget
- See total budget, spent, and remaining amounts

## Categories

### Expense Categories
- Food & Dining
- Transportation
- Utilities
- Shopping
- Entertainment
- Health & Medical
- Education
- Bills & Fees
- Groceries
- Rent & Housing
- Insurance
- Personal Care
- Gifts & Donations
- Travel
- Other Expense

### Income Categories
- Salary
- Freelance
- Business
- Investment
- Interest
- Rental Income
- Bonus
- Refund
- Other Income

## Getting Started

### Quick Start (Local Storage Mode)
1. Clone or download this repository
2. Open `index.html` in a web browser
3. Start using the app! All data will be saved in your browser's local storage.

### With Firebase Firestore (cloud sync)
1. Create a Firebase project → enable Firestore (Production mode) and Anonymous Auth.
2. Copy your Firebase config and replace the values inside `js/config.js` (the file already contains a sample config).
3. No backend code is required; the frontend talks directly to Firestore via the Firebase SDK.
4. Open `index.html` and add data. You should see documents appear in Firestore under collections `accounts`, `transactions`, and `budgets`.

> Note: Local Storage remains available as a fallback if Firebase fails to initialize.

### (Legacy) MongoDB Atlas
The previous MongoDB App Services setup is no longer used by default. If you still need it, keep `MONGODB_SETUP.md` for reference.

## Deployment on GitHub Pages

1. Fork or clone this repository
2. Push to your GitHub account
3. Go to repository Settings → Pages
4. Select "Deploy from a branch" → "main" → "/ (root)"
5. Your app will be live at `https://yourusername.github.io/repository-name/`

## File Structure

```
Budget Management App/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Custom styles
├── js/
│   ├── config.js       # Configuration and constants (includes Firebase config)
│   ├── db.js           # Database operations (Firebase + localStorage fallback)
│   └── app.js          # Main application logic
├── MONGODB_SETUP.md    # Legacy MongoDB Atlas setup guide
└── README.md           # This file
```

## Technologies Used

- **HTML5** - Structure
- **CSS3** - Styling
- **JavaScript (ES6+)** - Logic
- **Bootstrap 5** - UI Framework
- **Bootstrap Icons** - Icons
- **Chart.js** - Charts and graphs
- **Firebase (Auth + Firestore)** - Cloud database connection

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Data Storage

The app supports two storage modes:

1. **Local Storage** (Default): Data is stored in your browser. Works offline but doesn't sync across devices.

2. **MongoDB Atlas**: Cloud storage with cross-device sync. Requires setup (see [MONGODB_SETUP.md](MONGODB_SETUP.md)).

## Currency

The app uses Sri Lankan Rupees (Rs.) by default. To change the currency, modify the `formatCurrency` function in `js/config.js`.

## License

This project is open source and available for personal use.

## Contributing

Feel free to submit issues and enhancement requests!

---

Made with ❤️ for personal budget management
