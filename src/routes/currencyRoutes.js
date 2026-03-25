const express = require('express');
const { getCurrencyRates } = require('../controllers/currencyController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/rates', authMiddleware, getCurrencyRates);

module.exports = router;
