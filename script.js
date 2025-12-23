const API_CONFIG = {
  // mode: 'dataApi' will call Atlas Data API; 'local' keeps everything in localStorage.
  mode: 'local',
  baseUrl: 'https://data.mongodb-api.com/app/<APP_ID>/endpoint/data/v1',
  apiKey: '<DATA_API_KEY>',
  dataSource: '<ClusterName>',
  database: 'budgetapp',
  collections: {
    accounts: 'accounts',
    transactions: 'transactions',
    budgets: 'budgets'
  }
};

const USE_REMOTE = API_CONFIG.mode === 'dataApi' && API_CONFIG.apiKey && API_CONFIG.baseUrl.includes('mongodb-api');
const STORAGE_KEY = 'budget-manager-state-v1';

const state = {
  accounts: [],
  transactions: [],
  budgets: []
};

const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));

const uid = () => crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(16).slice(2);
const toNumber = (v) => Number.parseFloat(v || '0');
const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthKey = (iso) => iso ? iso.slice(0, 7) : new Date().toISOString().slice(0, 7);

// Local storage helpers
const storage = {
  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      state.accounts = data.accounts || [];
      state.transactions = data.transactions || [];
      state.budgets = data.budgets || [];
    } catch (err) {
      console.error('Failed to parse local data', err);
    }
  },
  save() {
    const payload = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, payload);
  }
};

// Data API helpers
async function dataApi(action, body) {
  if (!USE_REMOTE) throw new Error('Remote mode not enabled. Set API_CONFIG.mode = "dataApi".');
  const url = `${API_CONFIG.baseUrl}/action/${action}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': API_CONFIG.apiKey
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Data API error ${res.status}: ${text}`);
  }
  return res.json();
}

const remote = {
  async list(collection) {
    const body = {
      dataSource: API_CONFIG.dataSource,
      database: API_CONFIG.database,
      collection,
      filter: {}
    };
    const { documents } = await dataApi('find', body);
    return documents || [];
  },
  async insert(collection, document) {
    const body = {
      dataSource: API_CONFIG.dataSource,
      database: API_CONFIG.database,
      collection,
      document
    };
    await dataApi('insertOne', body);
  },
  async upsert(collection, filter, update) {
    const body = {
      dataSource: API_CONFIG.dataSource,
      database: API_CONFIG.database,
      collection,
      filter,
      update: { $set: update },
      upsert: true
    };
    await dataApi('updateOne', body);
  },
  async remove(collection, filter) {
    const body = {
      dataSource: API_CONFIG.dataSource,
      database: API_CONFIG.database,
      collection,
      filter
    };
    await dataApi('deleteOne', body);
  }
};

async function syncFromRemote() {
  try {
    const [accounts, transactions, budgets] = await Promise.all([
      remote.list(API_CONFIG.collections.accounts),
      remote.list(API_CONFIG.collections.transactions),
      remote.list(API_CONFIG.collections.budgets)
    ]);
    state.accounts = accounts;
    state.transactions = transactions;
    state.budgets = budgets;
    storage.save();
    renderAll();
  } catch (err) {
    console.error('Sync failed', err);
    alert('Could not sync from Atlas. Check API config.');
  }
}

async function persistAll() {
  storage.save();
  if (!USE_REMOTE) return;
  try {
    // Upsert each document by _id so the client remains the source of truth.
    await Promise.all([
      ...state.accounts.map((doc) => remote.upsert(API_CONFIG.collections.accounts, { _id: doc._id }, doc)),
      ...state.transactions.map((doc) => remote.upsert(API_CONFIG.collections.transactions, { _id: doc._id }, doc)),
      ...state.budgets.map((doc) => remote.upsert(API_CONFIG.collections.budgets, { _id: doc._id }, doc))
    ]);
  } catch (err) {
    console.error('Remote persist failed', err);
  }
}

function seedDefaults() {
  if (state.accounts.length) return;
  const baseAccounts = [
    { _id: uid(), name: 'BOC', balance: 0, createdAt: new Date().toISOString() },
    { _id: uid(), name: 'HNB', balance: 0, createdAt: new Date().toISOString() },
    { _id: uid(), name: 'Cash', balance: 0, createdAt: new Date().toISOString() }
  ];
  state.accounts.push(...baseAccounts);
  storage.save();
}

