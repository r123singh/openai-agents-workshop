const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const WeatherTools = require('./weatherTools');

class HistoricalWeatherAgent {
  constructor(openaiApiKey, weatherApiKey) {
    this.llm = new ChatOpenAI({
      openAIApiKey: openaiApiKey,
      modelName: 'gpt-3.5-turbo',
      temperature: 0.1
    });
    
    this.weatherTools = new WeatherTools(weatherApiKey);
    
    this.systemPrompt = `You are a Historical Weather Agent specialized in providing historical weather data and analysis.
    
Your responsibilities:
1. Get historical weather data for any city and date
2. Analyze weather patterns over time
3. Compare historical data with current conditions
4. Provide insights about weather trends and climate patterns
5. Format historical information in an engaging way

Always provide context about historical weather patterns and explain their significance.`;
  }

  async processRequest(userQuery, city, date) {
    try {
      // Get historical weather data
      const historicalData = await this.weatherTools.getHistoricalWeather(city, date);
      
      // Create context for the LLM
      const context = {
        historicalData,
        userQuery,
        city,
        date
      };
      
      // Generate response using LLM
      const response = await this.generateResponse(context);
      
      return {
        agent: 'HistoricalWeatherAgent',
        data: historicalData,
        response: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        agent: 'HistoricalWeatherAgent',
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

Historical Weather Data for ${context.city} on ${context.date}:
${JSON.stringify(context.historicalData, null, 2)}

Please provide a comprehensive analysis of the historical weather data. Include:
1. Summary of weather conditions on that date
2. Comparison with typical weather patterns for that time of year
3. Any notable weather events or anomalies
4. Historical context and significance
5. Insights about climate patterns

Make it engaging and provide historical context that helps understand the weather patterns.
      `)
    ];

    const response = await this.llm.invoke(messages);
    return response.content;
  }

  async compareWithCurrent(historicalData, currentData) {
    const comparison = {
      temperature: {
        historical: historicalData.temperature,
        current: currentData.temperature,
        difference: currentData.temperature - historicalData.temperature.avg
      },
      humidity: {
        historical: historicalData.humidity,
        current: currentData.humidity,
        difference: currentData.humidity - historicalData.humidity
      },
      pressure: {
        historical: historicalData.pressure,
        current: currentData.pressure,
        difference: currentData.pressure - historicalData.pressure
      }
    };

    return comparison;
  }

  async getAgentCapabilities() {
    return {
      name: 'HistoricalWeatherAgent',
      description: 'Provides historical weather data and analysis for any city',
      capabilities: [
        'Get historical weather data for specific dates',
        'Analyze weather patterns over time',
        'Compare historical vs current conditions',
        'Identify climate trends',
        'Provide historical context',
        'Analyze weather anomalies'
      ],
      tools: ['getHistoricalWeather', 'compareWithCurrent']
    };
  }
}

module.exports = HistoricalWeatherAgent;
