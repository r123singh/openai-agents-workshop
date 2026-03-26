const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.dbPath = process.env.DATABASE_URL || './data/weather_app.db';
    this.ensureDataDirectory();
    this.db = new sqlite3.Database(this.dbPath);
    this.init();
  }

  ensureDataDirectory() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  init() {
    this.db.serialize(() => {
      // Users table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          first_name TEXT,
          last_name TEXT,
          subscription_tier TEXT DEFAULT 'free',
          subscription_status TEXT DEFAULT 'active',
          stripe_customer_id TEXT,
          api_key TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME,
          email_verified BOOLEAN DEFAULT 0,
          reset_token TEXT,
          reset_token_expires DATETIME
        )
      `);

      // API usage tracking
      this.db.run(`
        CREATE TABLE IF NOT EXISTS api_usage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          endpoint TEXT NOT NULL,
          request_count INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // User preferences
      this.db.run(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          preference_type TEXT NOT NULL,
          preference_data TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(user_id, preference_type)
        )
      `);

      // Subscription plans
      this.db.run(`
        CREATE TABLE IF NOT EXISTS subscription_plans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tier TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          monthly_limit INTEGER NOT NULL,
          price_monthly REAL DEFAULT 0,
          price_yearly REAL DEFAULT 0,
          features TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insert default subscription plans
      this.insertDefaultPlans();
    });
  }

  insertDefaultPlans() {
    const plans = [
      {
        tier: 'free',
        name: 'Free',
        description: 'Basic weather information with limited API calls',
        monthly_limit: parseInt(process.env.FREE_TIER_LIMIT) || 100,
        price_monthly: 0,
        price_yearly: 0,
        features: JSON.stringify(['Basic weather queries', 'Current weather', '3-day forecast', 'Email support'])
      },
      {
        tier: 'pro',
        name: 'Pro',
        description: 'Advanced features with higher API limits',
        monthly_limit: parseInt(process.env.PRO_TIER_LIMIT) || 1000,
        price_monthly: 9.99,
        price_yearly: 99.99,
        features: JSON.stringify(['All Free features', 'Extended forecasts', 'Historical data', 'AI recommendations', 'Weather alerts', 'Priority support', 'API access'])
      },
      {
        tier: 'enterprise',
        name: 'Enterprise',
        description: 'Unlimited access for businesses and developers',
        monthly_limit: parseInt(process.env.ENTERPRISE_TIER_LIMIT) || 10000,
        price_monthly: 49.99,
        price_yearly: 499.99,
        features: JSON.stringify(['All Pro features', 'Unlimited API calls', 'Custom integrations', 'White-label options', 'Dedicated support', 'SLA guarantee'])
      }
    ];

    plans.forEach(plan => {
      this.db.run(`
        INSERT OR IGNORE INTO subscription_plans 
        (tier, name, description, monthly_limit, price_monthly, price_yearly, features)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [plan.tier, plan.name, plan.description, plan.monthly_limit, plan.price_monthly, plan.price_yearly, plan.features]);
    });
  }

  // User management methods
  async createUser(userData) {
    return new Promise((resolve, reject) => {
      const { id, email, passwordHash, firstName, lastName } = userData;
      const apiKey = this.generateApiKey();
      
      this.db.run(`
        INSERT INTO users (id, email, password_hash, first_name, last_name, api_key)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, email, passwordHash, firstName, lastName, apiKey], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, apiKey });
        }
      });
    });
  }

  async findUserByEmail(email) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async findUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async findUserByApiKey(apiKey) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE api_key = ?', [apiKey], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async updateUserLastLogin(userId) {
    return new Promise((resolve, reject) => {
      this.db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [userId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async updateUserSubscription(userId, subscriptionData) {
    return new Promise((resolve, reject) => {
      const { subscription_tier, subscription_status, stripe_customer_id } = subscriptionData;
      this.db.run(`
        UPDATE users 
        SET subscription_tier = ?, subscription_status = ?, stripe_customer_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [subscription_tier, subscription_status, stripe_customer_id, userId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // API usage tracking
  async trackApiUsage(userId, endpoint) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO api_usage (user_id, endpoint)
        VALUES (?, ?)
      `, [userId, endpoint], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async getUserUsageCount(userId, startDate = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT COUNT(*) as count FROM api_usage WHERE user_id = ?';
      let params = [userId];
      
      if (startDate) {
        query += ' AND created_at >= ?';
        params.push(startDate);
      }
      
      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? row.count : 0);
        }
      });
    });
  }

  async getUserMonthlyUsage(userId) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    return this.getUserUsageCount(userId, startOfMonth.toISOString());
  }

  // User preferences
  async saveUserPreference(userId, preferenceType, preferenceData) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT OR REPLACE INTO user_preferences (user_id, preference_type, preference_data, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `, [userId, preferenceType, JSON.stringify(preferenceData)], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async getUserPreference(userId, preferenceType) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT preference_data FROM user_preferences 
        WHERE user_id = ? AND preference_type = ?
      `, [userId, preferenceType], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? JSON.parse(row.preference_data) : null);
        }
      });
    });
  }

  // Subscription plans
  async getSubscriptionPlans() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM subscription_plans ORDER BY monthly_limit', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            ...row,
            features: JSON.parse(row.features)
          })));
        }
      });
    });
  }

  async getSubscriptionPlan(tier) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM subscription_plans WHERE tier = ?', [tier], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? {
            ...row,
            features: JSON.parse(row.features)
          } : null);
        }
      });
    });
  }

  // Utility methods
  generateApiKey() {
    const { v4: uuidv4 } = require('uuid');
    return `wapi_${uuidv4().replace(/-/g, '')}`;
  }

  async checkUserLimit(userId) {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const plan = await this.getSubscriptionPlan(user.subscription_tier);
    if (!plan) {
      throw new Error('Subscription plan not found');
    }

    const monthlyUsage = await this.getUserMonthlyUsage(userId);
    return {
      currentUsage: monthlyUsage,
      limit: plan.monthly_limit,
      remaining: Math.max(0, plan.monthly_limit - monthlyUsage),
      canMakeRequest: monthlyUsage < plan.monthly_limit
    };
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;
