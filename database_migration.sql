-- =============================================
-- Personal Finance API - Database Migration Script
-- File: database_migration.sql
-- Date: 2025-10-31
-- Purpose: Handle database schema changes and data migration
-- =============================================

-- 1. MIGRATION TRACKING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `version` varchar(50) NOT NULL,
  `description` varchar(255) NOT NULL,
  `executed_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `success` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `version_UNIQUE` (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. MIGRATION v1.0.0 - Initial Database Setup
-- =============================================
INSERT IGNORE INTO migrations (version, description) VALUES 
('1.0.0', 'Initial database setup with users and transactions tables');

-- 3. MIGRATION v1.1.0 - Add Indexes for Performance (EXAMPLE)
-- =============================================
-- Check if migration already applied
SET @migration_exists = (SELECT COUNT(*) FROM migrations WHERE version = '1.1.0');

-- Apply migration if not exists
SET @sql = IF(@migration_exists = 0, 
    'CREATE INDEX IF NOT EXISTS idx_user_date_type ON transactions (user_id, transaction_date, type);
     CREATE INDEX IF NOT EXISTS idx_amount ON transactions (amount);
     INSERT INTO migrations (version, description) VALUES ("1.1.0", "Added performance indexes");',
    'SELECT "Migration 1.1.0 already applied" as status;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. SAFE COLUMN ADDITION (EXAMPLE)
-- =============================================
-- Add a new column safely (example: adding currency field)
SET @column_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'personal_finance' 
    AND TABLE_NAME = 'transactions' 
    AND COLUMN_NAME = 'currency'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE transactions ADD COLUMN currency VARCHAR(3) DEFAULT "USD" AFTER amount;
     UPDATE transactions SET currency = "USD" WHERE currency IS NULL;
     INSERT IGNORE INTO migrations (version, description) VALUES ("1.2.0", "Added currency column");',
    'SELECT "Currency column already exists" as status;'
);

-- PREPARE stmt FROM @sql;
-- EXECUTE stmt;
-- DEALLOCATE PREPARE stmt;

-- 5. DATA MIGRATION HELPERS
-- =============================================
-- Function to safely migrate data
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS MigrateTransactionData()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE user_id_val INT;
    DECLARE cur CURSOR FOR SELECT DISTINCT user_id FROM transactions;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Start transaction for data integrity
    START TRANSACTION;
    
    OPEN cur;
    read_loop: LOOP
        FETCH cur INTO user_id_val;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Example migration logic here
        -- UPDATE transactions SET some_field = new_value WHERE user_id = user_id_val;
        
    END LOOP;
    CLOSE cur;
    
    -- Commit if all successful
    COMMIT;
END//
DELIMITER ;

-- 6. ROLLBACK PROCEDURES
-- =============================================
-- Procedure to rollback specific migration
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS RollbackMigration(IN migration_version VARCHAR(50))
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Add rollback logic based on version
    CASE migration_version
        WHEN '1.2.0' THEN
            -- Remove currency column
            ALTER TABLE transactions DROP COLUMN IF EXISTS currency;
            DELETE FROM migrations WHERE version = '1.2.0';
        WHEN '1.1.0' THEN
            -- Remove added indexes
            DROP INDEX IF EXISTS idx_user_date_type ON transactions;
            DROP INDEX IF EXISTS idx_amount ON transactions;
            DELETE FROM migrations WHERE version = '1.1.0';
        ELSE
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Unknown migration version';
    END CASE;
    
    COMMIT;
END//
DELIMITER ;

-- 7. MIGRATION STATUS CHECK
-- =============================================
-- View to check migration status
CREATE OR REPLACE VIEW migration_status AS
SELECT 
    version,
    description,
    executed_at,
    CASE WHEN success = 1 THEN 'SUCCESS' ELSE 'FAILED' END as status
FROM migrations
ORDER BY executed_at DESC;

-- Show current migration status
SELECT * FROM migration_status;

-- 8. DATABASE VERSION INFO
-- =============================================
-- Create a view for database version information
CREATE OR REPLACE VIEW database_info AS
SELECT 
    'personal_finance' as database_name,
    VERSION() as mysql_version,
    (SELECT version FROM migrations ORDER BY executed_at DESC LIMIT 1) as current_migration,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM transactions) as total_transactions,
    NOW() as checked_at;

-- Show database information
SELECT * FROM database_info;

-- 9. CLEAN MIGRATION HISTORY (USE WITH CAUTION)
-- =============================================
-- Remove old migration records (uncomment to use)
-- DELETE FROM migrations WHERE executed_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);

-- 10. VALIDATION QUERIES
-- =============================================
-- Validate data integrity after migration
SELECT 
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM transactions) as transactions_count,
    (SELECT COUNT(*) FROM transactions WHERE user_id NOT IN (SELECT id FROM users)) as orphaned_transactions,
    (SELECT COUNT(*) FROM transactions WHERE amount <= 0) as invalid_amounts,
    (SELECT COUNT(*) FROM transactions WHERE type NOT IN ('income', 'expense')) as invalid_types;

-- Check for duplicate users
SELECT email, COUNT(*) as count
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Check for invalid dates
SELECT COUNT(*) as invalid_dates
FROM transactions 
WHERE transaction_date > CURDATE() OR transaction_date < '1900-01-01';

-- =============================================
-- MIGRATION EXECUTION NOTES:
-- 1. Always backup database before running migrations
-- 2. Test migrations on development environment first  
-- 3. Run migrations during low traffic periods
-- 4. Monitor application logs after migration
-- 5. Have rollback plan ready
-- =============================================