// Main Application Entry Point
// Sets up Express HTTP server, middleware, routes, and error handling

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth.routes');
const toolsRoutes = require('./routes/tools.routes');
const alertsRoutes = require('./routes/alerts.routes');
const reportsRoutes = require('./routes/reports.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configuration
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support base64 image strings
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file hosting for uploaded inspection photos
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Root health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ToolTrack Backend API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/reports', reportsRoutes);

// Centralized error handler
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ToolTrack API server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
