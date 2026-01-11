# Testing Guide

## Prerequisites Checklist

Before testing, make sure you have:

- [ ] Node.js installed (v18+)
- [ ] PostgreSQL database running
- [ ] Server dependencies installed (`cd server && npm install`)
- [ ] Client dependencies installed (`cd client && npm install`)
- [ ] `.env` file created in `server/` directory with all required variables
- [ ] Google OAuth credentials configured in Google Cloud Console
- [ ] Database initialized (tables created automatically on first server start)

## Step 1: Start the Application

### Option A: Start Both Server and Client (Recommended)
```bash
# From the root directory
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

### Option B: Start Separately
```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm start
```

## Step 2: Verify Server is Running

1. Open browser: http://localhost:5000/health
   - Should show: `{"status":"ok"}`

2. Check OAuth configuration: http://localhost:5000/auth/check
   - Should show JSON with configuration status
   - Verify `configured: true` if OAuth is set up

## Step 3: Test User Authentication

### 3.1 Test Login Page
1. Open: http://localhost:3000
2. You should be redirected to `/login` if not authenticated
3. You should see:
   - "AI Email Sorter" title
   - "Sign in with Google" button

### 3.2 Test Google OAuth Login
1. Click "Sign in with Google" button
2. You should be redirected to Google's OAuth consent screen
3. Select your Google account
4. Grant permissions (Gmail read/modify access)
5. You should be redirected back to: http://localhost:3000
6. You should now see the Dashboard

**Expected Result:** Successfully logged in and viewing the Dashboard

**If you get errors:**
- `redirect_uri_mismatch`: Check Google Cloud Console redirect URI matches exactly
- Blank page: Check server is running on port 5000
- Connection refused: Server not started

## Step 4: Test Dashboard Features

### 4.1 View Dashboard
After login, you should see:
- Welcome message with your name/email
- "Categories" section
- "Gmail Accounts" section
- "Fetch Emails" button
- "Logout" button

### 4.2 Test Creating Categories
1. Click the "+" button or "Create Category" button
2. Fill in:
   - **Name**: e.g., "Work"
   - **Description**: e.g., "Work-related emails and projects"
3. Click "Create" or "Save"
4. Category should appear in the list

**Test with multiple categories:**
- Work
- Personal
- Shopping
- Bills

### 4.3 Test Viewing Categories
1. Click on a category card
2. Should navigate to category detail page
3. Should show category name and description
4. Should show list of emails in that category (empty initially)

## Step 5: Test Email Fetching

### 5.1 Fetch Emails
1. On Dashboard, click "Fetch Emails" button
2. Wait for processing (may take a few seconds)
3. You should see a success message: "Emails fetched and processed successfully!"

**What happens:**
- Fetches unread emails from Gmail
- Uses AI to categorize each email
- Assigns emails to matching categories
- Archives emails in Gmail
- Stores emails in database

### 5.2 View Categorized Emails
1. Go back to Dashboard
2. Click on a category that should have emails
3. You should see:
   - List of emails in that category
   - Email subject, sender, summary
   - Email actions (delete, etc.)

## Step 6: Test Email Management

### 6.1 View Email Details
1. Click on an email in a category
2. Should show:
   - Full email content
   - Sender information
   - Subject
   - Body text/HTML
   - AI-generated summary

### 6.2 Test Email Actions
1. **Delete Email:**
   - Click delete button on an email
   - Confirm deletion
   - Email should be removed from view

2. **Bulk Actions:**
   - Select multiple emails
   - Use bulk delete or unsubscribe options

## Step 7: Test Multi-Account Support

### 7.1 Connect Additional Gmail Account
1. On Dashboard, find "Gmail Accounts" section
2. Click "Connect Account" or similar button
3. Should redirect to Google OAuth again
4. Select a different Gmail account
5. Account should be added to the list

### 7.2 Test Account Switching
1. Verify both accounts are listed
2. Check that emails from both accounts are fetched
3. Verify primary account is marked

## Step 8: Test Unsubscribe Feature

### 8.1 Test Unsubscribe
1. Find an email with an unsubscribe link
2. Click "Unsubscribe" button
3. System should:
   - Extract unsubscribe link
   - Use Puppeteer to navigate to unsubscribe page
   - Use AI to analyze the page
   - Automatically complete unsubscribe process

**Note:** This requires Puppeteer and may take longer

## Step 9: Test Logout

1. Click "Logout" button
2. Should redirect to login page
3. Try accessing Dashboard directly: http://localhost:3000
4. Should redirect back to login (protected route)

## Step 10: Test Error Handling

### 10.1 Test Without Categories
1. Logout and create a new account
2. Try fetching emails without creating categories
3. System should handle gracefully (may create default category or show message)

### 10.2 Test API Errors
1. Stop the server
2. Try to fetch emails
3. Should show appropriate error message

## Testing Checklist

Use this checklist to verify all features:

### Authentication
- [ ] Login page displays correctly
- [ ] Google OAuth redirects properly
- [ ] User can successfully log in
- [ ] User session persists on page refresh
- [ ] Logout works correctly
- [ ] Protected routes redirect to login

### Categories
- [ ] Can create new category
- [ ] Category appears in list
- [ ] Can view category details
- [ ] Can delete category
- [ ] Category validation works (name/description required)

### Email Fetching
- [ ] "Fetch Emails" button works
- [ ] Emails are fetched from Gmail
- [ ] Emails are categorized by AI
- [ ] Emails appear in correct categories
- [ ] Emails are archived in Gmail
- [ ] Success message displays

### Email Display
- [ ] Emails list displays correctly
- [ ] Email details show full content
- [ ] AI summaries are generated
- [ ] Email metadata (sender, date) displays

### Email Management
- [ ] Can delete individual emails
- [ ] Can use bulk actions
- [ ] Unsubscribe feature works (if applicable)

### Multi-Account
- [ ] Can connect multiple Gmail accounts
- [ ] All accounts are listed
- [ ] Emails from all accounts are fetched
- [ ] Primary account is marked

## Common Issues & Solutions

### Issue: "Cannot GET /auth/google"
**Solution:** Server not running. Start server with `npm run dev` in server directory.

### Issue: Blank page after clicking "Sign in with Google"
**Solution:** 
- Check server is running on port 5000
- Verify `.env` file has correct OAuth credentials
- Check browser console for errors

### Issue: "redirect_uri_mismatch"
**Solution:** 
- Verify redirect URI in Google Cloud Console matches exactly: `http://localhost:5000/auth/google/callback`
- Check `.env` file has: `GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback`

### Issue: "Failed to fetch emails"
**Solution:**
- Check OpenAI API key is set in `.env`
- Verify Gmail API is enabled in Google Cloud Console
- Check OAuth scopes include Gmail permissions
- Check database connection

### Issue: Emails not categorizing correctly
**Solution:**
- Ensure category descriptions are detailed and specific
- Check OpenAI API key is valid and has credits
- Review server logs for AI processing errors

### Issue: Database errors
**Solution:**
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env` is correct
- Ensure database exists: `createdb email_sorter`
- Check database connection: server logs will show errors

## Performance Testing

### Test with Large Email Volume
1. Connect an account with many unread emails
2. Fetch emails and measure processing time
3. Verify all emails are processed
4. Check database for all emails stored

### Test Concurrent Users
1. Open multiple browser windows
2. Log in with different accounts
3. Test that each user sees only their data

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

## Next Steps After Testing

1. Review any errors or issues found
2. Check server logs for warnings
3. Verify database contains expected data
4. Test edge cases specific to your use case
5. Document any custom configurations needed

## Getting Help

If you encounter issues:
1. Check server terminal for error messages
2. Check browser console (F12) for client errors
3. Verify all environment variables are set
4. Check database connection
5. Review the setup documentation in `SETUP.md`
