# Personal Finance API - Production Ready

## Production Deployment Instructions

### 1. Environment Setup
- Copy `.env.production` to `.env` and update with your production values:
  ```bash
  cp .env.production .env
  ```
- Update the following critical values:
  - `DB_PASSWORD`: Your production database password
  - `JWT_SECRET`: Strong secret key for JWT tokens
  - `ALLOWED_ORIGINS`: Your frontend domain
  - `ADMIN_EMAILS`: Production admin emails

### 2. Database Setup
- Create production database:
  ```sql
  CREATE DATABASE personal_finance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```

- Create transactions table:
  ```sql
  USE personal_finance;
  
  CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_type (type)
  );
  
  CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
  );
  ```

### 3. Production Start
```bash
# Install dependencies
npm install --production

# Start in production mode
npm run prod
```

### 4. Features in Production Mode
- ✅ All debugging logs disabled
- ✅ Error stack traces hidden from API responses
- ✅ Request logging disabled
- ✅ Optimized for performance
- ✅ Security headers enabled
- ✅ Rate limiting active
- ✅ XSS protection enabled

### 5. API Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/transactions` - Get user transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/transactions/report/monthly` - Monthly report

### 6. Security Features
- JWT authentication
- Password hashing with bcrypt
- Rate limiting (100 requests per 15 minutes)
- XSS protection
- Parameter pollution protection
- Security headers with Helmet
- Input validation and sanitization

### 7. System Requirements
- Node.js 14+
- MySQL 8.0+
- PM2 (recommended for production)

### 8. Production Monitoring
Consider using:
- PM2 for process management
- nginx as reverse proxy
- SSL certificate for HTTPS
- Database connection pooling
- Log aggregation service

## API Usage Examples

### Authentication
```bash
# Register
curl -X POST http://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"securepassword"}'

# Login
curl -X POST http://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"securepassword"}'
```

### Transactions (with JWT token)
```bash
# Create transaction
curl -X POST http://your-domain.com/api/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Salary","amount":5000,"type":"income","description":"Monthly salary","transaction_date":"2024-10-31"}'

# Get transactions
curl -X GET http://your-domain.com/api/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```