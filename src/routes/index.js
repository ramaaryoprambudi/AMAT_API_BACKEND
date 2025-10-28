const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const categoryRoutes = require('./categories');
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
      categories: '/api/categories',
      transactions: '/api/transactions',
      health: '/api/health'
    },
    features: [
      'Input pemasukan/pengeluaran',
      'Kategori transaksi',
      'Laporan bulanan',
      'Filter by date'
    ]
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/transactions', transactionRoutes);

module.exports = router;