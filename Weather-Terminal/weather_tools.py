from agents import function_tool
import requests
import os
from datetime import datetime

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/"

#OPENWEATHER REQUESTS
def submit_request(endpoint: str, params: dict) -> dict:
    """
    Submit a request to the OpenWeather API.
    """
    url = f"{OPENWEATHER_BASE_URL}/{endpoint}"
    response = requests.get(url, params=params)
    response.raise_for_status()  # Raise exception for bad status codes
    return response.json()

#TOOLS

@function_tool(name_override="get_weather_forecast", description_override="Get the weather forecast for a given location.")
def get_weather_forecast(location: str) -> str:
    params = {
        "q": location,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
        "cnt": 5  # Get 5 day forecast
    }
    response = submit_request("forecast", params)
    
    # Extract relevant forecast data
    forecast_list = response.get("list", [])
    if not forecast_list:
        return f"No forecast data available for {location}"
        
    forecast = forecast_list[0]  # Get first forecast
    temp = forecast["main"]["temp"]
    weather_desc = forecast["weather"][0]["description"]
    
    return f"The weather forecast for {location} shows {weather_desc} with a temperature of {temp}°C."

@function_tool(name_override="get_weather_history", description_override="Get the weather history for a given location.")
def get_weather_history(location: str, start_date: str, end_date: str) -> str:
    # Convert dates to Unix timestamps
    start_timestamp = int(datetime.strptime(start_date, "%Y-%m-%d").timestamp())
    end_timestamp = int(datetime.strptime(end_date, "%Y-%m-%d").timestamp())
    
    params = {
        "q": location,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
        "type": "hour",
        "start": start_timestamp,
        "end": end_timestamp,
        "cnt": 1  # Get 1 day of history
    }
    response = submit_request("history/city", params)
    history_list = response.get("list", [])
    if not history_list:
        return f"No history data available for {location}"
        
    history = history_list[0]  # Get first history
    temp = history["main"]["temp"]
    weather_desc = history["weather"][0]["description"]
    
    return f"The weather history for {location} from {start_date} to {end_date} shows {weather_desc} with a temperature of {temp}°C."

@function_tool(name_override="get_weather_current", description_override="Get the current weather for a given location.")
def get_weather_current(location: str) -> str:
    params = {
        "q": location,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric"
    }
    response = submit_request("weather", params)
    
    # Extract relevant current weather data
    temp = response["main"]["temp"]
    weather_desc = response["weather"][0]["description"]
    humidity = response["main"]["humidity"]
    
    return f"Current weather in {location}: {weather_desc}, temperature {temp}°C, humidity {humidity}%"