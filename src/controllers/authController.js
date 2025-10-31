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

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: newUser,
          token,
          expires_in: process.env.JWT_EXPIRES_IN || '7d'
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

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user,
          token,
          expires_in: process.env.JWT_EXPIRES_IN || '7d'
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

      res.json({
        success: true,
        message: 'Token is valid',
        data: {
          user,
          token_expires: new Date(req.user.exp * 1000)
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
}

module.exports = AuthController;