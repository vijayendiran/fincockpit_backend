const prisma = require('../config/prisma');
const { askAI } = require('./ai.service');

/**
 * Generates smart saving suggestions based on the user's recent spending and subscriptions.
 * @param {string} userId - The user's ID.
 * @returns {Promise<Object>} - The AI-generated savings suggestions.
 */
async function getSavingsSuggestions(userId) {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const [expenses, subscriptions, user] = await Promise.all([
    prisma.expense.findMany({
      where: { userId, date: { gte: oneMonthAgo } },
      select: { amount: true, category: { select: { name: true } }, title: true },
    }),
    prisma.subscription.findMany({
      where: { userId },
      select: { name: true, amount: true, billingCycle: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { monthlyBudget: true, currency: true },
    }),
  ]);

  const userCurrency = user?.currency ?? "INR";

  if (expenses.length < 3 && subscriptions.length === 0) {
    return { suggestions: [], totalPotentialSaving: `0 ${userCurrency}/month`, message: "Not enough data for personalized suggestions yet." };
  }

  const totalSpend = expenses.reduce((s, e) => s + e.amount, 0);

  const prompt = `
    A user has a monthly budget of ${user?.monthlyBudget ?? "unknown"} ${userCurrency}.
    This month they spent ${totalSpend} ${userCurrency} total.

    Their expenses (last 30 days): ${JSON.stringify(expenses)}
    Their subscriptions: ${JSON.stringify(subscriptions)}

    Analyze their data and give exactly 3 specific, actionable money-saving suggestions.
    Include potential monthly savings in each using their currency (${userCurrency}).
    Return JSON in this EXACT format:
    {
      "suggestions": [
        {
          "title": "Short title",
          "detail": "One specific actionable tip",
          "potentialSaving": "500 ${userCurrency}/month",
          "category": "Food"
        }
      ],
      "totalPotentialSaving": "1500 ${userCurrency}/month",
      "summary": "A brief overall outlook"
    }

    Respond ONLY with the raw JSON. No markdown or explanation.
  `;

  return await askAI(prompt);
}

module.exports = { getSavingsSuggestions };
