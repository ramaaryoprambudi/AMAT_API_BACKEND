# JWT Configuration Standard API

## Overview
JWT (JSON Web Token) telah dikonfigurasi sesuai dengan standar API yang lebih aman dan profesional.

## Changes Made

### 1. JWT Claims yang Ditambahkan

#### Standard Claims:
- **`iss` (Issuer)**: `https://api.personal-finance.com`
  - Mengidentifikasi server yang mengeluarkan token
  - Berguna untuk validasi dalam multi-domain environment

- **`aud` (Audience)**: `personal-finance-client`
  - Mengidentifikasi target aplikasi yang boleh menggunakan token
  - Mencegah token digunakan di aplikasi lain

- **`sub` (Subject)**: User UID
  - Unique identifier untuk user
  - Lebih aman daripada menggunakan database ID

- **`alg` (Algorithm)**: `HS256`
  - Explicitly specified untuk keamanan
  - Mencegah algorithm confusion attacks

### 2. Environment Configuration

Ditambahkan di `.env`:
```env
JWT_ISSUER=https://api.personal-finance.com
JWT_AUDIENCE=personal-finance-client
```

### 3. Token Generation

#### Register & Login:
```javascript
const token = jwt.sign(
  payload,
  process.env.JWT_SECRET,
  { 
    expiresIn: expiresIn,
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
    subject: user.uid,
    algorithm: 'HS256'
  }
);
```

### 4. Token Verification

#### Middleware Auth:
```javascript
const decoded = jwt.verify(
  token, 
  process.env.JWT_SECRET,
  {
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
    algorithms: ['HS256']
  }
);
```

## JWT Payload Structure

```json
{
  "user": {
    "id": 19,
    "uid": "6c3c880e-571c-4dfa-bd8f-9057507cceb2",
    "email": "testjwt@example.com"
  },
  "iat": 1762080723,
  "exp": 1762685523,
  "aud": "personal-finance-client",
  "iss": "https://api.personal-finance.com",
  "sub": "6c3c880e-571c-4dfa-bd8f-9057507cceb2"
}
```

## Security Benefits

1. **Issuer Validation**: Memastikan token berasal dari server yang benar
2. **Audience Validation**: Memastikan token hanya digunakan untuk aplikasi yang tepat
3. **Algorithm Specification**: Mencegah serangan algorithm confusion
4. **Subject Field**: Menggunakan UUID yang lebih aman daripada database ID
5. **Explicit Validation**: Semua claims divalidasi saat verifikasi token

## Testing Endpoints

### Debug Token (Development Only):
```bash
GET /api/auth/debug-token
Authorization: Bearer <token>
```

### Verify Token:
```bash
GET /api/auth/verify
Authorization: Bearer <token>
```

## Production Considerations

Untuk production, pastikan untuk:
1. Menggunakan HTTPS untuk semua endpoint
2. Mengupdate `JWT_ISSUER` dengan domain production yang sebenarnya
3. Mempertimbangkan menggunakan asymmetric algorithms (RS256) untuk skalabilitas
4. Implementasi token blacklisting untuk logout yang lebih aman
5. Regular key rotation untuk JWT_SECRET

## Compatibility

- ✅ Backward compatible dengan aplikasi Android yang ada
- ✅ Standar JWT yang diakui industri
- ✅ Mudah untuk integration dengan third-party services
- ✅ Mendukung microservices architecture