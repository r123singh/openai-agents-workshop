import asyncio
import uuid
from datetime import datetime
from dotenv import load_dotenv

from openai.types.responses import ResponseContentPartDoneEvent, ResponseTextDeltaEvent
load_dotenv()
from agents import Agent, RawResponsesStreamEvent, Runner, TResponseInputItem, trace, handoff, RunContextWrapper
from pydantic import BaseModel
from weather_tools import get_weather_forecast, get_weather_history, get_weather_current

"""
This example shows the handoffs/routing pattern. The weather triage agent receives the first message, and
then hands off to the appropriate specialized weather agent based on the type of weather query. Responses are
streamed to the user.
"""

class WeatherContext(BaseModel):
    location: str
    start_date: str = datetime.now().strftime("%Y-%m-%d")
    duration: str = "3 days"
    weather_type: str = None

def on_forecast_handoff(context: RunContextWrapper[WeatherContext]) -> None:
    context.context.location = context.context.location
    context.context.duration = "3 days"
    context.context.start_date = datetime.now().strftime("%Y-%m-%d")
    context.context.weather_type = "forecast"
    
def on_historical_handoff(context: RunContextWrapper[WeatherContext]) -> None:
    context.context.location = context.context.location
    context.context.duration = "3 days"
    context.context.start_date = datetime.now().strftime("%Y-%m-%d")
    context.context.weather_type = "historical"

def on_current_handoff(context: RunContextWrapper[WeatherContext]) -> None:
    context.context.location = context.context.location
    context.context.weather_type = "current"

forecast_agent = Agent[WeatherContext](
    name="forecast_agent",
    instructions="""You handle weather forecast queries, providing predictions for future weather conditions. If you are speaking to the customer, you were probably transferred to from the triage agent. Retreive the location, duration and other relevant information from the context Use the following routine to support the customer. 
    # Routine
    1. Ask the customer for the location if not provided in the context. 
    2. Use the tool to get the weather forecast data. 
    3. If the customer asks a question that is not related to the routine, transfer back to the triage agent.""",
    tools=[get_weather_forecast],
)

historical_agent = Agent[WeatherContext](
    name="historical_agent",
    instructions="""You handle historical weather data queries, providing information about past weather conditions. If you are speaking to the customer, you were probably transferred to from the triage agent. Retreive the location, duration and other relevant information from the context. Use the following routine to support the customer.  
    # Routine
    1. Ask the customer for the location if not provided in the context. 
    2. Use the tool to get the weather history data. 
    3. If the customer asks a question that is not related to the routine, transfer back to the triage agent.""",
    tools=[get_weather_history],
)

current_agent = Agent[WeatherContext](
    name="current_agent",
    instructions="""You handle current weather queries, providing real-time weather information. If you are speaking to the customer, you were probably transferred to from the triage agent. Retreive the location, and other relevant information from the context. Use the following routine to support the customer. 
    # Routine
    1. Ask the customer for the location if not provided in the context. 
    2. Use the tool to get the weather current data. 
    3. If the customer asks a question that is not related to the routine, transfer back to the triage agent.""",
    tools=[get_weather_current],
)

weather_triage_agent = Agent[WeatherContext](
    name="weather_triage_agent",
    handoff_description="Analyze the user's query and handoff to the appropriate weather agent",
    instructions="""Analyze the user's query and handoff to the appropriate weather agent:
    - For future weather predictions, use forecast_agent
    - For past weather data, use historical_agent
    - For current conditions, use current_agent
    - If the user's query is not related to weather, stop here and say that you are a weather agent and you only handle weather queries.
    - exit the conversation if the user says "exit" by saying "Goodbye!"
    """,
    handoffs=[handoff(agent=forecast_agent, on_handoff=on_forecast_handoff), handoff(agent=historical_agent, on_handoff=on_historical_handoff), handoff(agent=current_agent, on_handoff=on_current_handoff)],

)


async def main():
    # We'll create an ID for this conversation, so we can link each trace
    conversation_id = str(uuid.uuid4().hex[:16])

    msg = input("Hi! I can help with weather information. What would you like to know? ")
    agent = weather_triage_agent
    inputs: list[TResponseInputItem] = [{"content": msg, "role": "user"}]
    # print("inputs"+ str(inputs))
    context = WeatherContext(location="New York")
    while True:
        # Each conversation turn is a single trace. Normally, each input from the user would be an
        # API request to your app, and you can wrap the request in a trace()
        with trace("Weather routing example", group_id=conversation_id):
            result = Runner.run_streamed(
                agent,
                input=inputs,
                context=context
            )
            async for event in result.stream_events():
                if not isinstance(event, RawResponsesStreamEvent):
                    continue
                data = event.data
                if isinstance(data, ResponseTextDeltaEvent):
                    if "goodbye" in data.delta.lower():
                        print("Goodbye!")
                        break
                    print(data.delta, end="", flush=True)
                elif isinstance(data, ResponseContentPartDoneEvent):
                    pass
        print("\n")
        inputs = result.to_input_list()
        user_msg = input("▶ ")
        inputs.append({"content": user_msg, "role": "user"})
        agent = result.current_agent


if __name__ == "__main__":
    asyncio.run(main())