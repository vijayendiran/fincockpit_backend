const express = require('express');
const {
  createSubscription,
  getSubscriptions,
  getSubscription,
  updateSubscription,
  deleteSubscription,
  cancelSubscription
} = require('../controllers/subscriptionController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.route('/')
  .post(createSubscription)
  .get(getSubscriptions);

router.route('/:id')
  .get(getSubscription)
  .put(updateSubscription)
  .delete(deleteSubscription);

router.patch('/:id/cancel', cancelSubscription);

module.exports = router;
