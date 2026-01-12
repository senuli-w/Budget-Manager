// Budget Manager - Simplified PWA App

// Global state (Firestore shapes)
// accounts: { _id, name, type, balance, ... }
// transactions: { _id, type, amount, category, accountId, toAccountId, date, note, ... }
let accounts = [];
let transactions = [];
let allTransactions = [];

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {
      // Service worker registration failed - app will still work
    });
  });
}

// Initialize app on load
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Set current date
    updateCurrentDate();

    // Initialize database
    const initResult = await db.init();

    // Check if login required
    if (initResult.requiresLogin) {
      document.getElementById('loginScreen').style.display = 'flex';
      document.getElementById('mainApp').style.display = 'none';
      document.getElementById('pinInput').focus();
      return;
    }

    // User is logged in
    await loadAppData();
    showMainApp();

    // Optional deep link: ?section=dashboard|add-transaction|transactions|accounts
    const section = new URLSearchParams(window.location.search).get('section');
    if (section) {
      setActiveSection(section);
    }
  } catch (error) {
    console.error('Initialization error:', error);
    alert('Error initializing app. Please refresh.');
  }
});

// Show main app
function showMainApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'flex';
  updateDashboard();
}

// Load all app data
async function loadAppData() {
  try {
    accounts = (await db.getAccounts()) || [];
    transactions = (await db.getTransactions()) || [];
    allTransactions = [...transactions];

    // Populate account selects
    populateAccountSelects();
    populateAccountFilters();

    // Render initial views
    updateDashboard();
    renderTransactions(transactions);
    renderAccounts();

    // Set today's date as default
    const txnDateEl = document.getElementById('txnDate');
    if (txnDateEl) txnDateEl.valueAsDate = new Date();

    // Ensure the Add form starts in a valid state
    syncTransactionFormForType(getSelectedTxnType());
  } catch (error) {
    console.error('Error loading app data:', error);
  }
}

// ==================== AUTH HANDLERS ====================

