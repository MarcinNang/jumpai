const { fetchNewEmails, archiveEmail } = require('./gmail');
const { processNewEmail } = require('./ai');
const { pool } = require('../db/connection');

// Process new emails for a user
const processUserEmails = async (userId) => {
  try {
    // Get all Gmail accounts for the user
    const accountsResult = await pool.query(
      'SELECT id FROM gmail_accounts WHERE user_id = $1',
      [userId]
    );

    if (accountsResult.rows.length === 0) {
      return { processed: 0, errors: [] };
    }

    const processed = [];
    const errors = [];

    for (const account of accountsResult.rows) {
      try {
        // Fetch new emails
        const newEmails = await fetchNewEmails(account.id, userId);

        // Process each email
        for (const email of newEmails) {
          try {
            // Sort and summarize
            await processNewEmail(email.id, userId);
            
            // Archive in Gmail
            await archiveEmail(account.id, email.gmail_id);
            
            processed.push(email.id);
          } catch (error) {
            console.error(`Error processing email ${email.id}:`, error);
            errors.push({ emailId: email.id, error: error.message });
          }
        }
      } catch (error) {
        console.error(`Error processing account ${account.id}:`, error);
        errors.push({ accountId: account.id, error: error.message });
      }
    }

    return { processed: processed.length, errors };
  } catch (error) {
    console.error('Error in processUserEmails:', error);
    throw error;
  }
};

module.exports = {
  processUserEmails
};
