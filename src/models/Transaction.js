const db = require('../config/db');
const moment = require('moment');

class Transaction {
  // Get all transactions with pagination and filters
  static async getAll(filters = {}) {
    let query = `
      SELECT 
        t.id,
        t.title,
        t.amount,
        t.type,
        t.description,
        t.transaction_date,
        t.created_at,
        t.updated_at,
        c.id as category_id,
        c.name as category_name,
        c.type as category_type
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
    `;
    
    const conditions = [];
    const params = [];

    // Filter by user (always required for user-specific data)
    if (filters.user_id) {
      conditions.push('t.user_id = ?');
      params.push(filters.user_id);
    }

    // Filter by type
    if (filters.type) {
      conditions.push('t.type = ?');
      params.push(filters.type);
    }

    // Filter by category
    if (filters.category_id) {
      conditions.push('t.category_id = ?');
      params.push(filters.category_id);
    }

    // Filter by date range
    if (filters.start_date) {
      conditions.push('t.transaction_date >= ?');
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      conditions.push('t.transaction_date <= ?');
      params.push(filters.end_date);
    }

    // Filter by month and year
    if (filters.month && filters.year) {
      conditions.push('MONTH(t.transaction_date) = ? AND YEAR(t.transaction_date) = ?');
      params.push(filters.month, filters.year);
    } else if (filters.year) {
      conditions.push('YEAR(t.transaction_date) = ?');
      params.push(filters.year);
    }

    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Order by transaction date (newest first)
    query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';

    // Add pagination
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
      
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(parseInt(filters.offset));
      }
    }

    return await db.getMany(query, params);
  }

  // Get transaction by ID
  static async getById(id) {
    const query = `
      SELECT 
        t.id,
        t.title,
        t.amount,
        t.type,
        t.description,
        t.transaction_date,
        t.created_at,
        t.updated_at,
        c.id as category_id,
        c.name as category_name,
        c.type as category_type
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `;
    return await db.getOne(query, [id]);
  }

  // Create new transaction
  static async create(transactionData) {
    const { title, amount, type, category_id, description = null, transaction_date, user_id } = transactionData;
    const query = `
      INSERT INTO transactions (title, amount, type, category_id, description, transaction_date, user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const insertId = await db.insert(query, [title, amount, type, category_id, description, transaction_date, user_id]);
    return await this.getById(insertId);
  }

  // Update transaction
  static async update(id, transactionData) {
    const { title, amount, type, category_id, description, transaction_date } = transactionData;
    const query = `
      UPDATE transactions 
      SET title = ?, amount = ?, type = ?, category_id = ?, description = ?, 
          transaction_date = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    const affectedRows = await db.update(query, [title, amount, type, category_id, description, transaction_date, id]);
    if (affectedRows === 0) {
      return null;
    }
    return await this.getById(id);
  }

  // Delete transaction
  static async delete(id) {
    const query = `DELETE FROM transactions WHERE id = ?`;
    const affectedRows = await db.remove(query, [id]);
    return affectedRows > 0;
  }

  // Get monthly report by user
  static async getMonthlyReportByUser(month, year, userId) {
    const query = `
      SELECT 
        t.type,
        c.name as category_name,
        COUNT(t.id) as transaction_count,
        SUM(t.amount) as total_amount
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE MONTH(t.transaction_date) = ? AND YEAR(t.transaction_date) = ? AND t.user_id = ?
      GROUP BY t.type, c.id, c.name
      ORDER BY t.type, total_amount DESC
    `;
    return await db.getMany(query, [month, year, userId]);
  }

  // Get monthly summary by user
  static async getMonthlySummaryByUser(month, year, userId) {
    const query = `
      SELECT 
        type,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount
      FROM transactions
      WHERE MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? AND user_id = ?
      GROUP BY type
    `;
    const results = await db.getMany(query, [month, year, userId]);
    
    const summary = {
      income: { count: 0, total: 0 },
      expense: { count: 0, total: 0 },
      balance: 0
    };

    results.forEach(row => {
      summary[row.type] = {
        count: row.transaction_count,
        total: parseFloat(row.total_amount)
      };
    });

    summary.balance = summary.income.total - summary.expense.total;
    
    return summary;
  }

  // Get monthly report (admin only)
  static async getMonthlyReport(month, year) {
    const query = `
      SELECT 
        t.type,
        c.name as category_name,
        COUNT(t.id) as transaction_count,
        SUM(t.amount) as total_amount
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE MONTH(t.transaction_date) = ? AND YEAR(t.transaction_date) = ?
      GROUP BY t.type, c.id, c.name
      ORDER BY t.type, total_amount DESC
    `;
    return await db.getMany(query, [month, year]);
  }

  // Get monthly summary (admin only)
  static async getMonthlySummary(month, year) {
    const query = `
      SELECT 
        type,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount
      FROM transactions
      WHERE MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?
      GROUP BY type
    `;
    const results = await db.getMany(query, [month, year]);
    
    const summary = {
      income: { count: 0, total: 0 },
      expense: { count: 0, total: 0 },
      balance: 0
    };

    results.forEach(row => {
      summary[row.type] = {
        count: row.transaction_count,
        total: parseFloat(row.total_amount)
      };
    });

    summary.balance = summary.income.total - summary.expense.total;
    
    return summary;
  }

  // Get daily transactions for a specific date by user
  static async getDailyTransactionsByUser(date, userId) {
    const query = `
      SELECT 
        t.id,
        t.title,
        t.amount,
        t.type,
        t.description,
        t.transaction_date,
        c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.transaction_date = ? AND t.user_id = ?
      ORDER BY t.created_at DESC
    `;
    return await db.getMany(query, [date, userId]);
  }

  // Get daily transactions for a specific date (admin only)
  static async getDailyTransactions(date) {
    const query = `
      SELECT 
        t.id,
        t.title,
        t.amount,
        t.type,
        t.description,
        t.transaction_date,
        c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.transaction_date = ?
      ORDER BY t.created_at DESC
    `;
    return await db.getMany(query, [date]);
  }

  // Get transaction statistics
  static async getStatistics(filters = {}) {
    const conditions = [];
    const params = [];

    // Always filter by user_id if provided
    if (filters.user_id) {
      conditions.push('user_id = ?');
      params.push(filters.user_id);
    }

    if (filters.start_date && filters.end_date) {
      conditions.push('transaction_date BETWEEN ? AND ?');
      params.push(filters.start_date, filters.end_date);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const query = `
      SELECT 
        type,
        COUNT(*) as count,
        SUM(amount) as total,
        AVG(amount) as average,
        MIN(amount) as minimum,
        MAX(amount) as maximum
      FROM transactions
      ${whereClause}
      GROUP BY type
    `;
    
    return await db.getMany(query, params);
  }

  // Search transactions
  static async search(searchTerm, filters = {}) {
    let query = `
      SELECT 
        t.id,
        t.title,
        t.amount,
        t.type,
        t.description,
        t.transaction_date,
        c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE (t.title LIKE ? OR t.description LIKE ? OR c.name LIKE ?)
    `;
    
    const searchPattern = `%${searchTerm}%`;
    const params = [searchPattern, searchPattern, searchPattern];

    // Always filter by user_id if provided
    if (filters.user_id) {
      query += ' AND t.user_id = ?';
      params.push(filters.user_id);
    }

    // Add additional filters
    if (filters.type) {
      query += ' AND t.type = ?';
      params.push(filters.type);
    }

    if (filters.category_id) {
      query += ' AND t.category_id = ?';
      params.push(filters.category_id);
    }

    query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    return await db.getMany(query, params);
  }
}

module.exports = Transaction;