async function handleLogin(event) {
  event.preventDefault();
  
  const pin = document.getElementById('pinInput').value;
  const btn = event.target.querySelector('button');
  const originalText = btn.textContent;

  try {
    btn.textContent = 'Logging in...';
    btn.disabled = true;

    const result = await db.signIn(pin);

    if (result?.success) {
      document.getElementById('pinInput').value = '';
      await loadAppData();
      showMainApp();
      showToast('Welcome back!');
    } else {
      showToast('Invalid PIN', 'error');
      document.getElementById('pinInput').focus();
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('Login failed. Please try again.', 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

async function handleLogout() {
  if (!confirm('Are you sure you want to logout?')) return;

  try {
    await db.signOut();
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('pinInput').value = '';
    document.getElementById('pinInput').focus();
    accounts = [];
    transactions = [];
  } catch (error) {
    console.error('Logout error:', error);
    showToast('Logout failed', 'error');
  }
}

// ==================== SECTION NAVIGATION ====================

function switchSection(event, sectionId) {
  const tab = event?.target?.closest?.('.nav-tab');
  setActiveSection(sectionId, tab);
}

function setActiveSection(sectionId, activeTabEl = null) {
  // Update active tab
  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
  if (activeTabEl) {
    activeTabEl.classList.add('active');
  } else {
    const tabBySection = document.querySelector(`.nav-tab[data-section="${CSS.escape(sectionId)}"]`);
    if (tabBySection) tabBySection.classList.add('active');
  }

  // Update active section
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  const sectionEl = document.getElementById(sectionId);
  if (sectionEl) sectionEl.classList.add('active');

  // Refresh section data if needed
  if (sectionId === 'dashboard') {
    updateDashboard();
  } else if (sectionId === 'transactions') {
    renderTransactions(transactions);
  }
}

// ==================== DASHBOARD ====================

function updateCurrentDate() {
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  const dateStr = new Date().toLocaleDateString('en-US', options);
  document.getElementById('currentDate').textContent = dateStr;
}

async function updateDashboard() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Calculate totals
  let totalBalance = 0;
  let monthIncome = 0;
  let monthExpenses = 0;

  accounts.forEach(account => {
    totalBalance += Number(account.balance || 0);
  });

  transactions.forEach(txn => {
    const txnMonth = (txn.date || '').substring(0, 7);
    if (txnMonth === currentMonth) {
      if (txn.type === 'income') monthIncome += Number(txn.amount || 0);
      if (txn.type === 'expense') monthExpenses += Number(txn.amount || 0);
    }
  });

  // Update stat cards
  document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);
  document.getElementById('monthIncome').textContent = formatCurrency(monthIncome);
  document.getElementById('monthExpenses').textContent = formatCurrency(monthExpenses);

  // Update charts
  updateCharts();

  // Update account list
  renderDashboardAccounts();

  // Update recent transactions
  renderDashboardTransactions();
}

function updateCharts() {
  // Spending by category (current month expenses)
  const categoryCtx = document.getElementById('accountsChart')?.getContext('2d');
  if (categoryCtx) {
    if (window.accountsChartInstance) window.accountsChartInstance.destroy();

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const totalsByCategory = new Map();
    transactions
      .filter(t => t.type === 'expense' && (t.date || '').startsWith(currentMonth))
      .forEach(t => {
        const catId = t.category || 'other_expense';
        totalsByCategory.set(catId, (totalsByCategory.get(catId) || 0) + Number(t.amount || 0));
      });

    const sorted = [...totalsByCategory.entries()]
      .filter(([, total]) => total > 0)
      .sort((a, b) => b[1] - a[1]);

    const labels = sorted.map(([catId]) => getExpenseCategoryName(catId));
    const data = sorted.map(([, total]) => total);
    const colors = sorted.map(([catId], idx) => getExpenseCategoryColor(catId, idx));

    window.accountsChartInstance = new Chart(categoryCtx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors, borderWidth: 0 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  // Income vs Expenses chart
  const incomeCtx = document.getElementById('incomeExpenseChart')?.getContext('2d');
  if (incomeCtx) {
    if (window.incomeChartInstance) window.incomeChartInstance.destroy();

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let income = 0, expense = 0;
    transactions.forEach(txn => {
      if ((txn.date || '').substring(0, 7) === currentMonth) {
        if (txn.type === 'income') income += Number(txn.amount || 0);
        if (txn.type === 'expense') expense += Number(txn.amount || 0);
      }
    });

    window.incomeChartInstance = new Chart(incomeCtx, {
      type: 'bar',
      data: {
        labels: ['Income', 'Expenses'],
        datasets: [{
          label: 'Amount',
          data: [income, expense],
          backgroundColor: ['#10b981', '#ef4444'],
          borderWidth: 0,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { beginAtZero: true }
        }
      }
    });
  }
}

function renderDashboardAccounts() {
  const container = document.getElementById('dashboardAccounts');
  if (!container) return;

  container.innerHTML = accounts.length ? accounts.map(account => `
    <div class="account-item">
      <div class="account-info">
        <div class="account-name">${account.name}</div>
        <div class="account-type">${account.type || 'Account'}</div>
      </div>
      <div class="account-balance">${formatCurrency(account.balance)}</div>
    </div>
  `).join('') : '<p style="color: var(--gray-500); text-align: center; padding: 20px;">No accounts yet</p>';
}

function renderDashboardTransactions() {
  const container = document.getElementById('dashboardTransactions');
  if (!container) return;

  const recent = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  container.innerHTML = recent.length ? recent.map(txn => `
    <div class="transaction-item">
      <div class="transaction-icon ${txn.type}">
        ${getTransactionIcon(txn.type)}
      </div>
      <div class="transaction-info">
        <div class="transaction-category">${getTransactionTitle(txn)}</div>
        <div class="transaction-date">${formatDate(txn.date)}</div>
      </div>
      <div class="transaction-amount ${txn.type}">
        ${txn.type === 'income' ? '+' : txn.type === 'expense' ? '−' : '→'} ${formatCurrency(txn.amount)}
      </div>
    </div>
  `).join('') : '<p style="color: var(--gray-500); text-align: center; padding: 20px;">No transactions yet</p>';
}

// ==================== TRANSACTIONS ====================

async function handleAddTransaction(event) {
  event.preventDefault();

  const type = getSelectedTxnType();
  const amount = Number(document.getElementById('txnAmount').value);
  const category = document.getElementById('txnCategory').value;
  const accountId = document.getElementById('txnAccount').value;
  const toAccountId = document.getElementById('txnToAccount').value;
  const date = document.getElementById('txnDate').value;
  const note = document.getElementById('txnNote').value;

  // Validation rules per type
  if (!type || !amount || !accountId || !date) {
    showToast('Please fill all required fields', 'error');
    return;
  }

  if ((type === 'income' || type === 'expense') && !category) {
    showToast('Please select a category', 'error');
    return;
  }

  if (type === 'transfer') {
    if (!toAccountId) {
      showToast('Please select a destination account', 'error');
      return;
    }
    if (toAccountId === accountId) {
      showToast('From and To accounts must be different', 'error');
      return;
    }
  }

  const payload = {
    type,
    amount,
    category: type === 'transfer' ? null : category,
    accountId,
    toAccountId: type === 'transfer' ? toAccountId : null,
    date,
    note
  };

  try {
    await db.addTransaction(payload);

    // Reload from DB so balances and history are always correct
    accounts = (await db.getAccounts()) || [];
    transactions = (await db.getTransactions()) || [];
    allTransactions = [...transactions];

    populateAccountSelects();
    populateAccountFilters();

    // Reset form (keep current type)
    const form = event.target;
    form.reset();
    const txnDateEl = document.getElementById('txnDate');
    if (txnDateEl) txnDateEl.valueAsDate = new Date();
    syncTransactionFormForType(type);

    showToast('Transaction added!');
    setActiveSection('dashboard');
  } catch (error) {
    console.error('Error adding transaction:', error);
    showToast('Could not update balances. Check Firestore rules and try again.', 'error');
  }
}

function renderTransactions(txns = transactions) {
  const container = document.getElementById('transactionsList');
  if (!container) return;

  const sorted = [...txns].sort((a, b) => new Date(b.date) - new Date(a.date));

  container.innerHTML = sorted.length ? sorted.map(txn => `
    <div class="transaction-item">
      <div class="transaction-icon ${txn.type}">
        ${getTransactionIcon(txn.type)}
      </div>
      <div class="transaction-info">
        <div class="transaction-category">${getTransactionTitle(txn)}</div>
        <div class="transaction-date">${formatDate(txn.date)}</div>
      </div>
      <div class="transaction-amount ${txn.type}">
        ${txn.type === 'income' ? '+' : txn.type === 'expense' ? '−' : '→'} ${formatCurrency(txn.amount)}
      </div>
    </div>
  `).join('') : '<p style="color: var(--gray-500); text-align: center; padding: 20px;">No transactions</p>';
}

function getTransactionIcon(type) {
  switch (type) {
    case 'income': return '<i class="bi bi-graph-up"></i>';
    case 'expense': return '<i class="bi bi-graph-down"></i>';
    case 'transfer': return '<i class="bi bi-arrow-left-right"></i>';
    default: return '<i class="bi bi-circle"></i>';
  }
}

// Filter transactions
document.addEventListener('DOMContentLoaded', () => {
  const filterAccount = document.getElementById('filterAccount');
  const filterType = document.getElementById('filterType');

  if (filterAccount) {
    filterAccount.addEventListener('change', applyFilters);
  }
  if (filterType) {
    filterType.addEventListener('change', applyFilters);
  }
});

function applyFilters() {
  const accountFilter = document.getElementById('filterAccount')?.value || '';
  const typeFilter = document.getElementById('filterType')?.value || '';

  let filtered = allTransactions;

  if (accountFilter) {
    filtered = filtered.filter(t => t.accountId === accountFilter || t.toAccountId === accountFilter);
  }
  if (typeFilter) {
    filtered = filtered.filter(t => t.type === typeFilter);
  }

  renderTransactions(filtered);
}

// ==================== ACCOUNTS ====================

function renderAccounts() {
  const container = document.getElementById('accountsList');
  if (!container) return;

  container.innerHTML = accounts.length ? accounts.map(account => `
    <div class="account-item">
      <div class="account-info">
        <div class="account-name">${account.name}</div>
        <div class="account-type">${account.type || 'Account'}</div>
      </div>
      <div class="account-balance">${formatCurrency(account.balance)}</div>
    </div>
  `).join('') : '<p style="color: var(--gray-500); text-align: center; padding: 20px;">No accounts yet. Add one!</p>';
}

function showAddAccountModal() {
  document.getElementById('addAccountModal').style.display = 'flex';
  document.getElementById('accountName').focus();
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

async function handleAddAccount(event) {
  event.preventDefault();

  const name = document.getElementById('accountName').value;
  const type = document.getElementById('accountType').value;
  const balance = parseFloat(document.getElementById('accountBalance').value) || 0;

  try {
    const created = await db.addAccount({ name, type, balance });
    accounts.push(created);

    // Reset form and close modal
    event.target.reset();
    closeModal('addAccountModal');

    showToast('Account added!');
    renderAccounts();
    populateAccountSelects();
    updateDashboard();
  } catch (error) {
    console.error('Error adding account:', error);
    showToast('Failed to add account', 'error');
  }
}

function populateAccountSelects() {
  const selects = [
    document.getElementById('txnAccount'),
    document.getElementById('txnToAccount'),
    document.getElementById('filterAccount')
  ];

  selects.forEach(select => {
    if (!select) return;
    const currentValue = select.value;
    const isFilter = select.id === 'filterAccount';
    const emptyLabel = isFilter ? 'All Accounts' : 'Select account';
    select.innerHTML = `<option value="">${emptyLabel}</option>` +
      accounts.map(a => `<option value="${a._id}">${a.name}</option>`).join('');
    if (currentValue) select.value = currentValue;
  });
}

function populateAccountFilters() {
  const filterSelect = document.getElementById('filterAccount');
  if (!filterSelect) return;

  filterSelect.innerHTML = '<option value="">All Accounts</option>' +
    accounts.map(a => `<option value="${a._id}">${a.name}</option>`).join('');
}

// Update category dropdown based on transaction type
document.addEventListener('DOMContentLoaded', () => {
  const typeInputs = document.querySelectorAll('input[name="type"]');
  const categorySelect = document.getElementById('txnCategory');
  const toAccountGroup = document.getElementById('txnToAccountGroup');
  const categoryGroup = categorySelect?.closest?.('.form-group') || null;
  const fromLabel = document.querySelector('label[for="txnAccount"]');

  typeInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      const type = e.target.value;
      syncTransactionFormForType(type, { categorySelect, categoryGroup, toAccountGroup, fromLabel });
    });
  });

  // Initialize with default type
  const expenseType = document.querySelector('input[name="type"][value="expense"]');
  if (expenseType) expenseType.dispatchEvent(new Event('change'));
});

function getSelectedTxnType() {
  return document.querySelector('input[name="type"]:checked')?.value || 'expense';
}

function syncTransactionFormForType(type, els = {}) {
  const categorySelect = els.categorySelect || document.getElementById('txnCategory');
  const toAccountGroup = els.toAccountGroup || document.getElementById('txnToAccountGroup');
  const categoryGroup = els.categoryGroup || categorySelect?.closest?.('.form-group') || null;
  const fromLabel = els.fromLabel || document.querySelector('label[for="txnAccount"]');
  const toSelect = document.getElementById('txnToAccount');

  // Show/hide fields
  if (toAccountGroup) toAccountGroup.style.display = type === 'transfer' ? 'block' : 'none';
  if (categoryGroup) categoryGroup.style.display = type === 'transfer' ? 'none' : 'block';
  if (fromLabel) fromLabel.textContent = type === 'transfer' ? 'From Account' : 'Account';
  if (toSelect) toSelect.required = type === 'transfer';
  if (categorySelect) categorySelect.required = type !== 'transfer';

  // Populate categories for income/expense
  if (categorySelect) {
    const categories = type === 'income'
      ? (typeof INCOME_CATEGORIES !== 'undefined' ? INCOME_CATEGORIES : [])
      : (typeof EXPENSE_CATEGORIES !== 'undefined' ? EXPENSE_CATEGORIES : []);

    categorySelect.innerHTML = '<option value="">Select category</option>' +
      categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
  }
}

// ==================== UTILITY FUNCTIONS ====================

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2
  }).format(amount || 0);
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('successToast');
  if (!toast) return;

  const messageEl = document.getElementById('toastMessage');
  messageEl.textContent = message;

  if (type === 'error') {
    toast.style.background = 'var(--danger)';
  } else {
    toast.style.background = 'var(--gray-900)';
  }

  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

