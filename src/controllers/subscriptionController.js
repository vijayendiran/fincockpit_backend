const subscriptionService = require('../services/subscription.service');

// @desc    Create new subscription
// @route   POST /api/subscriptions
// @access  Private
const createSubscription = async (req, res) => {
  try {
    const { name, amount, billingCycle, startDate, categoryId, description, currency } = req.body;

    // Validate basic fields
    if (!name || isNaN(parseFloat(amount)) || !billingCycle) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, valid amount, and billing cycle'
      });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const subscription = await subscriptionService.createSubscription(req.user.id, {
      name,
      amount: parseFloat(amount),
      currency: currency || "INR",
      billingCycle,
      startDate: startDate ? new Date(startDate) : new Date(),
      categoryId: categoryId && categoryId !== "" ? categoryId : null,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: { subscription }
    });

  } catch (error) {
    console.error('Create Subscription Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during subscription creation',
      error: error.message
    });
  }
};

// @desc    Get all subscriptions
// @route   GET /api/subscriptions
// @access  Private
const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await subscriptionService.getAllSubscriptions(req.user.id);

    // Calculate total monthly cost
    const totalMonthlyCost = subscriptions
      .filter(sub => sub.status === 'active')
      .reduce((sum, sub) => {
        let monthlyCost = 0;
        const amount = sub.amount || 0;

        if (sub.billingCycle === 'weekly') {
          monthlyCost = amount * 4;
        } else if (sub.billingCycle === 'monthly') {
          monthlyCost = amount;
        } else if (sub.billingCycle === 'yearly') {
          monthlyCost = amount / 12;
        }

        return sum + monthlyCost;
      }, 0);

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
      data: { subscriptions }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single subscription
// @route   GET /api/subscriptions/:id
// @access  Private
const getSubscription = async (req, res) => {
  try {
    const subscription = await subscriptionService.getSubscriptionById(req.params.id, req.user.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { subscription }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update subscription
// @route   PUT /api/subscriptions/:id
// @access  Private
const updateSubscription = async (req, res) => {
  try {
    const { amount } = req.body;

    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const updateData = { ...req.body };
    if (updateData.amount) updateData.amount = parseFloat(updateData.amount);
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.categoryId === "") updateData.categoryId = null;

    const subscription = await subscriptionService.updateSubscription(req.params.id, req.user.id, updateData);

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      data: { subscription }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete subscription
// @route   DELETE /api/subscriptions/:id
// @access  Private
const deleteSubscription = async (req, res) => {
  try {
    await subscriptionService.deleteSubscription(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Subscription deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Cancel subscription (change status to cancelled)
// @route   PATCH /api/subscriptions/:id/cancel
// @access  Private
const cancelSubscription = async (req, res) => {
  try {
    const subscription = await subscriptionService.updateSubscription(req.params.id, req.user.id, { status: 'cancelled' });

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: { subscription }
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
  createSubscription,
  getSubscriptions,
  getSubscription,
  updateSubscription,
  deleteSubscription,
  cancelSubscription
};