function renderAccounts() {
  const container = qs('#accountsList');
  container.innerHTML = '';
  state.accounts.forEach((acc) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div>
        <div class="title">${acc.name}</div>
        <div class="meta">Balance: LKR ${fmt(acc.balance || 0)}</div>
      </div>
      <button class="btn ghost" data-remove-account="${acc._id}">Remove</button>
    `;
    container.appendChild(card);
  });
  qs('#fromAccount').innerHTML = state.accounts.map((a) => `<option value="${a._id}">${a.name}</option>`).join('');
  qs('#toAccount').innerHTML = qs('#fromAccount').innerHTML;
}

function renderSummary() {
  const total = state.accounts.reduce((sum, a) => sum + toNumber(a.balance), 0);
  const month = qs('#filterMonth').value || monthKey(new Date().toISOString());
  const monthlyTx = state.transactions.filter((t) => monthKey(t.date) === month);
  const income = monthlyTx.filter((t) => t.type === 'income').reduce((s, t) => s + toNumber(t.amount), 0);
  const expense = monthlyTx.filter((t) => t.type === 'expense').reduce((s, t) => s + toNumber(t.amount), 0);
  const cards = [
    { label: 'Total balance', value: `LKR ${fmt(total)}` },
    { label: 'Income this month', value: `LKR ${fmt(income)}` },
    { label: 'Expense this month', value: `LKR ${fmt(expense)}` }
  ];
  const container = qs('#summaryCards');
  container.innerHTML = cards.map((c) => `
    <div class="summary-card">
      <div class="label">${c.label}</div>
      <div class="value">${c.value}</div>
    </div>
  `).join('');
}

function renderBudgets() {
  const container = qs('#budgetList');
  container.innerHTML = '';
  const nowMonth = qs('#filterMonth').value || monthKey(new Date().toISOString());
  state.budgets.filter((b) => b.month === nowMonth).forEach((b) => {
    const spent = state.transactions
      .filter((t) => t.type === 'expense' && t.category?.toLowerCase() === b.category?.toLowerCase() && monthKey(t.date) === b.month)
      .reduce((s, t) => s + toNumber(t.amount), 0);
    const pct = Math.min(100, Math.round((spent / toNumber(b.amount)) * 100));
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div>
        <div class="title">${b.category}</div>
        <div class="meta">Budget: LKR ${fmt(b.amount)} · Spent: LKR ${fmt(spent)} (${pct}%)</div>
        <div class="progress"><span style="width:${pct}%"></span></div>
      </div>
      <button class="btn ghost" data-remove-budget="${b._id}">Remove</button>
    `;
    container.appendChild(card);
  });
}

