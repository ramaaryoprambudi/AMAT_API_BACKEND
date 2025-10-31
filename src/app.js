require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const db = require('./config/db');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { directoryProtection, handleUploadsRoot, logFileAccess } = require('./middleware/directoryProtection');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Directory protection middleware (before static file serving)
app.use(handleUploadsRoot);
app.use(logFileAccess);
app.use(directoryProtection);

// Serve static files (uploaded photos)
app.use('/uploads', express.static('uploads'));

// Request logging middleware (production ready)
app.use((req, res, next) => {
  // Only log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  }
  next();
});

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Personal Finance API',
    version: '1.0.0',
    documentation: '/api',
    health: '/api/health'
  });
});

// 404 handler (must be after all routes)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await db.testConnection();
    
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Start HTTP server
    app.listen(PORT, () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n🚀 Personal Finance API Server Started');
        console.log(`📍 Server running on port ${PORT}`);
        console.log(`🌐 API URL: http://localhost:${PORT}`);
        console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
        console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
        console.log(` Transactions: http://localhost:${PORT}/api/transactions`);
        console.log('\n✅ Server is ready for connections!\n');
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err.message);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n${signal} received. Shutting down gracefully...`);
  }
  
  // Close database connections
  if (db.pool) {
    db.pool.end(() => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Database connections closed.');
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
startServer();

module.exports = app;