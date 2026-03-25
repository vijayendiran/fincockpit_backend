const prisma = require('../config/prisma');
const groqService = require('./groq.service');

/**
 * Generate spending forecast for a user using AI
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} - Forecast data or null
 */
async function generateForecast(userId) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  try {
    const expenses = await prisma.expense.findMany({
      where: { userId, date: { gte: sixMonthsAgo } },
      select: { 
        amount: true, 
        date: true, 
        category: { select: { name: true } } 
      },
      orderBy: { date: 'asc' },
    });

    if (expenses.length < 10) return null; // not enough data

    const prompt = `
      Based on this user's last 6 months of expense history:
      ${JSON.stringify(expenses)}

      Predict next month's total spending and breakdown by category.
      Return JSON:
      {
        "predictedTotal": 12500,
        "confidence": "medium",
        "breakdown": [
          { "category": "Food", "predicted": 4000 }
        ],
        "trend": "Your spending has been increasing by ~8% each month"
      }
      Confidence must be: "low", "medium", or "high".
      predictedTotal must be a number.
    `;

    // Using groq.service as it handles the AI calls in JS
    const messages = [
      {
        role: "system",
        content: "You are a personal finance assistant. Always respond with valid JSON only. No explanation, no markdown, just raw JSON."
      },
      { role: "user", content: prompt }
    ];

    const rawResponse = await groqService.getGroqChatCompletion(messages);
    const forecast = JSON.parse(rawResponse.replace(/```json|```/g, "").trim());

    // Save to DB so dashboard can read it without calling AI every time
    await prisma.forecast.upsert({
      where: { userId },
      update: { ...forecast, updatedAt: new Date() },
      create: { userId, ...forecast },
    });

    return forecast;
  } catch (error) {
    console.error("AI forecast generation failed:", error);
    throw error;
  }
}

module.exports = {
  generateForecast
};
