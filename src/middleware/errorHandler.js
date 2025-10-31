// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  // Only log full error details in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error occurred:', err);
  }

  // Default error
  let error = {
    success: false,
    message: err.message || 'Internal Server Error',
    statusCode: err.statusCode || 500
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error.message = 'Validation Error';
    error.statusCode = 400;
    error.errors = Object.values(err.errors).map(val => val.message);
  }

  // MySQL duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    error.message = 'Duplicate entry error';
    error.statusCode = 409;
  }

  // MySQL foreign key constraint error
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    error.message = 'Referenced record does not exist';
    error.statusCode = 400;
  }

  // MySQL connection error
  if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
    error.message = 'Database connection error';
    error.statusCode = 503;
  }

  // JSON parsing error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error.message = 'Invalid JSON format';
    error.statusCode = 400;
  }

  // Send response
  const response = {
    success: false,
    message: error.message,
    errors: error.errors || []
  };
  
  // Only include stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }
  
  res.status(error.statusCode).json(response);
};

// Handle 404 errors
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};