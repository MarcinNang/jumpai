const express = require('express');
const passport = require('passport');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { pool } = require('../db/connection');

// OAuth configuration check endpoint
router.get('/check', (req, res) => {
  const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
  const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
  const hasRedirectUri = !!process.env.GOOGLE_REDIRECT_URI;
  
  res.json({
    configured: hasClientId && hasClientSecret,
    hasClientId,
    hasClientSecret,
    hasRedirectUri,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/auth/google/callback',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
  });
});

// Google OAuth routes
router.get('/google', (req, res, next) => {
  // Check if Google OAuth credentials are configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('Missing Google OAuth credentials. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file');
    return res.status(500).json({ 
      error: 'OAuth not configured', 
      message: 'Please configure Google OAuth credentials in the server .env file' 
    });
  }
  
  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify'
    ]
  })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      // Store the primary account
      const user = req.user;
      const accountResult = await pool.query(
        'SELECT * FROM gmail_accounts WHERE user_id = $1 AND email = $2',
        [user.id, user.email]
      );

      if (accountResult.rows.length === 0) {
        // Set as primary if no accounts exist
        const hasAccounts = await pool.query(
          'SELECT COUNT(*) FROM gmail_accounts WHERE user_id = $1',
          [user.id]
        );
        const isPrimary = hasAccounts.rows[0].count === '0';

        await pool.query(
          `INSERT INTO gmail_accounts (user_id, email, access_token, refresh_token, is_primary)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, email) DO UPDATE
           SET access_token = EXCLUDED.access_token,
               refresh_token = EXCLUDED.refresh_token,
               updated_at = NOW()`,
          [user.id, user.email, user.access_token, user.refresh_token, isPrimary]
        );
      } else {
        // Update tokens
        await pool.query(
          `UPDATE gmail_accounts 
           SET access_token = $1, refresh_token = $2, updated_at = NOW()
           WHERE user_id = $3 AND email = $4`,
          [user.access_token, user.refresh_token, user.id, user.email]
        );
      }

      res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
    } catch (error) {
      console.error('Error in OAuth callback:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=1`);
    }
  }
);

router.get('/me', ensureAuthenticated, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    picture: req.user.picture
  });
});

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;
