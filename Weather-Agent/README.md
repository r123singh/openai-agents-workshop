# 🌤️ Weather Multi-Agent System

A sophisticated weather application powered by **LangGraph.js** and **OpenAI**, featuring a multi-agent architecture that provides comprehensive weather information, AI-powered insights, and real-time alerts.

## 🚀 Features

### Core Weather Features
- **Multi-Agent Weather Analysis**: Coordinated agents for current weather, forecasts, historical data, and alerts
- **AI-Powered Recommendations**: Personalized weather insights and activity suggestions
- **Real-time Weather Dashboard**: Live weather monitoring with auto-refresh
- **Weather Alerts & Notifications**: Advanced alert system with custom thresholds
- **Historical Weather Analysis**: Past weather data comparison and trends

### Authentication & Subscription System
- **User Registration & Login**: Secure JWT-based authentication
- **Subscription Tiers**: Free, Pro, and Enterprise plans with different API limits
- **Usage Tracking**: Real-time API usage monitoring and limits
- **Account Management**: Profile management, password reset, API key generation
- **Rate Limiting**: Intelligent rate limiting based on subscription tier

## 🏗️ Architecture

### Multi-Agent System
- **MainResponseAgent**: Coordinates all specialized agents
- **CurrentWeatherAgent**: Real-time weather data processing
- **ForecastAgent**: Weather predictions and trend analysis
- **HistoricalWeatherAgent**: Past weather data analysis
- **RecommendationAgent**: AI-powered personalized insights
- **AlertAgent**: Weather alerts and notification management

### Technology Stack
- **Backend**: Node.js, Express.js, LangGraph.js
- **AI/ML**: OpenAI GPT-3.5-turbo, LangChain.js
- **Database**: SQLite with custom ORM
- **Authentication**: JWT, bcrypt, express-validator
- **Weather API**: OpenWeatherMap
- **Frontend**: HTML5, CSS3, Vanilla JavaScript

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key
- OpenWeatherMap API key

### Setup
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd weather-multi-agent-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your API keys:
   ```env
   # OpenAI API Key
   OPENAI_API_KEY=your_openai_api_key_here
   
   # OpenWeatherMap API Key
   OPENWEATHER_API_KEY=your_openweather_api_key_here
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Authentication & Security
   JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random
   JWT_EXPIRES_IN=7d
   BCRYPT_ROUNDS=12
   
   # Database
   DATABASE_URL=./data/weather_app.db
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   
   # Subscription Plans
   FREE_TIER_LIMIT=100
   PRO_TIER_LIMIT=1000
   ENTERPRISE_TIER_LIMIT=10000
   ```

4. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

5. **Access the application**
   - Web Interface: http://localhost:3000
   - Health Check: http://localhost:3000/api/health

## 🔐 Authentication System

### User Registration
```bash
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### User Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Authentication Headers
For authenticated requests, include the JWT token:
```bash
Authorization: Bearer <your_jwt_token>
```

## 💳 Subscription Plans

### Free Tier
- **Monthly Limit**: 100 API calls
- **Features**: Basic weather queries, current weather, 3-day forecast
- **Price**: Free

### Pro Tier
- **Monthly Limit**: 1,000 API calls
- **Features**: All Free features + Extended forecasts, Historical data, AI recommendations, Weather alerts
- **Price**: $9.99/month or $99.99/year

### Enterprise Tier
- **Monthly Limit**: 10,000 API calls
- **Features**: All Pro features + Unlimited API calls, Custom integrations, White-label options
- **Price**: $49.99/month or $499.99/year

## 🌐 API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/subscriptions/plans` - Get subscription plans
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request

### Authenticated Endpoints
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/regenerate-api-key` - Regenerate API key
- `GET /api/subscriptions/current` - Get current subscription
- `GET /api/subscriptions/usage` - Get usage statistics
- `POST /api/subscriptions/upgrade` - Upgrade subscription
- `POST /api/subscriptions/cancel` - Cancel subscription

### Weather API Endpoints
All weather endpoints support both JWT authentication and API key authentication:

#### JWT Authentication
```bash
Authorization: Bearer <jwt_token>
```

#### API Key Authentication
```bash
X-API-Key: <your_api_key>
# or
?api_key=<your_api_key>
```

- `POST /api/weather` - General weather queries
- `POST /api/dashboard/weather` - Dashboard-optimized weather data
- `POST /api/recommendations` - AI-powered weather recommendations
- `POST /api/alerts` - Weather alerts and notifications

## 🎯 Usage Examples

### Basic Weather Query
```bash
curl -X POST http://localhost:3000/api/weather \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "London",
    "query": "What is the current weather and 3-day forecast?"
  }'
```

### AI Recommendations
```bash
curl -X POST http://localhost:3000/api/recommendations \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "New York",
    "query": "What should I wear today and what activities are recommended?",
    "userPreferences": {
      "activities": ["hiking", "dining"],
      "clothing": ["casual", "outdoor"]
    }
  }'
```

### Weather Alerts
```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Miami",
    "query": "Are there any severe weather alerts?",
    "alertPreferences": {
      "temperature": {
        "maxTemp": 35,
        "minTemp": 10
      },
      "alertTypes": {
        "STORM": true,
        "FLOOD": true
      }
    }
  }'
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
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
);
```

### API Usage Tracking
```sql
CREATE TABLE api_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## 🔧 Development

### Project Structure
```
├── agents/                 # Multi-agent system
│   ├── mainResponseAgent.js
│   ├── currentWeatherAgent.js
│   ├── forecastAgent.js
│   ├── historicalWeatherAgent.js
│   ├── recommendationAgent.js
│   ├── alertAgent.js
│   └── weatherTools.js
├── workflows/              # LangGraph workflows
│   └── weatherWorkflow.js
├── routes/                 # API routes
│   ├── auth.js
│   └── subscriptions.js
├── middleware/             # Express middleware
│   └── auth.js
├── database/               # Database layer
│   └── database.js
├── public/                 # Frontend files
│   ├── index.html
│   ├── dashboard.html
│   ├── login.html
│   ├── recommendations.html
│   ├── alerts.html
│   └── *.css, *.js
└── server.js              # Main server file
```

### Running Tests
```bash
npm test
```

### Development Mode
```bash
npm run dev
```

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set in production:
- `OPENAI_API_KEY`
- `OPENWEATHER_API_KEY`
- `JWT_SECRET` (use a strong, random secret)
- `NODE_ENV=production`

### Database
The application uses SQLite by default. For production, consider:
- Using PostgreSQL or MySQL for better performance
- Setting up database backups
- Implementing connection pooling

### Security Considerations
- Use HTTPS in production
- Set up proper CORS configuration
- Implement request validation
- Use environment variables for sensitive data
- Regular security updates

## 📈 Monitoring & Analytics

### Usage Tracking
- API call monitoring per user
- Subscription tier analytics
- Popular endpoints tracking
- Error rate monitoring

### Performance Metrics
- Response time monitoring
- Agent execution time tracking
- Database query performance
- Memory usage optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API examples

## 🔮 Roadmap

- [ ] Stripe payment integration
- [ ] Email notifications
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] White-label solutions
- [ ] API marketplace
- [ ] Machine learning model training
- [ ] Weather data caching
- [ ] Multi-language support
- [ ] Advanced alert rules engine

---

**Built with ❤️ using LangGraph.js, OpenAI, and modern web technologies**
