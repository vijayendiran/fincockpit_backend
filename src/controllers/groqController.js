const groqService = require('../services/groq.service');
const anomalyService = require('../services/anomaly.service');
const nlpService = require('../services/nlp.service');
const savingsService = require('../services/savings.service');
const forecastService = require('../services/forecast.service');
const prisma = require('../config/prisma');

/**
 * Handle POST /api/ai/chat
 */
const chat = async (req, res, next) => {
    try {
        const { messages, model } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const responseContent = await groqService.getGroqChatCompletion(messages, model);
        
        res.status(200).json({
            status: 'success',
            data: {
                message: responseContent
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handle GET /api/ai/anomalies
 */
const getAnomalies = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await anomalyService.detectAnomalies(userId);
        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handle POST /api/ai/parse-expense
 */
const parseNLP = async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        const result = await nlpService.parseExpenseText(text);
        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handle GET /api/ai/savings-suggestions
 */
const getSuggestions = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await savingsService.getSavingsSuggestions(userId);
        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Handle GET /api/ai/forecast
 */
const getForecast = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // Return saved forecast if exists
        const forecast = await prisma.forecast.findUnique({
            where: { userId }
        });

        if (forecast) {
            return res.status(200).json({
                status: 'success',
                data: forecast
            });
        }

        // Otherwise generate on-demand
        const result = await forecastService.generateForecast(userId);
        res.status(200).json({
            status: 'success',
            data: result || { message: "Not enough data yet" }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    chat,
    getAnomalies,
    parseNLP,
    getSuggestions,
    getForecast
};
