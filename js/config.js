// Firebase configuration (replace with your own project values if needed)
const CONFIG = {
    FIREBASE_CONFIG: {
        apiKey: 'AIzaSyDC2EPqMAo-laYO59IvHFwbqA65eqst0Jw',
        authDomain: 'budgetmanager-21858.firebaseapp.com',
        projectId: 'budgetmanager-21858',
        storageBucket: 'budgetmanager-21858.firebasestorage.app',
        messagingSenderId: '817688844370',
        appId: '1:817688844370:web:00354b2f8a1a7c1de7e78b',
        measurementId: 'G-45NDMNN1LN'
    },
    // Fixed email for your account (password will be set in Firebase)
    USER_EMAIL: 'user@budgetmanager.app',
    DATABASE_NAME: 'budget_manager',
    COLLECTIONS: {
        ACCOUNTS: 'accounts',
        TRANSACTIONS: 'transactions',
        BUDGETS: 'budgets'
    }
};

// Expense Categories
const EXPENSE_CATEGORIES = [
    { id: 'food', name: 'Food & Dining', icon: 'bi-basket', color: '#ff6b6b' },
    { id: 'transport', name: 'Transportation', icon: 'bi-car-front', color: '#4ecdc4' },
    { id: 'utilities', name: 'Utilities', icon: 'bi-lightning', color: '#45b7d1' },
    { id: 'shopping', name: 'Shopping', icon: 'bi-bag', color: '#96ceb4' },
    { id: 'entertainment', name: 'Entertainment', icon: 'bi-film', color: '#dda0dd' },
    { id: 'health', name: 'Health & Medical', icon: 'bi-heart-pulse', color: '#ff9ff3' },
    { id: 'education', name: 'Education', icon: 'bi-book', color: '#54a0ff' },
    { id: 'bills', name: 'Bills & Fees', icon: 'bi-receipt', color: '#5f27cd' },
    { id: 'groceries', name: 'Groceries', icon: 'bi-cart', color: '#00d2d3' },
    { id: 'rent', name: 'Rent & Housing', icon: 'bi-house', color: '#ff9f43' },
    { id: 'insurance', name: 'Insurance', icon: 'bi-shield-check', color: '#1dd1a1' },
    { id: 'personal', name: 'Personal Care', icon: 'bi-person', color: '#f368e0' },
    { id: 'gifts', name: 'Gifts & Donations', icon: 'bi-gift', color: '#ee5a24' },
    { id: 'travel', name: 'Travel', icon: 'bi-airplane', color: '#0abde3' },
    { id: 'lost_money', name: 'Lost Money', icon: 'bi-question-circle', color: '#576574' },
    { id: 'other_expense', name: 'Other Expense', icon: 'bi-three-dots', color: '#8395a7' }
];

// Income Categories
const INCOME_CATEGORIES = [
    { id: 'salary', name: 'Salary', icon: 'bi-briefcase', color: '#2ecc71' },
    { id: 'freelance', name: 'Freelance', icon: 'bi-laptop', color: '#3498db' },
    { id: 'business', name: 'Business', icon: 'bi-building', color: '#9b59b6' },
    { id: 'investment', name: 'Investment', icon: 'bi-graph-up', color: '#1abc9c' },
    { id: 'interest', name: 'Interest', icon: 'bi-percent', color: '#e74c3c' },
    { id: 'rental', name: 'Rental Income', icon: 'bi-house-door', color: '#f39c12' },
    { id: 'bonus', name: 'Bonus', icon: 'bi-star', color: '#e67e22' },
    { id: 'refund', name: 'Refund', icon: 'bi-arrow-return-left', color: '#16a085' },
    { id: 'other_income', name: 'Other Income', icon: 'bi-three-dots', color: '#7f8c8d' }
];

// Account Type Icons
const ACCOUNT_ICONS = {
    bank: 'bi-bank',
    cash: 'bi-cash-stack',
    credit: 'bi-credit-card',
    savings: 'bi-piggy-bank',
    other: 'bi-wallet2'
};

// Get category by ID
function getCategoryById(id, type = 'expense') {
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return categories.find(cat => cat.id === id) || categories[categories.length - 1];
}

// Format currency
function formatCurrency(amount) {
    return 'Rs. ' + parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Format date
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Get current month string (YYYY-MM)
function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
