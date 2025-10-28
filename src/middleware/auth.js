const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback_secret_key_change_in_production'
    );

    // Check if user still exists and is active
    const user = await User.getById(decoded.user.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    // Add user info to request object
    req.user = {
      id: decoded.user.id,
      uid: decoded.user.uid,
      email: decoded.user.email,
      exp: decoded.exp
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Token verification failed',
      error: error.message
    });
  }
};

// Optional authentication middleware (for routes that work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without user info
      req.user = null;
      return next();
    }

    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback_secret_key_change_in_production'
    );

    // Check if user exists and is active
    const user = await User.getById(decoded.user.id);
    
    if (user) {
      req.user = {
        id: decoded.user.id,
        uid: decoded.user.uid,
        email: decoded.user.email,
        exp: decoded.exp
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // If token is invalid, continue without user info
    req.user = null;
    next();
  }
};

// Middleware to check if user owns the resource
const checkResourceOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const resourceId = req.params.id;

      let query;
      switch (resourceType) {
        case 'transaction':
          query = 'SELECT user_id FROM transactions WHERE id = ?';
          break;
        case 'category':
          query = 'SELECT user_id FROM categories WHERE id = ?';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid resource type'
          });
      }

      const db = require('../config/db');
      const resource = await db.getOne(query, [resourceId]);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found`
        });
      }

      if (resource.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - you can only access your own resources'
        });
      }

      next();
    } catch (error) {
      console.error('Resource ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify resource ownership',
        error: error.message
      });
    }
  };
};

// Middleware to check if user is admin (for future admin features)
const requireAdmin = async (req, res, next) => {
  try {
    // For now, we'll implement a simple admin check
    // In a real app, you might have an 'is_admin' field in users table
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',');
    
    if (!adminEmails.includes(req.user.email)) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify admin status',
      error: error.message
    });
  }
};

// Rate limiting middleware (basic implementation)
const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    if (requests.has(clientId)) {
      const clientRequests = requests.get(clientId).filter(time => time > windowStart);
      requests.set(clientId, clientRequests);
    }
    
    // Check rate limit
    const clientRequests = requests.get(clientId) || [];
    
    if (clientRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        retry_after: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add current request
    clientRequests.push(now);
    requests.set(clientId, clientRequests);
    
    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  checkResourceOwnership,
  requireAdmin,
  rateLimiter
};