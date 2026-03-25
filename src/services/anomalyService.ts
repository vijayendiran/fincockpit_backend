import { askAI } from "./aiService";
import prisma from "../config/prisma";

export async function detectAnomalies(userId: string) {
  // Fetch last 3 months of expenses grouped by category
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: threeMonthsAgo } },
    select: { amount: true, category: true, date: true, title: true },
    orderBy: { date: "asc" },
  });

  if (expenses.length < 5) {
    return { anomalies: [], message: "Not enough data yet" };
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
