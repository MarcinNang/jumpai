# Setup Guide

## Step-by-Step Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Gmail API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - Development: `http://localhost:5000/auth/google/callback`
     - Production: `https://your-domain.com/auth/google/callback`
   - Save and note your Client ID and Client Secret

5. Add Test Users:
   - Go to "OAuth consent screen"
   - Add test users (required for apps in testing mode):
     - `webshookeng@gmail.com`
     - Your own Gmail address
   - Note: Apps with email scopes require verification for production use

### 2. Database Setup

#### Local Development (PostgreSQL)
```bash
# Install PostgreSQL if not already installed
# Create database
createdb email_sorter

# Or using psql:
psql -U postgres
CREATE DATABASE email_sorter;
```

#### Production (Render)
1. Create a new PostgreSQL database on Render
2. Copy the connection string

### 3. Environment Variables

Create `server/.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/email_sorter

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
SESSION_SECRET=generate_a_random_secret_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 4. Install Dependencies

```bash
# Root directory
npm install

# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 5. Run the Application

#### Development Mode
```bash
# From root directory
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend on http://localhost:3000

#### Production Build
```bash
# Build client
cd client
npm run build

# Start server
cd ../server
npm start
```

### 6. First Time Setup

1. Open http://localhost:3000
2. Click "Sign in with Google"
3. Authorize the app (you'll see a warning about unverified app - click "Advanced" > "Go to [app name]")
4. Create your first category
5. Click "Fetch Emails" to process your inbox

## Troubleshooting

### OAuth Issues
- Make sure redirect URI matches exactly in Google Cloud Console
- Check that test users are added
- Verify Client ID and Secret are correct

### Database Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL format: `postgresql://user:password@host:port/database`
- Verify database exists

### Email Processing Issues
- Check that Gmail API is enabled
- Verify OAuth scopes include email permissions
- Check OpenAI API key is valid

### Token Refresh Issues
- Tokens are automatically refreshed, but if issues persist:
  - Re-authenticate by logging out and back in
  - Check that refresh_token is stored in database

## Production Deployment

### Render
1. Create PostgreSQL database on Render
2. Create new Web Service
3. Connect to GitHub repository
4. Set environment variables
5. Deploy

### Fly.io
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Run `fly launch`
3. Create database: `fly postgres create`
4. Set secrets: `fly secrets set KEY=value`
5. Deploy: `fly deploy`

## Security Notes

- Never commit `.env` files
- Use strong SESSION_SECRET in production
- Enable HTTPS in production
- Regularly rotate API keys
- Review OAuth scopes - only request what you need
