const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { pool } = require('../db/connection');

// Get all categories for the authenticated user
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create a new category
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    const result = await pool.query(
      `INSERT INTO categories (user_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, name, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update a category
router.put('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Verify ownership
    const categoryCheck = await pool.query(
      'SELECT * FROM categories WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const result = await pool.query(
      `UPDATE categories 
       SET name = $1, description = $2, updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [name, description, id, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete a category
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const categoryCheck = await pool.query(
      'SELECT * FROM categories WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await pool.query('DELETE FROM categories WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
