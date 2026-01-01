// Main Application Logic

// Global state
let currentSection = 'dashboard';
let accounts = [];
let transactions = [];
let budgets = [];
let accountsChart = null;
let incomeExpenseChart = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    showLoading();
    
    // Initialize database connection
    const initResult = await db.init();
    
    // Check if login is required
    if (initResult.requiresLogin) {
        hideLoading();
        showLoginScreen();
        return;
    }
    
    // Load initial data
    await loadAllData();
    
    // Setup navigation
    setupNavigation();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize date inputs
    initializeDateInputs();
    
    // Initialize budget month selector
    initializeBudgetMonthSelector();
    
    // Show dashboard
    showSection('dashboard');
    
    hideLoading();
});

// Load all data from database
async function loadAllData() {
    accounts = await db.getAccounts();
    transactions = await db.getTransactions();
    budgets = await db.getBudgets(getCurrentMonth());
    
    updateDashboard();
    renderAccounts();
    renderTransactions();
    renderBudgets();
    populateAccountSelects();
}

// Setup navigation
function setupNavigation() {
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.currentTarget.dataset.section;
            showSection(section);
            
            // Update active nav link
            document.querySelectorAll('[data-section]').forEach(l => l.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });
}

// Show a specific section
function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(section).classList.add('active');
    currentSection = section;
    
    // Refresh data when showing section
    if (section === 'dashboard') {
        updateDashboard();
    } else if (section === 'budget') {
        renderBudgets();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Filter listeners
    document.getElementById('filterAccount').addEventListener('change', filterTransactions);
    document.getElementById('filterType').addEventListener('change', filterTransactions);
    document.getElementById('filterFromDate').addEventListener('change', filterTransactions);
    document.getElementById('filterToDate').addEventListener('change', filterTransactions);
    
    // Budget month selector
    document.getElementById('budgetMonth').addEventListener('change', async (e) => {
        budgets = await db.getBudgets(e.target.value);
        renderBudgets();
    });
    
    // Modal events - populate categories when transaction modal opens
    document.getElementById('addTransactionModal').addEventListener('show.bs.modal', () => {
        populateCategorySelect();
    });
    
    // Budget modal - populate categories
    document.getElementById('addBudgetModal').addEventListener('show.bs.modal', () => {
        populateBudgetCategorySelect();
    });
}

// Initialize date inputs with current date
function initializeDateInputs() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;
    document.getElementById('transferDate').value = today;
    
    // Set current date display
    document.getElementById('currentDate').textContent = formatDate(new Date());
}

// Initialize budget month selector
function initializeBudgetMonthSelector() {
    const select = document.getElementById('budgetMonth');
    const currentDate = new Date();
    
    // Add past 6 months and next 6 months
    for (let i = -6; i <= 6; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const text = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        
        if (i === 0) {
            option.selected = true;
        }
        
        select.appendChild(option);
    }
}

// =====================
// DASHBOARD FUNCTIONS
// =====================

async function updateDashboard() {
    // Update total balance
    const totalBalance = await db.getTotalBalance();
    document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);
    
    // Update monthly summary
    const summary = await db.getMonthlySummary();
    document.getElementById('monthIncome').textContent = formatCurrency(summary.income);
    document.getElementById('monthExpenses').textContent = formatCurrency(summary.expenses);
    
    // Update account list in dashboard
    renderDashboardAccounts();
    
    // Update recent transactions
    renderRecentTransactions();
    
    // Update charts
    updateCharts();
}

