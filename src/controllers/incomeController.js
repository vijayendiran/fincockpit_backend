const incomeService = require('../services/income.service');

// @desc    Create new income
// @route   POST /api/incomes
// @access  Private
const createIncome = async (req, res) => {
  try {
    const { source, amount, date, description, categoryId } = req.body;

    // Validate
    if (!source || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide source and amount'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Create income
    const income = await incomeService.createIncome(req.user.id, {
      source,
      amount,
      date: date || new Date(),
      description,
      categoryId
    });

    res.status(201).json({
      success: true,
      message: 'Income added successfully',
      data: { income }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all incomes for logged-in user
// @route   GET /api/incomes
// @access  Private
const getIncomes = async (req, res) => {
  try {
    const incomes = await incomeService.getAllIncomes(req.user.id);

    // Calculate total
    const total = incomes.reduce((sum, income) => sum + income.amount, 0);

    res.status(200).json({
      success: true,
      count: incomes.length,
      total,
      data: { incomes }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single income
// @route   GET /api/incomes/:id
// @access  Private
const getIncome = async (req, res) => {
  try {
    const income = await incomeService.getIncomeById(req.params.id, req.user.id);

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { income }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update income
// @route   PUT /api/incomes/:id
// @access  Private
const updateIncome = async (req, res) => {
  try {
    const { amount } = req.body;

    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const income = await incomeService.updateIncome(req.params.id, req.user.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Income updated successfully',
      data: { income }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete income
// @route   DELETE /api/incomes/:id
// @access  Private
const deleteIncome = async (req, res) => {
  try {
    await incomeService.deleteIncome(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Income deleted successfully'
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
  createIncome,
  getIncomes,
  getIncome,
  updateIncome,
  deleteIncome
};