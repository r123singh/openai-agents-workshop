const { StateGraph, END } = require('@langchain/langgraph');
const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const MainResponseAgent = require('../agents/mainResponseAgent');

class WeatherWorkflow {
  constructor(openaiApiKey, weatherApiKey) {
    this.openaiApiKey = openaiApiKey;
    this.weatherApiKey = weatherApiKey;
    this.mainAgent = new MainResponseAgent(openaiApiKey, weatherApiKey);
    
    // Initialize the workflow
    this.workflow = this.createWorkflow();
  }

  createWorkflow() {
    // Define the state schema
    const stateSchema = {
      userQuery: { type: 'string' },
      city: { type: 'string' },
      options: { type: 'object', default: {} },
      queryAnalysis: { type: 'object', default: {} },
      agentResponses: { type: 'object', default: {} },
      finalResponse: { type: 'string', default: '' },
      error: { type: 'string', default: '' },
      metadata: { type: 'object', default: {} }
    };

    // Create the state graph
    const workflow = new StateGraph({
      channels: stateSchema
    });

    // Add nodes
    workflow.addNode('analyze_query', this.analyzeQueryNode.bind(this));
    workflow.addNode('route_to_agents', this.routeToAgentsNode.bind(this));
    workflow.addNode('synthesize_response', this.synthesizeResponseNode.bind(this));
    workflow.addNode('handle_error', this.handleErrorNode.bind(this));

    // Set the entry point
    workflow.setEntryPoint('analyze_query');

    // Add conditional edges
    workflow.addConditionalEdges(
      'analyze_query',
      this.shouldContinue.bind(this),
      {
        'continue': 'route_to_agents',
        'error': 'handle_error'
      }
    );

    workflow.addConditionalEdges(
      'route_to_agents',
      this.shouldSynthesize.bind(this),
      {
        'synthesize': 'synthesize_response',
        'error': 'handle_error'
      }
    );

    // Add final edges
    workflow.addEdge('synthesize_response', END);
    workflow.addEdge('handle_error', END);

    return workflow.compile();
  }

  async analyzeQueryNode(state) {
    try {
      const { userQuery, city } = state;
      
      // Use the main agent to analyze the query
      const queryAnalysis = await this.mainAgent.analyzeQuery(userQuery);
      
      return {
        ...state,
        queryAnalysis,
        metadata: {
          ...state.metadata,
          analysisTimestamp: new Date().toISOString(),
          analysisComplete: true
        }
      };
    } catch (error) {
      return {
        ...state,
        error: `Query analysis failed: ${error.message}`,
        metadata: {
          ...state.metadata,
          errorTimestamp: new Date().toISOString()
        }
      };
    }
  }

  async routeToAgentsNode(state) {
    try {
      const { userQuery, city, queryAnalysis, options } = state;
      const agentResponses = {};

      // Execute tasks for each required agent
      const agentTasks = [];

      if (queryAnalysis.needsCurrentWeather) {
        agentTasks.push(
          this.mainAgent.currentWeatherAgent.processRequest(userQuery, city)
            .then(response => { agentResponses.currentWeather = response; })
        );
      }

      if (queryAnalysis.needsForecast) {
        const days = queryAnalysis.forecastDays || 5;
        agentTasks.push(
          this.mainAgent.forecastAgent.processRequest(userQuery, city, days)
            .then(response => { agentResponses.forecast = response; })
        );
      }

      if (queryAnalysis.needsHistorical) {
        const date = queryAnalysis.historicalDate || new Date().toISOString().split('T')[0];
        agentTasks.push(
          this.mainAgent.historicalWeatherAgent.processRequest(userQuery, city, date)
            .then(response => { agentResponses.historical = response; })
        );
      }

      if (queryAnalysis.needsRecommendations) {
        agentTasks.push(
          this.mainAgent.recommendationAgent.processRequest(userQuery, city, (options && options.userPreferences) || {})
            .then(response => { agentResponses.recommendations = response; })
        );
      }

      if (queryAnalysis.needsAlerts) {
        agentTasks.push(
          this.mainAgent.alertAgent.processRequest(userQuery, city, (options && options.alertPreferences) || {})
            .then(response => { agentResponses.alerts = response; })
        );
      }

      // Wait for all agent tasks to complete
      await Promise.all(agentTasks);

      return {
        ...state,
        agentResponses,
        metadata: {
          ...state.metadata,
          agentExecutionTimestamp: new Date().toISOString(),
          agentsExecuted: Object.keys(agentResponses)
        }
      };
    } catch (error) {
      return {
        ...state,
        error: `Agent execution failed: ${error.message}`,
        metadata: {
          ...state.metadata,
          errorTimestamp: new Date().toISOString()
        }
      };
    }
  }

  async synthesizeResponseNode(state) {
    try {
      const { userQuery, city, agentResponses } = state;
      
      // Generate final comprehensive response
      const finalResponse = await this.mainAgent.generateFinalResponse(userQuery, agentResponses, city);
      
      return {
        ...state,
        finalResponse,
        metadata: {
          ...state.metadata,
          synthesisTimestamp: new Date().toISOString(),
          workflowComplete: true
        }
      };
    } catch (error) {
      return {
        ...state,
        error: `Response synthesis failed: ${error.message}`,
        metadata: {
          ...state.metadata,
          errorTimestamp: new Date().toISOString()
        }
      };
    }
  }

  async handleErrorNode(state) {
    // Log error and return error state
    console.error('Workflow error:', state.error);
    
    return {
      ...state,
      finalResponse: `I apologize, but I encountered an error while processing your request: ${state.error}. Please try again or rephrase your question.`,
      metadata: {
        ...state.metadata,
        errorHandled: true,
        errorHandledTimestamp: new Date().toISOString()
      }
    };
  }

  shouldContinue(state) {
    return state.error ? 'error' : 'continue';
  }

  shouldSynthesize(state) {
    return state.error ? 'error' : 'synthesize';
  }

  async processRequest(userQuery, city, options = {}) {
    try {
      const initialState = {
        userQuery,
        city,
        options: options || {},
        queryAnalysis: {},
        agentResponses: {},
        finalResponse: '',
        error: '',
        metadata: {
          startTimestamp: new Date().toISOString(),
          workflowVersion: '1.0'
        }
      };

      const result = await this.workflow.invoke(initialState);
      
      return {
        success: !result.error,
        response: result.finalResponse,
        agentResponses: result.agentResponses,
        queryAnalysis: result.queryAnalysis,
        metadata: result.metadata,
        error: result.error || null
      };
    } catch (error) {
      return {
        success: false,
        response: `Workflow execution failed: ${error.message}`,
        error: error.message,
        metadata: {
          errorTimestamp: new Date().toISOString()
        }
      };
    }
  }

  async getWorkflowInfo() {
    return {
      name: 'Weather Multi-Agent Workflow',
      description: 'A LangGraph workflow that coordinates multiple weather agents',
      version: '1.0',
      nodes: ['analyze_query', 'route_to_agents', 'synthesize_response', 'handle_error'],
      agents: await this.mainAgent.getAgentCapabilities()
    };
  }
}

module.exports = WeatherWorkflow;
