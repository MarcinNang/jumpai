# AI Email Sorter

An AI-powered email sorting and management application that automatically categorizes and summarizes emails using OpenAI, then archives them in Gmail.

## Features

- **Google OAuth Integration**: Sign in with Google and manage multiple Gmail accounts
- **AI-Powered Categorization**: Automatically sort emails into custom categories using AI
- **Email Summarization**: Get AI-generated summaries for each email
- **Automatic Archiving**: Emails are automatically archived in Gmail after processing
- **Bulk Actions**: Delete or unsubscribe from multiple emails at once
- **AI Unsubscribe Agent**: Automatically finds and processes unsubscribe links
- **Multi-Account Support**: Connect and manage multiple Gmail accounts

## Tech Stack

- **Backend**: Node.js, Express, PostgreSQL
- **Frontend**: React, Material-UI
- **AI**: OpenAI GPT-4o-mini
- **OAuth**: Google OAuth 2.0
- **Email**: Gmail API
- **Automation**: Puppeteer for unsubscribe automation

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Cloud Console project with OAuth credentials
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

3. Set up environment variables:
   - **Server**: Copy `server/.env.example` to `server/.env`
   - Fill in all required values:
     - `DATABASE_URL`: PostgreSQL connection string
     - `GOOGLE_CLIENT_ID`: Google OAuth client ID
     - `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
     - `GOOGLE_REDIRECT_URI`: OAuth callback URL
     - `SESSION_SECRET`: Random secret for sessions
     - `OPENAI_API_KEY`: OpenAI API key
     - `FRONTEND_URL`: Frontend URL (e.g., http://localhost:3000)
   - **Client**: Create `client/.env` file (optional for local development):
     - `REACT_APP_API_URL`: Backend API URL (e.g., http://localhost:5000)
     - For production, set this to your deployed backend URL

4. Set up Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Gmail API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:5000/auth/google/callback`
   - Add test user: `webshookeng@gmail.com`
   - **Important**: Apps with email scopes require test users to be added in the OAuth consent screen. For production, you'll need to complete Google's security review process.

5. Initialize database:
   - The database will be initialized automatically on server start

6. Run the application:
   ```bash
   # Development (runs both server and client)
   npm run dev

   # Or separately:
   npm run server:dev  # Backend on port 5000
   npm run client:dev  # Frontend on port 3000
   ```

## Testing

```bash
cd server
npm test
```

## Deployment

### Render

1. Create a new PostgreSQL database on Render
2. Create a new Web Service
3. Set build command: `npm install && cd server && npm install && cd ../client && npm install && npm run build`
4. Set start command: `cd server && npm start`
5. Add environment variables
6. The app will be available at your Render URL

### Fly.io

1. Install Fly CLI
2. Run `fly launch`
3. Set up PostgreSQL: `fly postgres create`
4. Configure environment variables
5. Deploy: `fly deploy`

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/me` - Get current user
- `GET /auth/logout` - Logout

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Emails
- `GET /api/emails/category/:categoryId` - Get emails in category
- `GET /api/emails/:id` - Get email details
- `POST /api/emails/fetch` - Fetch and process new emails
- `POST /api/emails/bulk-delete` - Delete multiple emails
- `POST /api/emails/bulk-unsubscribe` - Unsubscribe from multiple emails

### Accounts
- `GET /api/accounts` - Get connected accounts
- `GET /api/accounts/connect` - Connect new account
- `DELETE /api/accounts/:id` - Disconnect account

## License

MIT
