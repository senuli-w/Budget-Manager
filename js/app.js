// Budget Manager - Simplified PWA App

// Global state
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
      document.getElementById('passwordInput').focus();
      return;
    }

    // User is logged in
    await loadAppData();
    showMainApp();
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
    accounts = await db.getAccounts() || [];
    transactions = await db.getTransactions() || [];
    allTransactions = [...transactions];

    // Populate account selects
    populateAccountSelects();
    populateAccountFilters();

    // Render initial views
    updateDashboard();
    renderTransactions(transactions);
    renderAccounts();

    // Set today's date as default
    document.getElementById('txnDate').valueAsDate = new Date();
  } catch (error) {
    console.error('Error loading app data:', error);
  }
}

// ==================== AUTH HANDLERS ====================

async function handleLogin(event) {
  event.preventDefault();
  
  const password = document.getElementById('passwordInput').value;
  const btn = event.target.querySelector('button');
  const originalText = btn.textContent;

  try {
    btn.textContent = 'Logging in...';
    btn.disabled = true;

    const success = await db.signIn(password);
    
    if (success) {
      document.getElementById('passwordInput').value = '';
      await loadAppData();
      showMainApp();
      showToast('Welcome back!');
    } else {
      showToast('Invalid password', 'error');
      document.getElementById('passwordInput').focus();
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
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordInput').focus();
    accounts = [];
    transactions = [];
  } catch (error) {
    console.error('Logout error:', error);
    showToast('Logout failed', 'error');
  }
}

// ==================== SECTION NAVIGATION ====================

function switchSection(event, sectionId) {
  // Update active tab
  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
  event.target.closest('.nav-tab').classList.add('active');

  // Update active section
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');

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
    totalBalance += account.balance || 0;
  });

  transactions.forEach(txn => {
    const txnMonth = txn.date.substring(0, 7);
    if (txnMonth === currentMonth) {
      if (txn.type === 'income') monthIncome += txn.amount;
      if (txn.type === 'expense') monthExpenses += txn.amount;
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
  // Account distribution chart
  const accountCtx = document.getElementById('accountsChart')?.getContext('2d');
  if (accountCtx) {
    if (window.accountsChartInstance) window.accountsChartInstance.destroy();

    const chartData = {
      labels: accounts.map(a => a.name),
      datasets: [{
        data: accounts.map(a => a.balance),
        backgroundColor: [
          '#6366f1',
          '#10b981',
          '#ef4444',
          '#f59e0b',
          '#8b5cf6',
          '#ec4899'
        ],
        borderWidth: 0
      }]
    };

    window.accountsChartInstance = new Chart(accountCtx, {
      type: 'doughnut',
      data: chartData,
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
      if (txn.date.substring(0, 7) === currentMonth) {
        if (txn.type === 'income') income += txn.amount;
        if (txn.type === 'expense') expense += txn.amount;
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

  const recent = transactions.slice(-5).reverse();
  container.innerHTML = recent.length ? recent.map(txn => `
    <div class="transaction-item">
      <div class="transaction-icon ${txn.type}">
        ${getTransactionIcon(txn.type)}
      </div>
      <div class="transaction-info">
        <div class="transaction-category">${txn.category}</div>
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

  const type = document.querySelector('input[name="type"]:checked').value;
  const amount = parseFloat(document.getElementById('txnAmount').value);
  const category = document.getElementById('txnCategory').value;
  const account = document.getElementById('txnAccount').value;
  const date = document.getElementById('txnDate').value;
  const note = document.getElementById('txnNote').value;

  if (!type || !amount || !category || !account || !date) {
    showToast('Please fill all required fields', 'error');
    return;
  }

  const transaction = {
    id: Date.now().toString(),
    type,
    amount,
    category,
    account,
    toAccount: type === 'transfer' ? document.getElementById('txnToAccount').value : null,
    date,
    note,
    timestamp: new Date().toISOString()
  };

  try {
    // Add transaction to database
    await db.addTransaction(transaction);

    // Update local account balances
    const accountObj = accounts.find(a => a.id === account);
    if (accountObj) {
      if (type === 'income') {
        accountObj.balance += amount;
      } else if (type === 'expense') {
        accountObj.balance -= amount;
      } else if (type === 'transfer') {
        const toAccountObj = accounts.find(a => a.id === transaction.toAccount);
        if (toAccountObj) {
          accountObj.balance -= amount;
          toAccountObj.balance += amount;
          await db.updateAccount(toAccountObj);
        }
      }
      await db.updateAccount(accountObj);
    }

    // Refresh data
    transactions.push(transaction);
    allTransactions.push(transaction);

    // Reset form
    event.target.reset();
    document.getElementById('txnDate').valueAsDate = new Date();

    showToast('Transaction added!');
    updateDashboard();
    renderTransactions(transactions);
    switchSection({ target: document.querySelector('[data-section="dashboard"]').parentElement }, 'dashboard');
  } catch (error) {
    console.error('Error adding transaction:', error);
    showToast('Failed to add transaction', 'error');
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
        <div class="transaction-category">${txn.category}</div>
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
    filtered = filtered.filter(t => t.account === accountFilter);
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

  const account = {
    id: Date.now().toString(),
    name,
    type,
    balance,
    timestamp: new Date().toISOString()
  };

  try {
    await db.addAccount(account);
    accounts.push(account);

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
    select.innerHTML = '<option value="">Select account</option>' +
      accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    if (currentValue) select.value = currentValue;
  });
}

function populateAccountFilters() {
  const filterSelect = document.getElementById('filterAccount');
  if (!filterSelect) return;

  filterSelect.innerHTML = '<option value="">All Accounts</option>' +
    accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
}

// Update category dropdown based on transaction type
document.addEventListener('DOMContentLoaded', () => {
  const typeInputs = document.querySelectorAll('input[name="type"]');
  const categorySelect = document.getElementById('txnCategory');
  const toAccountGroup = document.getElementById('txnToAccountGroup');

  typeInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      const type = e.target.value;

      // Update categories
      const categories = {
        expense: ['Food', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'],
        income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
        transfer: ['Bank Transfer', 'Account Transfer', 'Cash Transfer']
      };

      if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Select category</option>' +
          (categories[type] || []).map(cat => `<option value="${cat}">${cat}</option>`).join('');
      }

      // Show/hide "To Account" field for transfers
      if (toAccountGroup) {
        toAccountGroup.style.display = type === 'transfer' ? 'block' : 'none';
      }
    });
  });

  // Initialize with default type
  const expenseType = document.querySelector('input[name="type"][value="expense"]');
  if (expenseType) expenseType.dispatchEvent(new Event('change'));
});

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

// Close modals on outside click
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.style.display = 'none';
  }
});
