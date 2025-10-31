-- =============================================
-- Personal Finance API - Security & User Management
-- File: security_setup.sql
-- Date: 2025-10-31
-- Purpose: Database security configuration and user management
-- =============================================

-- 1. CREATE DATABASE USER FOR APPLICATION
-- =============================================
-- Create dedicated user for the application (replace with strong password)
CREATE USER IF NOT EXISTS 'finance_app'@'localhost' IDENTIFIED BY 'StrongPassword123!';
CREATE USER IF NOT EXISTS 'finance_app'@'%' IDENTIFIED BY 'StrongPassword123!';

-- Grant necessary privileges to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON personal_finance.* TO 'finance_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON personal_finance.* TO 'finance_app'@'%';

-- Grant specific privileges for procedures and functions
GRANT EXECUTE ON personal_finance.* TO 'finance_app'@'localhost';
GRANT EXECUTE ON personal_finance.* TO 'finance_app'@'%';

-- 2. CREATE READ-ONLY USER FOR REPORTING
-- =============================================
CREATE USER IF NOT EXISTS 'finance_readonly'@'localhost' IDENTIFIED BY 'ReadOnlyPass123!';
CREATE USER IF NOT EXISTS 'finance_readonly'@'%' IDENTIFIED BY 'ReadOnlyPass123!';

-- Grant read-only access
GRANT SELECT ON personal_finance.* TO 'finance_readonly'@'localhost';
GRANT SELECT ON personal_finance.* TO 'finance_readonly'@'%';

-- 3. CREATE BACKUP USER
-- =============================================
CREATE USER IF NOT EXISTS 'finance_backup'@'localhost' IDENTIFIED BY 'BackupPass123!';

-- Grant backup privileges
GRANT SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER ON personal_finance.* TO 'finance_backup'@'localhost';

-- 4. REMOVE UNNECESSARY PRIVILEGES
-- =============================================
-- Remove file privileges from application user (security)
REVOKE FILE ON *.* FROM 'finance_app'@'localhost';
REVOKE FILE ON *.* FROM 'finance_app'@'%';

-- 5. PASSWORD POLICY ENFORCEMENT
-- =============================================
-- Set password expiration for users (adjust as needed)
ALTER USER 'finance_app'@'localhost' PASSWORD EXPIRE INTERVAL 90 DAY;
ALTER USER 'finance_app'@'%' PASSWORD EXPIRE INTERVAL 90 DAY;
ALTER USER 'finance_readonly'@'localhost' PASSWORD EXPIRE INTERVAL 180 DAY;
ALTER USER 'finance_readonly'@'%' PASSWORD EXPIRE INTERVAL 180 DAY;

-- 6. CONNECTION LIMITS
-- =============================================
-- Limit connections for application user
ALTER USER 'finance_app'@'localhost' WITH MAX_CONNECTIONS_PER_HOUR 1000;
ALTER USER 'finance_app'@'%' WITH MAX_CONNECTIONS_PER_HOUR 1000;

-- Limit connections for readonly user
ALTER USER 'finance_readonly'@'localhost' WITH MAX_CONNECTIONS_PER_HOUR 100;
ALTER USER 'finance_readonly'@'%' WITH MAX_CONNECTIONS_PER_HOUR 100;

-- 7. AUDIT TABLE FOR SECURITY MONITORING
-- =============================================
CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `table_name` varchar(50) NOT NULL,
  `record_id` int DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_table_name` (`table_name`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. LOGIN ATTEMPTS TRACKING
-- =============================================
CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `success` tinyint(1) NOT NULL DEFAULT 0,
  `user_agent` text,
  `attempted_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_ip_address` (`ip_address`),
  KEY `idx_attempted_at` (`attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. SECURITY TRIGGERS
-- =============================================
-- Trigger to log transaction changes
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `transaction_audit_insert` 
AFTER INSERT ON `transactions`
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action, table_name, record_id, new_values)
    VALUES (NEW.user_id, 'INSERT', 'transactions', NEW.id, 
            JSON_OBJECT('title', NEW.title, 'amount', NEW.amount, 'type', NEW.type));