function renderTransactions() {
  const month = qs('#filterMonth').value;
  const categoryFilter = qs('#filterCategory').value.trim().toLowerCase();
  let txs = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (month) txs = txs.filter((t) => monthKey(t.date) === month);
  if (categoryFilter) txs = txs.filter((t) => t.category?.toLowerCase().includes(categoryFilter));
  const rows = txs.map((t) => {
    const label = t.type === 'transfer'
      ? `${lookupAccount(t.fromAccount)?.name || 'From'} → ${lookupAccount(t.toAccount)?.name || 'To'}`
      : lookupAccount(t.fromAccount)?.name || 'Account';
    return `
      <tr>
        <td>${new Date(t.date).toLocaleDateString()}</td>
        <td><span class="badge ${t.type === 'expense' ? 'danger' : t.type === 'income' ? 'success' : ''}">${t.type}</span></td>
        <td>${label}</td>
        <td>${t.category || '—'}</td>
        <td>${t.description || '—'}</td>
        <td>LKR ${fmt(t.amount)}</td>
        <td><button class="btn ghost" data-remove-tx="${t._id}">Delete</button></td>
      </tr>
    `;
  }).join('');
  qs('#transactionsTable').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Date</th><th>Type</th><th>Account</th><th>Category</th><th>Description</th><th>Amount</th><th></th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="7">No transactions yet.</td></tr>'}</tbody>
    </table>
  `;
}

function renderDashboard() {
  const nowMonth = qs('#filterMonth').value || monthKey(new Date().toISOString());
  const txs = state.transactions.filter((t) => monthKey(t.date) === nowMonth);
  const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + toNumber(t.amount), 0);
  const expense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + toNumber(t.amount), 0);
  const byCategory = txs.reduce((map, t) => {
    if (t.type !== 'expense') return map;
    const key = t.category || 'Other';
    map[key] = (map[key] || 0) + toNumber(t.amount);
    return map;
  }, {});
  const topCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const totalBalance = state.accounts.reduce((s, a) => s + toNumber(a.balance), 0);

  const items = [
    { title: 'Net balance', value: `LKR ${fmt(totalBalance)}`, meta: 'All accounts' },
    { title: 'This month income', value: `LKR ${fmt(income)}`, meta: nowMonth },
    { title: 'This month expense', value: `LKR ${fmt(expense)}`, meta: nowMonth }
  ];

  const container = qs('#dashboard');
  container.innerHTML = [
    ...items.map((c) => `
      <div class="summary-card">
        <div class="label">${c.meta}</div>
        <div class="value">${c.value}</div>
        <div class="label">${c.title}</div>
      </div>
    `),
    `<div class="summary-card">
      <div class="label">Top spending</div>
      ${topCategories.length ? topCategories.map(([cat, amt]) => `
        <div class="card" style="padding:8px 10px; margin:6px 0; background: rgba(255,255,255,0.03);">
          <div class="title">${cat}</div>
          <div class="meta">LKR ${fmt(amt)}</div>
        </div>
      `).join('') : '<div class="meta">No expenses yet.</div>'}
    </div>`
  ].join('');
}

function renderAll() {
  renderAccounts();
  renderSummary();
  renderBudgets();
  renderTransactions();
  renderDashboard();
}

function lookupAccount(id) {
  return state.accounts.find((a) => a._id === id);
}

function ensureAccountSelection() {
  const select = qs('#fromAccount');
  if (!select.value && state.accounts[0]) {
    select.value = state.accounts[0]._id;
  }
  const toSelect = qs('#toAccount');
  if (!toSelect.value && state.accounts[1]) {
    toSelect.value = state.accounts[1]._id;
  }
}

async function addAccount(event) {
  event.preventDefault();
  const form = event.target;
  const name = form.name.value.trim();
  const balance = toNumber(form.balance.value);
  if (!name) return;
  const account = { _id: uid(), name, balance, createdAt: new Date().toISOString() };
  state.accounts.push(account);
  await persistAll();
  renderAll();
  form.reset();
  ensureAccountSelection();
}

async function addBudget(event) {
  event.preventDefault();
  const form = event.target;
  const budget = {
    _id: uid(),
    category: form.category.value.trim(),
    amount: toNumber(form.amount.value),
    month: form.month.value || monthKey(new Date().toISOString())
  };
  const existing = state.budgets.find((b) => b.category.toLowerCase() === budget.category.toLowerCase() && b.month === budget.month);
  if (existing) {
    existing.amount = budget.amount;
  } else {
    state.budgets.push(budget);
  }
  await persistAll();
  renderBudgets();
  renderDashboard();
  form.reset();
}

async function addTransaction(event) {
  event.preventDefault();
  const form = event.target;
  const type = form.type.value;
  const fromAccountId = form.fromAccount.value;
  const toAccountId = form.toAccount.value;
  const amount = toNumber(form.amount.value);
  if (!amount || amount <= 0) return alert('Enter an amount');

  if (type !== 'transfer' && !fromAccountId) return alert('Select an account');
  if (type === 'transfer' && (!fromAccountId || !toAccountId)) return alert('Select both accounts');

  const tx = {
    _id: uid(),
    type,
    fromAccount: fromAccountId,
    toAccount: type === 'transfer' ? toAccountId : null,
    amount,
    category: form.category.value.trim() || 'General',
    description: form.description.value.trim(),
    date: form.date.value ? new Date(form.date.value).toISOString() : new Date().toISOString()
  };

  applyTransactionToAccounts(tx);
  state.transactions.push(tx);
  await persistAll();
  renderAll();
  form.reset();
  form.date.value = new Date().toISOString().slice(0, 10);
}

function applyTransactionToAccounts(tx) {
  if (tx.type === 'income') {
    const acc = lookupAccount(tx.fromAccount);
    if (acc) acc.balance = toNumber(acc.balance) + tx.amount;
  } else if (tx.type === 'expense') {
    const acc = lookupAccount(tx.fromAccount);
    if (acc) acc.balance = toNumber(acc.balance) - tx.amount;
  } else if (tx.type === 'transfer') {
    const fromAcc = lookupAccount(tx.fromAccount);
    const toAcc = lookupAccount(tx.toAccount);
    if (fromAcc) fromAcc.balance = toNumber(fromAcc.balance) - tx.amount;
    if (toAcc) toAcc.balance = toNumber(toAcc.balance) + tx.amount;
  }
}

async function removeAccount(id) {
  const txExists = state.transactions.some((t) => t.fromAccount === id || t.toAccount === id);
  if (txExists) return alert('Cannot remove an account with transactions. Delete transactions first.');
  state.accounts = state.accounts.filter((a) => a._id !== id);
  await persistAll();
  renderAll();
}

async function removeBudget(id) {
  state.budgets = state.budgets.filter((b) => b._id !== id);
  await persistAll();
  renderBudgets();
}

async function removeTransaction(id) {
  const tx = state.transactions.find((t) => t._id === id);
  if (tx) undoTransaction(tx);
  state.transactions = state.transactions.filter((t) => t._id !== id);
  await persistAll();
  renderAll();
}

function undoTransaction(tx) {
  // Reverse balance changes when deleting.
  if (tx.type === 'income') {
    const acc = lookupAccount(tx.fromAccount);
    if (acc) acc.balance = toNumber(acc.balance) - toNumber(tx.amount);
  } else if (tx.type === 'expense') {
    const acc = lookupAccount(tx.fromAccount);
    if (acc) acc.balance = toNumber(acc.balance) + toNumber(tx.amount);
  } else if (tx.type === 'transfer') {
    const fromAcc = lookupAccount(tx.fromAccount);
    const toAcc = lookupAccount(tx.toAccount);
    if (fromAcc) fromAcc.balance = toNumber(fromAcc.balance) + toNumber(tx.amount);
    if (toAcc) toAcc.balance = toNumber(toAcc.balance) - toNumber(tx.amount);
  }
}

function bindEvents() {
  qs('#accountForm').addEventListener('submit', addAccount);
  qs('#budgetForm').addEventListener('submit', addBudget);
  qs('#transactionForm').addEventListener('submit', addTransaction);

  qs('#transactionsTable').addEventListener('click', (e) => {
    const id = e.target.dataset.removeTx;
    if (id) removeTransaction(id);
  });
  qs('#accountsList').addEventListener('click', (e) => {
    const id = e.target.dataset.removeAccount;
    if (id) removeAccount(id);
  });
  qs('#budgetList').addEventListener('click', (e) => {
    const id = e.target.dataset.removeBudget;
    if (id) removeBudget(id);
  });

  qs('#filterMonth').addEventListener('change', () => { renderSummary(); renderBudgets(); renderTransactions(); renderDashboard(); });
  qs('#filterCategory').addEventListener('input', () => { renderTransactions(); });
  qs('#clearFilters').addEventListener('click', () => {
    qs('#filterMonth').value = '';
    qs('#filterCategory').value = '';
    renderAll();
  });

  qs('#txType').addEventListener('change', (e) => {
    qs('#toAccountField').style.display = e.target.value === 'transfer' ? 'block' : 'none';
  });

  qs('#quickAddCash').addEventListener('click', () => {
    ['BOC', 'HNB', 'Cash'].forEach((name) => {
      if (!state.accounts.find((a) => a.name.toLowerCase() === name.toLowerCase())) {
        state.accounts.push({ _id: uid(), name, balance: 0, createdAt: new Date().toISOString() });
      }
    });
    storage.save();
    renderAccounts();
    ensureAccountSelection();
  });

  qs('#refreshData').addEventListener('click', () => {
    if (USE_REMOTE) {
      syncFromRemote();
    } else {
      alert('Remote sync is off. Set API_CONFIG.mode = "dataApi" and fill your credentials.');
    }
  });
}

function init() {
  storage.load();
  seedDefaults();
  renderAll();
  ensureAccountSelection();
  bindEvents();
  qs('#transactionForm').date.value = new Date().toISOString().slice(0, 10);
  if (USE_REMOTE) syncFromRemote();
}

document.addEventListener('DOMContentLoaded', init);
