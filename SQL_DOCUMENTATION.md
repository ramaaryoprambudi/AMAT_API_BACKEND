# SQL Files Documentation - Production Database Setup

## 📋 Overview
Kumpulan file SQL untuk setup database production yang lengkap dan aman untuk Personal Finance API.

## 📁 File SQL yang Tersedia

### 1. `production_database_setup.sql` 
**🎯 Tujuan:** Setup awal database production
**📝 Isi:**
- Membuat database `personal_finance` 
- Membuat tabel `users` dan `transactions`
- Membuat indexes untuk performa optimal
- Insert data admin default (opsional)
- Insert sample data untuk testing (opsional)
- Membuat views untuk reporting
- Validasi setup database

**🚀 Cara Penggunaan:**
```bash
mysql -u root -p < production_database_setup.sql
```

### 2. `backup_restore.sql`
**🎯 Tujuan:** Script backup, restore, dan maintenance database
**📝 Isi:**
- Perintah backup database (full, structure, data only)
- Perintah restore dari backup
- Maintenance queries (check, repair, optimize)
- Clean up data lama
- Monitoring performa database
- Analisis penggunaan index
- Statistik user activity

**🚀 Cara Penggunaan:**
```bash
# Backup
mysqldump -u root -p personal_finance > backup_$(date +%Y%m%d).sql

# Restore  
mysql -u root -p personal_finance < backup_YYYYMMDD.sql

# Maintenance
mysql -u root -p personal_finance < backup_restore.sql
```

### 3. `database_migration.sql`
**🎯 Tujuan:** Handle perubahan schema dan migrasi data
**📝 Isi:**
- Tabel tracking migrasi
- Sistem versioning database
- Prosedur migrasi data yang aman
- Rollback procedures
- Validasi data integrity
- View status migrasi

**🚀 Cara Penggunaan:**
```bash
mysql -u root -p personal_finance < database_migration.sql
```

### 4. `security_setup.sql`
**🎯 Tujuan:** Konfigurasi keamanan database
**📝 Isi:**
- Membuat user database terpisah untuk aplikasi
- User read-only untuk reporting
- User backup dengan privileges minimal
- Password policy dan connection limits
- Audit logging untuk monitoring
- Security triggers
- Views untuk security alerts
- Cleanup procedures
- Security checklist

**🚀 Cara Penggunaan:**
```bash
mysql -u root -p < security_setup.sql
```

## 🔄 Urutan Eksekusi untuk Production

### Setup Awal (Fresh Installation):
```bash
# 1. Setup database dan struktur
mysql -u root -p < production_database_setup.sql

# 2. Konfigurasi keamanan
mysql -u root -p < security_setup.sql

# 3. Setup migrasi tracking
mysql -u root -p personal_finance < database_migration.sql
```

### Maintenance Rutin:
```bash
# Backup berkala
mysqldump -u root -p personal_finance | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Maintenance bulanan
mysql -u root -p personal_finance < backup_restore.sql
```

## ⚙️ Konfigurasi Environment

### Update `.env` untuk Production:
```env
DB_HOST=localhost
DB_USER=finance_app
DB_PASSWORD=StrongPassword123!
DB_NAME=personal_finance
DB_PORT=3306
```

### Update Connection di `src/config/db.js`:
```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  // Production settings
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  ssl: false // Set to true if using SSL
});
```

## 🔒 Security Features

### Database Users:
- `finance_app` - User untuk aplikasi (SELECT, INSERT, UPDATE, DELETE)
- `finance_readonly` - User untuk reporting (SELECT only)
- `finance_backup` - User untuk backup (SELECT, LOCK TABLES)

### Audit Logging:
- `audit_log` - Track semua perubahan data transactions
- `login_attempts` - Track attempt login untuk security monitoring

### Security Monitoring:
- View `security_alerts` - Monitor aktivitas mencurigakan
- View `user_activity_summary` - Summary aktivitas user

## 📊 Database Schema

### Tabel Utama:
```sql
users:
- id (PK)
- name
- email (UNIQUE)
- password (hashed)
- created_at, updated_at

transactions:
- id (PK) 
- user_id (FK)
- title
- amount
- type (income/expense)
- description
- transaction_date
- created_at, updated_at
```

### Indexes untuk Performa:
- `idx_user_id` - Query by user
- `idx_transaction_date` - Query by date  
- `idx_type` - Query by type
- `idx_user_date_type` - Composite index untuk reporting

## 🔧 Maintenance Schedule

### Harian:
- Monitor security alerts
- Check disk space

### Mingguan:  
- Review audit logs
- Backup database

### Bulanan:
- Optimize tables
- Clean old audit data
- Review user activity
- Update statistics

### Tahunan:
- Rotate passwords
- Review security configuration
- Archive old data

## ⚠️ Important Notes

1. **Backup Before Migration**: Selalu backup sebelum menjalankan migrasi
2. **Test First**: Test semua script di development environment dulu
3. **Strong Passwords**: Ganti semua password default dengan password yang kuat
4. **Monitor Logs**: Setup monitoring untuk database logs
5. **SSL Connection**: Aktifkan SSL untuk koneksi database di production
6. **Firewall**: Konfigurasi firewall untuk membatasi akses database
7. **Regular Updates**: Update MySQL secara berkala untuk security patches

## 🆘 Troubleshooting

### Connection Issues:
```sql
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Connections';
```

### Performance Issues:
```sql
SHOW STATUS LIKE 'Slow_queries';
EXPLAIN SELECT * FROM transactions WHERE user_id = 1;
```

### Security Issues:
```sql
SELECT * FROM security_alerts;
SELECT * FROM login_attempts WHERE attempted_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR);
```

---
**📝 File ini dibuat otomatis untuk dokumentasi setup database production Personal Finance API.**