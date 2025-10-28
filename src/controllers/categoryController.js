const Category = require('../models/Category');
const { validationResult } = require('express-validator');

class CategoryController {
  // Get all categories
  static async getAllCategories(req, res) {
    try {
      const { type } = req.query;
      const userId = req.user.id;
      
      let categories;
      if (type) {
        categories = await Category.getByTypeAndUser(type, userId);
      } else {
        categories = await Category.getAllByUser(userId);
      }

      res.json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories
      });
    } catch (error) {
      console.error('Error getting categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve categories',
        error: error.message
      });
    }
  }

  // Get category by ID
  static async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      
      const category = await Category.getById(id);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        message: 'Category retrieved successfully',
        data: category
      });
    } catch (error) {
      console.error('Error getting category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve category',
        error: error.message
      });
    }
  }

  // Create new category
  static async createCategory(req, res) {
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

      const { name, type, description } = req.body;

      // Check if category name already exists for this user
      const nameExists = await Category.nameExists(name, req.user.id);
      if (nameExists) {
        return res.status(409).json({
          success: false,
          message: 'Category name already exists'
        });
      }

      const newCategory = await Category.create({
        name,
        type,
        description,
        user_id: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: newCategory
      });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create category',
        error: error.message
      });
    }
  }

  // Update category
  static async updateCategory(req, res) {
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

      const { id } = req.params;
      const { name, type, description } = req.body;

      // Check if category exists
      const existingCategory = await Category.getById(id);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Check if new name already exists for this user (excluding current category)
      const nameExists = await Category.nameExists(name, req.user.id, id);
      if (nameExists) {
        return res.status(409).json({
          success: false,
          message: 'Category name already exists'
        });
      }

      const updatedCategory = await Category.update(id, {
        name,
        type,
        description
      });

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory
      });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update category',
        error: error.message
      });
    }
  }

  // Delete category
  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;

      // Check if category exists
      const existingCategory = await Category.getById(id);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      const deleted = await Category.delete(id);
      
      if (!deleted) {
        return res.status(400).json({
          success: false,
          message: 'Failed to delete category'
        });
      }

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      
      // Handle foreign key constraint error
      if (error.message.includes('Cannot delete category that is being used')) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete category that is being used by transactions'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete category',
        error: error.message
      });
    }
  }

  // Get category usage statistics
  static async getCategoryStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await Category.getUsageStatsByUser(userId);

      res.json({
        success: true,
        message: 'Category statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      console.error('Error getting category stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve category statistics',
        error: error.message
      });
    }
  }
}

module.exports = CategoryController;