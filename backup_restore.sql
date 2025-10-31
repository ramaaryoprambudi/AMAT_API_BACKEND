-- =============================================
-- Personal Finance API - Database Backup Script
-- File: backup_restore.sql
-- Date: 2025-10-31
-- =============================================

-- 1. BACKUP COMMANDS (Run from terminal)
-- =============================================
-- Full database backup:
-- mysqldump -u root -p personal_finance > personal_finance_backup_$(date +%Y%m%d_%H%M%S).sql

-- Backup with compression:
-- mysqldump -u root -p personal_finance | gzip > personal_finance_backup_$(date +%Y%m%d_%H%M%S).sql.gz

-- Backup structure only:
-- mysqldump -u root -p --no-data personal_finance > personal_finance_structure_$(date +%Y%m%d_%H%M%S).sql

-- Backup data only:
-- mysqldump -u root -p --no-create-info personal_finance > personal_finance_data_$(date +%Y%m%d_%H%M%S).sql

-- 2. RESTORE COMMANDS (Run from terminal)
-- =============================================
-- Restore from backup:
-- mysql -u root -p personal_finance < personal_finance_backup_YYYYMMDD_HHMMSS.sql

-- Restore from compressed backup:
-- gunzip < personal_finance_backup_YYYYMMDD_HHMMSS.sql.gz | mysql -u root -p personal_finance

-- 3. DATABASE MAINTENANCE
-- =============================================
-- Check table integrity
CHECK TABLE users, transactions;

-- Repair tables if needed
-- REPAIR TABLE users, transactions;

-- Optimize tables for better performance
OPTIMIZE TABLE users, transactions;

-- Analyze tables for query optimization
ANALYZE TABLE users, transactions;

-- 4. CLEAN UP OLD DATA (USE WITH CAUTION)
-- =============================================
-- Delete transactions older than 2 years (UNCOMMENT TO USE)
-- DELETE FROM transactions 
-- WHERE transaction_date < DATE_SUB(CURDATE(), INTERVAL 2 YEAR);

-- Delete users with no transactions (UNCOMMENT TO USE)
-- DELETE u FROM users u 
-- LEFT JOIN transactions t ON u.id = t.user_id 
-- WHERE t.user_id IS NULL AND u.email != 'admin@example.com';

-- 5. PERFORMANCE MONITORING
-- =============================================
-- Show database size
SELECT 
    TABLE_SCHEMA as 'Database',
    ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as 'Size (MB)'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'personal_finance'
GROUP BY TABLE_SCHEMA;

-- Show table sizes
SELECT 
    TABLE_NAME as 'Table',
    TABLE_ROWS as 'Rows',
    ROUND(DATA_LENGTH / 1024 / 1024, 2) as 'Data Size (MB)',
    ROUND(INDEX_LENGTH / 1024 / 1024, 2) as 'Index Size (MB)',
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as 'Total Size (MB)'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'personal_finance'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;

-- Show slow queries (if slow query log is enabled)
-- SELECT * FROM mysql.slow_log WHERE start_time >= DATE_SUB(NOW(), INTERVAL 1 DAY);

-- 6. INDEX USAGE ANALYSIS
-- =============================================
-- Show index usage statistics
SELECT 
    TABLE_SCHEMA,
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    CARDINALITY,
    SUB_PART,
    NULLABLE
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'personal_finance'
ORDER BY TABLE_NAME, INDEX_NAME;

-- 7. USER ACTIVITY STATISTICS
-- =============================================
-- User registration by month
SELECT 
    YEAR(created_at) as year,
    MONTH(created_at) as month,
    COUNT(*) as new_users
FROM users 
GROUP BY YEAR(created_at), MONTH(created_at)
ORDER BY year DESC, month DESC;

-- Transaction activity by month
SELECT 
    YEAR(transaction_date) as year,
    MONTH(transaction_date) as month,
    type,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount
FROM transactions 
GROUP BY YEAR(transaction_date), MONTH(transaction_date), type
ORDER BY year DESC, month DESC, type;

-- Most active users
SELECT 
    u.name,
    u.email,
    COUNT(t.id) as total_transactions,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expense
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id
GROUP BY u.id, u.name, u.email
ORDER BY total_transactions DESC
LIMIT 10;

-- =============================================
-- END OF BACKUP AND MAINTENANCE SCRIPT
-- =============================================