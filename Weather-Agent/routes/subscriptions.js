const express = require('express');
const { body } = require('express-validator');
const Database = require('../database/database');
const { 
  authenticateToken, 
  validateRequest,
  createRateLimiter
} = require('../middleware/auth');

const router = express.Router();
const db = new Database();

// Rate limiting for subscription endpoints
const subscriptionRateLimit = createRateLimiter(60 * 1000, 10, 'Too many subscription requests');

// Get all subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await db.getSubscriptionPlans();
    
    res.json({
      success: true,
      data: {
        plans: plans.map(plan => ({
          tier: plan.tier,
          name: plan.name,
          description: plan.description,
          monthlyLimit: plan.monthly_limit,
          priceMonthly: plan.price_monthly,
          priceYearly: plan.price_yearly,
          features: plan.features
        }))
      }
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      error: 'Unable to fetch subscription plans',
      message: 'Please try again later.'
    });
  }
});

// Get current user's subscription details
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const currentPlan = await db.getSubscriptionPlan(user.subscription_tier);
    const usageInfo = await db.checkUserLimit(user.id);
    const monthlyUsage = await db.getUserMonthlyUsage(user.id);

    res.json({
      success: true,
      data: {
        subscription: {
          tier: user.subscription_tier,
          status: user.subscription_status,
          plan: currentPlan ? {
            name: currentPlan.name,
            description: currentPlan.description,
            monthlyLimit: currentPlan.monthly_limit,
            priceMonthly: currentPlan.price_monthly,
            priceYearly: currentPlan.price_yearly,
            features: currentPlan.features
          } : null,
          stripeCustomerId: user.stripe_customer_id
        },
        usage: {
          ...usageInfo,
          monthlyUsage
        }
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      error: 'Unable to fetch subscription details',
      message: 'Please try again later.'
    });
  }
});

// Get user's usage history
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query;

    let startDate = null;
    if (period === 'week') {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'year') {
      startDate = new Date();
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
    }

    const usageCount = await db.getUserUsageCount(userId, startDate ? startDate.toISOString() : null);
    const monthlyUsage = await db.getUserMonthlyUsage(userId);

    res.json({
      success: true,
      data: {
        usage: {
          period,
          count: usageCount,
          monthlyUsage,
          startDate: startDate ? startDate.toISOString() : null
        }
      }
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({
      error: 'Unable to fetch usage data',
      message: 'Please try again later.'
    });
  }
});

// Upgrade subscription (placeholder for Stripe integration)
router.post('/upgrade', subscriptionRateLimit, authenticateToken, [
  body('planTier').isIn(['pro', 'enterprise']).withMessage('Invalid plan tier'),
  body('billingCycle').isIn(['monthly', 'yearly']).withMessage('Invalid billing cycle')
], validateRequest, async (req, res) => {
  try {
    const { planTier, billingCycle } = req.body;
    const userId = req.user.id;

    // Get the requested plan
    const plan = await db.getSubscriptionPlan(planTier);
    if (!plan) {
      return res.status(400).json({
        error: 'Invalid plan',
        message: 'The requested plan does not exist.'
      });
    }

    // Check if user is already on this plan or higher
    const currentPlan = await db.getSubscriptionPlan(req.user.subscription_tier);
    if (currentPlan && currentPlan.monthly_limit >= plan.monthly_limit) {
      return res.status(400).json({
        error: 'Invalid upgrade',
        message: 'You are already on this plan or higher.'
      });
    }

    // Calculate price
    const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

    // In a real implementation, you would:
    // 1. Create a Stripe checkout session
    // 2. Redirect user to Stripe for payment
    // 3. Handle webhook for successful payment
    // 4. Update user subscription

    // For now, we'll simulate a successful upgrade
    const stripeCustomerId = req.user.stripe_customer_id || `cus_${Date.now()}`;
    
    await db.updateUserSubscription(userId, {
      subscription_tier: planTier,
      subscription_status: 'active',
      stripe_customer_id: stripeCustomerId
    });

    res.json({
      success: true,
      message: 'Subscription upgraded successfully',
      data: {
        newPlan: {
          tier: planTier,
          name: plan.name,
          monthlyLimit: plan.monthly_limit,
          price: price,
          billingCycle: billingCycle
        }
      }
    });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({
      error: 'Unable to upgrade subscription',
      message: 'Please try again later.'
    });
  }
});

// Cancel subscription
router.post('/cancel', subscriptionRateLimit, authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // In a real implementation, you would:
    // 1. Cancel the subscription in Stripe
    // 2. Set the subscription to cancel at period end
    // 3. Update user subscription status

    // For now, we'll downgrade to free plan
    await db.updateUserSubscription(userId, {
      subscription_tier: 'free',
      subscription_status: 'active',
      stripe_customer_id: null
    });

    res.json({
      success: true,
      message: 'Subscription cancelled successfully. You have been downgraded to the free plan.',
      data: {
        newPlan: {
          tier: 'free',
          name: 'Free',
          monthlyLimit: 100
        }
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      error: 'Unable to cancel subscription',
      message: 'Please try again later.'
    });
  }
});

// Get billing history (placeholder)
router.get('/billing', authenticateToken, async (req, res) => {
  try {
    // In a real implementation, you would fetch billing history from Stripe
    res.json({
      success: true,
      data: {
        billingHistory: [],
        message: 'Billing history will be available when Stripe integration is complete.'
      }
    });
  } catch (error) {
    console.error('Get billing error:', error);
    res.status(500).json({
      error: 'Unable to fetch billing history',
      message: 'Please try again later.'
    });
  }
});

// Webhook for Stripe events (placeholder)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // In a real implementation, you would:
    // 1. Verify the webhook signature
    // 2. Handle different Stripe events (payment succeeded, subscription updated, etc.)
    // 3. Update user subscription status accordingly

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      error: 'Webhook processing failed'
    });
  }
});

module.exports = router;
