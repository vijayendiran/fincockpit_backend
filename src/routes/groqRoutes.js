const express = require('express');
const { chat, getAnomalies } = require('../controllers/groqController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// AI Chat Route
router.post('/chat', authMiddleware, chat);

// AI Anomalies Detection Route
router.get('/anomalies', authMiddleware, getAnomalies);

module.exports = router;