function getAccountNameById(accountId) {
  const acc = accounts.find(a => a._id === accountId);
  return acc ? acc.name : 'Account';
}

function getExpenseCategoryName(categoryId) {
  if (!categoryId) return 'Expense';
  const list = typeof EXPENSE_CATEGORIES !== 'undefined' ? EXPENSE_CATEGORIES : [];
  const match = list.find(c => c.id === categoryId);
  return match ? match.name : 'Other Expense';
}

function getIncomeCategoryName(categoryId) {
  if (!categoryId) return 'Income';
  const list = typeof INCOME_CATEGORIES !== 'undefined' ? INCOME_CATEGORIES : [];
  const match = list.find(c => c.id === categoryId);
  return match ? match.name : 'Other Income';
}

function getExpenseCategoryColor(categoryId, index = 0) {
  const list = typeof EXPENSE_CATEGORIES !== 'undefined' ? EXPENSE_CATEGORIES : [];
  const match = list.find(c => c.id === categoryId);
  if (match?.color) return match.color;
  const fallback = ['#6366f1', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];
  return fallback[index % fallback.length];
}

function getTransactionTitle(txn) {
  if (!txn) return '';
  if (txn.type === 'transfer') {
    const from = getAccountNameById(txn.accountId);
    const to = getAccountNameById(txn.toAccountId);
    return `Transfer: ${from} → ${to}`;
  }
  if (txn.type === 'income') {
    return getIncomeCategoryName(txn.category);
  }
  return getExpenseCategoryName(txn.category);
}

// Close modals on outside click
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
});
