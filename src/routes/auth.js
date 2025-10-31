const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken, rateLimiter } = require('../middleware/auth');
const { authValidation } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadProfilePhoto, optionalUploadProfilePhoto } = require('../middleware/upload');

// Rate limiting for auth endpoints - Relaxed for development/testing
const authRateLimit = rateLimiter(1000, 15 * 60 * 1000); // 1000 requests per 15 minutes

// Public routes (no authentication required)

// POST /api/auth/register - Register new user
router.post('/register',
  // authRateLimit, // Disabled for development testing
  optionalUploadProfilePhoto,
  authValidation.register,
  asyncHandler(AuthController.register)
);

// POST /api/auth/login - Login user
router.post('/login',
  // authRateLimit, // Disabled for development testing
  authValidation.login,
  asyncHandler(AuthController.login)
);

// Protected routes (authentication required)

// GET /api/auth/profile - Get current user profile
router.get('/profile',
  authenticateToken,
  asyncHandler(AuthController.getProfile)
);

// PUT /api/auth/profile - Update user profile
router.put('/profile',
  authenticateToken,
  optionalUploadProfilePhoto,
  authValidation.updateProfile,
  asyncHandler(AuthController.updateProfile)
);

// PUT /api/auth/change-password - Change password
router.put('/change-password',
  authenticateToken,
  authValidation.changePassword,
  asyncHandler(AuthController.changePassword)
);

// POST /api/auth/logout - Logout user
router.post('/logout',
  authenticateToken,
  asyncHandler(AuthController.logout)
);

// DELETE /api/auth/account - Delete user account
router.delete('/account',
  authenticateToken,
  authValidation.deleteAccount,
  asyncHandler(AuthController.deleteAccount)
);

// GET /api/auth/verify - Verify token validity
router.get('/verify',
  authenticateToken,
  asyncHandler(AuthController.verifyToken)
);

module.exports = router;