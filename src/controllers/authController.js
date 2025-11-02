const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { deleteOldProfilePhoto } = require('../middleware/upload');

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { nama, email, password, foto_url, foto_filename } = req.body;

      // Check if email already exists
      const emailExists = await User.emailExists(email);
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Create new user
      const newUser = await User.create({
        nama,
        email,
        password,
        url_foto: foto_url || null,
        foto_filename: foto_filename || null
      });

      // Generate JWT token
      const payload = {
        user: {
          id: newUser.id,
          uid: newUser.uid,
          email: newUser.email
        }
      };

      // Ensure proper expiration time
      const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'a8f5d2e9c7b4x6n1m3k9p2q5w8r7t4y6u3i0o9e8r7t6y5u4i3o2p1a9s8d7f6g5h4j3k2l1',
        { 
          expiresIn: expiresIn,
          issuer: process.env.JWT_ISSUER || 'https://personal-finance-api-114056315885.asia-southeast2.run.app',
          audience: process.env.JWT_AUDIENCE || 'https://personal-finance-api-114056315885.asia-southeast2.run.app',
          subject: newUser.uid,
          algorithm: 'HS256'
        }
      );

      // Debug: Decode token to verify creation
      if (process.env.NODE_ENV === 'development') {
        const decoded = jwt.decode(token);
        console.log('Token created for registration:');
        console.log('  - User ID:', newUser.id);
        console.log('  - Expires In Config:', expiresIn);
        console.log('  - Issued At:', new Date(decoded.iat * 1000));
        console.log('  - Expires At:', new Date(decoded.exp * 1000));
        console.log('  - Time Difference (seconds):', decoded.exp - decoded.iat);
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: newUser,
          token,
          expires_in: expiresIn
        }
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register user',
        error: error.message
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Get user by email (including password for verification)
      const user = await User.getByEmail(email);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const isValidPassword = await User.verifyPassword(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Remove password from user object
      delete user.password;

      // Generate JWT token
      const payload = {
        user: {
          id: user.id,
          uid: user.uid,
          email: user.email
        }
      };

      // Ensure proper expiration time
      const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'a8f5d2e9c7b4x6n1m3k9p2q5w8r7t4y6u3i0o9e8r7t6y5u4i3o2p1a9s8d7f6g5h4j3k2l1',
        { 
          expiresIn: expiresIn,
          issuer: process.env.JWT_ISSUER || 'https://personal-finance-api-114056315885.asia-southeast2.run.app',
          audience: process.env.JWT_AUDIENCE || 'https://personal-finance-api-114056315885.asia-southeast2.run.app',
          subject: user.uid,
          algorithm: 'HS256'
        }
      );

      // Debug: Decode token to verify creation
      if (process.env.NODE_ENV === 'development') {
        const decoded = jwt.decode(token);
        console.log('🔐 Token created for login:');
        console.log('  - User ID:', user.id);
        console.log('  - Expires In Config:', expiresIn);
        console.log('  - Issued At:', new Date(decoded.iat * 1000));
        console.log('  - Expires At:', new Date(decoded.exp * 1000));
        console.log('  - Time Difference (seconds):', decoded.exp - decoded.iat);
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          token,
          expires_in: expiresIn
        }
      });
    } catch (error) {
      console.error('Error logging in user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to login',
        error: error.message
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      
      const userProfile = await User.getById(userId);
      
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data: userProfile
      });
    } catch (error) {
      console.error('Error getting profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
        error: error.message
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { nama, email, foto_url, foto_filename } = req.body;

      // Check if new email already exists (excluding current user)
      if (email && email !== req.user.email) {
        const emailExists = await User.emailExists(email, userId);
        if (emailExists) {
          return res.status(409).json({
            success: false,
            message: 'Email already taken by another user'
          });
        }
      }

      // Get current user data to check for old photo
      const currentUser = await User.getById(userId);
      
      // If new photo uploaded, delete old photo
      if (foto_filename && currentUser.foto_filename && currentUser.foto_filename !== foto_filename) {
        deleteOldProfilePhoto(currentUser.foto_filename);
      }

      // Update user profile
      const updatedUser = await User.update(userId, {
        nama,
        email,
        url_foto: foto_url || currentUser.url_foto,
        foto_filename: foto_filename || currentUser.foto_filename
      });

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { current_password, new_password } = req.body;

      // Get user with password
      const user = await User.getByEmail(req.user.email);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isValidPassword = await User.verifyPassword(current_password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      const success = await User.updatePassword(userId, new_password);
      
      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update password'
        });
      }

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: error.message
      });
    }
  }

  // Logout (client-side token removal, but we can blacklist tokens if needed)
  static async logout(req, res) {
    try {
      // In a simple JWT implementation, logout is handled client-side
      // by removing the token. However, we could implement token blacklisting
      // or store active sessions in database/redis for more security
      
      res.json({
        success: true,
        message: 'Logged out successfully',
        note: 'Please remove the token from client storage'
      });
    } catch (error) {
      console.error('Error logging out:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to logout',
        error: error.message
      });
    }
  }

  // Delete account (soft delete)
  static async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      // Verify password before deletion
      const user = await User.getByEmail(req.user.email);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const isValidPassword = await User.verifyPassword(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Password is incorrect'
        });
      }

      // Soft delete user
      const success = await User.delete(userId);
      
      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Failed to delete account'
        });
      }

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete account',
        error: error.message
      });
    }
  }

  // Verify token (for token validation endpoint)
  static async verifyToken(req, res) {
    try {
      // If we reach here, token is valid (verified by auth middleware)
      const user = await User.getById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Debug token info
      const currentTime = Math.floor(Date.now() / 1000);
      const timeToExpiry = req.user.exp - currentTime;

      res.json({
        success: true,
        message: 'Token is valid',
        data: {
          user,
          token_info: {
            issued_at: new Date(req.user.iat * 1000),
            expires_at: new Date(req.user.exp * 1000),
            current_time: new Date(),
            time_to_expiry_seconds: timeToExpiry,
            time_to_expiry_hours: Math.round(timeToExpiry / 3600 * 100) / 100
          }
        }
      });
    } catch (error) {
      console.error('Error verifying token:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify token',
        error: error.message
      });
    }
  }

  // Debug endpoint to decode token without verification
  static async debugToken(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(400).json({
          success: false,
          message: 'No token provided'
        });
      }

      const token = authHeader.substring(7);
      
      try {
        // Decode without verification to see token content
        const decoded = jwt.decode(token, { complete: true });
        const currentTime = Math.floor(Date.now() / 1000);

        res.json({
          success: true,
          message: 'Token decoded successfully',
          data: {
            header: decoded.header,
            payload: decoded.payload,
            debug_info: {
              issued_at: new Date(decoded.payload.iat * 1000),
              expires_at: new Date(decoded.payload.exp * 1000),
              current_time: new Date(),
              current_timestamp: currentTime,
              is_expired: currentTime > decoded.payload.exp,
              time_difference: decoded.payload.exp - decoded.payload.iat,
              time_to_expiry: decoded.payload.exp - currentTime
            }
          }
        });
      } catch (decodeError) {
        res.status(400).json({
          success: false,
          message: 'Invalid token format',
          error: decodeError.message
        });
      }
    } catch (error) {
      console.error('Error debugging token:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to debug token',
        error: error.message
      });
    }
  }
}

module.exports = AuthController;