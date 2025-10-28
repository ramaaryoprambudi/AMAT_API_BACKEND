const db = require('../config/db');

class Category {
  // Get all categories for a user
  static async getAllByUser(userId) {
    const query = `
      SELECT id, name, type, description, created_at, updated_at 
      FROM categories 
      WHERE user_id = ?
      ORDER BY type, name
    `;
    return await db.getMany(query, [userId]);
  }

  // Get categories by type for a user
  static async getByTypeAndUser(type, userId) {
    const query = `
      SELECT id, name, type, description, created_at, updated_at 
      FROM categories 
      WHERE type = ? AND user_id = ?
      ORDER BY name
    `;
    return await db.getMany(query, [type, userId]);
  }

  // Get all categories (admin only)
  static async getAll() {
    const query = `
      SELECT id, name, type, description, user_id, created_at, updated_at 
      FROM categories 
      ORDER BY type, name
    `;
    return await db.getMany(query);
  }

  // Get categories by type (admin only)
  static async getByType(type) {
    const query = `
      SELECT id, name, type, description, user_id, created_at, updated_at 
      FROM categories 
      WHERE type = ? 
      ORDER BY name
    `;
    return await db.getMany(query, [type]);
  }

  // Get category by ID
  static async getById(id) {
    const query = `
      SELECT id, name, type, description, created_at, updated_at 
      FROM categories 
      WHERE id = ?
    `;
    return await db.getOne(query, [id]);
  }

  // Create new category
  static async create(categoryData) {
    const { name, type, description = null, user_id } = categoryData;
    const query = `
      INSERT INTO categories (name, type, description, user_id) 
      VALUES (?, ?, ?, ?)
    `;
    const insertId = await db.insert(query, [name, type, description, user_id]);
    return await this.getById(insertId);
  }

  // Update category
  static async update(id, categoryData) {
    const { name, type, description } = categoryData;
    const query = `
      UPDATE categories 
      SET name = ?, type = ?, description = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    const affectedRows = await db.update(query, [name, type, description, id]);
    if (affectedRows === 0) {
      return null;
    }
    return await this.getById(id);
  }

  // Delete category
  static async delete(id) {
    // Check if category is being used by any transaction
    const checkQuery = `
      SELECT COUNT(*) as count 
      FROM transactions 
      WHERE category_id = ?
    `;
    const result = await db.getOne(checkQuery, [id]);
    
    if (result.count > 0) {
      throw new Error('Cannot delete category that is being used by transactions');
    }

    const query = `DELETE FROM categories WHERE id = ?`;
    const affectedRows = await db.remove(query, [id]);
    return affectedRows > 0;
  }

  // Check if category name exists for a user
  static async nameExists(name, userId, excludeId = null) {
    let query = `SELECT id FROM categories WHERE name = ? AND user_id = ?`;
    let params = [name, userId];
    
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    
    const result = await db.getOne(query, params);
    return result !== null;
  }

  // Get category usage statistics for a user
  static async getUsageStatsByUser(userId) {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.type,
        COUNT(t.id) as transaction_count,
        COALESCE(SUM(t.amount), 0) as total_amount
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id AND t.user_id = ?
      WHERE c.user_id = ?
      GROUP BY c.id, c.name, c.type
      ORDER BY c.type, transaction_count DESC
    `;
    return await db.getMany(query, [userId, userId]);
  }

  // Get category usage statistics (admin only)
  static async getUsageStats() {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.type,
        c.user_id,
        COUNT(t.id) as transaction_count,
        COALESCE(SUM(t.amount), 0) as total_amount
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id
      GROUP BY c.id, c.name, c.type, c.user_id
      ORDER BY c.type, transaction_count DESC
    `;
    return await db.getMany(query);
  }
}

module.exports = Category;