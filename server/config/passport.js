const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('../db/connection');

const initializePassport = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('Warning: Google OAuth credentials not configured. OAuth will not work.');
    return;
  }

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_REDIRECT_URI || '/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      const userResult = await pool.query(
        'SELECT * FROM users WHERE google_id = $1',
        [profile.id]
      );

      let user;
      if (userResult.rows.length === 0) {
        // Create new user
        const insertResult = await pool.query(
          `INSERT INTO users (google_id, email, name, picture, access_token, refresh_token)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [
            profile.id,
            profile.emails[0].value,
            profile.displayName,
            profile.photos[0]?.value,
            accessToken,
            refreshToken
          ]
        );
        user = insertResult.rows[0];
      } else {
        // Update existing user tokens
        await pool.query(
          `UPDATE users 
           SET access_token = $1, refresh_token = $2, updated_at = NOW()
           WHERE google_id = $3`,
          [accessToken, refreshToken, profile.id]
        );
        user = userResult.rows[0];
        user.access_token = accessToken;
        user.refresh_token = refreshToken;
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      done(null, result.rows[0]);
    } catch (error) {
      done(error, null);
    }
  });
};

module.exports = { initializePassport };
