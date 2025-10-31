const { body } = require('express-validator');

// Validation rules for category
const categoryValidation = {
  create: [
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .trim(),
    
    body('type')
      .notEmpty()
      .withMessage('Type is required')
      .isIn(['income', 'expense'])
      .withMessage('Type must be either income or expense'),
    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters')
      .trim()
  ],

  update: [
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .trim(),
    
    body('type')
      .notEmpty()
      .withMessage('Type is required')
      .isIn(['income', 'expense'])
      .withMessage('Type must be either income or expense'),
    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters')
      .trim()
  ]
};

// Validation rules for transaction
const transactionValidation = {
  create: [
    body('title')
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 2, max: 255 })
      .withMessage('Title must be between 2 and 255 characters')
      .trim()
      .escape() // Escape HTML untuk prevent XSS
      .custom((value) => {
        // Check for SQL injection patterns
        const sqlPatterns = [
          /('|(\\)|;|--|\/\*|\*\/|union|select|insert|update|delete|drop|create|alter)/i,
          /(script|javascript|vbscript|onload|onerror|onclick)/i
        ];
        
        if (sqlPatterns.some(pattern => pattern.test(value))) {
          throw new Error('Title contains invalid characters');
        }
        
        // Only allow alphanumeric, spaces, and common punctuation
        if (!/^[a-zA-Z0-9\s\-_.(),!?\u00C0-\u017F]+$/.test(value)) {
          throw new Error('Title contains forbidden characters');
        }
        
        return true;
      }),
    
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isFloat({ min: 1000, max: 999999999.99 })
      .withMessage('Amount must be between Rp 1,000 and Rp 999,999,999.99')
      .custom((value) => {
        const numValue = parseFloat(value);
        
        // Check minimum amount 1000 rupiah
        if (numValue < 1000) {
          throw new Error('Minimum transaction amount is Rp 1,000');
        }
        
        // Prevent scientific notation
        if (value.toString().includes('e') || value.toString().includes('E')) {
          throw new Error('Scientific notation not allowed');
        }
        
        // Check decimal places
        const decimalPlaces = (value.toString().split('.')[1] || '').length;
        if (decimalPlaces > 2) {
          throw new Error('Maximum 2 decimal places allowed');
        }
        
        // Ensure positive number
        if (numValue <= 0) {
          throw new Error('Amount must be greater than zero');
        }
        
        return true;
      }),
    
    body('type')
      .notEmpty()
      .withMessage('Type is required')
      .isIn(['income', 'expense'])
      .withMessage('Type must be either income or expense')
      .custom((value) => {
        // Strict type checking
        if (typeof value !== 'string') {
          throw new Error('Type must be a string');
        }
        return true;
      }),
    

    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters')
      .trim()
      .escape() // Escape HTML untuk prevent XSS
      .custom((value) => {
        if (value) {
          // Check for malicious patterns
          const maliciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /data:text\/html/i,
            /vbscript:/i,
            /('|(\\)|;|--|\/\*|\*\/|union|select|insert|update|delete|drop)/i
          ];
          
          if (maliciousPatterns.some(pattern => pattern.test(value))) {
            throw new Error('Description contains potentially harmful content');
          }
        }
        return true;
      }),
    
    body('transaction_date')
      .optional()
      .isDate({ format: 'YYYY-MM-DD' })
      .withMessage('Transaction date must be in YYYY-MM-DD format')
      .custom((value) => {
        if (value) {
          const date = new Date(value);
          const today = new Date();
          const minDate = new Date('1900-01-01');
          const maxDate = new Date();
          maxDate.setFullYear(today.getFullYear() + 1);
          
          if (date < minDate || date > maxDate) {
            throw new Error('Invalid transaction date range');
          }
        }
        return true;
      }),

    // Additional security validation for request payload
    body()
      .custom((value, { req }) => {
        // Check payload size
        const jsonString = JSON.stringify(req.body);
        if (jsonString.length > 5000) {
          throw new Error('Request payload too large');
        }
        
        // Check for unexpected fields
        const allowedFields = ['title', 'amount', 'type', 'description', 'transaction_date'];
        const receivedFields = Object.keys(req.body);
        const unexpectedFields = receivedFields.filter(field => !allowedFields.includes(field));
        
        if (unexpectedFields.length > 0) {
          throw new Error(`Unexpected fields detected: ${unexpectedFields.join(', ')}`);
        }
        
        return true;
      })
  ],

  update: [
    body('title')
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 2, max: 255 })
      .withMessage('Title must be between 2 and 255 characters')
      .trim(),
    
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isFloat({ min: 1000, max: 999999999.99 })
      .withMessage('Amount must be between Rp 1,000 and Rp 999,999,999.99')
      .custom((value) => {
        const numValue = parseFloat(value);
        
        // Check minimum amount 1000 rupiah
        if (numValue < 1000) {
          throw new Error('Minimum transaction amount is Rp 1,000');
        }
        
        return true;
      }),
    
    body('type')
      .notEmpty()
      .withMessage('Type is required')
      .isIn(['income', 'expense'])
      .withMessage('Type must be either income or expense'),
    

    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters')
      .trim(),
    
    body('transaction_date')
      .notEmpty()
      .withMessage('Transaction date is required')
      .isDate({ format: 'YYYY-MM-DD' })
      .withMessage('Transaction date must be in YYYY-MM-DD format')
  ]
};

// Validation rules for authentication
const authValidation = {
  register: [
    body('nama')
      .notEmpty()
      .withMessage('Nama is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Nama must be between 2 and 100 characters')
      .trim(),
    
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail()
      .isLength({ max: 100 })
      .withMessage('Email must not exceed 100 characters'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    // File upload akan dihandle oleh multer middleware
  ],

  login: [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  updateProfile: [
    body('nama')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nama must be between 2 and 100 characters')
      .trim(),
    
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail()
      .isLength({ max: 100 })
      .withMessage('Email must not exceed 100 characters')
    // File upload akan dihandle oleh multer middleware
  ],

  changePassword: [
    body('current_password')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('new_password')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('confirm_password')
      .notEmpty()
      .withMessage('Password confirmation is required')
      .custom((value, { req }) => {
        if (value !== req.body.new_password) {
          throw new Error('Password confirmation does not match new password');
        }
        return true;
      })
  ],

  deleteAccount: [
    body('password')
      .notEmpty()
      .withMessage('Password is required to delete account')
  ]
};

module.exports = {
  categoryValidation,
  transactionValidation,
  authValidation
};