# JSON untuk Testing di Postman

## 1. REGISTER USER BARU

### Request Register
**Method**: `POST`
**URL**: `http://localhost:3000/api/auth/register`
**Headers**:
```
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "nama": "Ahmad Nugraha",
  "email": "ahmad.nugraha@example.com",
  "password": "AhmadPass123!",
  "url_foto": "https://example.com/ahmad-photo.jpg"
}
```

### Alternatif Body Register (tanpa url_foto):
```json
{
  "nama": "Siti Rahayu",
  "email": "siti.rahayu@example.com",
  "password": "SitiPass123!"
}
```

### Expected Response Register (Success - 201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 7,
      "uid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "nama": "Ahmad Nugraha",
      "email": "ahmad.nugraha@example.com",
      "url_foto": "https://example.com/ahmad-photo.jpg",
      "dibuat_pada": "2025-10-26T10:45:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjo3LCJ1aWQiOiJhMWIyYzNkNC1lNWY2LTc4OTAtYWJjZC1lZjEyMzQ1Njc4OTAiLCJlbWFpbCI6ImFobWFkLm51Z3JhaGFAZXhhbXBsZS5jb20ifSwiaWF0IjoxNjk4MzI0MzAwLCJleHAiOjE2OTg5MjkxMDB9.abc123def456ghi789",
    "expires_in": "7d"
  }
}
```

---

## 2. LOGIN USER

### Request Login
**Method**: `POST`
**URL**: `http://localhost:3000/api/auth/login`
**Headers**:
```
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "email": "ahmad.nugraha@example.com",
  "password": "AhmadPass123!"
}
```

### Expected Response Login (Success - 200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 7,
      "uid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "nama": "Ahmad Nugraha",
      "email": "ahmad.nugraha@example.com",
      "url_foto": "https://example.com/ahmad-photo.jpg",
      "dibuat_pada": "2025-10-26T10:45:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjo3LCJ1aWQiOiJhMWIyYzNkNC1lNWY2LTc4OTAtYWJjZC1lZjEyMzQ1Njc4OTAiLCJlbWFpbCI6ImFobWFkLm51Z3JhaGFAZXhhbXBsZS5jb20ifSwiaWF0IjoxNjk4MzI0MzAwLCJleHAiOjE2OTg5MjkxMDB9.abc123def456ghi789",
    "expires_in": "7d"
  }
}
```

---

## 3. GET PROFILE (dengan Token)

### Request Get Profile
**Method**: `GET`
**URL**: `http://localhost:3000/api/auth/profile`
**Headers**:
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjo3LCJ1aWQiOiJhMWIyYzNkNC1lNWY2LTc4OTAtYWJjZC1lZjEyMzQ1Njc4OTAiLCJlbWFpbCI6ImFobWFkLm51Z3JhaGFAZXhhbXBsZS5jb20ifSwiaWF0IjoxNjk4MzI0MzAwLCJleHAiOjE2OTg5MjkxMDB9.abc123def456ghi789
```

**Body**: (kosong)

### Expected Response Get Profile (Success - 200):
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": 7,
    "uid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "nama": "Ahmad Nugraha",
    "email": "ahmad.nugraha@example.com",
    "url_foto": "https://example.com/ahmad-photo.jpg",
    "dibuat_pada": "2025-10-26T10:45:00.000Z"
  }
}
```

---

## 4. CONTOH JSON UNTUK TESTING MULTIPLE USERS

### User 1 - Register
```json
{
  "nama": "Muhammad Rizki",
  "email": "rizki@example.com",
  "password": "RizkiPass123!"
}
```

### User 2 - Register
```json
{
  "nama": "Dewi Sartika",
  "email": "dewi@example.com",
  "password": "DewiPass123!",
  "url_foto": "https://example.com/dewi.jpg"
}
```

### User 3 - Register
```json
{
  "nama": "Budi Santoso",
  "email": "budi@example.com",
  "password": "BudiPass123!"
}
```

---

## 5. ERROR RESPONSES

### Error - Email sudah terdaftar (409):
```json
{
  "success": false,
  "message": "Email already registered"
}
```

### Error - Validation gagal (400):
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
    },
    {
      "type": "field",
      "msg": "Password must be at least 8 characters long",
      "path": "password",
      "location": "body"
    }
  ]
}
```

### Error - Login gagal (401):
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Error - Token tidak valid (401):
```json
{
  "success": false,
  "message": "Invalid token"
}
```

---

## 6. TESTING STEPS di POSTMAN

1. **Test Register**:
   - Copy JSON register di atas
   - Paste ke Body > raw > JSON
   - Send request
   - Simpan token dari response

2. **Test Login**:
   - Copy JSON login di atas
   - Paste ke Body > raw > JSON
   - Send request
   - Bandingkan token dengan yang dari register

3. **Test Get Profile**:
   - Tidak perlu body
   - Tambahkan Authorization header dengan token
   - Send request

4. **Test dengan Email yang Sama**:
   - Coba register dengan email yang sama
   - Harusnya dapat error 409

---

## 7. VALIDATION RULES

### Password harus memenuhi:
- Minimal 8 karakter
- Mengandung huruf besar
- Mengandung huruf kecil  
- Mengandung angka
- Mengandung karakter khusus (@$!%*?&)

### Contoh password valid:
- `TestPass123!`
- `MySecure456@`
- `Strong789#`

### Contoh password tidak valid:
- `12345678` (tidak ada huruf besar/kecil/karakter khusus)
- `password` (tidak ada angka/huruf besar/karakter khusus)
- `Pass123` (kurang dari 8 karakter)