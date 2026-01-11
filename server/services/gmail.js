const { google } = require('googleapis');
const { pool } = require('../db/connection');

// Get Gmail client for a specific account
const getGmailClient = async (gmailAccountId) => {
  const accountResult = await pool.query(
    'SELECT * FROM gmail_accounts WHERE id = $1',
    [gmailAccountId]
  );

  if (accountResult.rows.length === 0) {
    throw new Error('Gmail account not found');
  }

  const account = accountResult.rows[0];
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token
  });

  // Set up token refresh handler
  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // Update refresh token if provided
      pool.query(
        'UPDATE gmail_accounts SET refresh_token = $1, updated_at = NOW() WHERE id = $2',
        [tokens.refresh_token, gmailAccountId]
      ).catch(console.error);
    }
    if (tokens.access_token) {
      // Update access token
      pool.query(
        'UPDATE gmail_accounts SET access_token = $1, updated_at = NOW() WHERE id = $2',
        [tokens.access_token, gmailAccountId]
      ).catch(console.error);
    }
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
};

// Fetch new emails
const fetchNewEmails = async (gmailAccountId, userId) => {
  try {
    const gmail = await getGmailClient(gmailAccountId);
    
    // Get account email
    const accountResult = await pool.query(
      'SELECT email FROM gmail_accounts WHERE id = $1',
      [gmailAccountId]
    );
    const accountEmail = accountResult.rows[0].email;

    // List messages (get unread messages)
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread -in:trash',
      maxResults: 50
    });

    const messages = response.data.messages || [];
    const processedEmails = [];

    for (const message of messages) {
      // Check if email already exists
      const existingEmail = await pool.query(
        'SELECT id FROM emails WHERE gmail_account_id = $1 AND gmail_id = $2',
        [gmailAccountId, message.id]
      );

      if (existingEmail.rows.length > 0) {
        continue; // Skip already processed emails
      }

      // Get full message
      const messageData = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full'
      });

      const msg = messageData.data;
      const headers = msg.payload.headers;
      
      const getHeader = (name) => {
        const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
        return header ? header.value : '';
      };

      const subject = getHeader('Subject');
      const from = getHeader('From');
      const fromMatch = from.match(/^(.+?)\s*<(.+?)>$/) || [null, from, from];
      const fromName = fromMatch[1].trim();
      const fromEmail = fromMatch[2].trim();

      // Extract body
      let bodyText = '';
      let bodyHtml = '';

      const extractBody = (part) => {
        if (part.body && part.body.data) {
          const data = Buffer.from(part.body.data, 'base64').toString('utf-8');
          if (part.mimeType === 'text/plain') {
            bodyText += data;
          } else if (part.mimeType === 'text/html') {
            bodyHtml += data;
          }
        }
        if (part.parts) {
          part.parts.forEach(extractBody);
        }
      };

      extractBody(msg.payload);

      // Store email in database (category will be set by AI sorting)
      const emailResult = await pool.query(
        `INSERT INTO emails (user_id, gmail_account_id, gmail_id, thread_id, subject, from_email, from_name, body_text, body_html)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          userId,
          gmailAccountId,
          message.id,
          msg.threadId,
          subject,
          fromEmail,
          fromName,
          bodyText,
          bodyHtml
        ]
      );

      processedEmails.push(emailResult.rows[0]);
    }

    return processedEmails;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
};

// Archive email in Gmail
const archiveEmail = async (gmailAccountId, gmailId) => {
  try {
    const gmail = await getGmailClient(gmailAccountId);
    
    await gmail.users.messages.modify({
      userId: 'me',
      id: gmailId,
      requestBody: {
        removeLabelIds: ['INBOX']
      }
    });

    // Update database
    await pool.query(
      'UPDATE emails SET is_archived = true, updated_at = NOW() WHERE gmail_account_id = $1 AND gmail_id = $2',
      [gmailAccountId, gmailId]
    );

    return true;
  } catch (error) {
    console.error('Error archiving email:', error);
    throw error;
  }
};

// Delete email in Gmail
const deleteEmail = async (gmailAccountId, gmailId) => {
  try {
    const gmail = await getGmailClient(gmailAccountId);
    
    await gmail.users.messages.trash({
      userId: 'me',
      id: gmailId
    });

    // Update database
    await pool.query(
      'UPDATE emails SET is_deleted = true, updated_at = NOW() WHERE gmail_account_id = $1 AND gmail_id = $2',
      [gmailAccountId, gmailId]
    );

    return true;
  } catch (error) {
    console.error('Error deleting email:', error);
    throw error;
  }
};

// Get unsubscribe link from email
const getUnsubscribeLink = (bodyHtml, bodyText) => {
  // Try HTML first
  if (bodyHtml) {
    const htmlMatch = bodyHtml.match(/<a[^>]*href=["']([^"']*unsubscribe[^"']*)["'][^>]*>/i);
    if (htmlMatch) {
      return htmlMatch[1];
    }
  }

  // Try text
  if (bodyText) {
    const textMatch = bodyText.match(/(https?:\/\/[^\s]*unsubscribe[^\s]*)/i);
    if (textMatch) {
      return textMatch[1];
    }
  }

  // Try List-Unsubscribe header (would need to be passed separately)
  return null;
};

module.exports = {
  getGmailClient,
  fetchNewEmails,
  archiveEmail,
  deleteEmail,
  getUnsubscribeLink
};
