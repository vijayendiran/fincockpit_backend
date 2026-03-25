// @ts-ignore
import { askAI } from "./ai.service";
// @ts-ignore
import prisma from "../config/prisma";
import {
  computeAllOptions,
  projectSIPGrowth,
  calculateSIPMonthly,
} from "./financialMathService";

interface GoalInput {
  goalText: string;
  targetAmount: number;
  targetYears: number;
  monthlyIncome?: number;
  currentSavings?: number;
  riskLevel?: "low" | "moderate" | "high";
}

export async function planFinancialGoal(userId: string, input: GoalInput) {
  const {
    goalText,
    targetAmount,
    targetYears,
    monthlyIncome,
    currentSavings = 0,
    riskLevel = "moderate",
  } = input;

  // 1. Run the math engine first
  const options = computeAllOptions(targetAmount - currentSavings, targetYears);

  // Pick the recommended option based on risk preference
  const recommended =
    riskLevel === "low" ? options.ppf
    : riskLevel === "high" ? options.elss
    : options.sip;

  // 2. Year-by-year growth projection for chart
  const projection = projectSIPGrowth(
    recommended.monthly,
    targetYears,
    riskLevel === "low" ? 0.071 : riskLevel === "high" ? 0.13 : 0.12
  );

  // 3. Feasibility check
  const affordableMonthly = monthlyIncome ? monthlyIncome * 0.3 : null; // max 30% of income
  const isFeasible = affordableMonthly
    ? recommended.monthly <= affordableMonthly
    : true;

  // 4. Ask Groq AI to explain everything in warm, personal, plain English
  const prompt = `
    You are a friendly Indian personal finance advisor.
    A user said: "${goalText}"
    
    Here are the calculated facts:
    - Target amount: ₹${targetAmount.toLocaleString("en-IN")}
    - Timeframe: ${targetYears} years
    - Current savings: ₹${currentSavings.toLocaleString("en-IN")}
    - Risk preference: ${riskLevel}
    - Monthly income: ${monthlyIncome ? "₹" + monthlyIncome.toLocaleString("en-IN") : "not provided"}
    - Feasible: ${isFeasible}

    Investment options computed:
    - SIP: ₹${options.sip.monthly}/month at 12% p.a.
    - ELSS: ₹${options.elss.monthly}/month at 13% p.a. (tax saving)
    - PPF: ₹${options.ppf.monthly}/month at 7.1% p.a. (government)
    - FD: ₹${options.fd.monthly}/month at 7% p.a.
    - Recommended: ${recommended.label} at ₹${recommended.monthly}/month

    Write a warm, encouraging, conversational reply (3-4 sentences max).
    Confirm if the goal is achievable. Mention the recommended monthly investment.
    Add one practical tip relevant to their risk level.
    Use Indian financial context (SIP, PPF, ELSS, Rupees).
    
    Return JSON:
    {
      "message": "your warm reply here",
      "headline": "Yes, you can! / Here's the plan / Let's make it happen",
      "tip": "one practical tip"
    }
  `;

  // Depending on what askAI expects and returns
  let aiReply;
  try {
    const rawAiReply = await askAI(prompt);
    // If askAI already parses JSON, we just assign it; otherwise parse it
    aiReply = typeof rawAiReply === "string" ? JSON.parse(rawAiReply) : rawAiReply;
  } catch (error) {
    console.error("AI reply parsing failed, falling back to empty fields.", error);
    aiReply = { headline: "Let's make it happen", message: "We can formulate a plan tailored directly for you.", tip: "Patience pays off." };
  }

  // 5. Compose full result
  const result = {
    headline: aiReply?.headline || "Here's the plan",
    message: aiReply?.message || "Goal formulated.",
    tip: aiReply?.tip || "Keep saving.",
    isFeasible,
    recommended,
    options,
    projection,
    summary: {
      targetAmount,
      targetYears,
      currentSavings,
      riskLevel,
      monthlyNeeded: recommended.monthly,
      totalInvested: recommended.monthly * targetYears * 12,
      expectedValue: projection[projection.length - 1]?.value ?? targetAmount,
      wealthGained:
        (projection[projection.length - 1]?.value ?? targetAmount) -
        recommended.monthly * targetYears * 12,
    },
  };

  // 6. Save goal + result to DB
  await prisma.financialGoal.create({
    data: {
      userId,
      goalText,
      targetAmount,
      targetYears,
      monthlyIncome,
      currentSavings,
      riskLevel,
      result,
    },
  });

  return result;
}

// Get user's past goals
export async function getPastGoals(userId: string) {
  return prisma.financialGoal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}
