const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');
const { transactionValidation } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, checkResourceOwnership } = require('../middleware/auth');

// All transaction routes require authentication
router.use(authenticateToken);

// GET /api/transactions - Get all transactions (with filters)
router.get('/', asyncHandler(TransactionController.getAllTransactions));

// GET /api/transactions/search - Search transactions
router.get('/search', asyncHandler(TransactionController.searchTransactions));

// GET /api/transactions/report - Get monthly report
router.get('/report', asyncHandler(TransactionController.getMonthlyReport));

// GET /api/transactions/statistics - Get transaction statistics
router.get('/statistics', asyncHandler(TransactionController.getStatistics));

// GET /api/transactions/daily/:date - Get daily transactions
router.get('/daily/:date', asyncHandler(TransactionController.getDailyTransactions));

// GET /api/transactions/:id - Get transaction by ID
router.get('/:id', 
  checkResourceOwnership('transaction'),
  asyncHandler(TransactionController.getTransactionById)
);

// POST /api/transactions - Create new transaction
router.post('/',
  transactionValidation.create,
  asyncHandler(TransactionController.createTransaction)
);

// PUT /api/transactions/:id - Update transaction
router.put('/:id',
  checkResourceOwnership('transaction'),
  transactionValidation.update,
  asyncHandler(TransactionController.updateTransaction)
);

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', 
  checkResourceOwnership('transaction'),
  asyncHandler(TransactionController.deleteTransaction)
);

module.exports = router;