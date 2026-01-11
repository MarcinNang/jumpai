const puppeteer = require('puppeteer');
const { getUnsubscribeLink } = require('./gmail');

// AI-powered unsubscribe agent
const unsubscribeFromEmail = async (emailId, userId) => {
  const { pool } = require('../db/connection');
  
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

    // Get unsubscribe link
    const unsubscribeUrl = getUnsubscribeLink(email.body_html, email.body_text);

    if (!unsubscribeUrl) {
      throw new Error('No unsubscribe link found in email');
    }

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.goto(unsubscribeUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Use AI to analyze the page and determine what actions to take
      const pageContent = await page.content();
      const pageText = await page.evaluate(() => document.body.innerText);

      // Analyze page with AI to determine actions
      const OpenAI = require('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

      const analysisPrompt = `You are analyzing an unsubscribe page. Determine what actions need to be taken to unsubscribe.

Page URL: ${unsubscribeUrl}
Page Text: ${pageText.substring(0, 2000)}

Analyze the page and provide a JSON response with:
{
  "actions": [
    {"type": "click", "selector": "button selector or text"},
    {"type": "fill", "selector": "input selector", "value": "value to fill"},
    {"type": "select", "selector": "select selector", "value": "option value"},
    {"type": "wait", "time": 2000}
  ],
  "description": "brief description of what the page requires"
}

Only include actions that are necessary. If it's a simple one-click unsubscribe, just click the button.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an unsubscribe automation assistant. Analyze pages and provide actionable steps.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const analysis = JSON.parse(completion.choices[0].message.content);
      const actions = analysis.actions || [];

      // Execute actions
      for (const action of actions) {
        try {
          switch (action.type) {
            case 'click':
              if (action.selector) {
                // Try as CSS selector first
                try {
                  await page.click(action.selector);
                } catch (e) {
                  // Try as text content
                  await page.evaluate((text) => {
                    const buttons = Array.from(document.querySelectorAll('button, a, input[type="submit"]'));
                    const button = buttons.find(btn => btn.textContent.includes(text) || btn.value.includes(text));
                    if (button) button.click();
                  }, action.selector);
                }
              }
              break;
            case 'fill':
              await page.type(action.selector, action.value, { delay: 0 });
              break;
            case 'select':
              await page.select(action.selector, action.value);
              break;
            case 'wait':
              await page.waitForTimeout(action.time || 1000);
              break;
          }
        } catch (actionError) {
          console.error(`Error executing action ${action.type}:`, actionError);
          // Continue with next action
        }
      }

      // Wait a bit for any final processing
      await page.waitForTimeout(2000);

      // Check if unsubscribe was successful (look for success messages)
      const finalText = await page.evaluate(() => document.body.innerText);
      const successIndicators = ['unsubscribed', 'success', 'confirmed', 'removed'];
      const isSuccess = successIndicators.some(indicator => 
        finalText.toLowerCase().includes(indicator)
      );

      await browser.close();

      if (isSuccess) {
        // Mark email as unsubscribed in database
        await pool.query(
          'UPDATE emails SET is_deleted = true, updated_at = NOW() WHERE id = $1',
          [emailId]
        );
        return { success: true, message: 'Successfully unsubscribed' };
      } else {
        return { success: false, message: 'Unsubscribe process completed but success could not be confirmed' };
      }
    } catch (error) {
      await browser.close();
      throw error;
    }
  } catch (error) {
    console.error('Error unsubscribing:', error);
    throw error;
  }
};

module.exports = {
  unsubscribeFromEmail
};
