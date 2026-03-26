const express = require('express');
const { body } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const Database = require('../database/database');
const { 
  generateToken, 
  hashPassword, 
  comparePassword, 
  validateRequest,
  authenticateToken,
  createRateLimiter
} = require('../middleware/auth');

const router = express.Router();
const db = new Database();

// Rate limiting for auth endpoints
const authRateLimit = createRateLimiter(15 * 60 * 1000, 5, 'Too many authentication attempts');

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const resetPasswordValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
];

// Register new user
router.post('/register', authRateLimit, registerValidation, validateRequest, async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        error: 'Registration failed',
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const userId = uuidv4();
    const passwordHash = await hashPassword(password);
    
    const userData = {
      id: userId,
      email,
      passwordHash,
      firstName,
      lastName
    };

    const { apiKey } = await db.createUser(userData);
    const token = generateToken(userId);

    // Update last login
    await db.updateUserLastLogin(userId);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: userId,
          email,
          firstName,
          lastName,
          subscriptionTier: 'free',
          apiKey
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'Unable to create account. Please try again.'
    });
  }
});

// Login user
router.post('/login', authRateLimit, loginValidation, validateRequest, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Login failed',
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Login failed',
        message: 'Invalid email or password'
      });
    }

    // Check subscription status
    if (user.subscription_status !== 'active') {
      return res.status(403).json({
        error: 'Account suspended',
        message: 'Your account has been suspended. Please contact support.'
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Update last login
    await db.updateUserLastLogin(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          subscriptionTier: user.subscription_tier,
          subscriptionStatus: user.subscription_status,
          apiKey: user.api_key,
          createdAt: user.created_at,
          lastLogin: user.last_login
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'Unable to log in. Please try again.'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Get usage information
    const usageInfo = await db.checkUserLimit(user.id);
    const monthlyUsage = await db.getUserMonthlyUsage(user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          subscriptionTier: user.subscription_tier,
          subscriptionStatus: user.subscription_status,
          apiKey: user.api_key,
          createdAt: user.created_at,
          lastLogin: user.last_login,
          emailVerified: user.email_verified
        },
        usage: {
          ...usageInfo,
          monthlyUsage
        }
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: 'Unable to fetch profile',
      message: 'Please try again later.'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 1 }).withMessage('First name cannot be empty'),
  body('lastName').optional().trim().isLength({ min: 1 }).withMessage('Last name cannot be empty')
], validateRequest, async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const userId = req.user.id;

    // Update user profile (you'll need to add this method to your Database class)
    // await db.updateUserProfile(userId, { firstName, lastName });

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Unable to update profile',
      message: 'Please try again later.'
    });
  }
});

// Change password
router.post('/change-password', authenticateToken, changePasswordValidation, validateRequest, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Password change failed',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password (you'll need to add this method to your Database class)
    // await db.updateUserPassword(user.id, newPasswordHash);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      error: 'Unable to change password',
      message: 'Please try again later.'
    });
  }
});

// Request password reset
router.post('/forgot-password', authRateLimit, resetPasswordValidation, validateRequest, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await db.findUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token (you'll need to add this method to your Database class)
    // await db.saveResetToken(user.id, resetToken, resetTokenExpires);

    // Send email (you'll need to implement email service)
    // await sendPasswordResetEmail(user.email, resetToken);

    res.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      error: 'Unable to process password reset',
      message: 'Please try again later.'
    });
  }
});

// Reset password with token
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
], validateRequest, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find user by reset token (you'll need to add this method to your Database class)
    // const user = await db.findUserByResetToken(token);
    
    // if (!user || user.reset_token_expires < new Date()) {
    //   return res.status(400).json({
    //     error: 'Invalid or expired token',
    //     message: 'Please request a new password reset link.'
    //   });
    // }

    // Hash new password and update
    // const newPasswordHash = await hashPassword(newPassword);
    // await db.updateUserPassword(user.id, newPasswordHash);
    // await db.clearResetToken(user.id);

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      error: 'Unable to reset password',
      message: 'Please try again later.'
    });
  }
});

// Regenerate API key
router.post('/regenerate-api-key', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const newApiKey = db.generateApiKey();

    // Update API key (you'll need to add this method to your Database class)
    // await db.updateUserApiKey(userId, newApiKey);

    res.json({
      success: true,
      message: 'API key regenerated successfully',
      data: {
        apiKey: newApiKey
      }
    });
  } catch (error) {
    console.error('API key regeneration error:', error);
    res.status(500).json({
      error: 'Unable to regenerate API key',
      message: 'Please try again later.'
    });
  }
});

// Logout (client-side token removal, but we can track it)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // You could track logout events if needed
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'Please try again.'
    });
  }
});

module.exports = router;
