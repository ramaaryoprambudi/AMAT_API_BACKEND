# Personal Finance API - Postman Testing Guide

## Setup Instructions

### 1. Database Setup
1. Install MySQL and create database:
   ```sql
   CREATE DATABASE personal_finance;
   ```
2. Import schema:
   ```bash
   mysql -u root -p personal_finance < database/schema.sql
   ```
3. Import sample data:
   ```bash
   mysql -u root -p personal_finance < database/sample_data.sql
   ```

### 2. Application Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables in `.env` file
3. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints for Postman Testing

### Base URL
```
http://localhost:3000
```

### 1. Health Check
**GET** `/api/health`
- No parameters required
- Returns API status

### 2. Categories Endpoints

#### Get All Categories
**GET** `/api/categories`
- Optional query parameter: `type` (income/expense)
- Example: `/api/categories?type=income`

#### Get Category by ID
**GET** `/api/categories/:id`
- Example: `/api/categories/1`

#### Create Category
**POST** `/api/categories`
```json
{
  "name": "Freelance",
  "type": "income",
  "description": "Pendapatan dari pekerjaan freelance"
}
```

#### Update Category
**PUT** `/api/categories/:id`
```json
{
  "name": "Freelance Updated",
  "type": "income",
  "description": "Updated description"
}
```

#### Delete Category
**DELETE** `/api/categories/:id`

#### Get Category Statistics
**GET** `/api/categories/stats`

### 3. Transactions Endpoints

#### Get All Transactions
**GET** `/api/transactions`

Query parameters (all optional):
- `type`: income/expense
- `category_id`: filter by category
- `start_date`: YYYY-MM-DD format
- `end_date`: YYYY-MM-DD format
- `month`: 1-12
- `year`: e.g., 2024
- `limit`: number of results
- `offset`: for pagination

Examples:
- `/api/transactions?type=income`
- `/api/transactions?start_date=2024-10-01&end_date=2024-10-31`
- `/api/transactions?month=10&year=2024`

#### Get Transaction by ID
**GET** `/api/transactions/:id`

#### Create Transaction
**POST** `/api/transactions`
```json
{
  "title": "Gaji Bulanan",
  "amount": 5000000,
  "type": "income",
  "category_id": 1,
  "description": "Gaji bulan November 2024",
  "transaction_date": "2024-11-01"
}
```

#### Update Transaction
**PUT** `/api/transactions/:id`
```json
{
  "title": "Gaji Bulanan Updated",
  "amount": 5500000,
  "type": "income",
  "category_id": 1,
  "description": "Updated salary",
  "transaction_date": "2024-11-01"
}
```

#### Delete Transaction
**DELETE** `/api/transactions/:id`

#### Monthly Report
**GET** `/api/transactions/report`

Query parameters:
- `month`: 1-12 (optional, defaults to current month)
- `year`: e.g., 2024 (optional, defaults to current year)

Example: `/api/transactions/report?month=10&year=2024`

#### Daily Transactions
**GET** `/api/transactions/daily/:date`

Example: `/api/transactions/daily/2024-10-15`

#### Transaction Statistics
**GET** `/api/transactions/statistics`

Query parameters (optional):
- `start_date`: YYYY-MM-DD
- `end_date`: YYYY-MM-DD

#### Search Transactions
**GET** `/api/transactions/search`

Query parameters:
- `q`: search term (required, min 2 characters)
- `type`: income/expense (optional)
- `category_id`: filter by category (optional)
- `limit`: number of results (optional, default 50)

Example: `/api/transactions/search?q=gaji&type=income`

## Sample Test Data

### Categories
The database comes with pre-populated categories:

**Income Categories:**
- Gaji (ID: 1)
- Bonus (ID: 2)
- Investasi (ID: 3)
- Usaha (ID: 4)
- Lainnya (ID: 5)

**Expense Categories:**
- Makanan (ID: 6)
- Transportasi (ID: 7)
- Belanja (ID: 8)
- Hiburan (ID: 9)
- Tagihan (ID: 10)
- Kesehatan (ID: 11)
- Pendidikan (ID: 12)
- Tabungan (ID: 13)
- Lainnya (ID: 14)

### Sample Transactions
The database includes sample transactions for October and September 2024 for testing the monthly report feature.

## Testing Scenarios

### 1. Basic CRUD Operations
1. Create a new income category
2. Create a new expense category
3. Create transactions using the created categories
4. Update a transaction
5. Delete a transaction
6. Delete a category (test with and without associated transactions)

### 2. Filtering and Reports
1. Get all income transactions
2. Get all expense transactions
3. Get transactions for specific month/year
4. Get transactions within date range
5. Generate monthly report
6. Get daily transactions for specific date

### 3. Search and Statistics
1. Search transactions by title
2. Search transactions by description
3. Get transaction statistics for date range
4. Get category usage statistics

### 4. Error Handling
1. Try to create transaction with invalid category
2. Try to create transaction with invalid amount
3. Try to delete category that has transactions
4. Try to access non-existent transaction/category
5. Try to create transaction with mismatched category type

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] // validation errors if any
}
```

## Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `409`: Conflict (duplicate, constraint violations)
- `500`: Internal Server Error