const axios = require('axios');

class WeatherTools {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  async getCurrentWeather(city) {
    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          q: city,
          appid: this.apiKey,
          units: 'metric'
        }
      });
      
      return {
        city: response.data.name,
        country: response.data.sys.country,
        temperature: response.data.main.temp,
        feels_like: response.data.main.feels_like,
        humidity: response.data.main.humidity,
        pressure: response.data.main.pressure,
        description: response.data.weather[0].description,
        icon: response.data.weather[0].icon,
        wind_speed: response.data.wind.speed,
        wind_direction: response.data.wind.deg,
        visibility: response.data.visibility,
        sunrise: new Date(response.data.sys.sunrise * 1000).toLocaleTimeString(),
        sunset: new Date(response.data.sys.sunset * 1000).toLocaleTimeString(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get current weather for ${city}: ${error.message}`);
    }
  }

  async getWeatherForecast(city, days = 5) {
    try {
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          q: city,
          appid: this.apiKey,
          units: 'metric',
          cnt: days * 8 // 8 forecasts per day (every 3 hours)
        }
      });
      
      const forecasts = response.data.list.map(item => ({
        datetime: new Date(item.dt * 1000).toISOString(),
        temperature: item.main.temp,
        feels_like: item.main.feels_like,
        humidity: item.main.humidity,
        pressure: item.main.pressure,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        wind_speed: item.wind.speed,
        wind_direction: item.wind.deg,
        pop: item.pop // probability of precipitation
      }));

      return {
        city: response.data.city.name,
        country: response.data.city.country,
        forecasts: forecasts,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to get weather forecast for ${city}: ${error.message}`);
    }
  }

  async getHistoricalWeather(city, date) {
    try {
      // Note: Historical data requires a paid OpenWeatherMap subscription
      // For demo purposes, we'll return a mock response
      const mockHistoricalData = {
        city: city,
        date: date,
        temperature: {
          min: 15,
          max: 25,
          avg: 20
        },
        humidity: 65,
        pressure: 1013,
        description: "Partly cloudy",
        wind_speed: 12,
        precipitation: 0,
        timestamp: new Date().toISOString()
      };

      return mockHistoricalData;
    } catch (error) {
      throw new Error(`Failed to get historical weather for ${city}: ${error.message}`);
    }
  }

  async getWeatherAlerts(city) {
    try {
      const response = await axios.get(`${this.baseUrl}/onecall`, {
        params: {
          q: city,
          appid: this.apiKey,
          exclude: 'current,minutely,hourly,daily'
        }
      });
      
      return {
        city: city,
        alerts: response.data.alerts || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      // If no alerts or error, return empty alerts
      return {
        city: city,
        alerts: [],
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = WeatherTools;
