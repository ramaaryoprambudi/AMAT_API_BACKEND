-- =============================================
-- Personal Finance API - Production Database Setup
-- File: production_database_setup.sql
-- Date: 2025-10-31
-- =============================================

-- 1. CREATE DATABASE
-- =============================================
CREATE DATABASE IF NOT EXISTS personal_finance 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE personal_finance;

-- 2. CREATE USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CREATE TRANSACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `type` enum('income','expense') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `transaction_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_transaction_date` (`transaction_date`),
  KEY `idx_type` (`type`),
  KEY `idx_user_date` (`user_id`,`transaction_date`),
  KEY `idx_user_type` (`user_id`,`type`),
  CONSTRAINT `fk_transactions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. CREATE INDEXES FOR PERFORMANCE
-- =============================================
-- Additional composite indexes for better query performance
CREATE INDEX IF NOT EXISTS `idx_user_date_type` ON `transactions` (`user_id`, `transaction_date`, `type`);
CREATE INDEX IF NOT EXISTS `idx_amount` ON `transactions` (`amount`);
CREATE INDEX IF NOT EXISTS `idx_created_at` ON `transactions` (`created_at`);

-- 5. INSERT DEFAULT ADMIN USER (OPTIONAL)
-- =============================================
-- Default admin user with email: admin@example.com, password: admin123
-- Password hash for 'admin123' using bcrypt (10 rounds)
INSERT IGNORE INTO `users` (`name`, `email`, `password`) VALUES
('System Admin', 'admin@example.com', '$2b$10$rOzJKZXGU5sPzKOyVqTQ7O4qV8qrPzv8iJW8/cGGqjJ4mH4oFKAeO');

-- 6. INSERT SAMPLE DATA (OPTIONAL - REMOVE FOR PRODUCTION)
-- =============================================
-- Sample user for testing (password: testpass123)
INSERT IGNORE INTO `users` (`name`, `email`, `password`) VALUES
('Test User', 'test@example.com', '$2b$10$86Zr78jX.JxH8Q9mGQoJG.qVJyJ5qP5bZ4p5W5L5Z4.4L4T4O4K4G4');

-- Sample transactions for test user
SET @test_user_id = (SELECT id FROM users WHERE email = 'test@example.com');

INSERT IGNORE INTO `transactions` (`user_id`, `title`, `amount`, `type`, `description`, `transaction_date`) VALUES
(@test_user_id, 'Initial Salary', 5000.00, 'income', 'Monthly salary from company', '2025-10-01'),
(@test_user_id, 'Grocery Shopping', 150.75, 'expense', 'Weekly grocery shopping', '2025-10-02'),
(@test_user_id, 'Freelance Work', 800.00, 'income', 'Web development project', '2025-10-05'),
(@test_user_id, 'Gas Bill', 89.50, 'expense', 'Monthly gas utility bill', '2025-10-07'),
(@test_user_id, 'Restaurant', 45.25, 'expense', 'Dinner with friends', '2025-10-10'),
(@test_user_id, 'Investment Return', 200.00, 'income', 'Dividend from stocks', '2025-10-15'),
(@test_user_id, 'Internet Bill', 55.00, 'expense', 'Monthly internet subscription', '2025-10-18'),
(@test_user_id, 'Part-time Job', 300.00, 'income', 'Weekend part-time work', '2025-10-20'),
(@test_user_id, 'Medical Checkup', 120.00, 'expense', 'Annual health checkup', '2025-10-25'),
(@test_user_id, 'Bonus', 1000.00, 'income', 'Performance bonus', '2025-10-30');

-- 7. CREATE VIEWS FOR REPORTING (OPTIONAL)
-- =============================================
-- Monthly summary view
CREATE OR REPLACE VIEW `monthly_summary` AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    YEAR(t.transaction_date) as year,
    MONTH(t.transaction_date) as month,
    t.type,
    COUNT(*) as transaction_count,
    SUM(t.amount) as total_amount
FROM users u
JOIN transactions t ON u.id = t.user_id
GROUP BY u.id, u.name, YEAR(t.transaction_date), MONTH(t.transaction_date), t.type;

-- User balance view
CREATE OR REPLACE VIEW `user_balance` AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email,
    COALESCE(income.total, 0) as total_income,
    COALESCE(expense.total, 0) as total_expense,
    COALESCE(income.total, 0) - COALESCE(expense.total, 0) as balance,
    COALESCE(income.count, 0) as income_transactions,
    COALESCE(expense.count, 0) as expense_transactions
FROM users u
LEFT JOIN (
    SELECT user_id, SUM(amount) as total, COUNT(*) as count
    FROM transactions 
    WHERE type = 'income' 
    GROUP BY user_id
) income ON u.id = income.user_id
LEFT JOIN (
    SELECT user_id, SUM(amount) as total, COUNT(*) as count
    FROM transactions 
    WHERE type = 'expense' 
    GROUP BY user_id
) expense ON u.id = expense.user_id;

-- 8. SHOW TABLE STATUS
-- =============================================
SHOW TABLES;

SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    DATA_LENGTH,
    INDEX_LENGTH,
    CREATE_TIME
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'personal_finance';

-- 9. DISPLAY SAMPLE DATA COUNT
-- =============================================
SELECT 'Users' as table_name, COUNT(*) as total_records FROM users
UNION ALL
SELECT 'Transactions' as table_name, COUNT(*) as total_records FROM transactions;

-- 10. SUCCESS MESSAGE
-- =============================================
SELECT 'Database setup completed successfully!' as status,
       NOW() as setup_time,
       'personal_finance' as database_name;

-- =============================================
-- END OF PRODUCTION DATABASE SETUP
-- =============================================