END//

CREATE TRIGGER IF NOT EXISTS `transaction_audit_update` 
AFTER UPDATE ON `transactions`
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (NEW.user_id, 'UPDATE', 'transactions', NEW.id,
            JSON_OBJECT('title', OLD.title, 'amount', OLD.amount, 'type', OLD.type),
            JSON_OBJECT('title', NEW.title, 'amount', NEW.amount, 'type', NEW.type));
END//

CREATE TRIGGER IF NOT EXISTS `transaction_audit_delete` 
AFTER DELETE ON `transactions`
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_values)
    VALUES (OLD.user_id, 'DELETE', 'transactions', OLD.id,
            JSON_OBJECT('title', OLD.title, 'amount', OLD.amount, 'type', OLD.type));
END//
DELIMITER ;

-- 10. SECURITY VIEWS
-- =============================================
-- View for monitoring suspicious activities
CREATE OR REPLACE VIEW `security_alerts` AS
SELECT 
    'Multiple Failed Logins' as alert_type,
    email,
    ip_address,
    COUNT(*) as failed_attempts,
    MAX(attempted_at) as last_attempt
FROM login_attempts 
WHERE success = 0 
    AND attempted_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY email, ip_address
HAVING COUNT(*) >= 5

UNION ALL

SELECT 
    'Large Transaction' as alert_type,
    CONCAT('User ID: ', t.user_id) as email,
    'N/A' as ip_address,
    t.amount as failed_attempts,
    t.created_at as last_attempt
FROM transactions t
WHERE t.amount > 10000 
    AND t.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- View for user activity summary
CREATE OR REPLACE VIEW `user_activity_summary` AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.created_at as registered_at,
    COUNT(t.id) as total_transactions,
    MAX(t.created_at) as last_transaction,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expense
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id
GROUP BY u.id, u.name, u.email, u.created_at;

-- 11. CLEANUP PROCEDURES
-- =============================================
-- Procedure to clean old audit logs
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CleanOldAuditLogs()
BEGIN
    DELETE FROM audit_log WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);
    DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 3 MONTH);
END//
DELIMITER ;

-- 12. SECURITY CHECKS
-- =============================================
-- Check for users without passwords
SELECT user, host FROM mysql.user WHERE authentication_string = '' OR authentication_string IS NULL;

-- Check for users with weak privileges
SELECT user, host, Super_priv, File_priv, Process_priv, Reload_priv, Shutdown_priv, Create_user_priv, Grant_priv
FROM mysql.user 
WHERE user LIKE 'finance_%';

-- Show current user privileges
SHOW GRANTS FOR 'finance_app'@'localhost';
SHOW GRANTS FOR 'finance_readonly'@'localhost';

-- 13. FLUSH PRIVILEGES
-- =============================================
FLUSH PRIVILEGES;

-- 14. SECURITY RECOMMENDATIONS
-- =============================================
/*
SECURITY CHECKLIST FOR PRODUCTION:

1. ✅ Change default passwords for all database users
2. ✅ Use strong passwords (min 12 characters, mixed case, numbers, symbols)
3. ✅ Limit user privileges to minimum required
4. ✅ Enable SSL/TLS for database connections
5. ✅ Regular password rotation (90 days for app users)
6. ✅ Monitor failed login attempts
7. ✅ Set up audit logging for sensitive operations
8. ✅ Regular security updates for MySQL
9. ✅ Firewall rules to restrict database access
10. ✅ Regular backup of security configurations

DATABASE CONFIGURATION RECOMMENDATIONS:
- Enable slow query log
- Set max_connections appropriately
- Configure innodb_buffer_pool_size
- Enable binary logging for point-in-time recovery
- Set up master-slave replication for high availability

MONITORING ALERTS:
- Failed login attempts > 5 per hour per IP
- Transactions > $10,000 
- New user registrations spike
- Database connection failures
- Unusual query patterns
*/

SELECT 'Security setup completed! Review recommendations above.' as status;

-- =============================================
-- END OF SECURITY SETUP
-- =============================================