import express from "express";
import { detectAnomalies } from "../services/anomalyService";
import { generateForecast } from "../services/forecastService";
// @ts-ignore
import { chat } from "../controllers/groqController"; // Import the chat controller
// @ts-ignore
import { protect } from "../middleware/auth";
// @ts-ignore
import prisma from "../config/prisma";
import { planFinancialGoal, getPastGoals } from "../services/goalPlannerService";

const router = express.Router();

// AI Chat Route
router.post("/chat", protect, chat);

// AI Anomalies Detection Route
router.get("/anomalies", protect, async (req: any, res: any) => {
  try {
    const result = await detectAnomalies(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "AI analysis failed" });
  }
});

// AI Spending Forecast Route
router.get("/forecast", protect, async (req: any, res: any) => {
  try {
    // Return saved forecast (no AI call on every request)
    const forecast = await prisma.forecast.findUnique({
      where: { userId: req.user.id },
    });
    // If no forecast yet, generate one on-demand
    if (!forecast) {
      const fresh = await generateForecast(req.user.id);
      return res.json(fresh ?? { message: "Not enough data yet" });
    }
    res.json(forecast);
  } catch (err: any) {
    console.error("Forecast error:", err);
    res.status(500).json({ error: err.message || "AI forecast failed" });
  }
});

// Plan a new goal
router.post("/goal-planner", protect, async (req: any, res: any) => {
  try {
    const result = await planFinancialGoal(req.user.id, req.body);
    res.json(result);
  } catch (err) {
    console.error("Goal planner error:", err);
    res.status(500).json({ error: "Goal planning failed" });
  }
});

// Get past goals
router.get("/goal-planner/history", protect, async (req: any, res: any) => {
  try {
    const goals = await getPastGoals(req.user.id);
    res.json(goals);
  } catch (err) {
    console.error("Fetch past goals error:", err);
    res.status(500).json({ error: "Could not fetch goals" });
  }
});

export default router;
