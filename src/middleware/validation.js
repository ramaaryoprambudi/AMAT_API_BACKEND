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
      .trim(),
    
    body('amount')
      .notEmpty()
      .withMessage('Amount is required')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be a positive number greater than 0'),
    
    body('type')
      .notEmpty()
      .withMessage('Type is required')
      .isIn(['income', 'expense'])
      .withMessage('Type must be either income or expense'),
    
    body('category_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Category ID must be a positive integer'),
    
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must not exceed 500 characters')
      .trim(),
    
    body('transaction_date')
      .optional()
      .isDate({ format: 'YYYY-MM-DD' })
      .withMessage('Transaction date must be in YYYY-MM-DD format')
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
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be a positive number greater than 0'),
    
    body('type')
      .notEmpty()
      .withMessage('Type is required')
      .isIn(['income', 'expense'])
      .withMessage('Type must be either income or expense'),
    
    body('category_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Category ID must be a positive integer'),
    
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
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('url_foto')
      .optional()
      .isURL()
      .withMessage('URL foto must be a valid URL')
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
      .withMessage('Email must not exceed 100 characters'),
    
    body('url_foto')
      .optional()
      .isURL()
      .withMessage('URL foto must be a valid URL')
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