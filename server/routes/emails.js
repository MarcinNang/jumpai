const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { pool } = require('../db/connection');
const { deleteEmail } = require('../services/gmail');
const { summarizeEmail } = require('../services/ai');
const { unsubscribeFromEmail } = require('../services/unsubscribe');
const { processUserEmails } = require('../services/emailProcessor');

// Get emails for a category
router.get('/category/:categoryId', ensureAuthenticated, async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Verify category ownership
    const categoryCheck = await pool.query(
      'SELECT * FROM categories WHERE id = $1 AND user_id = $2',
      [categoryId, req.user.id]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const result = await pool.query(
      `SELECT e.*, c.name as category_name
       FROM emails e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.category_id = $1 AND e.user_id = $2 AND e.is_deleted = false
       ORDER BY e.created_at DESC`,
      [categoryId, req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching category emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Get single email details
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT e.*, c.name as category_name
       FROM emails e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.id = $1 AND e.user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
});

// Fetch and process new emails
router.post('/fetch', ensureAuthenticated, async (req, res) => {
  try {
    const result = await processUserEmails(req.user.id);
    
    res.json({ 
      message: `Processed ${result.processed} new emails`,
      count: result.processed,
      errors: result.errors
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Bulk delete emails
router.post('/bulk-delete', ensureAuthenticated, async (req, res) => {
  try {
    const { emailIds } = req.body;

    if (!Array.isArray(emailIds) || emailIds.length === 0) {
      return res.status(400).json({ error: 'Email IDs array is required' });
    }

    // Get emails with account info
    const emailsResult = await pool.query(
      `SELECT e.id, e.gmail_id, e.gmail_account_id
       FROM emails e
       WHERE e.id = ANY($1) AND e.user_id = $2 AND e.is_deleted = false`,
      [emailIds, req.user.id]
    );

    const deleted = [];

    for (const email of emailsResult.rows) {
      try {
        await deleteEmail(email.gmail_account_id, email.gmail_id);
        deleted.push(email.id);
      } catch (error) {
        console.error(`Error deleting email ${email.id}:`, error);
      }
    }

    res.json({ 
      message: `Deleted ${deleted.length} emails`,
      deleted
    });
  } catch (error) {
    console.error('Error bulk deleting emails:', error);
    res.status(500).json({ error: 'Failed to delete emails' });
  }
});

// Bulk unsubscribe
router.post('/bulk-unsubscribe', ensureAuthenticated, async (req, res) => {
  try {
    const { emailIds } = req.body;

    if (!Array.isArray(emailIds) || emailIds.length === 0) {
      return res.status(400).json({ error: 'Email IDs array is required' });
    }

    // Get emails
    const emailsResult = await pool.query(
      `SELECT id FROM emails WHERE id = ANY($1) AND user_id = $2 AND is_deleted = false`,
      [emailIds, req.user.id]
    );

    const results = [];

    for (const email of emailsResult.rows) {
      try {
        const result = await unsubscribeFromEmail(email.id, req.user.id);
        results.push({ emailId: email.id, ...result });
      } catch (error) {
        console.error(`Error unsubscribing from email ${email.id}:`, error);
        results.push({ 
          emailId: email.id, 
          success: false, 
          message: error.message 
        });
      }
    }

    res.json({ 
      message: `Processed ${results.length} unsubscribe requests`,
      results
    });
  } catch (error) {
    console.error('Error bulk unsubscribing:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

module.exports = router;
