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
  
  // Get the actual redirect URI being used (from passport config)
  const actualRedirectUri = process.env.GOOGLE_REDIRECT_URI || '/auth/google/callback';
  
  res.json({
    configured: hasClientId && hasClientSecret,
    hasClientId,
    hasClientSecret,
    hasRedirectUri,
    redirectUri: actualRedirectUri,
    redirectUriFull: actualRedirectUri.startsWith('http') 
      ? actualRedirectUri 
      : `${req.protocol}://${req.get('host')}${actualRedirectUri}`,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    note: 'The redirectUriFull shows what Google will receive. It must match exactly in Google Cloud Console.'
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
      console.log('OAuth callback - User authenticated:', req.user ? 'Yes' : 'No');
      console.log('OAuth callback - Session ID:', req.sessionID);
      console.log('OAuth callback - Is authenticated:', req.isAuthenticated());
      
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

      // Ensure user is logged in
      req.login(user, (err) => {
        if (err) {
          console.error('Error logging in user:', err);
          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=1`);
        }
        
        console.log('User logged in, session ID:', req.sessionID);
        console.log('Session after login:', JSON.stringify(req.session, null, 2));
        
        // Save session before redirect
        req.session.save((err) => {
          if (err) {
            console.error('Error saving session:', err);
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=1`);
          }
          
          console.log('=== OAuth Callback Success ===');
          console.log('Session saved successfully');
          console.log('Session ID:', req.sessionID);
          console.log('Is authenticated:', req.isAuthenticated());
          console.log('Redirecting to:', process.env.FRONTEND_URL || 'http://localhost:3000');
          
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          res.redirect(frontendUrl);
        });
      });
    } catch (error) {
      console.error('Error in OAuth callback:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=1`);
    }
  }
);

router.get('/me', (req, res) => {
  // Debug session
  console.log('=== /auth/me Request ===');
  console.log('Session ID:', req.sessionID);
  console.log('Session:', JSON.stringify(req.session, null, 2));
  console.log('Is authenticated:', req.isAuthenticated());
  console.log('User:', req.user);
  console.log('Cookies:', req.headers.cookie);
  
  if (req.isAuthenticated()) {
    return res.json({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture
    });
  }
  
  res.status(401).json({ 
    error: 'Unauthorized',
    debug: {
      sessionID: req.sessionID,
      hasSession: !!req.session,
      isAuthenticated: req.isAuthenticated()
    }
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
