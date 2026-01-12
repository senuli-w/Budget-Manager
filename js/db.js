// Firebase Firestore Database Connection Module with localStorage fallback

class Database {
    constructor() {
        this.firestore = null;
        this.auth = null;
        this.userId = null;
        this.isConnected = false;
        this.useLocalStorage = false;
    }

    // Initialize Firebase with email/password auth and session persistence
    async init() {
        try {
            if (typeof firebase === 'undefined' || !CONFIG?.FIREBASE_CONFIG?.apiKey) {
                console.warn('Firebase SDK not available or config missing. Using local storage.');
                this.useLocalStorage = true;
                this.isConnected = true;
                return { requiresLogin: false };
            }

            if (!firebase.apps.length) {
                firebase.initializeApp(CONFIG.FIREBASE_CONFIG);
            }

            this.auth = firebase.auth();
            this.firestore = firebase.firestore();

            // Enable session persistence (lasts 1 week)
            await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

            // Check if user is already signed in
            return new Promise((resolve) => {
                this.auth.onAuthStateChanged(async (user) => {
                    if (user) {
                        this.userId = user.uid;
                        this.userEmail = user.email;
                        this.useLocalStorage = false;
                        this.isConnected = true;
                        
                        // Check if session is older than 1 week
                        const lastLogin = localStorage.getItem('lastLoginTime');
                        const oneWeek = 7 * 24 * 60 * 60 * 1000;
                        if (lastLogin && (Date.now() - parseInt(lastLogin)) > oneWeek) {
                            await this.auth.signOut();
                            localStorage.removeItem('lastLoginTime');
                            resolve({ requiresLogin: true });
                        } else {
                            console.log('Already signed in to Firebase');
                            resolve({ requiresLogin: false });
                        }
                    } else {
                        resolve({ requiresLogin: true });
                    }
                });
            });
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.useLocalStorage = true;
            this.isConnected = true;
            return { requiresLogin: false };
        }
    }

