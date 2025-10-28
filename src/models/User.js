const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  // Get all users
  static async getAll() {
    const query = `
      SELECT id, uid, nama, email, url_foto, dibuat_pada 
      FROM users 
      ORDER BY dibuat_pada DESC
    `;
    return await db.getMany(query);
  }

  // Get user by ID
  static async getById(id) {
    const query = `
      SELECT id, uid, nama, email, url_foto, dibuat_pada 
      FROM users 
      WHERE id = ?
    `;
    return await db.getOne(query, [id]);
  }

  // Get user by UID
  static async getByUid(uid) {
    const query = `
      SELECT id, uid, nama, email, url_foto, dibuat_pada 
      FROM users 
      WHERE uid = ?
    `;
    return await db.getOne(query, [uid]);
  }

  // Get user by email (for login - includes password)
  static async getByEmail(email) {
    const query = `
      SELECT id, uid, nama, email, password, url_foto, dibuat_pada 
      FROM users 
      WHERE email = ?
    `;
    return await db.getOne(query, [email]);
  }

  // Check if email exists
  static async emailExists(email, excludeId = null) {
    let query = `SELECT id FROM users WHERE email = ?`;
    let params = [email];
    
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    
    const result = await db.getOne(query, params);
    return result !== null;
  }

  // Create new user
  static async create(userData) {
    const { nama, email, password, url_foto = null } = userData;
    
    // Generate unique UID
    const uid = uuidv4();
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const query = `
      INSERT INTO users (uid, nama, email, password, url_foto) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const insertId = await db.insert(query, [uid, nama, email, hashedPassword, url_foto]);
    
    // Return user without password
    return await this.getById(insertId);
  }

  // Update user
  static async update(id, userData) {
    const { nama, email, url_foto } = userData;
    
    const query = `
      UPDATE users 
      SET nama = ?, email = ?, url_foto = ?
      WHERE id = ?
    `;
    
    const affectedRows = await db.update(query, [nama, email, url_foto, id]);
    
    if (affectedRows === 0) {
      return null;
    }
    
    return await this.getById(id);
  }

  // Update password
  static async updatePassword(id, newPassword) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    const query = `
      UPDATE users 
      SET password = ?
      WHERE id = ?
    `;
    
    const affectedRows = await db.update(query, [hashedPassword, id]);
    return affectedRows > 0;
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Delete user
  static async delete(id) {
    const query = `DELETE FROM users WHERE id = ?`;
    const affectedRows = await db.update(query, [id]);
    return affectedRows > 0;
  }

  // Search users
  static async search(searchTerm, limit = 50) {
    const query = `
      SELECT id, uid, nama, email, url_foto, dibuat_pada 
      FROM users 
      WHERE (nama LIKE ? OR email LIKE ?)
      ORDER BY nama ASC
      LIMIT ?
    `;
    
    const searchPattern = `%${searchTerm}%`;
    return await db.getMany(query, [searchPattern, searchPattern, limit]);
  }
}

module.exports = User;