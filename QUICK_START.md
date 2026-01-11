# Quick Start Guide

## Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and running
- [ ] Google Cloud Console project created
- [ ] Gmail API enabled
- [ ] OAuth credentials created
- [ ] OpenAI API key obtained

## 5-Minute Setup

1. **Clone and Install**
   ```bash
   cd /home/ubuntu/paid
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

2. **Configure Environment**
   ```bash
   cd ../server
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Set Up Database**
   ```bash
   createdb email_sorter
   # Or use your preferred method
   ```

4. **Start Development**
   ```bash
   cd ..
   npm run dev
   ```

5. **Access Application**
   - Open http://localhost:3000
   - Sign in with Google
   - Create your first category
   - Click "Fetch Emails"

## Environment Variables Quick Reference

```env
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/email_sorter
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
OPENAI_API_KEY=your_openai_key
SESSION_SECRET=random_secret_string

# Optional (defaults provided)
PORT=5000
FRONTEND_URL=http://localhost:3000
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
```

## Common Commands

```bash
# Development
npm run dev              # Start both server and client
npm run server:dev       # Start only server
npm run client:dev       # Start only client

# Production
npm run build            # Build React app
npm start                # Start production server

# Testing
cd server && npm test     # Run tests
```

## Troubleshooting Quick Fixes

**OAuth not working?**
- Check redirect URI matches exactly
- Verify test users are added
- Check Client ID/Secret are correct

**Database connection failed?**
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

**Emails not processing?**
- Check OpenAI API key is valid
- Verify Gmail API is enabled
- Check OAuth scopes include email permissions

**Build fails?**
- Delete node_modules and reinstall
- Check Node.js version (18+)
- Verify all package.json files are correct
