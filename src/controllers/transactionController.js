const Transaction = require('../models/Transaction');
const { validationResult } = require('express-validator');
const moment = require('moment');

class TransactionController {
  // Get dashboard data (Balance, Cash In/Out, Recent Activity, User Name)
  static async getDashboard(req, res) {
    try {
      const userId = req.user.id;
      const User = require('../models/User');
      
      // Get user information
      const userInfo = await User.getById(userId);
      
      // Get balance (total income - total expenses)
      const balanceData = await Transaction.getBalance(userId);
      
      // Get recent activity (last 10 transactions)
      const recentActivity = await Transaction.getRecentActivity(userId, 10);
      
      res.json({
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: {
          user_name: userInfo.nama || userInfo.name || 'User',
          balance: balanceData.balance || 0,
          cash_in: balanceData.total_income || 0,
          cash_out: balanceData.total_expense || 0,
          recent_activity: recentActivity || []
        }
      });
    } catch (error) {
      console.error('Error getting dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard data',
        error: error.message
      });
    }
  }

  // Get transaction history with formatted date and time
  static async getTransactionHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, type, start_date, end_date } = req.query;
      
      // Build filters
      const filters = {
        user_id: userId,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      };

      // Add optional filters
      if (type && ['income', 'expense'].includes(type)) {
        filters.type = type;
      }
      
      if (start_date && moment(start_date, 'YYYY-MM-DD', true).isValid()) {
        filters.start_date = start_date;
      }
      
      if (end_date && moment(end_date, 'YYYY-MM-DD', true).isValid()) {
        filters.end_date = end_date;
      }

      // Get transactions
      const transactions = await Transaction.getAll(filters);
      
      // Format response for history with detailed date/time info
      const formattedHistory = transactions.map(transaction => {
        const createdAt = moment(transaction.created_at);
        const transactionDate = moment(transaction.transaction_date);
        
        return {
          id: transaction.id,
          amount: parseFloat(transaction.amount),
          description: transaction.description || transaction.title,
          title: transaction.title,
          type: transaction.type,
          category_name: transaction.category_name,
          
          // Date and time details
          transaction_date: transactionDate.format('YYYY-MM-DD'),
          day: transactionDate.format('DD'),
          month: transactionDate.format('MM'),
          month_name: transactionDate.format('MMMM'),
          year: transactionDate.format('YYYY'),
          
          // Creation time details
          created_at: createdAt.format('YYYY-MM-DD HH:mm:ss'),
          created_time: createdAt.format('HH:mm:ss'),
          created_hour: createdAt.format('HH'),
          created_minute: createdAt.format('mm'),
          
          // Formatted displays
          amount_formatted: new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
          }).format(transaction.amount),
          
          date_formatted: transactionDate.format('DD MMMM YYYY'),
          time_formatted: createdAt.format('HH:mm'),
          datetime_formatted: createdAt.format('DD MMM YYYY, HH:mm')
        };
      });

      // Get total count for pagination
      const totalTransactions = await Transaction.getTotalCount({ user_id: userId, type, start_date, end_date });
      const totalPages = Math.ceil(totalTransactions / parseInt(limit));

      res.json({
        success: true,
        message: 'Transaction history retrieved successfully',
        data: {
          transactions: formattedHistory,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: totalTransactions,
            items_per_page: parseInt(limit),
            has_next: parseInt(page) < totalPages,
            has_prev: parseInt(page) > 1
          },
          filters: {
            type: type || 'all',
            start_date: start_date || null,
            end_date: end_date || null
          }
        }
      });
    } catch (error) {
      console.error('Error getting transaction history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transaction history',
        error: error.message
      });
    }
  }

  // Get all transactions with filters
  static async getAllTransactions(req, res) {
    try {
      const { type, category_id, start_date, end_date, limit, offset } = req.query;
      
      const filters = {
        user_id: req.user.id,
        type,
        category_id,
        start_date,
        end_date,
        limit: limit || 100,
        offset: offset || 0
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const transactions = await Transaction.getAll(filters);

      res.json({
        success: true,
        message: 'Transactions retrieved successfully',
        data: transactions,
        filters: filters
      });
    } catch (error) {
      console.error('Error getting transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transactions',
        error: error.message
      });
    }
  }

  // Get transaction by ID
  static async getTransactionById(req, res) {
    try {
      const { id } = req.params;
      
      const transaction = await Transaction.getById(id);
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        message: 'Transaction retrieved successfully',
        data: transaction
      });
    } catch (error) {
      console.error('Error getting transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transaction',
        error: error.message
      });
    }
  }

  // Create new transaction
  static async createTransaction(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Log security event untuk validation failures

        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { title, amount, type, category_id, description, transaction_date } = req.body;

      // Additional security checks
      const userId = req.user.id;
      const userIP = req.ip;
      
      // Check for suspicious large amounts
      const numAmount = parseFloat(amount);
      if (numAmount > 100000000) { // 100 million limit

        return res.status(400).json({
          success: false,
          message: 'Amount exceeds security limit',
          error: 'Security validation failed'
        });
      }

      // Rate limiting check - max 5 transactions per minute per user
      const currentTime = Date.now();
      const oneMinute = 60 * 1000;
      
      if (!global.userTransactionLimits) {
        global.userTransactionLimits = new Map();
      }
      
      const userKey = `transaction_${userId}`;
      const userTransactions = global.userTransactionLimits.get(userKey) || [];
      const recentTransactions = userTransactions.filter(time => currentTime - time < oneMinute);
      
      if (recentTransactions.length >= 5) {

        return res.status(429).json({
          success: false,
          message: 'Too many transactions. Please wait before creating another transaction.',
          error: 'Rate limit exceeded'
        });
      }
      
      // Update rate limit tracking
      recentTransactions.push(currentTime);
      global.userTransactionLimits.set(userKey, recentTransactions);

      // Validate category exists and type matches
      if (category_id) {
        const category = await Category.getById(category_id);
        if (!category) {
          return res.status(400).json({
            success: false,
            message: 'Invalid category ID'
          });
        }

        if (category.type !== type) {
          return res.status(400).json({
            success: false,
            message: `Category type (${category.type}) does not match transaction type (${type})`
          });
        }
      }

      // Sanitize input data sebelum save ke database
      const sanitizedTitle = title.replace(/[<>'"]/g, ''); // Remove potentially dangerous characters
      const sanitizedDescription = description ? description.replace(/[<>'"]/g, '') : null;
      
      // Double check amount is valid number
      const sanitizedAmount = Math.round(parseFloat(amount) * 100) / 100; // Round to 2 decimal places
      
      // Validate transaction date
      const sanitizedDate = transaction_date || moment().format('YYYY-MM-DD');
      if (!moment(sanitizedDate, 'YYYY-MM-DD', true).isValid()) {

        return res.status(400).json({
          success: false,
          message: 'Invalid transaction date format',
          error: 'Security validation failed'
        });
      }



      const newTransaction = await Transaction.create({
        title: sanitizedTitle,
        amount: sanitizedAmount,
        type,
        category_id: category_id || null,
        description: sanitizedDescription,
        transaction_date: sanitizedDate,
        user_id: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: newTransaction
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create transaction',
        error: error.message
      });
    }
  }

  // Update transaction
  static async updateTransaction(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { title, amount, type, category_id, description, transaction_date } = req.body;
      const userId = req.user.id;

      // Check if transaction exists
      const existingTransaction = await Transaction.getById(id);
      if (!existingTransaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Additional security checks for amount
      const numAmount = parseFloat(amount);
      if (numAmount < 1000) {

        return res.status(400).json({
          success: false,
          message: 'Minimum transaction amount is Rp 1,000',
          error: 'Amount validation failed'
        });
      }

      if (numAmount > 100000000) {

        return res.status(400).json({
          success: false,
          message: 'Amount exceeds security limit',
          error: 'Security validation failed'
        });
      }

      // Sanitize input data
      const sanitizedTitle = title.replace(/[<>'"]/g, '');
      const sanitizedDescription = description ? description.replace(/[<>'"]/g, '') : null;
      const sanitizedAmount = Math.round(numAmount * 100) / 100;
      const sanitizedDate = transaction_date || moment().format('YYYY-MM-DD');

      // Validate date format
      if (!moment(sanitizedDate, 'YYYY-MM-DD', true).isValid()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transaction date format'
        });
      }



      const updatedTransaction = await Transaction.update(id, {
        title: sanitizedTitle,
        amount: sanitizedAmount,
        type,
        description: sanitizedDescription,
        transaction_date: sanitizedDate
      });

      if (!updatedTransaction) {
        return res.status(404).json({
          success: false,
          message: 'Failed to update transaction'
        });
      }

      res.json({
        success: true,
        message: 'Transaction updated successfully',
        data: updatedTransaction
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update transaction',
        error: error.message
      });
    }
  }

  // Delete transaction
  static async deleteTransaction(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userIP = req.ip;

      // Validate ID parameter
      if (!id || isNaN(parseInt(id))) {

        return res.status(400).json({
          success: false,
          message: 'Invalid transaction ID'
        });
      }

      // Check if transaction exists and get details for logging
      const existingTransaction = await Transaction.getById(id);
      if (!existingTransaction) {

        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      const deleted = await Transaction.delete(id);
      
      if (!deleted) {
        return res.status(400).json({
          success: false,
          message: 'Failed to delete transaction'
        });
      }

      res.json({
        success: true,
        message: 'Transaction deleted successfully',
        data: {
          deleted_transaction: {
            id: existingTransaction.id,
            title: existingTransaction.title,
            amount: existingTransaction.amount,
            type: existingTransaction.type,
            transaction_date: existingTransaction.transaction_date
          }
        }
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to delete transaction',
        error: error.message
      });
    }
  }

  // Get monthly report
  static async getMonthlyReport(req, res) {
    try {
      let { month, year } = req.query;
      
      // Use current month/year if not provided
      if (!month || !year) {
        const now = moment();
        month = month || now.month() + 1; // moment months are 0-indexed
        year = year || now.year();
      }

      month = parseInt(month);
      year = parseInt(year);

      // Validate month and year
      if (month < 1 || month > 12) {
        return res.status(400).json({
          success: false,
          message: 'Month must be between 1 and 12'
        });
      }

      if (year < 1900 || year > new Date().getFullYear() + 10) {
        return res.status(400).json({
          success: false,
          message: 'Invalid year'
        });
      }

      const [reportData, summary] = await Promise.all([
        Transaction.getMonthlyReportByUser(month, year, req.user.id),
        Transaction.getMonthlySummaryByUser(month, year, req.user.id)
      ]);

      res.json({
        success: true,
        message: 'Monthly report retrieved successfully',
        data: {
          month,
          year,
          month_name: moment().month(month - 1).format('MMMM'),
          summary,
          categories: reportData
        }
      });
    } catch (error) {
      console.error('Error getting monthly report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve monthly report',
        error: error.message
      });
    }
  }

  // Get daily transactions
  static async getDailyTransactions(req, res) {
    try {
      const { date } = req.params;
      
      // Validate date format
      if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      const transactions = await Transaction.getDailyTransactionsByUser(date, req.user.id);

      res.json({
        success: true,
        message: 'Daily transactions retrieved successfully',
        data: {
          date,
          date_formatted: moment(date).format('dddd, MMMM Do YYYY'),
          transactions
        }
      });
    } catch (error) {
      console.error('Error getting daily transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve daily transactions',
        error: error.message
      });
    }
  }

  // Get transaction statistics
  static async getStatistics(req, res) {
    try {
      const { start_date, end_date } = req.query;
      const filters = {};

      if (start_date) {
        if (!moment(start_date, 'YYYY-MM-DD', true).isValid()) {
          return res.status(400).json({
            success: false,
            message: 'Invalid start_date format. Use YYYY-MM-DD'
          });
        }
        filters.start_date = start_date;
      }

      if (end_date) {
        if (!moment(end_date, 'YYYY-MM-DD', true).isValid()) {
          return res.status(400).json({
            success: false,
            message: 'Invalid end_date format. Use YYYY-MM-DD'
          });
        }
        filters.end_date = end_date;
      }

      const stats = await Transaction.getStatistics(filters);

      res.json({
        success: true,
        message: 'Transaction statistics retrieved successfully',
        data: {
          period: {
            start_date: start_date || 'All time',
            end_date: end_date || 'All time'
          },
          statistics: stats
        }
      });
    } catch (error) {
      console.error('Error getting statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics',
        error: error.message
      });
    }
  }

  // Search transactions
  static async searchTransactions(req, res) {
    try {
      const { q: searchTerm } = req.query;
      
      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search term must be at least 2 characters long'
        });
      }

      const filters = {
        user_id: req.user.id,
        type: req.query.type,
        limit: req.query.limit || 50
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const transactions = await Transaction.search(searchTerm.trim(), filters);

      res.json({
        success: true,
        message: 'Search completed successfully',
        data: {
          search_term: searchTerm.trim(),
          filters,
          results: transactions,
          count: transactions.length
        }
      });
    } catch (error) {
      console.error('Error searching transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search transactions',
        error: error.message
      });
    }
  }
}

module.exports = TransactionController;