const express = require('express');
const {
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.route('/')
  .post(createExpense)
  .get(getExpenses);

router.route('/:id')
  .get(getExpense)
  .put(updateExpense)
  .delete(deleteExpense);

module.exports = router;
