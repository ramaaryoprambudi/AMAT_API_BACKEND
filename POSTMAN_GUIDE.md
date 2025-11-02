# Postman Collection - Personal Finance API

## Files Included

1. **Personal-Finance-API.postman_collection.json** - Main collection file
2. **Personal-Finance-API-Dev.postman_environment.json** - Development environment
3. **Personal-Finance-API-Prod.postman_environment.json** - Production environment

## How to Import

### 1. Import Collection
1. Open Postman
2. Click **Import** button
3. Select `Personal-Finance-API.postman_collection.json`
4. Click **Import**

### 2. Import Environments
1. In Postman, click **Import** again
2. Select both environment files:
   - `Personal-Finance-API-Dev.postman_environment.json`
   - `Personal-Finance-API-Prod.postman_environment.json`
3. Click **Import**

### 3. Select Environment
1. In the top-right corner, select environment:
   - **Personal Finance API - Development** (for local testing)
   - **Personal Finance API - Production** (for production API)

## Collection Structure

### 📁 Authentication
- **Register User** - Create new account
- **Login User** - Get JWT token
- **Get Profile** - Get user info
- **Update Profile** - Update user info
- **Change Password** - Change user password
- **Verify Token** - Check token validity
- **Debug Token** - Debug token info (dev only)
- **Logout** - Logout user
- **Delete Account** - Delete user account

### 📁 Transactions
- **Get All Transactions** - List all transactions
- **Get Transaction by ID** - Get specific transaction
- **Create Transaction** - Add new transaction
- **Update Transaction** - Update existing transaction
- **Delete Transaction** - Remove transaction
- **Get Transaction Summary** - Get income/expense summary

### 📁 Utility
- **Health Check** - API health status
- **API Documentation** - Get API docs
- **Root Endpoint** - Basic API info

## Auto-Authentication

The collection includes automatic token management:

1. **Register** or **Login** requests automatically save the JWT token
2. All protected endpoints use the saved token automatically
3. No need to manually copy/paste tokens

## Environment Variables

### Development Environment
- `base_url`: `http://localhost:8080`
- `auth_token`: (auto-managed)
- `user_email`: `test@example.com`
- `user_password`: `TestPassword123!`

### Production Environment  
- `base_url`: `https://personal-finance-api-114056315885.asia-southeast2.run.app`
- `auth_token`: (auto-managed)
- `user_email`: (set your own)
- `user_password`: (set your own)

## Quick Start Guide

### 1. First Time Setup
1. Select **Development** environment
2. Run **Register User** to create account
3. Token is automatically saved

### 2. Regular Usage
1. Run **Login User** if token expired
2. Use any protected endpoints
3. Token is automatically included

### 3. Testing Workflow
```
1. Register User → Get token
2. Get Profile → Verify authentication
3. Create Transaction → Test transaction API
4. Get All Transactions → Verify creation
5. Update Transaction → Test update
6. Delete Transaction → Test deletion
```

## Example Request Bodies

### Register User
```json
{
  "nama": "John Doe",
  "email": "john.doe@example.com", 
  "password": "SecurePassword123!"
}
```

### Login User
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

### Create Transaction
```json
{
  "jumlah": 500000,
  "tipe": "income",
  "kategori": "salary", 
  "deskripsi": "Monthly salary payment",
  "tanggal": "2025-11-02"
}
```

### Update Profile
```json
{
  "nama": "John Doe Updated",
  "email": "john.updated@example.com"
}
```

## Response Examples

### Successful Authentication
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "uid": "550e8400-e29b-41d4-a716-446655440000",
      "nama": "John Doe",
      "email": "john.doe@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": "7d"
  }
}
```

### Transaction List
```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": {
    "transactions": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

## Error Handling

Common error responses:

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

### 400 Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Testing Tips

1. **Use Environment Variables**: Modify environment variables for different test scenarios
2. **Test Scripts**: Collection includes automatic token management
3. **Error Testing**: Try invalid tokens, missing fields, etc.
4. **Pagination**: Use query parameters for large datasets
5. **Filters**: Test transaction filtering by type, category, date

## Customization

### Add Custom Endpoints
1. Right-click collection → Add Request
2. Set method, URL, headers, body
3. Use `{{base_url}}` and `{{auth_token}}` variables

### Modify Environments
1. Go to Environments tab
2. Edit variables as needed
3. Save changes

### Add Test Scripts
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has token", function () {
    const response = pm.response.json();
    pm.expect(response.data.token).to.exist;
});
```

## Troubleshooting

### Token Issues
- Run **Debug Token** to check token status
- Re-login if token expired
- Check environment variable `auth_token`

### Connection Issues
- Verify `base_url` in environment
- Check if local server is running (dev environment)
- Verify production URL accessibility

### Validation Errors
- Check request body format
- Ensure required fields are present
- Verify data types match API expectations