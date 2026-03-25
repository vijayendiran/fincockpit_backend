import { askAI } from "./aiService";
import prisma from "../config/prisma";

export async function generateForecast(userId: string) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: sixMonthsAgo } },
    select: { amount: true, date: true, category: true },
    orderBy: { date: "asc" },
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

  const forecast = await askAI(prompt);

  // Save to DB so dashboard can read it without calling AI every time
  await prisma.forecast.upsert({
    where: { userId },
    update: { ...forecast, updatedAt: new Date() },
    create: { userId, ...forecast },
  });

  return forecast;
}
