const db = require('../config/db');
const moment = require('moment');

class Transaction {
  // Get all transactions with pagination and filters
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT 
          id,
          title,
          amount,
          type,
          description,
          transaction_date,
          created_at,
          updated_at
        FROM transactions
      `;
      
      const conditions = [];

      // Filter by user (always required for user-specific data)
      if (filters.user_id) {
        conditions.push(`user_id = ${parseInt(filters.user_id)}`);
      }

      // Filter by type
      if (filters.type) {
        conditions.push(`type = '${filters.type}'`);
      }

      // Filter by date range
      if (filters.start_date) {
        conditions.push(`transaction_date >= '${filters.start_date}'`);
      }

      if (filters.end_date) {
        conditions.push(`transaction_date <= '${filters.end_date}'`);
      }

      // Filter by month and year
      if (filters.month && filters.year) {
        conditions.push(`MONTH(transaction_date) = ${parseInt(filters.month)} AND YEAR(transaction_date) = ${parseInt(filters.year)}`);
      } else if (filters.year) {
        conditions.push(`YEAR(transaction_date) = ${parseInt(filters.year)}`);
      }

      // Add WHERE clause if there are conditions
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      // Order by transaction date (newest first)
      query += ' ORDER BY transaction_date DESC, created_at DESC';

      // Add pagination
      if (filters.limit) {
        query += ` LIMIT ${parseInt(filters.limit)}`;
        
        if (filters.offset) {
          query += ` OFFSET ${parseInt(filters.offset)}`;
        }
      }

      console.log('Generated query:', query);
      return await db.getMany(query, []);
    } catch (error) {
      console.error('Error in getAll:', error);
      return [];
    }
  }

  // Get transaction by ID
  static async getById(id) {
    const query = `
      SELECT 
        id,
        title,
        amount,
        type,
        description,
        transaction_date,
        created_at,
        updated_at
      FROM transactions
      WHERE id = ?
    `;
    return await db.getOne(query, [id]);
  }

  // Create new transaction
  static async create(transactionData) {
    const { title, amount, type, description = null, transaction_date, user_id } = transactionData;
    const query = `
      INSERT INTO transactions (title, amount, type, description, transaction_date, user_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const insertId = await db.insert(query, [title, amount, type, description, transaction_date, user_id]);
    return await this.getById(insertId);
  }

  // Update transaction
  static async update(id, transactionData) {
    try {
      const { title, amount, type, description, transaction_date } = transactionData;
      
      // Sanitize data
      const sanitizedTitle = title.replace(/'/g, "''"); // Escape single quotes
      const sanitizedDescription = description ? description.replace(/'/g, "''") : null;
      
      const query = `
        UPDATE transactions 
        SET title = '${sanitizedTitle}', 
            amount = ${parseFloat(amount)}, 
            type = '${type}', 
            description = ${sanitizedDescription ? `'${sanitizedDescription}'` : 'NULL'}, 
            transaction_date = '${transaction_date}', 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${parseInt(id)}
      `;
      
      console.log('Update query:', query);
      const affectedRows = await db.update(query, []);
      if (affectedRows === 0) {
        return null;
      }
      return await this.getById(id);
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  // Delete transaction
  static async delete(id) {
    try {
      const query = `DELETE FROM transactions WHERE id = ${parseInt(id)}`;
      console.log('Delete query:', query);
      const affectedRows = await db.remove(query, []);
      return affectedRows > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  // Get monthly report by user
  static async getMonthlyReportByUser(month, year, userId) {
    const query = `
      SELECT 
        type,
        COUNT(id) as transaction_count,
        SUM(amount) as total_amount
      FROM transactions
      WHERE MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? AND user_id = ?
      GROUP BY type
      ORDER BY type, total_amount DESC
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

  // Get balance data (total income - total expense)
  static async getBalance(userId) {
    try {
      const query = `
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance
        FROM transactions 
        WHERE user_id = ${parseInt(userId)}
      `;
      
      const result = await db.getOne(query, []);
      return {
        total_income: parseFloat(result.total_income) || 0,
        total_expense: parseFloat(result.total_expense) || 0,
        balance: parseFloat(result.balance) || 0
      };
    } catch (error) {
      console.error('Error in getBalance:', error);
      return {
        total_income: 0,
        total_expense: 0,
        balance: 0
      };
    }
  }

  // Get recent activity (last N transactions)
  static async getRecentActivity(userId, limit = 10) {
    try {
      const query = `
        SELECT 
          t.id,
          t.title,
          t.amount,
          t.type,
          t.description,
          t.transaction_date,
          t.created_at,
          c.name as category_name,
          c.type as category_type
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ${parseInt(userId)}
        ORDER BY t.created_at DESC, t.id DESC
        LIMIT ${parseInt(limit)}
      `;
      
      return await db.getMany(query, []);
    } catch (error) {
      console.error('Error in getRecentActivity:', error);
      return [];
    }
  }

  // Get total count of transactions for pagination
  static async getTotalCount(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM transactions t';
      const conditions = [];

      // Filter by user
      if (filters.user_id) {
        conditions.push(`t.user_id = ${parseInt(filters.user_id)}`);
      }

      // Filter by type
      if (filters.type) {
        conditions.push(`t.type = '${filters.type}'`);
      }

      // Filter by date range
      if (filters.start_date) {
        conditions.push(`t.transaction_date >= '${filters.start_date}'`);
      }

      if (filters.end_date) {
        conditions.push(`t.transaction_date <= '${filters.end_date}'`);
      }

      // Add WHERE conditions
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      console.log('getTotalCount query:', query);
      const result = await db.getOne(query, []);
      return result ? result.total : 0;
    } catch (error) {
      console.error('Error in getTotalCount:', error);
      return 0;
    }
  }
}

module.exports = Transaction;