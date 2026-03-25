const { askAI } = require("./ai.service");
const prisma = require("../config/prisma");

/**
 * Detect spending anomalies for a user
 * @param {string} userId 
 */
async function detectAnomalies(userId) {
  // Fetch last 3 months of expenses grouped by category
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: threeMonthsAgo } },
    select: { 
      amount: true, 
      category: {
        select: { name: true }
      }, 
      date: true, 
      title: true 
    },
    orderBy: { date: "asc" },
  });

  if (expenses.length < 5) {
    return { anomalies: [], message: "Not enough data yet", summary: "No data found to analyze" };
  }

  const prompt = `
    Here is a user's expense history for the last 3 months:
    ${JSON.stringify(expenses)}

    Analyze and detect spending anomalies or unusual patterns.
    Return JSON in this exact format:
    {
      "anomalies": [
        {
          "category": "Food",
          "severity": "high",
          "message": "Food spending increased 65% compared to last month",
          "suggestion": "Consider meal prepping to reduce costs"
        }
      ],
      "summary": "One sentence overall summary"
    }
    Severity must be: "low", "medium", or "high".
    Return max 3 anomalies. If no anomalies found, return empty array.
  `;

  return await askAI(prompt);
}

module.exports = {
  detectAnomalies,
};
