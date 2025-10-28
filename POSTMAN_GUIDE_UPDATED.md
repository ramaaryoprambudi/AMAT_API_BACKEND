# API Testing Guide dengan Postman - Updated

## Base Information
- **Base URL**: `http://localhost:3000`
- **Content-Type**: `application/json`

## 1. Authentication Endpoints

### Register User Baru
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/auth/register`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (JSON):
  ```json
  {
    "nama": "John Doe",
    "email": "john@example.com",
    "password": "StrongPass123!",
    "url_foto": "https://example.com/photo.jpg"
  }
  ```
- **Response Success** (201):
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": {
        "id": 1,
        "uid": "7953c734-4862-40ff-a798-a5922d155431",
        "nama": "John Doe",
        "email": "john@example.com",
        "url_foto": "https://example.com/photo.jpg",
        "dibuat_pada": "2025-10-26T10:28:38.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": "7d"
    }
  }
  ```

### Login User
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/auth/login`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (JSON):
  ```json
  {
    "email": "john@example.com",
    "password": "StrongPass123!"
  }
  ```
- **Response Success** (200):
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": 1,
        "uid": "7953c734-4862-40ff-a798-a5922d155431",
        "nama": "John Doe",
        "email": "john@example.com",
        "url_foto": "https://example.com/photo.jpg",
        "dibuat_pada": "2025-10-26T10:28:38.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": "7d"
    }
  }
  ```

### Get Profile (Perlu Token)
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/auth/profile`
- **Headers**: 
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_JWT_TOKEN_HERE
  ```
- **Response Success** (200):
  ```json
  {
    "success": true,
    "message": "Profile retrieved successfully",
    "data": {
      "id": 1,
      "uid": "7953c734-4862-40ff-a798-a5922d155431",
      "nama": "John Doe",
      "email": "john@example.com",
      "url_foto": "https://example.com/photo.jpg",
      "dibuat_pada": "2025-10-26T10:28:38.000Z"
    }
  }
  ```

### Update Profile (Perlu Token)
- **Method**: `PUT`
- **URL**: `http://localhost:3000/api/auth/profile`
- **Headers**: 
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_JWT_TOKEN_HERE
  ```
- **Body** (JSON):
  ```json
  {
    "nama": "John Doe Updated",
    "email": "john.updated@example.com",
    "url_foto": "https://example.com/new-photo.jpg"
  }
  ```

## 2. Categories Endpoints (Perlu Token)

### Get All Categories
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/categories`
- **Headers**: 
  ```
  Authorization: Bearer YOUR_JWT_TOKEN_HERE
  ```

### Create Category
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/categories`
- **Headers**: 
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_JWT_TOKEN_HERE
  ```
- **Body** (JSON):
  ```json
  {
    "name": "Makanan",
    "type": "expense",
    "description": "Pengeluaran untuk makanan"
  }
  ```

## 3. Transactions Endpoints (Perlu Token)

### Get All Transactions
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/transactions`
- **Headers**: 
  ```
  Authorization: Bearer YOUR_JWT_TOKEN_HERE
  ```

### Create Transaction
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/transactions`
- **Headers**: 
  ```
  Content-Type: application/json
  Authorization: Bearer YOUR_JWT_TOKEN_HERE
  ```
- **Body** (JSON):
  ```json
  {
    "title": "Gaji Bulanan",
    "amount": 5000000,
    "type": "income",
    "category_id": 1,
    "description": "Gaji bulan Oktober",
    "transaction_date": "2025-10-26"
  }
  ```

## 4. Testing Flow

### Step 1: Register User Baru
1. Buat request POST ke `/api/auth/register`
2. Gunakan data JSON dengan field: `nama`, `email`, `password`, `url_foto` (optional)
3. Simpan token dari response untuk digunakan di request selanjutnya

### Step 2: Login (Optional jika sudah register)
1. Buat request POST ke `/api/auth/login`
2. Gunakan email dan password yang sudah didaftarkan
3. Simpan token dari response

### Step 3: Test Protected Endpoints
1. Gunakan token yang didapat dari register/login
2. Tambahkan header `Authorization: Bearer YOUR_TOKEN`
3. Test endpoint seperti profile, categories, transactions

## 5. Database Structure

### Table Users
```sql
CREATE TABLE users (
  id int NOT NULL AUTO_INCREMENT,
  uid varchar(255) NOT NULL,
  nama varchar(100) NOT NULL,
  email varchar(100) NOT NULL,
  password varchar(255) NOT NULL,
  url_foto varchar(255) DEFAULT NULL,
  dibuat_pada timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uid (uid),
  UNIQUE KEY email (email)
);
```

## 6. Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "type": "field",
      "msg": "Nama is required",
      "path": "nama",
      "location": "body"
    }
  ]
}
```

### Email Already Exists (409)
```json
{
  "success": false,
  "message": "Email already registered"
}
```

### Invalid Credentials (401)
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Missing Token (401)
```json
{
  "success": false,
  "message": "Access denied. No token provided"
}
```

## 7. Field Validation Rules

### Register:
- **nama**: Required, 2-100 characters
- **email**: Required, valid email format, max 100 characters
- **password**: Required, min 8 characters, must contain uppercase, lowercase, number, and special character
- **url_foto**: Optional, must be valid URL

### Login:
- **email**: Required, valid email format
- **password**: Required

## Notes:
- Semua endpoint kecuali register dan login memerlukan JWT token
- Token berlaku selama 7 hari
- Password di-hash menggunakan bcrypt dengan salt rounds 12
- UID di-generate otomatis menggunakan UUID v4