    // Sign in with password (uses fixed email)
    async signIn(pin) {
        try {
            const email = CONFIG.USER_EMAIL;
            const credential = pin || CONFIG.USER_PIN;
            const userCredential = await this.auth.signInWithEmailAndPassword(email, credential);
            this.userId = userCredential.user.uid;
            this.userEmail = userCredential.user.email;
            this.useLocalStorage = false;
            this.isConnected = true;
            
            // Store login time
            localStorage.setItem('lastLoginTime', Date.now().toString());
            
            console.log('Signed in successfully');
            return { success: true };
        } catch (error) {
            console.error('Sign in failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Sign out
    async signOut() {
        try {
            await this.auth.signOut();
            localStorage.removeItem('lastLoginTime');
            this.userId = null;
            this.userEmail = null;
            return { success: true };
        } catch (error) {
            console.error('Sign out failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.useLocalStorage || (this.auth && this.auth.currentUser);
    }

    // =====================
    // ACCOUNTS OPERATIONS
    // =====================

    async getAccounts() {
        if (this.useLocalStorage) {
            const accounts = localStorage.getItem('budget_accounts');
            return accounts ? JSON.parse(accounts) : [];
        }

        const snapshot = await this.firestore
            .collection(CONFIG.COLLECTIONS.ACCOUNTS)
            .where('userId', '==', this.userId)
            .get();

        return snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    }

    async addAccount(account) {
        const newAccount = {
            ...account,
            userId: this.userId,
            createdAt: new Date().toISOString(),
            balance: parseFloat(account.balance) || 0
        };

        if (this.useLocalStorage) {
            const accounts = await this.getAccounts();
            newAccount._id = this.generateId();
            accounts.push(newAccount);
            localStorage.setItem('budget_accounts', JSON.stringify(accounts));
            return newAccount;
        }

        const docRef = await this.firestore
            .collection(CONFIG.COLLECTIONS.ACCOUNTS)
            .add(newAccount);
        return { _id: docRef.id, ...newAccount };
    }

    async updateAccount(id, updates) {
        if (this.useLocalStorage) {
            const accounts = await this.getAccounts();
            const index = accounts.findIndex(acc => acc._id === id);
            if (index !== -1) {
                accounts[index] = { ...accounts[index], ...updates };
                localStorage.setItem('budget_accounts', JSON.stringify(accounts));
                return accounts[index];
            }
            return null;
        }

        await this.firestore
            .collection(CONFIG.COLLECTIONS.ACCOUNTS)
            .doc(id)
            .update(updates);
        return { _id: id, ...updates };
    }

    async updateAccountBalance(id, amount, operation = 'add') {
        const accounts = await this.getAccounts();
        const account = accounts.find(acc => acc._id === id);
        if (!account) return null;

        const newBalance = operation === 'add'
            ? parseFloat(account.balance) + parseFloat(amount)
            : parseFloat(account.balance) - parseFloat(amount);

        return await this.updateAccount(id, { balance: newBalance });
    }

    async deleteAccount(id) {
        if (this.useLocalStorage) {
            const accounts = await this.getAccounts();
            const filtered = accounts.filter(acc => acc._id !== id);
            localStorage.setItem('budget_accounts', JSON.stringify(filtered));

            const transactions = await this.getTransactions();
            const filteredTrans = transactions.filter(t => t.accountId !== id && t.toAccountId !== id);
            localStorage.setItem('budget_transactions', JSON.stringify(filteredTrans));
            return true;
        }

        await this.firestore.collection(CONFIG.COLLECTIONS.ACCOUNTS).doc(id).delete();

        // Clean up related transactions
        const transRef = this.firestore.collection(CONFIG.COLLECTIONS.TRANSACTIONS);
        const [fromSnap, toSnap] = await Promise.all([
            transRef.where('userId', '==', this.userId).where('accountId', '==', id).get(),
            transRef.where('userId', '==', this.userId).where('toAccountId', '==', id).get()
        ]);

        const batch = this.firestore.batch();
        fromSnap.forEach(doc => batch.delete(doc.ref));
        toSnap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        return true;
    }

    // ========================
    // TRANSACTIONS OPERATIONS
    // ========================

    async getTransactions(filters = {}) {
        if (this.useLocalStorage) {
            let tx = localStorage.getItem('budget_transactions');
            tx = tx ? JSON.parse(tx) : [];
            return this.applyTransactionFilters(tx, filters);
        }

        const snapshot = await this.firestore
            .collection(CONFIG.COLLECTIONS.TRANSACTIONS)
            .where('userId', '==', this.userId)
            .get();

        const tx = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
        return this.applyTransactionFilters(tx, filters);
    }

    applyTransactionFilters(transactions, filters) {
        let tx = [...transactions];

        if (filters.accountId) {
            tx = tx.filter(t => t.accountId === filters.accountId || t.toAccountId === filters.accountId);
        }
        if (filters.type) {
            tx = tx.filter(t => t.type === filters.type);
        }
        if (filters.fromDate) {
            tx = tx.filter(t => t.date >= filters.fromDate);
        }
        if (filters.toDate) {
            tx = tx.filter(t => t.date <= filters.toDate);
        }
        if (filters.month) {
            const start = `${filters.month}-01`;
            const end = this.getMonthEnd(filters.month);
            tx = tx.filter(t => t.date >= start && t.date <= end);
        }

        tx.sort((a, b) => new Date(b.date) - new Date(a.date));
        return tx;
    }

    getMonthEnd(month) {
        const [year, m] = month.split('-').map(Number);
        const last = new Date(year, m, 0); // day 0 of next month
        const mm = String(last.getMonth() + 1).padStart(2, '0');
        const dd = String(last.getDate()).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
    }

    async addTransaction(transaction) {
        const newTransaction = {
            ...transaction,
            userId: this.userId,
            createdAt: new Date().toISOString(),
            amount: parseFloat(transaction.amount)
        };

        // Update balances before persisting
        if (transaction.type === 'income') {
            await this.updateAccountBalance(transaction.accountId, transaction.amount, 'add');
        } else if (transaction.type === 'expense') {
            await this.updateAccountBalance(transaction.accountId, transaction.amount, 'subtract');
        } else if (transaction.type === 'transfer') {
            await this.updateAccountBalance(transaction.accountId, transaction.amount, 'subtract');
            await this.updateAccountBalance(transaction.toAccountId, transaction.amount, 'add');
        }

        if (this.useLocalStorage) {
            const transactions = await this.getTransactions();
            newTransaction._id = this.generateId();
            transactions.push(newTransaction);
            localStorage.setItem('budget_transactions', JSON.stringify(transactions));
            return newTransaction;
        }

        const docRef = await this.firestore
            .collection(CONFIG.COLLECTIONS.TRANSACTIONS)
            .add(newTransaction);
        return { _id: docRef.id, ...newTransaction };
    }

    async deleteTransaction(id) {
        const transactions = await this.getTransactions();
        const transaction = transactions.find(t => t._id === id);

        if (transaction) {
            if (transaction.type === 'income') {
                await this.updateAccountBalance(transaction.accountId, transaction.amount, 'subtract');
            } else if (transaction.type === 'expense') {
                await this.updateAccountBalance(transaction.accountId, transaction.amount, 'add');
            } else if (transaction.type === 'transfer') {
                await this.updateAccountBalance(transaction.accountId, transaction.amount, 'add');
                await this.updateAccountBalance(transaction.toAccountId, transaction.amount, 'subtract');
            }
        }

        if (this.useLocalStorage) {
            const filtered = transactions.filter(t => t._id !== id);
            localStorage.setItem('budget_transactions', JSON.stringify(filtered));
            return true;
        }

        await this.firestore.collection(CONFIG.COLLECTIONS.TRANSACTIONS).doc(id).delete();
        return true;
    }

    // ====================
    // BUDGETS OPERATIONS
    // ====================

    async getBudgets(month = null) {
        if (this.useLocalStorage) {
            let budgets = localStorage.getItem('budget_budgets');
            budgets = budgets ? JSON.parse(budgets) : [];
            if (month) budgets = budgets.filter(b => b.month === month);
            return budgets;
        }

        const snapshot = await this.firestore
            .collection(CONFIG.COLLECTIONS.BUDGETS)
            .where('userId', '==', this.userId)
            .get();

        let budgets = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
        if (month) budgets = budgets.filter(b => b.month === month);
        return budgets;
    }

    async addBudget(budget) {
        const newBudget = {
            ...budget,
            userId: this.userId,
            createdAt: new Date().toISOString(),
            amount: parseFloat(budget.amount)
        };

        if (this.useLocalStorage) {
            const budgets = await this.getBudgets();
            const existingIndex = budgets.findIndex(b => b.category === budget.category && b.month === budget.month);
            if (existingIndex !== -1) {
                budgets[existingIndex].amount = newBudget.amount;
                localStorage.setItem('budget_budgets', JSON.stringify(budgets));
                return budgets[existingIndex];
            }
            newBudget._id = this.generateId();
            budgets.push(newBudget);
            localStorage.setItem('budget_budgets', JSON.stringify(budgets));
            return newBudget;
        }

        const existingSnap = await this.firestore
            .collection(CONFIG.COLLECTIONS.BUDGETS)
            .where('userId', '==', this.userId)
            .where('category', '==', budget.category)
            .where('month', '==', budget.month)
            .get();

        if (!existingSnap.empty) {
            const docRef = existingSnap.docs[0].ref;
            await docRef.update({ amount: newBudget.amount });
            return { _id: docRef.id, ...existingSnap.docs[0].data(), amount: newBudget.amount };
        }

        const docRef = await this.firestore
            .collection(CONFIG.COLLECTIONS.BUDGETS)
            .add(newBudget);
        return { _id: docRef.id, ...newBudget };
    }

    async deleteBudget(id) {
        if (this.useLocalStorage) {
            const budgets = await this.getBudgets();
            const filtered = budgets.filter(b => b._id !== id);
            localStorage.setItem('budget_budgets', JSON.stringify(filtered));
            return true;
        }

        await this.firestore.collection(CONFIG.COLLECTIONS.BUDGETS).doc(id).delete();
        return true;
    }

    async getBudgetSpent(category, month) {
        const transactions = await this.getTransactions({ month, type: 'expense' });
        return transactions
            .filter(t => t.category === category)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    }

    // ===================
    // UTILITY FUNCTIONS
    // ===================

    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async getMonthlySummary(month = null) {
        const targetMonth = month || getCurrentMonth();
        const transactions = await this.getTransactions({ month: targetMonth });

        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        return { income, expenses, net: income - expenses };
    }

    async getTotalBalance() {
        const accounts = await this.getAccounts();
        return accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    }

    async exportData() {
        const accounts = await this.getAccounts();
        const transactions = await this.getTransactions();
        const budgets = await this.getBudgets();

        return {
            accounts,
            transactions,
            budgets,
            exportedAt: new Date().toISOString()
        };
    }

    async importData(data) {
        if (this.useLocalStorage) {
            if (data.accounts) localStorage.setItem('budget_accounts', JSON.stringify(data.accounts));
            if (data.transactions) localStorage.setItem('budget_transactions', JSON.stringify(data.transactions));
            if (data.budgets) localStorage.setItem('budget_budgets', JSON.stringify(data.budgets));
            return true;
        }

        // Simple overwrite strategy for this user
        const batch = this.firestore.batch();

        // Clear and reinsert accounts
        const accSnap = await this.firestore
            .collection(CONFIG.COLLECTIONS.ACCOUNTS)
            .where('userId', '==', this.userId)
            .get();
        accSnap.forEach(doc => batch.delete(doc.ref));
        data.accounts?.forEach(acc => {
            const ref = acc._id
                ? this.firestore.collection(CONFIG.COLLECTIONS.ACCOUNTS).doc(acc._id)
                : this.firestore.collection(CONFIG.COLLECTIONS.ACCOUNTS).doc();
            batch.set(ref, { ...acc, userId: this.userId });
        });

        // Clear and reinsert transactions
        const transSnap = await this.firestore
            .collection(CONFIG.COLLECTIONS.TRANSACTIONS)
            .where('userId', '==', this.userId)
            .get();
        transSnap.forEach(doc => batch.delete(doc.ref));
        data.transactions?.forEach(tx => {
            const ref = tx._id
                ? this.firestore.collection(CONFIG.COLLECTIONS.TRANSACTIONS).doc(tx._id)
                : this.firestore.collection(CONFIG.COLLECTIONS.TRANSACTIONS).doc();
            batch.set(ref, { ...tx, userId: this.userId });
        });

        // Clear and reinsert budgets
        const budSnap = await this.firestore
            .collection(CONFIG.COLLECTIONS.BUDGETS)
            .where('userId', '==', this.userId)
            .get();
        budSnap.forEach(doc => batch.delete(doc.ref));
        data.budgets?.forEach(b => {
            const ref = b._id
                ? this.firestore.collection(CONFIG.COLLECTIONS.BUDGETS).doc(b._id)
                : this.firestore.collection(CONFIG.COLLECTIONS.BUDGETS).doc();
            batch.set(ref, { ...b, userId: this.userId });
        });

        await batch.commit();
        return true;
    }
}

// Create global database instance
const db = new Database();
