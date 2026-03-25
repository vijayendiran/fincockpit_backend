const express = require('express');
const {
    getSummary,
    getExpensesByCategory,
    getMonthlyTrend,
    getSubscriptionAnalysis
} = require('../controllers/analyticsController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/summary', getSummary);
router.get('/expenses-by-category', getExpensesByCategory);
router.get('/monthly-trend', getMonthlyTrend);
router.get('/subscription-analysis', getSubscriptionAnalysis);

module.exports = router;
