const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const WeatherTools = require('./weatherTools');

class CurrentWeatherAgent {
  constructor(openaiApiKey, weatherApiKey) {
    this.llm = new ChatOpenAI({
      openAIApiKey: openaiApiKey,
      modelName: 'gpt-3.5-turbo',
      temperature: 0.1
    });
    
    this.weatherTools = new WeatherTools(weatherApiKey);
    
    this.systemPrompt = `You are a Current Weather Agent specialized in providing real-time weather information.
    
Your responsibilities:
1. Get current weather data for any city
2. Provide detailed weather analysis
3. Format weather information in a user-friendly way
4. Include relevant weather alerts if available

Always provide accurate, up-to-date information and explain weather conditions clearly.`;
  }

  async processRequest(userQuery, city) {
    try {
      // Get current weather data
      const currentWeather = await this.weatherTools.getCurrentWeather(city);
      const weatherAlerts = await this.weatherTools.getWeatherAlerts(city);
      
      // Create context for the LLM
      const context = {
        currentWeather,
        weatherAlerts,
        userQuery
      };
      
      // Generate response using LLM
      const response = await this.generateResponse(context);
      
      return {
        agent: 'CurrentWeatherAgent',
        data: currentWeather,
        alerts: weatherAlerts,
        response: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        agent: 'CurrentWeatherAgent',
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

Current Weather Data:
${JSON.stringify(context.currentWeather, null, 2)}

Weather Alerts:
${JSON.stringify(context.weatherAlerts, null, 2)}

Please provide a comprehensive response about the current weather conditions. Include temperature, humidity, wind, visibility, and any relevant alerts. Make it conversational and informative.
      `)
    ];

    const response = await this.llm.invoke(messages);
    return response.content;
  }

  async getAgentCapabilities() {
    return {
      name: 'CurrentWeatherAgent',
      description: 'Provides real-time current weather information for any city',
      capabilities: [
        'Get current temperature, humidity, pressure',
        'Get wind speed and direction',
        'Get weather description and conditions',
        'Get sunrise and sunset times',
        'Get weather alerts and warnings',
        'Provide detailed weather analysis'
      ],
      tools: ['getCurrentWeather', 'getWeatherAlerts']
    };
  }
}

module.exports = CurrentWeatherAgent;
