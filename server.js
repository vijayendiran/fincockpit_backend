const express = require("express");
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const errorHandler = require('./src/middleware/errorHandler');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

const session = require('express-session');
const { handleAuthRoutes } = require('@logto/express');
const logtoConfig = require('./src/config/logto');

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.LOGTO_COOKIE_SECRET || 'fincockpit_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
    },
  })
);

// Logto Auth Routes
app.use(handleAuthRoutes(logtoConfig));

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const incomeRoutes = require('./src/routes/incomeRoutes');
const expenseRoutes = require('./src/routes/expenseRoutes');
const subscriptionRoutes = require('./src/routes/subscriptionRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const aiRoutes = require('./src/routes/ai.routes'); 
const currencyRoutes = require('./src/routes/currencyRoutes'); 

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/currency', currencyRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'FinCockpit API is running!',
    version: '1.0.0'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// --- Scheduled Jobs ---
const cron = require("node-cron");
const forecastService = require("./src/services/forecast.service");
const prisma = require("./src/config/prisma");

// Runs at midnight on the 1st of every month
cron.schedule("0 0 1 * *", async () => {
  console.log("Running monthly forecast job...");
  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const user of users) {
      await forecastService.generateForecast(user.id).catch(console.error);
    }
  } catch (err) {
    console.error("Forecast cron job error:", err);
  }
});