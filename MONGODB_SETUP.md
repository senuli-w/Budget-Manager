# MongoDB Atlas Setup Guide for Budget Manager

This guide will walk you through setting up MongoDB Atlas (free tier) with App Services to connect to your Budget Manager application.

## Prerequisites
- A web browser
- An email address for MongoDB account creation

---

## Step 1: Create a MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with your email or use Google sign-in
3. Verify your email if required

---

## Step 2: Create a Free Cluster

1. After logging in, you'll see the **"Create a deployment"** page
2. Select **M0 FREE** (the free tier option)
3. Choose a cloud provider (AWS, Google Cloud, or Azure - any works fine)
4. Select a region closest to you for better performance
5. Give your cluster a name (default is "Cluster0" - you can keep this)
6. Click **"Create Deployment"**

### Wait for Cluster Creation
- This takes 1-3 minutes
- You'll see a progress indicator

---

## Step 3: Set Up Database Access

When prompted, create a database user:

1. **Username**: Choose a username (e.g., `budget_admin`)
2. **Password**: Click "Autogenerate Secure Password" and **SAVE THIS PASSWORD**
3. Click **"Create Database User"**

---

## Step 4: Set Up Network Access

1. You'll be asked to set up network access
2. Click **"Add My Current IP Address"** - this adds your current IP
3. **For GitHub Pages hosting**, you need to allow access from anywhere:
   - Go to **Network Access** in the left sidebar
   - Click **"Add IP Address"**
   - Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - Click **"Confirm"**

⚠️ **Security Note**: Allowing access from anywhere is needed for web apps but less secure. Your data is still protected by your database username and password.

---

## Step 5: Create the App Services Application

1. In the left sidebar, click **"App Services"**
2. Click **"Create a New App"**
3. Configure your app:
   - **Application Name**: `budget-manager-app` (or any name you prefer)
   - **Link your Database**: Select your cluster (Cluster0)
   - **App Deployment Model**: Local (Single Region)
   - Select a region close to you
4. Click **"Create App"**

---

## Step 6: Enable Anonymous Authentication

1. In your App Services app, go to **"Authentication"** in the left sidebar
2. Click on **"Authentication Providers"**
3. Click on **"Anonymous"**
4. Toggle **"Provider Enabled"** to ON
5. Click **"Save Draft"**
6. Click **"Review Draft & Deploy"** at the top
7. Click **"Deploy"**

---

## Step 7: Set Up Data Access Rules

1. Go to **"Rules"** in the left sidebar
2. Click **"+ Add Collection"**
3. Configure rules for each collection:

### For Accounts Collection:
- **Database Name**: `budget_manager`
- **Collection Name**: `accounts`
- Click **"Add Collection"**
- Under "Permissions", select **"Users can read and write all data"**
- Click **"Save Draft"**

### For Transactions Collection:
- Click **"+ Add Collection"** again
- **Database Name**: `budget_manager`
- **Collection Name**: `transactions`
- Click **"Add Collection"**
- Under "Permissions", select **"Users can read and write all data"**
- Click **"Save Draft"**

### For Budgets Collection:
- Click **"+ Add Collection"** again
- **Database Name**: `budget_manager`
- **Collection Name**: `budgets`
- Click **"Add Collection"**
- Under "Permissions", select **"Users can read and write all data"**
- Click **"Save Draft"**

4. Click **"Review Draft & Deploy"**
5. Click **"Deploy"**

---

## Step 8: Get Your App ID

1. In the top left, you'll see your App ID (looks like: `budget-manager-app-xxxxx`)
2. **Copy this App ID** - you'll need it for the next step

---

## Step 9: Configure Your Application

1. Open the file `js/config.js` in your Budget Manager project
2. Find this line:
   ```javascript
   MONGODB_APP_ID: 'YOUR_APP_ID_HERE',
   ```
3. Replace `YOUR_APP_ID_HERE` with your actual App ID:
   ```javascript
   MONGODB_APP_ID: 'budget-manager-app-xxxxx',
   ```
4. Save the file

---

## Step 10: Add MongoDB Realm SDK to Your HTML

Add this script tag in your `index.html` file, **before** the other script tags:

```html
<!-- MongoDB Realm Web SDK -->
<script src="https://unpkg.com/realm-web@1.2.1/dist/bundle.iife.js"></script>
```

Place it just before:
```html
<script src="js/config.js"></script>
```

---

## Step 11: Deploy to GitHub Pages

1. Create a new repository on GitHub
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Budget Manager"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

3. Enable GitHub Pages:
   - Go to your repository on GitHub
   - Click **"Settings"**
   - Scroll down to **"Pages"** in the left sidebar
   - Under "Source", select **"Deploy from a branch"**
   - Select **"main"** branch and **"/ (root)"** folder
   - Click **"Save"**

4. Wait a few minutes, then your app will be live at:
   `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

---

## Using the App Without MongoDB (Local Storage)

The application is designed to work **without MongoDB configuration**. If you don't set up MongoDB:

- All data will be stored in your browser's Local Storage
- Data will persist in the same browser but won't sync across devices
- This is perfect for testing or if you just want to use it on one device

To use Local Storage mode:
1. Simply don't change the `MONGODB_APP_ID` value in `config.js`
2. The app will automatically use Local Storage as a fallback

---

## Troubleshooting

### "MongoDB connection failed" error
- Check that your App ID is correct in `config.js`
- Ensure you've deployed all changes in App Services
- Verify that Anonymous authentication is enabled

### Data not saving
- Check browser console for errors (Press F12 → Console tab)
- Ensure the Rules are set up correctly for all three collections
- Make sure you've deployed changes after setting up rules

### CORS errors
- This shouldn't happen with App Services, but if it does:
  - Go to App Services → App Settings
  - Check the "Hosting" settings

### App not loading on GitHub Pages
- Make sure all files are committed and pushed
- Check that the repository is public
- Wait a few minutes after enabling Pages

---

## Data Backup

Even with MongoDB, it's good to backup your data:

1. In the app, you can use the export function (if implemented)
2. Or in MongoDB Atlas:
   - Go to your Cluster
   - Click **"Browse Collections"**
   - Click **"Export Collection"** for each collection

---

## Support

If you need help:
1. Check MongoDB Atlas documentation: [https://www.mongodb.com/docs/atlas/](https://www.mongodb.com/docs/atlas/)
2. App Services documentation: [https://www.mongodb.com/docs/atlas/app-services/](https://www.mongodb.com/docs/atlas/app-services/)

---

Happy budgeting! 💰
