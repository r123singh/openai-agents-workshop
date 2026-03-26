const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const WeatherTools = require('./weatherTools');

class RecommendationAgent {
  constructor(openaiApiKey, weatherApiKey) {
    this.llm = new ChatOpenAI({
      openAIApiKey: openaiApiKey,
      modelName: 'gpt-3.5-turbo',
      temperature: 0.3
    });
    
    this.weatherTools = new WeatherTools(weatherApiKey);
    
    this.systemPrompt = `You are a Weather Recommendation Agent specialized in providing personalized weather insights and actionable recommendations.

Your responsibilities:
1. Analyze weather conditions and provide activity recommendations
2. Suggest appropriate clothing based on weather
3. Recommend optimal times for outdoor activities
4. Provide travel planning insights
5. Give health-related weather advice
6. Offer seasonal and trend-based insights

Always provide:
- Specific, actionable recommendations
- Reasoning behind your suggestions
- Alternative options for different preferences
- Safety considerations when relevant
- Personalized insights based on user context

Make recommendations conversational, helpful, and practical for daily life.`;
  }

  async processRequest(userQuery, city, userPreferences = {}) {
    try {
      // Get current weather and forecast data
      const [currentWeather, forecastData] = await Promise.all([
        this.weatherTools.getCurrentWeather(city),
        this.weatherTools.getWeatherForecast(city, 5)
      ]);
      
      // Create comprehensive context
      const context = {
        currentWeather,
        forecastData,
        userQuery,
        userPreferences,
        city,
        currentTime: new Date().toISOString()
      };
      
      // Generate personalized recommendations
      const recommendations = await this.generateRecommendations(context);
      
      return {
        agent: 'RecommendationAgent',
        data: {
          currentWeather,
          forecastData,
          recommendations
        },
        response: recommendations.summary,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        agent: 'RecommendationAgent',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async generateRecommendations(context) {
    const messages = [
      new SystemMessage(this.systemPrompt),
      new HumanMessage(`
User Query: ${context.userQuery}
City: ${context.city}
Current Time: ${new Date(context.currentTime).toLocaleString()}

User Preferences:
${JSON.stringify(context.userPreferences, null, 2)}

Current Weather Data:
${JSON.stringify(context.currentWeather, null, 2)}

5-Day Forecast Data:
${JSON.stringify(context.forecastData, null, 2)}

Please provide comprehensive, personalized recommendations including:

1. ACTIVITY RECOMMENDATIONS:
   - What activities are ideal for today's weather?
   - What should be avoided?
   - Best times for outdoor activities
   - Indoor alternatives if weather is poor

2. CLOTHING RECOMMENDATIONS:
   - What to wear today
   - What to pack for the week
   - Special considerations (rain, wind, etc.)

3. TRAVEL & PLANNING INSIGHTS:
   - Best times to travel/commute
   - Weather impact on plans
   - Alternative suggestions

4. HEALTH & SAFETY:
   - Health-related weather advice
   - Safety considerations
   - Special precautions needed

5. SEASONAL INSIGHTS:
   - How today's weather compares to seasonal norms
   - Trend analysis
   - What to expect in coming days

Provide a structured response with clear sections and actionable advice. Make it conversational and helpful.
      `)
    ];

    const response = await this.llm.invoke(messages);
    
    // Parse the response into structured recommendations
    return this.parseRecommendations(response.content, context);
  }

  parseRecommendations(content, context) {
    // Extract structured recommendations from AI response
    const recommendations = {
      activities: this.extractActivityRecommendations(content),
      clothing: this.extractClothingRecommendations(content),
      travel: this.extractTravelRecommendations(content),
      health: this.extractHealthRecommendations(content),
      insights: this.extractInsights(content),
      summary: content
    };

    return recommendations;
  }

  extractActivityRecommendations(content) {
    const activities = {
      recommended: [],
      avoid: [],
      bestTimes: [],
      alternatives: []
    };

    // Extract activity recommendations using regex patterns
    const activityPatterns = {
      recommended: /(?:recommended|ideal|great|perfect).*?(?:for|to|activities?)/gi,
      avoid: /(?:avoid|not recommended|poor|bad).*?(?:for|activities?)/gi,
      bestTimes: /(?:best time|optimal|ideal time).*?(?:for|to)/gi,
      alternatives: /(?:alternative|instead|indoor|backup)/gi
    };
    // Extract activity recommendations using regex patterns

    // Simple extraction - in a real implementation, you'd use more sophisticated parsing
    if (content.toLowerCase().includes('outdoor')) {
      activities.recommended.push('Outdoor activities');
    }
    if (content.toLowerCase().includes('indoor')) {
      activities.alternatives.push('Indoor activities');
    }

    return activities;
  }

  extractClothingRecommendations(content) {
    const clothing = {
      today: [],
      week: [],
      special: []
    };

    // Extract clothing recommendations
    if (content.toLowerCase().includes('jacket') || content.toLowerCase().includes('coat')) {
      clothing.today.push('Light jacket or coat');
    }
    if (content.toLowerCase().includes('umbrella') || content.toLowerCase().includes('rain')) {
      clothing.special.push('Umbrella or rain gear');
    }

    return clothing;
  }

  extractTravelRecommendations(content) {
    const travel = {
      bestTimes: [],
      considerations: [],
      alternatives: []
    };

    // Extract travel insights
    if (content.toLowerCase().includes('commute') || content.toLowerCase().includes('travel')) {
      travel.considerations.push('Check weather impact on travel');
    }

    return travel;
  }

  extractHealthRecommendations(content) {
    const health = {
      advice: [],
      precautions: [],
      considerations: []
    };

    // Extract health-related advice
    if (content.toLowerCase().includes('uv') || content.toLowerCase().includes('sun')) {
      health.precautions.push('Sun protection recommended');
    }
    if (content.toLowerCase().includes('allergy') || content.toLowerCase().includes('pollen')) {
      health.considerations.push('Check pollen levels');
    }

    return health;
  }

  extractInsights(content) {
    const insights = {
      seasonal: [],
      trends: [],
      expectations: []
    };

    // Extract seasonal and trend insights
    if (content.toLowerCase().includes('seasonal') || content.toLowerCase().includes('normal')) {
      insights.seasonal.push('Weather compared to seasonal norms');
    }
    if (content.toLowerCase().includes('trend') || content.toLowerCase().includes('pattern')) {
      insights.trends.push('Weather pattern analysis');
    }

    return insights;
  }

  async getActivityScore(weatherData, activity) {
    // Calculate a score (0-100) for how suitable the weather is for a specific activity
    const scores = {
      hiking: this.calculateHikingScore(weatherData),
      beach: this.calculateBeachScore(weatherData),
      cycling: this.calculateCyclingScore(weatherData),
      dining: this.calculateDiningScore(weatherData),
      shopping: this.calculateShoppingScore(weatherData)
    };

    return scores[activity] || 50;
  }

  calculateHikingScore(weatherData) {
    let score = 50;
    
    // Temperature factor (ideal: 15-25°C)
    const temp = weatherData.temperature;
    if (temp >= 15 && temp <= 25) score += 30;
    else if (temp >= 10 && temp <= 30) score += 15;
    
    // Precipitation factor
    if (weatherData.description.toLowerCase().includes('rain')) score -= 40;
    if (weatherData.description.toLowerCase().includes('snow')) score -= 30;
    
    // Wind factor
    if (weatherData.wind_speed < 20) score += 10;
    else if (weatherData.wind_speed > 40) score -= 20;
    
    return Math.max(0, Math.min(100, score));
  }

  calculateBeachScore(weatherData) {
    let score = 50;
    
    // Temperature factor (ideal: 25-35°C)
    const temp = weatherData.temperature;
    if (temp >= 25 && temp <= 35) score += 30;
    else if (temp >= 20 && temp <= 40) score += 15;
    
    // Precipitation factor
    if (weatherData.description.toLowerCase().includes('rain')) score -= 50;
    if (weatherData.description.toLowerCase().includes('storm')) score -= 60;
    
    // Wind factor
    if (weatherData.wind_speed < 15) score += 10;
    else if (weatherData.wind_speed > 30) score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }

  calculateCyclingScore(weatherData) {
    let score = 50;
    
    // Temperature factor (ideal: 15-25°C)
    const temp = weatherData.temperature;
    if (temp >= 15 && temp <= 25) score += 25;
    else if (temp >= 10 && temp <= 30) score += 10;
    
    // Precipitation factor
    if (weatherData.description.toLowerCase().includes('rain')) score -= 30;
    if (weatherData.description.toLowerCase().includes('snow')) score -= 40;
    
    // Wind factor
    if (weatherData.wind_speed < 15) score += 15;
    else if (weatherData.wind_speed > 25) score -= 20;
    
    return Math.max(0, Math.min(100, score));
  }

  calculateDiningScore(weatherData) {
    let score = 70; // Base score for dining
    
    // Temperature factor
    const temp = weatherData.temperature;
    if (temp >= 15 && temp <= 25) score += 20; // Perfect for outdoor dining
    else if (temp < 10 || temp > 35) score -= 10; // Too extreme
    
    // Precipitation factor
    if (weatherData.description.toLowerCase().includes('rain')) score -= 20;
    if (weatherData.description.toLowerCase().includes('storm')) score -= 30;
    
    return Math.max(0, Math.min(100, score));
  }

  calculateShoppingScore(weatherData) {
    let score = 60; // Base score for shopping
    
    // Precipitation factor (indoor activity, so rain is actually good)
    if (weatherData.description.toLowerCase().includes('rain')) score += 20;
    if (weatherData.description.toLowerCase().includes('storm')) score += 10;
    
    // Temperature factor (extreme weather drives people indoors)
    const temp = weatherData.temperature;
    if (temp < 5 || temp > 35) score += 15;
    
    return Math.max(0, Math.min(100, score));
  }

  async getAgentCapabilities() {
    return {
      name: 'RecommendationAgent',
      description: 'Provides personalized weather insights and actionable recommendations',
      capabilities: [
        'Activity recommendations based on weather',
        'Clothing suggestions for current conditions',
        'Travel planning insights',
        'Health-related weather advice',
        'Seasonal trend analysis',
        'Personalized recommendations',
        'Safety considerations',
        'Alternative activity suggestions'
      ],
      tools: ['getCurrentWeather', 'getWeatherForecast', 'getActivityScore']
    };
  }
}

module.exports = RecommendationAgent;
