const OpenAI = require('openai');
const { pool } = require('../db/connection');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Sort email into a category using AI
const sortEmailIntoCategory = async (emailId, userId) => {
  try {
    // Get email
    const emailResult = await pool.query(
      'SELECT * FROM emails WHERE id = $1 AND user_id = $2',
      [emailId, userId]
    );

    if (emailResult.rows.length === 0) {
      throw new Error('Email not found');
    }

    const email = emailResult.rows[0];

    // Get all categories for the user
    const categoriesResult = await pool.query(
      'SELECT * FROM categories WHERE user_id = $1',
      [userId]
    );

    if (categoriesResult.rows.length === 0) {
      return null; // No categories to sort into
    }

    const categories = categoriesResult.rows;

    // Build prompt for AI
    const categoriesDescription = categories.map(cat => 
      `- ${cat.name}: ${cat.description}`
    ).join('\n');

    const prompt = `You are an email sorting assistant. Analyze the following email and determine which category it best fits into.

Email Subject: ${email.subject}
From: ${email.from_name} <${email.from_email}>
Body: ${email.body_text.substring(0, 2000)}

Available Categories:
${categoriesDescription}

Respond with ONLY the category name that best matches this email. If none of the categories fit well, respond with "UNCATEGORIZED".`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an email sorting assistant. Respond with only the category name.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 50
    });

    const selectedCategoryName = completion.choices[0].message.content.trim();
    
    // Find matching category
    const matchedCategory = categories.find(cat => 
      cat.name.toLowerCase() === selectedCategoryName.toLowerCase()
    );

    if (matchedCategory) {
      // Update email with category
      await pool.query(
        'UPDATE emails SET category_id = $1, updated_at = NOW() WHERE id = $2',
        [matchedCategory.id, emailId]
      );
      return matchedCategory.id;
    }

    return null;
  } catch (error) {
    console.error('Error sorting email:', error);
    throw error;
  }
};

// Summarize an email using AI
const summarizeEmail = async (emailId, userId) => {
  try {
    // Get email
    const emailResult = await pool.query(
      'SELECT * FROM emails WHERE id = $1 AND user_id = $2',
      [emailId, userId]
    );

    if (emailResult.rows.length === 0) {
      throw new Error('Email not found');
    }

    const email = emailResult.rows[0];

    // If already summarized, return existing summary
    if (email.summary) {
      return email.summary;
    }

    const prompt = `Summarize the following email in 2-3 sentences. Focus on the main purpose and any action items.

Subject: ${email.subject}
From: ${email.from_name} <${email.from_email}>
Body: ${email.body_text.substring(0, 3000)}

Provide a concise summary:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an email summarization assistant. Provide concise, actionable summaries.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 200
    });

    const summary = completion.choices[0].message.content.trim();

    // Update email with summary
    await pool.query(
      'UPDATE emails SET summary = $1, updated_at = NOW() WHERE id = $2',
      [summary, emailId]
    );

    return summary;
  } catch (error) {
    console.error('Error summarizing email:', error);
    throw error;
  }
};

// Process new email: sort and summarize
const processNewEmail = async (emailId, userId) => {
  try {
    // Sort into category
    await sortEmailIntoCategory(emailId, userId);
    
    // Summarize
    await summarizeEmail(emailId, userId);
    
    return true;
  } catch (error) {
    console.error('Error processing email:', error);
    throw error;
  }
};

module.exports = {
  sortEmailIntoCategory,
  summarizeEmail,
  processNewEmail
};
