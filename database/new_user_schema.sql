-- Buat ulang table users dengan struktur baru
-- Drop table yang lama dan foreign key constraints
SET FOREIGN_KEY_CHECKS = 0;

-- Drop foreign key constraints
ALTER TABLE categories DROP FOREIGN KEY IF EXISTS categories_ibfk_1;
ALTER TABLE transactions DROP FOREIGN KEY IF EXISTS transactions_ibfk_1;
ALTER TABLE transactions DROP FOREIGN KEY IF EXISTS transactions_ibfk_2;

-- Drop existing users table
DROP TABLE IF EXISTS users;

-- Buat table users baru sesuai struktur yang diminta
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `uid` varchar(255) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `url_foto` varchar(255) DEFAULT NULL,
  `dibuat_pada` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uid` (`uid`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Update categories table agar sesuai dengan user_id yang baru
ALTER TABLE categories 
ADD CONSTRAINT `categories_ibfk_1` 
FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Update transactions table agar sesuai dengan user_id yang baru  
ALTER TABLE transactions 
ADD CONSTRAINT `transactions_ibfk_1` 
FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT `transactions_ibfk_2` 
FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;