function renderDashboardAccounts() {
    const container = document.getElementById('dashboardAccounts');
    container.innerHTML = '';
    
    if (accounts.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="bi bi-bank display-6"></i>
                <p class="mb-0 mt-2">No accounts yet</p>
            </div>
        `;
        return;
    }
    
    accounts.forEach(account => {
        const icon = ACCOUNT_ICONS[account.type] || 'bi-wallet2';
        const item = document.createElement('div');
        item.className = 'list-group-item';
        item.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="account-icon me-3" style="background-color: ${account.color}">
                    <i class="bi ${icon}"></i>
                </div>
                <div>
                    <h6 class="mb-0">${account.name}</h6>
                    <small class="text-muted">${account.type}</small>
                </div>
            </div>
            <span class="fw-bold ${account.balance >= 0 ? 'text-success' : 'text-danger'}">
                ${formatCurrency(account.balance)}
            </span>
        `;
        container.appendChild(item);
    });
}

function renderRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    container.innerHTML = '';
    
    const recent = transactions.slice(0, 5);
    
    if (recent.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="bi bi-inbox display-6"></i>
                <p class="mb-0 mt-2">No transactions yet</p>
            </div>
        `;
        return;
    }
    
    recent.forEach(trans => {
        const category = getCategoryById(trans.category, trans.type);
        const account = accounts.find(a => a._id === trans.accountId);
        
        const item = document.createElement('div');
        item.className = `list-group-item transaction-item ${trans.type}`;
        item.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="category-icon me-3" style="background-color: ${category.color}20; color: ${category.color}">
                    <i class="bi ${category.icon}"></i>
                </div>
                <div>
                    <h6 class="mb-0">${trans.description || category.name}</h6>
                    <small class="text-muted">${formatDate(trans.date)} • ${account?.name || 'Unknown'}</small>
                </div>
            </div>
            <span class="transaction-amount ${trans.type}">
                ${trans.type === 'income' ? '+' : '-'}${formatCurrency(trans.amount)}
            </span>
        `;
        container.appendChild(item);
    });
}

function updateCharts() {
    updateAccountsChart();
    updateIncomeExpenseChart();
}

