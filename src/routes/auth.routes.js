// Authentication Routes
// Handles user login and profile identity verification

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get } = require('../db/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  // Look up user by case-insensitive trimmed username
  const user = get('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username.trim()]);

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  // Verify hashed password
  const passwordValid = bcrypt.compareSync(password, user.password_hash);
  if (!passwordValid) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  // Generate JWT payload (omitting the password hash)
  const tokenPayload = {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    department: user.department
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

  return res.json({
    message: 'Authentication successful.',
    token,
    user: tokenPayload
  });
});

/**
 * GET /api/auth/me
 * Returns the authenticated user's current session profile
 */
router.get('/me', authenticateToken, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
