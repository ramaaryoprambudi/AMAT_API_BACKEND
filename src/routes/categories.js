const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const { categoryValidation } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, checkResourceOwnership } = require('../middleware/auth');

// All category routes require authentication
router.use(authenticateToken);

// GET /api/categories - Get all categories (with optional type filter)
router.get('/', asyncHandler(CategoryController.getAllCategories));

// GET /api/categories/stats - Get category usage statistics
router.get('/stats', asyncHandler(CategoryController.getCategoryStats));

// GET /api/categories/:id - Get category by ID
router.get('/:id', 
  checkResourceOwnership('category'),
  asyncHandler(CategoryController.getCategoryById)
);

// POST /api/categories - Create new category
router.post('/', 
  categoryValidation.create,
  asyncHandler(CategoryController.createCategory)
);

// PUT /api/categories/:id - Update category
router.put('/:id',
  checkResourceOwnership('category'),
  categoryValidation.update,
  asyncHandler(CategoryController.updateCategory)
);

// DELETE /api/categories/:id - Delete category
router.delete('/:id', 
  checkResourceOwnership('category'),
  asyncHandler(CategoryController.deleteCategory)
);

module.exports = router;