const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const WeatherWorkflow = require('./workflows/weatherWorkflow');
const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscriptions');
const { 
  authenticateToken, 
  authenticateApiKey, 
  checkUsageLimit, 
  trackApiUsage,
  optionalAuth,
  createRateLimiter
} = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize the weather workflow
const weatherWorkflow = new WeatherWorkflow(
  process.env.OPENAI_API_KEY,
  process.env.OPENWEATHER_API_KEY
);

// Rate limiting for public endpoints
const publicRateLimit = createRateLimiter(15 * 60 * 1000, 50, 'Too many requests from this IP');

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Weather Multi-Agent System'
  });
});

app.get('/api/workflow-info', async (req, res) => {
  try {
    const info = await weatherWorkflow.getWorkflowInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get workflow info',
      message: error.message
    });
  }
});

app.post('/api/weather', publicRateLimit, optionalAuth, checkUsageLimit, async (req, res) => {
  try {
    const { query, city, options = {} } = req.body;
    
    if (!query || !city) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Both query and city are required'
      });
    }

    console.log(`Processing weather request: "${query}" for city: ${city}`);
    
    const result = await weatherWorkflow.processRequest(query, city, options);
    
    res.json({
      success: result.success,
      response: result.response,
      agentResponses: result.agentResponses,
      queryAnalysis: result.queryAnalysis,
      metadata: result.metadata,
      error: result.error,
      usage: req.usageInfo
    });
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}, trackApiUsage);

app.post('/api/dashboard/weather', publicRateLimit, optionalAuth, checkUsageLimit, async (req, res) => {
  try {
    const { city } = req.body;
    
    if (!city) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'City is required'
      });
    }

    console.log(`Processing dashboard weather request for city: ${city}`);
    
    // Get both current weather and forecast for dashboard
    const currentQuery = 'What is the current weather and temperature?';
    const forecastQuery = 'What is the weather forecast for the next 3 days?';
    
    const [currentResult, forecastResult] = await Promise.all([
      weatherWorkflow.processRequest(currentQuery, city),
      weatherWorkflow.processRequest(forecastQuery, city)
    ]);
    
    res.json({
      success: currentResult.success && forecastResult.success,
      currentWeather: currentResult.agentResponses?.currentWeather,
      forecast: forecastResult.agentResponses?.forecast,
      metadata: {
        current: currentResult.metadata,
        forecast: forecastResult.metadata
      },
      error: currentResult.error || forecastResult.error,
      usage: req.usageInfo
    });
  } catch (error) {
    console.error('Dashboard weather API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}, trackApiUsage);

app.post('/api/recommendations', publicRateLimit, optionalAuth, checkUsageLimit, async (req, res) => {
  try {
    const { city, query, userPreferences = {} } = req.body;

    if (!city || !query) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Both city and query are required'
      });
    }

    console.log(`Processing recommendations request: "${query}" for city: ${city}`);

    const result = await weatherWorkflow.processRequest(query, city, { userPreferences });

    res.json({
      success: result.success,
      recommendations: result.agentResponses?.recommendations,
      currentWeather: result.agentResponses?.currentWeather,
      forecast: result.agentResponses?.forecast,
      metadata: result.metadata,
      error: result.error,
      usage: req.usageInfo
    });
  } catch (error) {
    console.error('Recommendations API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}, trackApiUsage);

app.post('/api/alerts', publicRateLimit, optionalAuth, checkUsageLimit, async (req, res) => {
  try {
    const { city, query, alertPreferences = {} } = req.body;

    if (!city || !query) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Both city and query are required'
      });
    }

    console.log(`Processing alerts request: "${query}" for city: ${city}`);

    const result = await weatherWorkflow.processRequest(query, city, { alertPreferences });

    res.json({
      success: result.success,
      alerts: result.agentResponses?.alerts,
      currentWeather: result.agentResponses?.currentWeather,
      metadata: result.metadata,
      error: result.error,
      usage: req.usageInfo
    });
  } catch (error) {
    console.error('Alerts API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}, trackApiUsage);

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Weather Multi-Agent Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Web interface: http://localhost:${PORT}`);
  
  // Check if required environment variables are set
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY not set. Please add it to your .env file.');
  }
  if (!process.env.OPENWEATHER_API_KEY) {
    console.warn('⚠️  OPENWEATHER_API_KEY not set. Please add it to your .env file.');
  }
});

module.exports = app;
