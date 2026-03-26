const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const WeatherTools = require('./weatherTools');

class ForecastAgent {
  constructor(openaiApiKey, weatherApiKey) {
    this.llm = new ChatOpenAI({
      openAIApiKey: openaiApiKey,
      modelName: 'gpt-3.5-turbo',
      temperature: 0.1
    });
    
    this.weatherTools = new WeatherTools(weatherApiKey);
    
    this.systemPrompt = `You are a Weather Forecast Agent specialized in providing weather predictions and forecasts.
    
Your responsibilities:
1. Get weather forecasts for any city (up to 5 days)
2. Analyze weather trends and patterns
3. Provide recommendations based on forecast
4. Identify potential weather events or changes
5. Format forecast information clearly and understandably

Always provide accurate forecast information and explain what the weather patterns mean for planning purposes.`;
  }

  async processRequest(userQuery, city, days = 5) {
    try {
      // Get weather forecast data
      const forecastData = await this.weatherTools.getWeatherForecast(city, days);
      
      // Create context for the LLM
      const context = {
        forecastData,
        userQuery,
        days
      };
      
      // Generate response using LLM
      const response = await this.generateResponse(context);
      
      return {
        agent: 'ForecastAgent',
        data: forecastData,
        response: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        agent: 'ForecastAgent',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async generateResponse(context) {
    const messages = [
      new SystemMessage(this.systemPrompt),
      new HumanMessage(`
User Query: ${context.userQuery}

Forecast Data for ${context.days} days:
${JSON.stringify(context.forecastData, null, 2)}

Please provide a comprehensive weather forecast analysis. Include:
1. Temperature trends over the forecast period
2. Precipitation probability and patterns
3. Wind conditions
4. Any significant weather changes
5. Recommendations for planning activities

Make it conversational and provide actionable insights based on the forecast.
      `)
    ];

    const response = await this.llm.invoke(messages);
    return response.content;
  }

  async analyzeTrends(forecastData) {
    const temperatures = forecastData.forecasts.map(f => f.temperature);
    const avgTemp = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
    const maxTemp = Math.max(...temperatures);
    const minTemp = Math.min(...temperatures);
    
    const precipitation = forecastData.forecasts.map(f => f.pop);
    const avgPrecipitation = precipitation.reduce((a, b) => a + b, 0) / precipitation.length;
    
    return {
      temperatureTrend: {
        average: avgTemp,
        maximum: maxTemp,
        minimum: minTemp,
        range: maxTemp - minTemp
      },
      precipitationTrend: {
        average: avgPrecipitation,
        maxProbability: Math.max(...precipitation)
      }
    };
  }

  async getAgentCapabilities() {
    return {
      name: 'ForecastAgent',
      description: 'Provides weather forecasts and predictions for any city',
      capabilities: [
        'Get 5-day weather forecasts',
        'Analyze temperature trends',
        'Predict precipitation patterns',
        'Identify weather changes',
        'Provide planning recommendations',
        'Analyze wind patterns'
      ],
      tools: ['getWeatherForecast', 'analyzeTrends']
    };
  }
}

module.exports = ForecastAgent;
