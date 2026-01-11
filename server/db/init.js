const { pool } = require('./connection');

const initializeDatabase = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        picture TEXT,
        access_token TEXT,
        refresh_token TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create gmail_accounts table (for multiple accounts per user)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS gmail_accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, email)
      )
    `);

    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create emails table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS emails (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        gmail_account_id INTEGER REFERENCES gmail_accounts(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        gmail_id VARCHAR(255) NOT NULL,
        thread_id VARCHAR(255),
        subject TEXT,
        from_email VARCHAR(255),
        from_name VARCHAR(255),
        body_text TEXT,
        body_html TEXT,
        summary TEXT,
        is_archived BOOLEAN DEFAULT false,
        is_deleted BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(gmail_account_id, gmail_id)
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
      CREATE INDEX IF NOT EXISTS idx_emails_category_id ON emails(category_id);
      CREATE INDEX IF NOT EXISTS idx_emails_gmail_account_id ON emails(gmail_account_id);
      CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
      CREATE INDEX IF NOT EXISTS idx_gmail_accounts_user_id ON gmail_accounts(user_id);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

module.exports = { initializeDatabase };
