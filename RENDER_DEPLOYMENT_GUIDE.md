# Complete Render.com Deployment Guide

## Step-by-Step Instructions

### Prerequisites Checklist

Before starting, make sure you have:
- [ ] GitHub account
- [ ] Code pushed to a GitHub repository
- [ ] Render.com account (sign up at https://render.com)
- [ ] Google Cloud Console project with OAuth credentials
- [ ] OpenAI API key
- [ ] All environment variables ready

---

## Part 1: Prepare Your Code

### Step 1: Push Code to GitHub

1. **Create a GitHub repository** (if you haven't already)
   ```bash
   # Initialize git if not already done
   git init
   git add .
   git commit -m "Initial commit"
   
   # Create repository on GitHub, then:
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git branch -M main
   git push -u origin main
   ```

2. **Verify your repository contains:**
   - `render.yaml` file (for automatic setup)
   - `package.json` files (root, server, client)
   - All source code
   - `.gitignore` file (to exclude `.env` and `node_modules`)

### Step 2: Verify render.yaml Configuration

Your `render.yaml` should look like this:
```yaml
services:
  - type: web
    name: ai-email-sorter
    env: node
    buildCommand: npm install && cd server && npm install && cd ../client && npm install && npm run build
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: ai-email-sorter-db
          property: connectionString
      - key: GOOGLE_CLIENT_ID
        sync: false
      - key: GOOGLE_CLIENT_SECRET
        sync: false
      - key: GOOGLE_REDIRECT_URI
        sync: false
      - key: SESSION_SECRET
        generateValue: true
      - key: OPENAI_API_KEY
        sync: false
      - key: FRONTEND_URL
        sync: false

databases:
  - name: ai-email-sorter-db
    plan: free
```

---

## Part 2: Create PostgreSQL Database on Render

### Step 3: Create Database

1. **Log in to Render Dashboard**
   - Go to https://dashboard.render.com
   - Sign in or create an account

2. **Create PostgreSQL Database**
   - Click **"New +"** button (top right)
   - Select **"PostgreSQL"**
   - Fill in the form:
     - **Name**: `ai-email-sorter-db` (or your preferred name)
     - **Database**: Leave default or customize
     - **User**: Leave default or customize
     - **Region**: Choose closest to your users
     - **PostgreSQL Version**: Latest (recommended)
     - **Plan**: Free (for testing) or Paid (for production)
   - Click **"Create Database"**

3. **Wait for Database to be Ready**
   - Status will show "Available" when ready
   - This takes 1-2 minutes

4. **Note the Connection String**
   - Click on your database
   - Find **"Internal Database URL"** or **"Connection String"**
   - Copy this - you'll need it later
   - Format: `postgresql://user:password@host:port/database`

---

## Part 3: Create Web Service on Render

### Step 4: Connect GitHub Repository

1. **Create New Web Service**
   - In Render Dashboard, click **"New +"**
   - Select **"Web Service"**

2. **Connect Repository**
   - Click **"Connect account"** if not connected
   - Authorize Render to access your GitHub
   - Select your repository
   - Click **"Connect"**

### Step 5: Configure Service Settings

If using `render.yaml`, Render will auto-detect it. Otherwise, configure manually:

**Basic Settings:**
- **Name**: `ai-email-sorter` (or your preferred name)
- **Region**: Same as database (recommended)
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (or `.` if needed)
- **Runtime**: `Node`
- **Build Command**: 
  ```
  npm install && cd server && npm install && cd ../client && npm install && npm run build
  ```
- **Start Command**: 
  ```
  cd server && npm start
  ```

**Plan:**
- **Free**: For testing (spins down after inactivity)
- **Starter ($7/month)**: Always on, better for production

### Step 6: Set Environment Variables

1. **Scroll to "Environment Variables" section**

2. **Add each variable:**
   
   **Required Variables:**
   ```
   NODE_ENV = production
   ```
   
   ```
   DATABASE_URL = <paste your database connection string from Step 3>
   ```
   
   ```
   GOOGLE_CLIENT_ID = <your Google OAuth Client ID>
   ```
   
   ```
   GOOGLE_CLIENT_SECRET = <your Google OAuth Client Secret>
   ```
   
   ```
   GOOGLE_REDIRECT_URI = https://your-app-name.onrender.com/auth/google/callback
   ```
   ⚠️ **Important**: Replace `your-app-name` with your actual Render service name!
   
   ```
   SESSION_SECRET = <generate a random string>
   ```
   Generate with: `openssl rand -hex 32` or use any random string
   
   ```
   OPENAI_API_KEY = <your OpenAI API key>
   ```
   
   ```
   FRONTEND_URL = https://your-app-name.onrender.com
   ```
   ⚠️ Replace `your-app-name` with your actual Render service name!

3. **Click "Save Changes"** after adding all variables

### Step 7: Deploy

1. **Click "Create Web Service"** (or "Save Changes" if editing)

2. **Wait for Build**
   - Render will start building your application
   - This takes 5-10 minutes
   - Watch the build logs for progress

3. **Monitor Build Logs**
   - Click on your service
   - Go to "Logs" tab
   - Watch for errors or warnings
   - Build should complete successfully

4. **Get Your App URL**
   - Once deployed, you'll see: `https://your-app-name.onrender.com`
   - Copy this URL

---

## Part 4: Update Google OAuth Settings

### Step 8: Update Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit https://console.cloud.google.com
   - Select your project

2. **Update OAuth Credentials**
   - Go to **"APIs & Services"** > **"Credentials"**
   - Click on your OAuth 2.0 Client ID

3. **Add Authorized Redirect URI**
   - Under **"Authorized redirect URIs"**
   - Click **"Add URI"**
   - Add: `https://your-app-name.onrender.com/auth/google/callback`
   - ⚠️ **Must match exactly** (including `https://` and no trailing slash)
   - Click **"Save"**

4. **Update Authorized JavaScript Origins** (if needed)
   - Add: `https://your-app-name.onrender.com`
   - Click **"Save"**

---

## Part 5: Verify Deployment

### Step 9: Test Your Application

1. **Check Health Endpoint**
   - Visit: `https://your-app-name.onrender.com/health`
   - Should return: `{"status":"ok"}`

2. **Check OAuth Configuration**
   - Visit: `https://your-app-name.onrender.com/auth/check`
   - Should show configuration status

3. **Test Login**
   - Visit: `https://your-app-name.onrender.com`
   - Should redirect to login page
   - Click "Sign in with Google"
   - Should redirect to Google OAuth

4. **Test Full Flow**
   - Complete Google OAuth
   - Should redirect back to your app
   - Test creating categories
   - Test fetching emails

---

## Part 6: Post-Deployment Configuration

### Step 10: Update Environment Variables (if needed)

If you need to update variables after deployment:

1. Go to your service in Render Dashboard
2. Click **"Environment"** tab
3. Edit or add variables
4. Click **"Save Changes"**
5. Service will automatically redeploy

### Step 11: Set Up Auto-Deploy (if not already)

1. Go to your service
2. Click **"Settings"** tab
3. Under **"Auto-Deploy"**
4. Ensure **"Auto-Deploy"** is enabled
5. Select branch: `main` (or your default)

Now, every push to your main branch will trigger a new deployment!

---

## Troubleshooting Common Issues

### Issue: Build Fails

**Possible Causes:**
- Missing dependencies in `package.json`
- Build command errors
- Node version incompatibility

**Solutions:**
1. Check build logs in Render dashboard
2. Verify all dependencies are listed in `package.json`
3. Test build locally: `npm install && cd server && npm install && cd ../client && npm install && npm run build`
4. Check Node version compatibility

### Issue: Application Crashes on Start

**Possible Causes:**
- Missing environment variables
- Database connection issues
- Port configuration

**Solutions:**
1. Check application logs in Render
2. Verify all environment variables are set
3. Check `DATABASE_URL` is correct
4. Ensure server listens on `process.env.PORT` (Render sets this automatically)

### Issue: OAuth Redirect Error

**Possible Causes:**
- Redirect URI mismatch
- Wrong `GOOGLE_REDIRECT_URI` in environment variables

**Solutions:**
1. Verify `GOOGLE_REDIRECT_URI` in Render matches Google Cloud Console
2. Must be exactly: `https://your-app-name.onrender.com/auth/google/callback`
3. Update both places if needed
4. Wait a few minutes for changes to propagate

### Issue: Database Connection Fails

**Possible Causes:**
- Wrong `DATABASE_URL`
- Database not accessible
- SSL configuration

**Solutions:**
1. Verify `DATABASE_URL` is correct
2. Check database is running in Render dashboard
3. Ensure SSL is enabled in database connection (Render requires SSL)
4. Check server logs for specific error messages

### Issue: Free Tier Spins Down

**On Free Plan:**
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Consider upgrading to Starter plan for always-on service

---

## Quick Reference: Environment Variables

Copy-paste this checklist:

```
✅ NODE_ENV = production
✅ DATABASE_URL = <from Render database>
✅ GOOGLE_CLIENT_ID = <from Google Cloud Console>
✅ GOOGLE_CLIENT_SECRET = <from Google Cloud Console>
✅ GOOGLE_REDIRECT_URI = https://your-app-name.onrender.com/auth/google/callback
✅ SESSION_SECRET = <random string, 32+ characters>
✅ OPENAI_API_KEY = <from OpenAI>
✅ FRONTEND_URL = https://your-app-name.onrender.com
```

---

## Deployment Checklist

Use this checklist to ensure everything is set up:

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] `render.yaml` file exists and is correct
- [ ] All dependencies in `package.json` files
- [ ] `.gitignore` excludes `.env` and `node_modules`

### Database Setup
- [ ] PostgreSQL database created on Render
- [ ] Database status is "Available"
- [ ] Connection string copied

### Web Service Setup
- [ ] GitHub repository connected
- [ ] Service name chosen
- [ ] Build command configured
- [ ] Start command configured
- [ ] All environment variables set
- [ ] Service deployed successfully

### OAuth Configuration
- [ ] Google Cloud Console updated with production redirect URI
- [ ] `GOOGLE_REDIRECT_URI` matches exactly
- [ ] Test users added (if app is in testing mode)

### Post-Deployment
- [ ] Health endpoint works (`/health`)
- [ ] OAuth check endpoint works (`/auth/check`)
- [ ] Can access application URL
- [ ] Login flow works
- [ ] Can create categories
- [ ] Can fetch emails
- [ ] Database connection works

---

## Cost Information

### Free Tier
- **Web Service**: Free (spins down after inactivity)
- **PostgreSQL**: Free (90 days, then $7/month)
- **Limitations**: 
  - Service spins down after 15 min inactivity
  - Database limited to 1GB storage
  - Slower cold starts

### Starter Plan (Recommended for Production)
- **Web Service**: $7/month (always on)
- **PostgreSQL**: $7/month (1GB storage)
- **Total**: ~$14/month

---

## Next Steps After Deployment

1. **Set up monitoring** - Check logs regularly
2. **Set up alerts** - Get notified of errors
3. **Backup database** - Regular backups recommended
4. **Monitor usage** - Watch resource usage
5. **Update documentation** - Document your production URL

---

## Support Resources

- **Render Documentation**: https://render.com/docs
- **Render Status**: https://status.render.com
- **Render Community**: https://community.render.com

---

## Summary

**Quick Deployment Steps:**
1. Push code to GitHub
2. Create PostgreSQL database on Render
3. Create Web Service and connect GitHub repo
4. Set all environment variables
5. Deploy and wait for build
6. Update Google OAuth redirect URI
7. Test your application

**Total Time:** ~15-20 minutes (excluding build time)

Good luck with your deployment! 🚀
