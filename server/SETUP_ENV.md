# Quick Setup Guide

## The Problem
The server is not running because the `.env` file is missing. This file contains all the required configuration.

## Quick Fix Steps

### 1. Create the `.env` file

Create a file named `.env` in the `server` directory with the following content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
# Replace with your actual PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/email_sorter

# Google OAuth (REQUIRED for login to work)
# Get these from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback

# Session Secret (generate a random string)
SESSION_SECRET=change_this_to_a_random_secret_string_min_32_chars

# OpenAI API Key (REQUIRED for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 2. Minimum Required to Test Login

To test the login button, you need at minimum:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `SESSION_SECRET`
- `DATABASE_URL` (even if database is empty, the server needs it to start)

### 3. Start the Server

```bash
cd server
npm run dev
```

Or from the root directory:
```bash
npm run server:dev
```

### 4. Verify Server is Running

Open: http://localhost:5000/auth/check

You should see a JSON response showing which environment variables are configured.

### 5. Test the Login

Once the server is running, go to http://localhost:3000 and click "Sign in with Google"

## Getting Google OAuth Credentials

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable Gmail API
4. Go to "APIs & Services" > "Credentials"
5. Click "Create Credentials" > "OAuth client ID"
6. Choose "Web application"
7. Add authorized redirect URI: `http://localhost:5000/auth/google/callback`
8. Copy the Client ID and Client Secret to your `.env` file
