const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { validationResult } = require('express-validator');
const moment = require('moment');

class TransactionController {
  // Get all transactions with filters
  static async getAllTransactions(req, res) {
    try {
      const filters = {
        user_id: req.user.id,
        start_date: start_date,
        end_date: end_date
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const stats = await Transaction.getStatistics(filters);

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
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { title, amount, type, category_id, description, transaction_date } = req.body;

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

      const newTransaction = await Transaction.create({
        title,
        amount: parseFloat(amount),
        type,
        category_id: category_id || null,
        description,
        transaction_date: transaction_date || moment().format('YYYY-MM-DD'),
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

      // Check if transaction exists
      const existingTransaction = await Transaction.getById(id);
      if (!existingTransaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

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

      const updatedTransaction = await Transaction.update(id, {
        title,
        amount: parseFloat(amount),
        type,
        category_id: category_id || null,
        description,
        transaction_date
      });

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

      // Check if transaction exists
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
        message: 'Transaction deleted successfully'
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
        category_id: req.query.category_id,
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