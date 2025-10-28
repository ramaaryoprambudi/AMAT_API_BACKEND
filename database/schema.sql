-- Personal Finance Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS personal_finance;
USE personal_finance;

-- Table for transaction categories
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    type ENUM('income', 'expense') NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table for transactions
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    category_id INT,
    description TEXT,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Insert default categories
INSERT INTO categories (name, type, description) VALUES
('Gaji', 'income', 'Pendapatan dari gaji bulanan'),
('Bonus', 'income', 'Bonus atau tunjangan tambahan'),
('Investasi', 'income', 'Keuntungan dari investasi'),
('Usaha', 'income', 'Pendapatan dari usaha sampingan'),
('Lainnya (Pemasukan)', 'income', 'Pendapatan lain-lain'),

('Makanan', 'expense', 'Pengeluaran untuk makanan dan minuman'),
('Transportasi', 'expense', 'Biaya transportasi'),
('Belanja', 'expense', 'Belanja kebutuhan sehari-hari'),
('Hiburan', 'expense', 'Biaya hiburan dan rekreasi'),
('Tagihan', 'expense', 'Pembayaran tagihan bulanan'),
('Kesehatan', 'expense', 'Biaya kesehatan dan obat-obatan'),
('Pendidikan', 'expense', 'Biaya pendidikan dan kursus'),
('Tabungan', 'expense', 'Uang yang ditabung atau diinvestasikan'),
('Lainnya (Pengeluaran)', 'expense', 'Pengeluaran lain-lain');

-- Create indexes for better performance
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_categories_type ON categories(type);