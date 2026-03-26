const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const WeatherTools = require('./weatherTools');

class AlertAgent {
  constructor(openaiApiKey, weatherApiKey) {
    this.openaiApiKey = openaiApiKey;
    this.weatherApiKey = weatherApiKey;
    this.llm = new ChatOpenAI({
      openAIApiKey: openaiApiKey,
      modelName: 'gpt-3.5-turbo',
      temperature: 0.1
    });
    this.weatherTools = new WeatherTools(weatherApiKey);
  }

  async processRequest(userQuery, city, alertPreferences = {}) {
    try {
      console.log(`AlertAgent processing request: "${userQuery}" for city: ${city}`);

      // Get current weather and alerts
      const [currentWeather, weatherAlerts] = await Promise.all([
        this.weatherTools.getCurrentWeather(city),
        this.weatherTools.getWeatherAlerts(city)
      ]);

      // Debug: Log the raw data
      console.log('Current weather data:', JSON.stringify(currentWeather, null, 2));
      console.log('Weather alerts data:', JSON.stringify(weatherAlerts, null, 2));

      // Analyze weather conditions for potential alerts
      const alertAnalysis = await this.analyzeWeatherConditions(currentWeather, alertPreferences);
      
      // Process existing weather alerts
      const processedAlerts = await this.processWeatherAlerts(weatherAlerts, alertPreferences);
      
      // Generate alert recommendations
      const alertRecommendations = await this.generateAlertRecommendations(
        currentWeather, 
        weatherAlerts, 
        alertAnalysis, 
        alertPreferences
      );

      return {
        success: true,
        data: {
          currentWeather,
          weatherAlerts,
          alertAnalysis,
          processedAlerts,
          alertRecommendations
        },
        metadata: {
          agent: 'AlertAgent',
          timestamp: new Date().toISOString(),
          city,
          alertCount: processedAlerts.length
        }
      };
    } catch (error) {
      console.error('AlertAgent error:', error);
      return {
        success: false,
        error: error.message,
        metadata: {
          agent: 'AlertAgent',
          timestamp: new Date().toISOString(),
          city
        }
      };
    }
  }

