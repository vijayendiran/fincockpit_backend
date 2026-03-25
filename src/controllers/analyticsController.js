const analyticsService = require('../services/analytics.service');

// @desc    Get financial summary
// @route   GET /api/analytics/summary
// @access  Private
const getSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const { incomes, expenses, activeSubscriptions } = await analyticsService.getSummary(req.user.id, startDate, endDate);

    // Calculate totals
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const balance = totalIncome - totalExpenses;

    // Calculate monthly subscription cost
    const monthlySubscriptionCost = activeSubscriptions.reduce((sum, sub) => {
      const monthlyCost = sub.billingCycle === 'monthly'
        ? sub.amount
        : sub.amount / 12;
      return sum + monthlyCost;
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        balance: Math.round(balance * 100) / 100,
        incomeCount: incomes.length,
        expenseCount: expenses.length,
        activeSubscriptions: activeSubscriptions.length,
        monthlySubscriptionCost: Math.round(monthlySubscriptionCost * 100) / 100
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get category-wise expense breakdown
// @route   GET /api/analytics/expenses-by-category
// @access  Private
const getExpensesByCategory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const expensesByCategory = await analyticsService.getExpensesByCategory(req.user.id, startDate, endDate);

    const totalExpenses = expensesByCategory.reduce((sum, cat) => sum + cat.total, 0);

    // Add percentage
    const result = expensesByCategory.map(cat => ({
      ...cat,
      percentage: totalExpenses > 0
        ? Math.round((cat.total / totalExpenses) * 100 * 100) / 100
        : 0
    }));

    res.status(200).json({
      success: true,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get monthly spending trend
// @route   GET /api/analytics/monthly-trend
// @access  Private
const getMonthlyTrend = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const { monthlyIncome, monthlyExpenses } = await analyticsService.getMonthlyTrend(req.user.id, year);

    // Combine data for all 12 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const trend = monthNames.map((month, index) => {
      const monthNum = index + 1;
      const incomeTotal = monthlyIncome[monthNum] || 0;
      const expenseTotal = monthlyExpenses[monthNum] || 0;

      return {
        month,
        income: Math.round(incomeTotal * 100) / 100,
        expenses: Math.round(expenseTotal * 100) / 100,
        balance: Math.round((incomeTotal - expenseTotal) * 100) / 100
      };
    });

    res.status(200).json({
      success: true,
      year: targetYear,
      data: trend
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get subscription vs non-subscription expenses
// @route   GET /api/analytics/subscription-analysis
// @access  Private
const getSubscriptionAnalysis = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // We can reuse getSummary to get the base data
    const { expenses, activeSubscriptions } = await analyticsService.getSummary(req.user.id, startDate, endDate);

    const recurringExpenses = expenses.filter(e => e.isRecurring);
    const oneTimeExpenses = expenses.filter(e => !e.isRecurring);

    const recurringTotal = recurringExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const oneTimeTotal = oneTimeExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const monthlySubscriptionCost = activeSubscriptions.reduce((sum, sub) => {
      const monthlyCost = sub.billingCycle === 'monthly' ? sub.amount : sub.amount / 12;
      return sum + monthlyCost;
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        recurringExpenses: {
          total: Math.round(recurringTotal * 100) / 100,
          count: recurringExpenses.length
        },
        oneTimeExpenses: {
          total: Math.round(oneTimeTotal * 100) / 100,
          count: oneTimeExpenses.length
        },
        subscriptions: {
          count: activeSubscriptions.length,
          monthlyTotal: Math.round(monthlySubscriptionCost * 100) / 100,
          yearlyTotal: Math.round(monthlySubscriptionCost * 12 * 100) / 100
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getSummary,
  getExpensesByCategory,
  getMonthlyTrend,
  getSubscriptionAnalysis
};