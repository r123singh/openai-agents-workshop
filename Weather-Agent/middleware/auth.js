const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { validationResult } = require('express-validator');
const Database = require('../database/database');

const db = new Database();

// Rate limiting middleware
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs: windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      error: 'Rate limit exceeded',
      message: message || 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.findUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please log in again'
      });
    }
    
    return res.status(401).json({
      error: 'Access denied',
      message: 'Invalid token'
    });
  }
};

// API key authentication middleware
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    if (!apiKey) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'API key required'
      });
    }

    const user = await db.findUserByApiKey(apiKey);
    
    if (!user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid API key'
      });
    }

    if (user.subscription_status !== 'active') {
      return res.status(403).json({
        error: 'Subscription inactive',
        message: 'Please renew your subscription to continue using the API'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Access denied',
      message: 'Invalid API key'
    });
  }
};

// Usage limit middleware
const checkUsageLimit = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate to use this endpoint'
      });
    }

    const usageInfo = await db.checkUserLimit(req.user.id);
    
    if (!usageInfo.canMakeRequest) {
      return res.status(429).json({
        error: 'Usage limit exceeded',
        message: `You have reached your monthly limit of ${usageInfo.limit} requests. Please upgrade your plan for more requests.`,
        usage: usageInfo
      });
    }

    req.usageInfo = usageInfo;
    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to check usage limits'
    });
  }
};

// Track API usage middleware
const trackApiUsage = async (req, res, next) => {
  try {
    if (req.user && req.usageInfo) {
      await db.trackApiUsage(req.user.id, req.path);
    }
    next();
  } catch (error) {
    // Don't fail the request if tracking fails
    console.error('Failed to track API usage:', error);
    next();
  }
};

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input',
      details: errors.array()
    });
  }
  next();
};

// Optional authentication middleware (for endpoints that work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await db.findUserById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Admin middleware (for admin-only endpoints)
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }

    // Check if user is admin (you can add an admin field to your users table)
    if (req.user.subscription_tier !== 'enterprise') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin privileges required'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to verify admin privileges'
    });
  }
};

// Utility functions
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

module.exports = {
  createRateLimiter,
  authenticateToken,
  authenticateApiKey,
  checkUsageLimit,
  trackApiUsage,
  validateRequest,
  optionalAuth,
  requireAdmin,
  generateToken,
  hashPassword,
  comparePassword
};