  async analyzeWeatherConditions(weatherData, preferences) {
    try {
      const analysis = {
        temperatureAlerts: [],
        precipitationAlerts: [],
        windAlerts: [],
        visibilityAlerts: [],
        uvAlerts: [],
        airQualityAlerts: []
      };

      // Debug: Log the weather data structure
      console.log('Weather data structure:', JSON.stringify(weatherData, null, 2));

      const current = weatherData.current || weatherData.data?.current;
      const alerts = weatherData.alerts?.alerts || [];

      // Temperature analysis
      if (current && current.temp) {
        const temp = current.temp;
        const tempPrefs = preferences.temperature || {};
        
        if (tempPrefs.maxTemp && temp > tempPrefs.maxTemp) {
          analysis.temperatureAlerts.push({
            type: 'HIGH_TEMPERATURE',
            severity: 'WARNING',
            message: `Temperature is ${temp}°C, above your maximum threshold of ${tempPrefs.maxTemp}°C`,
            value: temp,
            threshold: tempPrefs.maxTemp
          });
        }
        
        if (tempPrefs.minTemp && temp < tempPrefs.minTemp) {
          analysis.temperatureAlerts.push({
            type: 'LOW_TEMPERATURE',
            severity: 'WARNING',
            message: `Temperature is ${temp}°C, below your minimum threshold of ${tempPrefs.minTemp}°C`,
            value: temp,
            threshold: tempPrefs.minTemp
          });
        }
      }

      // Precipitation analysis
      if (current && current.rain && current.rain['1h'] > 0) {
        const rainPrefs = preferences.precipitation || {};
        const rainAmount = current.rain['1h'];
        
        if (rainPrefs.maxRain && rainAmount > rainPrefs.maxRain) {
          analysis.precipitationAlerts.push({
            type: 'HEAVY_RAIN',
            severity: 'WARNING',
            message: `Heavy rain detected: ${rainAmount}mm in the last hour`,
            value: rainAmount,
            threshold: rainPrefs.maxRain
          });
        }
      }

      // Wind analysis
      if (current && current.wind_speed) {
        const windPrefs = preferences.wind || {};
        const windSpeed = current.wind_speed;
        
        if (windPrefs.maxWind && windSpeed > windPrefs.maxWind) {
          analysis.windAlerts.push({
            type: 'HIGH_WIND',
            severity: 'WARNING',
            message: `High winds detected: ${windSpeed} m/s`,
            value: windSpeed,
            threshold: windPrefs.maxWind
          });
        }
      }

      // UV Index analysis
      if (current && current.uvi !== undefined) {
        const uvPrefs = preferences.uv || {};
        const uvi = current.uvi;
        
        if (uvi > 7) {
          analysis.uvAlerts.push({
            type: 'HIGH_UV',
            severity: 'WARNING',
            message: `High UV index: ${uvi} - Take sun protection measures`,
            value: uvi,
            threshold: 7
          });
        }
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing weather conditions:', error);
      console.error('Weather data received:', weatherData);
      return { error: error.message };
    }
  }

  async processWeatherAlerts(alertsData, preferences) {
    try {
      const processedAlerts = [];
      const alerts = alertsData.alerts || [];

      for (const alert of alerts) {
        // Check if user wants this type of alert
        const alertType = this.categorizeAlert(alert.event);
        const userPrefs = preferences.alertTypes || {};
        
        if (userPrefs[alertType] !== false) { // Default to true if not specified
          processedAlerts.push({
            id: alert.id || `alert_${Date.now()}_${Math.random()}`,
            type: alertType,
            severity: this.determineSeverity(alert.severity),
            title: alert.event,
            description: alert.description,
            start: alert.start,
            end: alert.end,
            tags: alert.tags || [],
            sender: alert.sender_name,
            urgency: alert.urgency,
            certainty: alert.certainty,
            areas: alert.areas || [],
            metadata: {
              processedAt: new Date().toISOString(),
              userRelevant: true
            }
          });
        }
      }

      return processedAlerts;
    } catch (error) {
      console.error('Error processing weather alerts:', error);
      return [];
    }
  }

  categorizeAlert(eventType) {
    const event = eventType.toLowerCase();
    
    if (event.includes('storm') || event.includes('thunderstorm')) return 'STORM';
    if (event.includes('flood') || event.includes('flooding')) return 'FLOOD';
    if (event.includes('tornado')) return 'TORNADO';
    if (event.includes('hurricane') || event.includes('typhoon')) return 'HURRICANE';
    if (event.includes('heat') || event.includes('excessive heat')) return 'HEAT';
    if (event.includes('cold') || event.includes('freeze')) return 'COLD';
    if (event.includes('snow') || event.includes('blizzard')) return 'SNOW';
    if (event.includes('ice') || event.includes('freezing')) return 'ICE';
    if (event.includes('wind') || event.includes('gale')) return 'WIND';
    if (event.includes('fog') || event.includes('visibility')) return 'FOG';
    if (event.includes('air quality') || event.includes('pollution')) return 'AIR_QUALITY';
    if (event.includes('fire') || event.includes('wildfire')) return 'FIRE';
    if (event.includes('tsunami')) return 'TSUNAMI';
    if (event.includes('volcano')) return 'VOLCANO';
    
    return 'OTHER';
  }

  determineSeverity(severity) {
    const sev = severity.toLowerCase();
    if (sev.includes('extreme') || sev.includes('catastrophic')) return 'EXTREME';
    if (sev.includes('severe') || sev.includes('major')) return 'SEVERE';
    if (sev.includes('moderate') || sev.includes('minor')) return 'MODERATE';
    return 'MINOR';
  }

  async generateAlertRecommendations(weatherData, alertsData, alertAnalysis, preferences) {
    try {
      const systemPrompt = `You are an expert weather alert analyst. Analyze the current weather conditions, existing alerts, and user preferences to provide personalized alert recommendations.

Current Weather: ${JSON.stringify(weatherData.current)}
Existing Alerts: ${JSON.stringify(alertsData.alerts || [])}
Alert Analysis: ${JSON.stringify(alertAnalysis)}
User Preferences: ${JSON.stringify(preferences)}

Provide recommendations in the following JSON format:
{
  "immediateActions": ["action1", "action2"],
  "preparednessSteps": ["step1", "step2"],
  "monitoringAdvice": "advice text",
  "alertSettings": {
    "recommendedThresholds": {},
    "suggestedAlertTypes": []
  },
  "safetyTips": ["tip1", "tip2"]
}`;

      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage("Generate personalized alert recommendations based on the current weather situation and user preferences.")
      ]);

      try {
        return JSON.parse(response.content);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          immediateActions: ["Monitor weather conditions closely"],
          preparednessSteps: ["Stay informed about weather updates"],
          monitoringAdvice: "Keep checking weather alerts regularly",
          alertSettings: {
            recommendedThresholds: {},
            suggestedAlertTypes: []
          },
          safetyTips: ["Follow local emergency instructions"]
        };
      }
    } catch (error) {
      console.error('Error generating alert recommendations:', error);
      return {
        immediateActions: ["Monitor weather conditions"],
        preparednessSteps: ["Stay informed"],
        monitoringAdvice: "Check weather updates regularly",
        alertSettings: {},
        safetyTips: ["Follow safety guidelines"]
      };
    }
  }

  async getAgentCapabilities() {
    return {
      name: 'AlertAgent',
      description: 'Handles weather alerts, notifications, and alert management',
      capabilities: [
        'Real-time weather alert processing',
        'Custom alert threshold monitoring',
        'Alert categorization and severity assessment',
        'Personalized alert recommendations',
        'Weather condition analysis for potential alerts',
        'Multi-channel notification support',
        'Alert history and management',
        'User preference-based alert filtering'
      ],
      supportedAlertTypes: [
        'STORM', 'FLOOD', 'TORNADO', 'HURRICANE', 'HEAT', 'COLD',
        'SNOW', 'ICE', 'WIND', 'FOG', 'AIR_QUALITY', 'FIRE',
        'TSUNAMI', 'VOLCANO', 'OTHER'
      ],
      supportedSeverities: ['EXTREME', 'SEVERE', 'MODERATE', 'MINOR']
    };
  }
}

module.exports = AlertAgent;
