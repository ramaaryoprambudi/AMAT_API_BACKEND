# Personal Finance API

API Backend untuk Aplikasi Manajemen Keuangan Pribadi

## Fitur
- Input pemasukan/pengeluaran
- Kategori transaksi
- Laporan bulanan
- Filter by date

## Instalasi

1. Clone repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup database MySQL
4. Copy `.env.example` ke `.env` dan sesuaikan konfigurasi
5. Import database schema dari `database/schema.sql`
6. Jalankan aplikasi:
   ```bash
   npm run dev
   ```

## API Endpoints

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/report` - Monthly report

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

## Tech Stack
- Node.js
- Express.js
- MySQL
- express-validator