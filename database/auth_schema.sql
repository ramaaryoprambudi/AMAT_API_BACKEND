-- Update users table for authentication
USE personal_finance;

-- Drop table if exists to recreate with proper structure
DROP TABLE IF EXISTS users;

-- Create users table with authentication fields
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uid VARCHAR(255) UNIQUE NOT NULL DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    profile_picture VARCHAR(255) DEFAULT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_uid ON users(uid);
CREATE INDEX idx_users_active ON users(is_active);

-- Add user_id to existing tables for multi-user support
-- Add user_id to categories table
ALTER TABLE categories ADD COLUMN user_id INT AFTER id;
ALTER TABLE categories ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add user_id to transactions table
ALTER TABLE transactions ADD COLUMN user_id INT AFTER id;
ALTER TABLE transactions ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes for user relationships
CREATE INDEX idx_categories_user ON categories(user_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);