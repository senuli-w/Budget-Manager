# Budget Manager (static + MongoDB Atlas)

Static HTML/CSS/JS app you can host on GitHub Pages. Data can sync to MongoDB Atlas using the Atlas Data API or App Services HTTP endpoints. Ships with localStorage-first behavior so you can try it immediately; switch to Atlas by filling the config in `script.js`.

## Quick start (local preview)
1. Open `index.html` in your browser. Data is stored in localStorage by default.
2. Click "Quick add cash account" to create sample accounts BOC, HNB, Cash.
3. Add transactions (income/expense/transfer) and budgets. Balances and dashboards update live.

## Deploy to GitHub Pages
1. Commit this folder to a repo.
2. Push to GitHub and enable GitHub Pages → source: `main` branch → root.
3. Your site will be available at `https://<username>.github.io/<repo>/`.

## Connect to MongoDB Atlas (Data API approach)
> Personal use is fine, but avoid exposing long-lived API keys in a public repo. If public, prefer App Services functions with anonymous auth so no secret lives in the client.

1. Create a free cluster (M0):
   - Atlas UI → Deployments → Database → Build a Database → Free tier.
   - Create database `budgetapp` with collections `accounts`, `transactions`, `budgets`.
2. Enable Data API:
   - Atlas UI → Data API → Enable.
   - Note your `APP_ID` and `Data API` base URL (looks like `https://data.mongodb-api.com/app/<APP_ID>/endpoint/data/v1`).
   - Create a Programmatic API Key; save the key string.
3. Configure CORS:
   - In Data API settings add allowed origin `https://<username>.github.io` (and your Pages subpath if used) or `*` while testing.
4. Update `script.js`:
   - Set `mode: 'dataApi'`.
   - Fill `baseUrl` with the Data API URL.
   - Fill `apiKey` with the Programmatic API key.
   - Set `dataSource` to your cluster name (often `Cluster0`).
   - Keep `database` as `budgetapp` or your chosen DB.
5. Deploy to GitHub Pages. The app will now read/write Atlas documents (client becomes the source of truth and upserts to Atlas).

### How the client writes
- Each document uses a string `_id` generated in the browser. Upserts are used so client-side edits replace Atlas copies.
- Collections used:
  - `accounts`: `{ _id, name, balance, createdAt }`
  - `transactions`: `{ _id, type, fromAccount, toAccount, amount, category, description, date }`
  - `budgets`: `{ _id, category, amount, month }`

## Alternative: Atlas App Services Functions (safer for public sites)
1. Create an App Services app bound to your cluster.
2. Enable Authentication → Anonymous (for single-user) or Email/Password (for multi-user).
3. Create Functions for CRUD (examples):
   - `getData`: find on `accounts/transactions/budgets` and return.
   - `upsert`: takes collection + document and runs `updateOne({ _id: doc._id }, { $set: doc }, { upsert: true })`.
   - `delete`: takes collection + id.
4. Create HTTP Endpoints for each function; enable CORS for your GitHub Pages origin.
5. In `script.js` swap the `remote.*` calls to hit your HTTP endpoints (no API key in client).

## Features
- Multiple accounts (BOC, HNB, Cash seeded). Add/remove accounts (guarded if transactions exist).
- Transactions: income, expense, transfer between accounts. Balances auto-adjust; deleting reverses the effect.
- Budgets: monthly limit per category with progress bars for current month.
- Filters: by month and category.
- Dashboard: total balance, monthly income/expense, top spending categories.
- Local-first storage with optional Atlas sync.

## Notes
- LocalStorage and Atlas data are kept in sync by upserting documents. Use the Refresh button to pull latest from Atlas.
- Dates are stored as ISO strings; month filtering uses `YYYY-MM`.
- Currency is displayed as LKR; change labels as needed.

## Quick test payloads (Data API)
Use `curl` to verify your Data API before wiring the UI:
```bash
curl -X POST "https://data.mongodb-api.com/app/<APP_ID>/endpoint/data/v1/action/insertOne" \
  -H 'Content-Type: application/json' \
  -H 'api-key: <API_KEY>' \
  -d '{
    "dataSource":"Cluster0",
    "database":"budgetapp",
    "collection":"accounts",
    "document": {"_id":"test-1","name":"BOC","balance":1000}
  }'
```

## Next tweaks you might want
- Add authentication (Email/Password) and per-user data partitioning via App Services rules.
- Add CSV export/import.
- Add charts (e.g., Chart.js) for trends.
- Add recurring transactions and reminders.
