# Deployment Guide

## Render Deployment

### Prerequisites
- GitHub repository with your code
- Render account

### Steps

1. **Create PostgreSQL Database**
   - Go to Render Dashboard
   - Click "New" > "PostgreSQL"
   - Name it (e.g., `ai-email-sorter-db`)
   - Note the connection string

2. **Create Web Service**
   - Click "New" > "Web Service"
   - Connect your GitHub repository
   - Use the `render.yaml` file or configure manually:
     - **Build Command**: `npm install && cd server && npm install && cd ../client && npm install && npm run build`
     - **Start Command**: `cd server && npm start`
     - **Environment**: Node

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   DATABASE_URL=<from database>
   GOOGLE_CLIENT_ID=<your_client_id>
   GOOGLE_CLIENT_SECRET=<your_client_secret>
   GOOGLE_REDIRECT_URI=https://your-app.onrender.com/auth/google/callback
   SESSION_SECRET=<generate_random_string>
   OPENAI_API_KEY=<your_openai_key>
   FRONTEND_URL=https://your-app.onrender.com
   ```

4. **Update Google OAuth Settings**
   - Add production redirect URI in Google Cloud Console
   - Update authorized redirect URIs to include your Render URL

5. **Deploy**
   - Render will automatically deploy on push
   - Or click "Manual Deploy" > "Deploy latest commit"

## Fly.io Deployment

### Prerequisites
- Fly.io account
- Fly CLI installed

### Steps

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**
   ```bash
   fly auth login
   ```

3. **Create App**
   ```bash
   fly launch
   ```
   - Follow prompts
   - Don't deploy yet

4. **Create PostgreSQL Database**
   ```bash
   fly postgres create --name ai-email-sorter-db
   fly postgres attach ai-email-sorter-db
   ```

5. **Set Secrets**
   ```bash
   fly secrets set GOOGLE_CLIENT_ID=your_client_id
   fly secrets set GOOGLE_CLIENT_SECRET=your_client_secret
   fly secrets set GOOGLE_REDIRECT_URI=https://your-app.fly.dev/auth/google/callback
   fly secrets set SESSION_SECRET=$(openssl rand -hex 32)
   fly secrets set OPENAI_API_KEY=your_openai_key
   fly secrets set FRONTEND_URL=https://your-app.fly.dev
   fly secrets set NODE_ENV=production
   ```

6. **Deploy**
   ```bash
   fly deploy
   ```

7. **Update Google OAuth**
   - Add `https://your-app.fly.dev/auth/google/callback` to authorized redirect URIs

## Post-Deployment Checklist

- [ ] Database is connected and migrations ran
- [ ] Environment variables are set correctly
- [ ] Google OAuth redirect URI matches production URL
- [ ] HTTPS is enabled
- [ ] Test user is added in Google Cloud Console
- [ ] Can sign in with Google
- [ ] Can create categories
- [ ] Can fetch and process emails
- [ ] Email monitoring is working

## Monitoring

### Render
- Check logs in Render dashboard
- Set up alerts for errors

### Fly.io
```bash
# View logs
fly logs

# Check app status
fly status

# SSH into app
fly ssh console
```

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check database is running
- Ensure SSL is configured if required

### OAuth Issues
- Verify redirect URI matches exactly
- Check test users are added
- Review OAuth consent screen settings

### Build Failures
- Check build logs
- Verify all dependencies are in package.json
- Ensure Node version is compatible

### Runtime Errors
- Check application logs
- Verify all environment variables are set
- Test database connectivity
