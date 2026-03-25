const express = require('express');
const {
  createIncome,
  getIncomes,
  getIncome,
  updateIncome,
  deleteIncome
} = require('../controllers/incomeController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.route('/')
  .post(createIncome)
  .get(getIncomes);

router.route('/:id')
  .get(getIncome)
  .put(updateIncome)
  .delete(deleteIncome);

module.exports = router;