function updateAccountsChart() {
    const ctx = document.getElementById('accountsChart').getContext('2d');
    
    if (accountsChart) {
        accountsChart.destroy();
    }
    
    if (accounts.length === 0) {
        return;
    }
    
    const positiveAccounts = accounts.filter(a => a.balance > 0);
    
    accountsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: positiveAccounts.map(a => a.name),
            datasets: [{
                data: positiveAccounts.map(a => a.balance),
                backgroundColor: positiveAccounts.map(a => a.color),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

async function updateIncomeExpenseChart() {
    const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
    
    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
    }
    
    // Get last 6 months data
    const months = [];
    const incomeData = [];
    const expenseData = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
        
        months.push(monthLabel);
        
        const summary = await db.getMonthlySummary(monthStr);
        incomeData.push(summary.income);
        expenseData.push(summary.expenses);
    }
    
    incomeExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: '#198754',
                    borderRadius: 5
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: '#dc3545',
                    borderRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// =====================
// ACCOUNT FUNCTIONS
// =====================

function renderAccounts() {
    const container = document.getElementById('accountsList');
    container.innerHTML = '';
    
    if (accounts.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="bi bi-bank"></i>
                    <h5>No Accounts Yet</h5>
                    <p>Add your first account to start tracking your finances.</p>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addAccountModal">
                        <i class="bi bi-plus-lg me-1"></i>Add Account
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    accounts.forEach(account => {
        const icon = ACCOUNT_ICONS[account.type] || 'bi-wallet2';
        const card = document.createElement('div');
        card.className = 'col-md-4';
        card.innerHTML = `
            <div class="card account-card h-100" style="--account-color: ${account.color}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div class="account-icon" style="background-color: ${account.color}">
                            <i class="bi ${icon}"></i>
                        </div>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-light" data-bs-toggle="dropdown">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li><a class="dropdown-item" href="#" onclick="editAccount('${account._id}')">
                                    <i class="bi bi-pencil me-2"></i>Edit
                                </a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="deleteAccount('${account._id}')">
                                    <i class="bi bi-trash me-2"></i>Delete
                                </a></li>
                            </ul>
                        </div>
                    </div>
                    <h5 class="card-title">${account.name}</h5>
                    <p class="text-muted mb-3">${account.type}</p>
                    <h3 class="${account.balance >= 0 ? 'text-success' : 'text-danger'}">
                        ${formatCurrency(account.balance)}
                    </h3>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

async function addAccount() {
    const name = document.getElementById('accountName').value.trim();
    const type = document.getElementById('accountType').value;
    const balance = document.getElementById('accountBalance').value;
    const color = document.getElementById('accountColor').value;
    
    if (!name) {
        showToast('Please enter account name', 'error');
        return;
    }
    
    showLoading();
    
    try {
        await db.addAccount({ name, type, balance, color });
        
        // Reload data
        accounts = await db.getAccounts();
        renderAccounts();
        populateAccountSelects();
        updateDashboard();
        
        // Close modal and reset form
        bootstrap.Modal.getInstance(document.getElementById('addAccountModal')).hide();
        document.getElementById('addAccountForm').reset();
        document.getElementById('accountColor').value = '#0d6efd';
        
        showToast('Account added successfully', 'success');
    } catch (error) {
        showToast('Error adding account', 'error');
    }
    
    hideLoading();
}

function editAccount(id) {
    const account = accounts.find(a => a._id === id);
    if (!account) return;
    
    document.getElementById('editAccountId').value = account._id;
    document.getElementById('editAccountName').value = account.name;
    document.getElementById('editAccountType').value = account.type;
    document.getElementById('editAccountColor').value = account.color;
    
    new bootstrap.Modal(document.getElementById('editAccountModal')).show();
}

async function updateAccount() {
    const id = document.getElementById('editAccountId').value;
    const name = document.getElementById('editAccountName').value.trim();
    const type = document.getElementById('editAccountType').value;
    const color = document.getElementById('editAccountColor').value;
    
    if (!name) {
        showToast('Please enter account name', 'error');
        return;
    }
    
    showLoading();
    
    try {
        await db.updateAccount(id, { name, type, color });
        
        // Reload data
        accounts = await db.getAccounts();
        renderAccounts();
        populateAccountSelects();
        updateDashboard();
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('editAccountModal')).hide();
        
        showToast('Account updated successfully', 'success');
    } catch (error) {
        showToast('Error updating account', 'error');
    }
    
    hideLoading();
}

async function deleteAccount(id) {
    const account = accounts.find(a => a._id === id);
    if (!account) return;
    
    if (!confirm(`Are you sure you want to delete "${account.name}"? This will also delete all related transactions.`)) {
        return;
    }
    
    showLoading();
    
    try {
        await db.deleteAccount(id);
        
        // Reload all data
        await loadAllData();
        
        showToast('Account deleted successfully', 'success');
    } catch (error) {
        showToast('Error deleting account', 'error');
    }
    
    hideLoading();
}

// ========================
// TRANSACTION FUNCTIONS
// ========================

function setTransactionType(type) {
    document.getElementById('transactionType').value = type;
    
    const title = document.getElementById('transactionModalTitle');
    const btn = document.getElementById('addTransactionBtn');
    
    if (type === 'income') {
        title.innerHTML = '<i class="bi bi-plus-circle me-2 text-success"></i>Add Income';
        btn.className = 'btn btn-success';
        btn.textContent = 'Add Income';
    } else {
        title.innerHTML = '<i class="bi bi-dash-circle me-2 text-danger"></i>Add Expense';
        btn.className = 'btn btn-danger';
        btn.textContent = 'Add Expense';
    }
    
    populateCategorySelect();
}

function populateCategorySelect() {
    const type = document.getElementById('transactionType').value;
    const select = document.getElementById('transactionCategory');
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    
    select.innerHTML = categories.map(cat => 
        `<option value="${cat.id}">${cat.name}</option>`
    ).join('');
}

function populateBudgetCategorySelect() {
    const select = document.getElementById('budgetCategory');
    select.innerHTML = EXPENSE_CATEGORIES.map(cat => 
        `<option value="${cat.id}">${cat.name}</option>`
    ).join('');
}

function populateAccountSelects() {
    const selects = [
        'transactionAccount',
        'filterAccount',
        'transferFrom',
        'transferTo'
    ];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const firstOption = selectId === 'filterAccount' 
            ? '<option value="">All Accounts</option>'
            : '';
        
        select.innerHTML = firstOption + accounts.map(acc => 
            `<option value="${acc._id}">${acc.name}</option>`
        ).join('');
    });
}

function renderTransactions() {
    const container = document.getElementById('transactionsList');
    const noTransactions = document.getElementById('noTransactions');
    
    container.innerHTML = '';
    
    if (transactions.length === 0) {
        container.style.display = 'none';
        noTransactions.style.display = 'block';
        return;
    }
    
    container.style.display = '';
    noTransactions.style.display = 'none';
    
    transactions.forEach(trans => {
        const category = getCategoryById(trans.category, trans.type);
        const account = accounts.find(a => a._id === trans.accountId);
        let accountDisplay = account?.name || 'Unknown';
        
        if (trans.type === 'transfer') {
            const toAccount = accounts.find(a => a._id === trans.toAccountId);
            accountDisplay = `${account?.name || 'Unknown'} → ${toAccount?.name || 'Unknown'}`;
        }
        
        const row = document.createElement('tr');
        row.className = `transaction-item ${trans.type}`;
        row.innerHTML = `
            <td>${formatDate(trans.date)}</td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="category-icon me-2" style="background-color: ${category.color}20; color: ${category.color}">
                        <i class="bi ${category.icon}"></i>
                    </div>
                    ${trans.description || '-'}
                </div>
            </td>
            <td><span class="badge" style="background-color: ${category.color}">${category.name}</span></td>
            <td>${accountDisplay}</td>
            <td class="transaction-amount ${trans.type}">
                ${trans.type === 'income' ? '+' : trans.type === 'expense' ? '-' : ''}${formatCurrency(trans.amount)}
            </td>
            <td>
                <button class="btn btn-sm btn-outline-danger action-btn" onclick="deleteTransaction('${trans._id}')" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        container.appendChild(row);
    });
}

async function addTransaction() {
    const type = document.getElementById('transactionType').value;
    const accountId = document.getElementById('transactionAccount').value;
    const amount = document.getElementById('transactionAmount').value;
    const category = document.getElementById('transactionCategory').value;
    const description = document.getElementById('transactionDescription').value.trim();
    const date = document.getElementById('transactionDate').value;
    
    if (!accountId || !amount || !date) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    showLoading();
    
    try {
        await db.addTransaction({
            type,
            accountId,
            amount,
            category,
            description,
            date
        });
        
        // Reload data
        accounts = await db.getAccounts();
        transactions = await db.getTransactions();
        
        renderTransactions();
        renderAccounts();
        updateDashboard();
        
        // Close modal and reset form
        bootstrap.Modal.getInstance(document.getElementById('addTransactionModal')).hide();
        document.getElementById('addTransactionForm').reset();
        document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
        
        showToast('Transaction added successfully', 'success');
    } catch (error) {
        showToast('Error adding transaction', 'error');
    }
    
    hideLoading();
}

async function makeTransfer() {
    const fromAccountId = document.getElementById('transferFrom').value;
    const toAccountId = document.getElementById('transferTo').value;
    const amount = document.getElementById('transferAmount').value;
    const description = document.getElementById('transferDescription').value.trim();
    const date = document.getElementById('transferDate').value;
    
    if (!fromAccountId || !toAccountId || !amount || !date) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (fromAccountId === toAccountId) {
        showToast('Please select different accounts', 'error');
        return;
    }
    
    // Check if source account has sufficient balance
    const fromAccount = accounts.find(a => a._id === fromAccountId);
    if (fromAccount.balance < parseFloat(amount)) {
        showToast('Insufficient balance in source account', 'error');
        return;
    }
    
    showLoading();
    
    try {
        await db.addTransaction({
            type: 'transfer',
            accountId: fromAccountId,
            toAccountId,
            amount,
            category: 'transfer',
            description: description || 'Account Transfer',
            date
        });
        
        // Reload data
        accounts = await db.getAccounts();
        transactions = await db.getTransactions();
        
        renderTransactions();
        renderAccounts();
        updateDashboard();
        
        // Close modal and reset form
        bootstrap.Modal.getInstance(document.getElementById('transferModal')).hide();
        document.getElementById('transferForm').reset();
        document.getElementById('transferDate').value = new Date().toISOString().split('T')[0];
        
        showToast('Transfer completed successfully', 'success');
    } catch (error) {
        showToast('Error making transfer', 'error');
    }
    
    hideLoading();
}

async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    showLoading();
    
    try {
        await db.deleteTransaction(id);
        
        // Reload data
        accounts = await db.getAccounts();
        transactions = await db.getTransactions();
        
        renderTransactions();
        renderAccounts();
        updateDashboard();
        
        showToast('Transaction deleted successfully', 'success');
    } catch (error) {
        showToast('Error deleting transaction', 'error');
    }
    
    hideLoading();
}

async function filterTransactions() {
    const accountId = document.getElementById('filterAccount').value;
    const type = document.getElementById('filterType').value;
    const fromDate = document.getElementById('filterFromDate').value;
    const toDate = document.getElementById('filterToDate').value;
    
    showLoading();
    
    transactions = await db.getTransactions({
        accountId: accountId || undefined,
        type: type || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
    });
    
    renderTransactions();
    
    hideLoading();
}

// ====================
// BUDGET FUNCTIONS
// ====================

async function renderBudgets() {
    const container = document.getElementById('budgetList');
    const month = document.getElementById('budgetMonth').value;
    
    container.innerHTML = '';
    
    // Calculate totals
    let totalBudget = 0;
    let totalSpent = 0;
    
    if (budgets.length === 0) {
        document.getElementById('totalBudget').textContent = formatCurrency(0);
        document.getElementById('totalSpent').textContent = formatCurrency(0);
        document.getElementById('totalRemaining').textContent = formatCurrency(0);
        
        container.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="bi bi-pie-chart"></i>
                    <h5>No Budget Set</h5>
                    <p>Create a budget to start planning your expenses.</p>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addBudgetModal">
                        <i class="bi bi-plus-lg me-1"></i>Add Budget
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    for (const budget of budgets) {
        const category = getCategoryById(budget.category, 'expense');
        const spent = await db.getBudgetSpent(budget.category, month);
        const remaining = budget.amount - spent;
        const percentage = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
        
        totalBudget += budget.amount;
        totalSpent += spent;
        
        let progressClass = 'safe';
        if (percentage >= 90) progressClass = 'danger';
        else if (percentage >= 70) progressClass = 'warning';
        
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4';
        card.innerHTML = `
            <div class="card budget-card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div class="d-flex align-items-center">
                            <div class="category-icon me-2" style="background-color: ${category.color}20; color: ${category.color}">
                                <i class="bi ${category.icon}"></i>
                            </div>
                            <h6 class="mb-0">${category.name}</h6>
                        </div>
                        <button class="btn btn-sm btn-outline-danger action-btn" onclick="deleteBudget('${budget._id}')" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                    
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted">Spent</span>
                        <span class="fw-bold">${formatCurrency(spent)} / ${formatCurrency(budget.amount)}</span>
                    </div>
                    
                    <div class="budget-progress mb-2">
                        <div class="budget-progress-bar ${progressClass}" style="width: ${percentage}%"></div>
                    </div>
                    
                    <div class="d-flex justify-content-between">
                        <small class="${remaining >= 0 ? 'text-success' : 'text-danger'}">
                            ${remaining >= 0 ? 'Remaining: ' : 'Over budget: '}${formatCurrency(Math.abs(remaining))}
                        </small>
                        <small class="text-muted">${percentage.toFixed(0)}%</small>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    }
    
    // Update totals
    document.getElementById('totalBudget').textContent = formatCurrency(totalBudget);
    document.getElementById('totalSpent').textContent = formatCurrency(totalSpent);
    document.getElementById('totalRemaining').textContent = formatCurrency(totalBudget - totalSpent);
}

async function addBudget() {
    const category = document.getElementById('budgetCategory').value;
    const amount = document.getElementById('budgetAmount').value;
    const month = document.getElementById('budgetMonth').value;
    
    if (!category || !amount) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    showLoading();
    
    try {
        await db.addBudget({ category, amount, month });
        
        // Reload budgets
        budgets = await db.getBudgets(month);
        renderBudgets();
        
        // Close modal and reset form
        bootstrap.Modal.getInstance(document.getElementById('addBudgetModal')).hide();
        document.getElementById('addBudgetForm').reset();
        
        showToast('Budget added successfully', 'success');
    } catch (error) {
        showToast('Error adding budget', 'error');
    }
    
    hideLoading();
}

async function deleteBudget(id) {
    if (!confirm('Are you sure you want to delete this budget?')) {
        return;
    }
    
    showLoading();
    
    try {
        await db.deleteBudget(id);
        
        // Reload budgets
        const month = document.getElementById('budgetMonth').value;
        budgets = await db.getBudgets(month);
        renderBudgets();
        
        showToast('Budget deleted successfully', 'success');
    } catch (error) {
        showToast('Error deleting budget', 'error');
    }
    
    hideLoading();
}

// ===================
// UTILITY FUNCTIONS
// ===================

function showLoading() {
    document.getElementById('loadingOverlay').classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    
    toastMessage.textContent = message;
    
    // Set icon and title based on type
    switch (type) {
        case 'success':
            toastTitle.textContent = 'Success';
            toastIcon.className = 'bi bi-check-circle-fill me-2 text-success';
            break;
        case 'error':
            toastTitle.textContent = 'Error';
            toastIcon.className = 'bi bi-exclamation-circle-fill me-2 text-danger';
            break;
        case 'warning':
            toastTitle.textContent = 'Warning';
            toastIcon.className = 'bi bi-exclamation-triangle-fill me-2 text-warning';
            break;
        default:
            toastTitle.textContent = 'Info';
            toastIcon.className = 'bi bi-info-circle-fill me-2 text-info';
    }
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Export data function
async function exportData() {
    const data = await db.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Import data function
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            await db.importData(data);
            await loadAllData();
            showToast('Data imported successfully', 'success');
        } catch (error) {
            showToast('Error importing data', 'error');
        }
    };
    reader.readAsText(file);
}

// ===================
// LOGIN FUNCTIONS
// ===================

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.querySelector('nav').style.display = 'none';
    document.querySelector('main').style.display = 'none';
}

function hideLoginScreen() {
    document.getElementById('loginScreen').style.display = 'none';
    document.querySelector('nav').style.display = 'block';
    document.querySelector('main').style.display = 'block';
}

async function handleLogin() {
    const password = document.getElementById('loginPassword').value;
    
    if (!password) {
        showToast('Please enter your password', 'error');
        return;
    }
    
    showLoading();
    
    const result = await db.signIn(password);
    
    if (result.success) {
        document.getElementById('loginPassword').value = '';
        hideLoginScreen();
        
        // Load data and initialize app
        await loadAllData();
        setupNavigation();
        setupEventListeners();
        initializeDateInputs();
        initializeBudgetMonthSelector();
        showSection('dashboard');
        
        showToast('Welcome back!', 'success');
    } else {
        showToast('Invalid password. Please try again.', 'error');
    }
    
    hideLoading();
}

async function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) {
        return;
    }
    
    showLoading();
    await db.signOut();
    hideLoading();
    
    showLoginScreen();
    showToast('Logged out successfully', 'info');
}
