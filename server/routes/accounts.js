const express = require('express');
const router = express.Router();
const passport = require('passport');
const { ensureAuthenticated } = require('../middleware/auth');
const { pool } = require('../db/connection');

// Get all connected Gmail accounts
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, is_primary, created_at FROM gmail_accounts WHERE user_id = $1 ORDER BY is_primary DESC, created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Connect additional Gmail account
router.get('/connect', ensureAuthenticated, (req, res, next) => {
  // Store the current user ID in session for the callback
  req.session.connectAccountUserId = req.user.id;
  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify'
    ]
  })(req, res, next);
});

router.get('/connect/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const userId = req.session.connectAccountUserId || req.user.id;
      const user = req.user;

      // Check if account already exists
      const accountResult = await pool.query(
        'SELECT * FROM gmail_accounts WHERE user_id = $1 AND email = $2',
        [userId, user.email]
      );

      if (accountResult.rows.length === 0) {
        await pool.query(
          `INSERT INTO gmail_accounts (user_id, email, access_token, refresh_token, is_primary)
           VALUES ($1, $2, $3, $4, false)
           ON CONFLICT (user_id, email) DO UPDATE
           SET access_token = EXCLUDED.access_token,
               refresh_token = EXCLUDED.refresh_token,
               updated_at = NOW()`,
          [userId, user.email, user.access_token, user.refresh_token]
        );
      } else {
        await pool.query(
          `UPDATE gmail_accounts 
           SET access_token = $1, refresh_token = $2, updated_at = NOW()
           WHERE user_id = $3 AND email = $4`,
          [user.access_token, user.refresh_token, userId, user.email]
        );
      }

      delete req.session.connectAccountUserId;
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/accounts`);
    } catch (error) {
      console.error('Error in account connect callback:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/accounts?error=1`);
    }
  }
);

// Disconnect an account
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const accountCheck = await pool.query(
      'SELECT * FROM gmail_accounts WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Don't allow deleting the primary account if it's the only one
    const account = accountCheck.rows[0];
    if (account.is_primary) {
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM gmail_accounts WHERE user_id = $1',
        [req.user.id]
      );
      if (countResult.rows[0].count === '1') {
        return res.status(400).json({ error: 'Cannot delete the only account' });
      }
    }

    await pool.query('DELETE FROM gmail_accounts WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ message: 'Account disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting account:', error);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
});

module.exports = router;
