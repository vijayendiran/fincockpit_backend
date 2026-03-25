const express = require('express');
const { chat, getAnomalies, parseNLP, getSuggestions, getForecast } = require('../controllers/groqController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// AI Chat Route
router.post('/chat', authMiddleware, chat);

// AI Anomalies Detection Route
router.get('/anomalies', authMiddleware, getAnomalies);

// AI NLP Parse Expense Route
router.post('/parse-expense', authMiddleware, parseNLP);

// AI Savings Suggestions Route
router.get('/savings-suggestions', authMiddleware, getSuggestions);
router.get('/suggestions', authMiddleware, getSuggestions); // Alias as per user request

// AI Spending Forecast Route
router.get('/forecast', authMiddleware, getForecast);

module.exports = router;
