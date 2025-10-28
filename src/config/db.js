const mysql = require('mysql2');
const dbConfig = require('./database');

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Get connection with promise support
const promisePool = pool.promise();

// Test database connection
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Execute query with error handling
const executeQuery = async (query, params = []) => {
  try {
    const [results] = await promisePool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Get single record
const getOne = async (query, params = []) => {
  try {
    const [results] = await promisePool.execute(query, params);
    return results[0] || null;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Get multiple records
const getMany = async (query, params = []) => {
  try {
    const [results] = await promisePool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Insert record and return inserted ID
const insert = async (query, params = []) => {
  try {
    const [result] = await promisePool.execute(query, params);
    return result.insertId;
  } catch (error) {
    console.error('Database insert error:', error);
    throw error;
  }
};

// Update record and return affected rows
const update = async (query, params = []) => {
  try {
    const [result] = await promisePool.execute(query, params);
    return result.affectedRows;
  } catch (error) {
    console.error('Database update error:', error);
    throw error;
  }
};

// Delete record and return affected rows
const remove = async (query, params = []) => {
  try {
    const [result] = await promisePool.execute(query, params);
    return result.affectedRows;
  } catch (error) {
    console.error('Database delete error:', error);
    throw error;
  }
};

module.exports = {
  pool,
  promisePool,
  testConnection,
  executeQuery,
  getOne,
  getMany,
  insert,
  update,
  remove
};