# JSON Testing Guide untuk File Upload

## ⚠️ PENTING: Untuk File Upload Gunakan FORM-DATA, bukan JSON!

Karena sekarang menggunakan file upload, Anda tidak bisa menggunakan raw JSON untuk register dan update profile yang menggunakan foto. Berikut panduannya:

## 1. REGISTER DENGAN FILE UPLOAD

### Di Postman:
1. **Method**: `POST`
2. **URL**: `http://localhost:3000/api/auth/register`
3. **Headers**: JANGAN set Content-Type (biarkan Postman set otomatis)
4. **Body**: Pilih `form-data` (bukan raw/JSON)

### Form-data Fields:
```
Key: nama          | Type: Text | Value: Ahmad Nugraha
Key: email         | Type: Text | Value: ahmad.nugraha@example.com  
Key: password      | Type: Text | Value: AhmadPass123!
Key: foto_profile  | Type: File | Value: [pilih file .jpg atau .png]
```

### Expected Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "uid": "generated-uuid-here",
      "nama": "Ahmad Nugraha",
      "email": "ahmad.nugraha@example.com",
      "url_foto": "http://localhost:3000/uploads/profile-photos/profile-1730102400-123456.jpg",
      "foto_filename": "profile-1730102400-123456.jpg",
      "dibuat_pada": "2025-10-28T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": "7d"
  }
}
```

## 2. REGISTER TANPA FOTO

### Form-data Fields:
```
Key: nama          | Type: Text | Value: Siti Rahayu
Key: email         | Type: Text | Value: siti.rahayu@example.com
Key: password      | Type: Text | Value: SitiPass123!
```
(Tidak perlu field foto_profile)

## 3. LOGIN (Masih Menggunakan JSON)

### Di Postman:
1. **Method**: `POST`
2. **URL**: `http://localhost:3000/api/auth/login`
3. **Headers**: `Content-Type: application/json`
4. **Body**: Pilih `raw` > `JSON`

### JSON Body:
```json
{
  "email": "ahmad.nugraha@example.com",
  "password": "AhmadPass123!"
}
```

### Expected Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "uid": "generated-uuid-here",
      "nama": "Ahmad Nugraha",
      "email": "ahmad.nugraha@example.com",
      "url_foto": "http://localhost:3000/uploads/profile-photos/profile-1730102400-123456.jpg",
      "foto_filename": "profile-1730102400-123456.jpg",
      "dibuat_pada": "2025-10-28T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": "7d"
  }
}
```

## 4. GET PROFILE (Menggunakan Token)

### Di Postman:
1. **Method**: `GET`
2. **URL**: `http://localhost:3000/api/auth/profile`
3. **Headers**: `Authorization: Bearer YOUR_TOKEN_HERE`
4. **Body**: Kosong

### Expected Response:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "uid": "generated-uuid-here",
    "nama": "Ahmad Nugraha",
    "email": "ahmad.nugraha@example.com",
    "url_foto": "http://localhost:3000/uploads/profile-photos/profile-1730102400-123456.jpg",
    "foto_filename": "profile-1730102400-123456.jpg",
    "dibuat_pada": "2025-10-28T10:00:00.000Z"
  }
}
```

## 5. UPDATE PROFILE DENGAN FOTO BARU

### Di Postman:
1. **Method**: `PUT`
2. **URL**: `http://localhost:3000/api/auth/profile`
3. **Headers**: `Authorization: Bearer YOUR_TOKEN_HERE`
4. **Body**: Pilih `form-data`

### Form-data Fields:
```
Key: nama          | Type: Text | Value: Ahmad Nugraha Updated
Key: email         | Type: Text | Value: ahmad.updated@example.com
Key: foto_profile  | Type: File | Value: [pilih file .jpg atau .png baru]
```

## 6. UPDATE PROFILE TANPA MENGUBAH FOTO

### Form-data Fields:
```
Key: nama          | Type: Text | Value: Ahmad Nugraha Updated
Key: email         | Type: Text | Value: ahmad.updated@example.com
```
(Tidak perlu field foto_profile, foto lama akan tetap ada)

## 7. ERROR TESTING

### 7.1 File Type Tidak Didukung
Upload file .gif atau .pdf:
```json
{
  "success": false,
  "message": "Hanya file JPG dan PNG yang diizinkan",
  "error_code": "INVALID_FILE_TYPE"
}
```

### 7.2 File Terlalu Besar (>5MB)
```json
{
  "success": false,
  "message": "File terlalu besar. Maksimal 5MB",
  "error_code": "FILE_TOO_LARGE"
}
```

### 7.3 Field Name Salah
Gunakan field name selain "foto_profile":
```json
{
  "success": false,
  "message": "Field file tidak sesuai. Gunakan \"foto_profile\"",
  "error_code": "INVALID_FIELD_NAME"
}
```

### 7.4 Validation Error (Nama kosong)
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

### 7.5 Email Sudah Terdaftar
```json
{
  "success": false,
  "message": "Email already registered"
}
```

### 7.6 Login Gagal
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

## 8. TESTING MULTIPLE USERS

### User 1 - Register dengan Foto
```
nama: Budi Santoso
email: budi@example.com
password: BudiPass123!
foto_profile: [file gambar .jpg]
```

### User 2 - Register tanpa Foto
```
nama: Dewi Sartika
email: dewi@example.com
password: DewiPass123!
```

### User 3 - Register dengan PNG
```
nama: Andi Wijaya
email: andi@example.com
password: AndiPass123!
foto_profile: [file gambar .png]
```

## 9. STEP-BY-STEP TESTING

### Step 1: Test Register dengan Foto
1. POST `/api/auth/register`
2. Form-data dengan foto
3. Simpan token dari response
4. Cek apakah url_foto dan foto_filename ada

### Step 2: Test Login
1. POST `/api/auth/login`
2. JSON dengan email/password
3. Bandingkan token dengan yang dari register

### Step 3: Test Get Profile
1. GET `/api/auth/profile`
2. Header Authorization dengan token
3. Cek data profile lengkap

### Step 4: Test Update Profile
1. PUT `/api/auth/profile`
2. Form-data dengan foto baru
3. Cek apakah foto lama terganti

### Step 5: Test Error Cases
1. Upload file .gif (harusnya error)
2. Upload file >5MB (harusnya error)
3. Field name salah (harusnya error)

## 10. AKSES FILE FOTO

Setelah upload, foto bisa diakses langsung via browser:
```
http://localhost:3000/uploads/profile-photos/profile-1730102400-123456.jpg
```

## CATATAN PENTING:

1. ✅ **Form-data untuk register/update profile**
2. ✅ **JSON untuk login/get profile**
3. ✅ **Field name: `foto_profile`**
4. ✅ **Hanya JPG dan PNG**
5. ✅ **Maksimal 5MB**
6. ✅ **Token disimpan untuk request berikutnya**