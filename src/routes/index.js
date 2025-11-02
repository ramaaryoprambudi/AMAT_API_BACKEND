const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const transactionRoutes = require('./transactions');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running successfully',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Personal Finance API',
    version: '1.0.0',
    description: 'API Backend untuk Aplikasi Manajemen Keuangan Pribadi',
    endpoints: {
      auth: '/api/auth',
      transactions: '/api/transactions',
      health: '/api/health'
    },
    features: [
      'Input pemasukan/pengeluaran (income/expense)',
      'Sistem kategori sederhana',
      'Laporan bulanan',
      'Filter by date dan type'
    ]
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);

module.exports = router;