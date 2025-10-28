# Personal Finance API - Authentication Guide

## 🔐 Authentication Endpoints

Base URL: `http://localhost:3000`

### 1. Register New User
**POST** `/api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com", 
  "password": "SecurePass123!",
  "phone": "+6281234567890",
  "profile_picture": "https://example.com/profile.jpg"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "uid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+6281234567890",
      "profile_picture": "https://example.com/profile.jpg",
      "email_verified": false,
      "is_active": true,
      "created_at": "2024-10-26T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": "7d"
  }
}
```

### 2. Login User
**POST** `/api/auth/login`

**Headers:**
```
Content-Type: application/json  
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "uid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+6281234567890",
      "profile_picture": "https://example.com/profile.jpg",
      "email_verified": false,
      "is_active": true,
      "last_login": "2024-10-26T10:35:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": "7d"  
  }
}
```

### 3. Get Profile (Protected)
**GET** `/api/auth/profile`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully", 
  "data": {
    "id": 1,
    "uid": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+6281234567890",
    "profile_picture": "https://example.com/profile.jpg",
    "email_verified": false,
    "is_active": true,
    "last_login": "2024-10-26T10:35:00.000Z",
    "statistics": {
      "total_transactions": 15,
      "total_income_transactions": 8,
      "total_expense_transactions": 7,
      "total_income": 25000000,
      "total_expense": 12500000,
      "balance": 12500000,
      "total_categories": 12
    }
  }
}
```

### 4. Update Profile (Protected)
**PUT** `/api/auth/profile`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com",
  "phone": "+6281234567891",
  "profile_picture": "https://example.com/new-profile.jpg"
}
```

### 5. Change Password (Protected)
**PUT** `/api/auth/change-password`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "current_password": "SecurePass123!",
  "new_password": "NewSecurePass456!",
  "confirm_password": "NewSecurePass456!"
}
```

### 6. Logout (Protected)
**POST** `/api/auth/logout`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 7. Verify Token (Protected)
**GET** `/api/auth/verify`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 8. Delete Account (Protected)
**DELETE** `/api/auth/account`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**
```json
{
  "password": "SecurePass123!"
}
```

## 🔒 Protected Endpoints

All the following endpoints now require authentication:

### Categories (All Protected)
- `GET /api/categories` - Get user's categories
- `POST /api/categories` - Create category for user
- `PUT /api/categories/:id` - Update user's category
- `DELETE /api/categories/:id` - Delete user's category
- `GET /api/categories/:id` - Get user's category by ID
- `GET /api/categories/stats` - Get user's category statistics

### Transactions (All Protected)  
- `GET /api/transactions` - Get user's transactions
- `POST /api/transactions` - Create transaction for user
- `PUT /api/transactions/:id` - Update user's transaction
- `DELETE /api/transactions/:id` - Delete user's transaction
- `GET /api/transactions/:id` - Get user's transaction by ID
- `GET /api/transactions/report` - Get user's monthly report
- `GET /api/transactions/search` - Search user's transactions
- `GET /api/transactions/statistics` - Get user's transaction statistics
- `GET /api/transactions/daily/:date` - Get user's daily transactions

**All protected endpoints require:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📝 Testing Scenarios for Postman

### Scenario 1: Complete Registration & Login Flow
1. **Register** a new user with valid data
2. **Login** with the registered credentials  
3. Copy the `token` from login response
4. **Get Profile** using the token
5. **Update Profile** with new information
6. **Change Password** 
7. **Logout**

### Scenario 2: Protected Routes Testing
1. **Login** and get token
2. **Create Category** (income type)
3. **Create Category** (expense type)  
4. **Get All Categories** 
5. **Create Transaction** using category ID
6. **Get All Transactions**
7. **Get Monthly Report**
8. **Search Transactions**

### Scenario 3: Error Handling
1. Try to access protected routes without token (should get 401)
2. Try to access protected routes with invalid token (should get 401)
3. Try to register with existing email (should get 409)
4. Try to login with wrong password (should get 401)
5. Try to access another user's transaction/category (should get 403)

### Scenario 4: Validation Testing
1. Register with invalid email format
2. Register with weak password
3. Login with empty fields
4. Create transaction with invalid data
5. Update profile with invalid phone number

## 🔐 Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter (A-Z) 
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (@$!%*?&)

## 🚨 Important Notes

1. **Token Storage**: Store the JWT token securely on client-side
2. **Token Expiry**: Tokens expire in 7 days by default
3. **Multi-User**: Each user can only access their own data
4. **Rate Limiting**: Auth endpoints have rate limiting (10 requests per 15 minutes)
5. **Data Isolation**: Users cannot see other users' transactions/categories

## ⚡ Quick Test Commands

### Register User:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com", 
    "password": "TestPass123!"
  }'
```

### Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### Access Protected Route:
```bash  
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🎯 API Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Invalid/missing token |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate data (email exists) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |