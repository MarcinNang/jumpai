const { pool } = require('../db/connection');
const { processUserEmails } = require('./emailProcessor');

// Monitor emails periodically
let monitoringInterval = null;

const startEmailMonitoring = () => {
  if (monitoringInterval) {
    return; // Already monitoring
  }

  // Check for new emails every 5 minutes
  monitoringInterval = setInterval(async () => {
    try {
      // Get all users with connected accounts
      const usersResult = await pool.query(
        `SELECT DISTINCT u.id
         FROM users u
         INNER JOIN gmail_accounts ga ON u.id = ga.user_id`
      );

      for (const row of usersResult.rows) {
        try {
          await processUserEmails(row.id);
        } catch (error) {
          console.error(`Error monitoring user ${row.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in email monitoring:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes

  console.log('Email monitoring started');
};

const stopEmailMonitoring = () => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.log('Email monitoring stopped');
  }
};

module.exports = {
  startEmailMonitoring,
  stopEmailMonitoring
};
