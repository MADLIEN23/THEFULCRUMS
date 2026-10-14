// Centralized Error Handling Middleware
// Catches unhandled errors and ensures the client receives a structured JSON response

function errorHandler(err, req, res, next) {
  console.error('Unhandled Application Error:', err);

  // If the response headers have already been sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    error: message,
    statusCode: statusCode
  });
}

module.exports = errorHandler;
