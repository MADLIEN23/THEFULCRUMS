// Authentication and Role Authorization Middleware
// Verifies JSON Web Tokens (JWT) and checks user role permissions

const jwt = require('jsonwebtoken');

// Fetch JWT secret from environment or use a secure fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'tooltrack_hackathon_demo_secret_key_2026';

/**
 * Middleware to verify that the request includes a valid Bearer JWT
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // The header format is: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Please provide a valid session token.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach decoded user payload (id, username, role, department) to request object
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      error: 'Session expired or invalid token. Please log in again.'
    });
  }
}

/**
 * Middleware generator to enforce Role-Based Access Control (RBAC)
 * @param {...string} allowedRoles - List of allowed roles (e.g. 'Admin', 'Inspector')
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access restricted. Your role (${req.user.role}) does not have permission. Required role: ${allowedRoles.join(' or ')}.`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole,
  JWT_SECRET,
};
