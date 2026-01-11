# Fix OAuth Redirect URI Mismatch Error

## The Problem
Error: `redirect_uri_mismatch` means the redirect URI in Google Cloud Console doesn't match what your app is sending.

## Solution

### Step 1: Check Your Current Redirect URI

The app is configured to use: `http://localhost:5000/auth/google/callback`

Check your `.env` file in the `server` directory:
```env
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
```

### Step 2: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, make sure you have EXACTLY:
   ```
   http://localhost:5000/auth/google/callback
   ```
6. **Important**: The URI must match EXACTLY (including http://, no trailing slash)
7. Click **Save**

### Step 3: Verify Your .env File

Make sure your `server/.env` file has:
```env
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
```

### Step 4: Restart Your Server

After making changes:
```bash
# Stop the server (Ctrl+C)
# Then restart it
cd server
npm run dev
```

### Common Mistakes to Avoid

1. ❌ Using `https://` instead of `http://` for localhost
2. ❌ Adding a trailing slash: `http://localhost:5000/auth/google/callback/`
3. ❌ Using port 3000 instead of 5000
4. ❌ Missing the `/callback` part
5. ❌ Typo in the URI

### Verify It's Working

1. Check your configuration: http://localhost:5000/auth/check
2. It should show:
   ```json
   {
     "hasRedirectUri": true,
     "redirectUri": "http://localhost:5000/auth/google/callback"
   }
   ```

### Still Not Working?

1. Make sure you saved the changes in Google Cloud Console (click Save button)
2. Wait a few minutes for changes to propagate
3. Clear your browser cache/cookies
4. Try in an incognito/private window
5. Double-check for typos in both places
