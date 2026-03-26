const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const CurrentWeatherAgent = require('./currentWeatherAgent');
const ForecastAgent = require('./forecastAgent');
const HistoricalWeatherAgent = require('./historicalWeatherAgent');
const RecommendationAgent = require('./recommendationAgent');
const AlertAgent = require('./alertAgent');

class MainResponseAgent {
  constructor(openaiApiKey, weatherApiKey) {
    this.llm = new ChatOpenAI({
      openAIApiKey: openaiApiKey,
      modelName: 'gpt-3.5-turbo',
      temperature: 0.2
    });
    
    // Initialize all specialized agents
    this.currentWeatherAgent = new CurrentWeatherAgent(openaiApiKey, weatherApiKey);
    this.forecastAgent = new ForecastAgent(openaiApiKey, weatherApiKey);
    this.historicalWeatherAgent = new HistoricalWeatherAgent(openaiApiKey, weatherApiKey);
    this.recommendationAgent = new RecommendationAgent(openaiApiKey, weatherApiKey);
    this.alertAgent = new AlertAgent(openaiApiKey, weatherApiKey);
    
    this.systemPrompt = `You are the Main Response Agent, the coordinator of a multi-agent weather system.
    
Your responsibilities:
1. Analyze user queries and determine which agents to involve
2. Coordinate responses from multiple specialized agents
3. Synthesize information into a comprehensive, coherent response
4. Ensure all relevant weather information is included
5. Provide a unified, user-friendly experience

You work with these specialized agents:
- CurrentWeatherAgent: Real-time weather data
- ForecastAgent: Weather predictions and trends
- HistoricalWeatherAgent: Past weather data and analysis
- RecommendationAgent: Personalized insights and recommendations
- AlertAgent: Weather alerts and notifications

Always provide a well-structured, comprehensive response that addresses all aspects of the user's query.`;
  }

  async processRequest(userQuery, city, options = {}) {
    try {
      const agentResponses = {};
      const agentTasks = [];

      // Analyze query to determine which agents to involve
      const queryAnalysis = await this.analyzeQuery(userQuery);
      
      // Execute tasks for each required agent
      if (queryAnalysis.needsCurrentWeather) {
        agentTasks.push(
          this.currentWeatherAgent.processRequest(userQuery, city)
            .then(response => { agentResponses.currentWeather = response; })
        );
      }

      if (queryAnalysis.needsForecast) {
        const days = queryAnalysis.forecastDays || 5;
        agentTasks.push(
          this.forecastAgent.processRequest(userQuery, city, days)
            .then(response => { agentResponses.forecast = response; })
        );
      }

      if (queryAnalysis.needsHistorical) {
        const date = queryAnalysis.historicalDate || new Date().toISOString().split('T')[0];
        agentTasks.push(
          this.historicalWeatherAgent.processRequest(userQuery, city, date)
            .then(response => { agentResponses.historical = response; })
        );
      }

      if (queryAnalysis.needsRecommendations) {
        agentTasks.push(
          this.recommendationAgent.processRequest(userQuery, city, options.userPreferences || {})
            .then(response => { agentResponses.recommendations = response; })
        );
      }

      if (queryAnalysis.needsAlerts) {
        agentTasks.push(
          this.alertAgent.processRequest(userQuery, city, options.alertPreferences || {})
            .then(response => { agentResponses.alerts = response; })
        );
      }

      // Wait for all agent tasks to complete
      await Promise.all(agentTasks);

      // Generate final comprehensive response
      const finalResponse = await this.generateFinalResponse(userQuery, agentResponses, city);

      return {
        agent: 'MainResponseAgent',
        query: userQuery,
        city: city,
        agentResponses: agentResponses,
        finalResponse: finalResponse,
        queryAnalysis: queryAnalysis,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        agent: 'MainResponseAgent',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async analyzeQuery(userQuery) {
    const query = userQuery.toLowerCase();
    
    return {
      needsCurrentWeather: query.includes('current') || query.includes('now') || query.includes('today') || 
                          query.includes('temperature') || query.includes('weather') || query.includes('conditions'),
      needsForecast: query.includes('forecast') || query.includes('tomorrow') || query.includes('week') || 
                    query.includes('future') || query.includes('prediction') || query.includes('upcoming'),
      needsHistorical: query.includes('historical') || query.includes('past') || query.includes('yesterday') || 
                      query.includes('last year') || query.includes('previous') || query.includes('compare'),
      needsRecommendations: query.includes('recommend') || query.includes('suggest') || query.includes('what to do') || 
                           query.includes('what to wear') || query.includes('activity') || query.includes('activities') || query.includes('clothing') ||
                           query.includes('travel') || query.includes('plan') || query.includes('advice') ||
                           query.includes('insight') || query.includes('tip'),
      needsAlerts: query.includes('alert') || query.includes('alerts') || query.includes('warning') || query.includes('warnings') || query.includes('severe') || query.includes('dangerous') || query.includes('emergency') || query.includes('storm') ||
                   query.includes('flood') || query.includes('tornado') || query.includes('hurricane') ||
                   query.includes('heat wave') || query.includes('cold snap') || query.includes('notification') || 
                   query.includes('storms') || query.includes('severe weather'),
      forecastDays: this.extractForecastDays(query),
      historicalDate: this.extractHistoricalDate(query)
    };
  }

  extractForecastDays(query) {
    const dayMatches = query.match(/(\d+)\s*(day|days)/);
    if (dayMatches) {
      return parseInt(dayMatches[1]);
    }
    return 5; // default
  }

  extractHistoricalDate(query) {
    // Simple date extraction - could be enhanced with more sophisticated parsing
    const dateMatches = query.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatches) {
      return dateMatches[1];
    }
    return null;
  }

  async generateFinalResponse(userQuery, agentResponses, city) {
    const messages = [
      new SystemMessage(this.systemPrompt),
      new HumanMessage(`
User Query: ${userQuery}
City: ${city}

Agent Responses:
${JSON.stringify(agentResponses, null, 2)}

Please provide a comprehensive, well-structured response that:
1. Addresses all aspects of the user's query
2. Integrates information from all relevant agents
3. Provides a coherent narrative
4. Includes actionable insights and recommendations
5. Is conversational and user-friendly

Structure the response logically and ensure it flows naturally from one topic to the next.
      `)
    ];

    const response = await this.llm.invoke(messages);
    return response.content;
  }

  async getAgentCapabilities() {
    const capabilities = await Promise.all([
      this.currentWeatherAgent.getAgentCapabilities(),
      this.forecastAgent.getAgentCapabilities(),
      this.historicalWeatherAgent.getAgentCapabilities(),
      this.recommendationAgent.getAgentCapabilities(),
      this.alertAgent.getAgentCapabilities()
    ]);

    return {
      name: 'MainResponseAgent',
      description: 'Coordinates multiple specialized weather agents to provide comprehensive weather information',
      capabilities: [
        'Query analysis and routing',
        'Multi-agent coordination',
        'Response synthesis',
        'Comprehensive weather reporting',
        'User query understanding'
      ],
      subAgents: capabilities
    };
  }
}

module.exports = MainResponseAgent;
