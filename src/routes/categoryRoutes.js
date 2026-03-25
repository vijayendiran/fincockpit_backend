const express = require('express');
const {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes are authMiddlewareed
router.use(authMiddleware);

router.route('/')
  .post(createCategory)
  .get(getCategories);

router.route('/:id')
  .get(getCategory)
  .put(updateCategory)
  .delete(deleteCategory);

module.exports = router;
