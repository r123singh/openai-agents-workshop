import asyncio
from agents import Agent, Runner, trace, ItemHelpers, MessageOutputItem, TResponseInputItem, RunContextWrapper, HandoffOutputItem, ToolCallItem, ToolCallOutputItem, WebSearchTool, function_tool
from pydantic import BaseModel
import uuid

"""
This app is a trip planning agent with agents-as-tools flow. The agents execute in sequence from collecting user preferences to compiling the final itinerary.

The agents are:

1. The first agent collects user preferences and constraints for the trip.
2. The second agent researches and suggests potential destinations based on the preferences.
3. The third agent creates a detailed itinerary, including activities, accommodations, and transportation.
4. The fourth agent handles booking and reservation tasks for the selected options.
5. The final agent provides a summary and confirmation of the trip plan.

Each agent has specific tools and capabilities to handle their domain of expertise while maintaining context through the conversation history.
"""

class TripPlannerContext(BaseModel):
    destination: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    budget: str | None = None
    travel_style: str | None = None
    number_of_people: int | None = None

@function_tool
async def update_context_tool(context: RunContextWrapper[TripPlannerContext], destination: str, start_date: str, end_date: str, budget: str, travel_style: str, number_of_people: int) -> None:
    context.context.destination = destination
    context.context.start_date = start_date
    context.context.end_date = end_date
    context.context.budget = budget
    context.context.travel_style = travel_style
    context.context.number_of_people = number_of_people

#AGENTS


summary_agent = Agent[TripPlannerContext](
    name="summary_agent",
    instructions="""You are the final agent in the sequence. Your role is to provide a comprehensive summary of the trip plan:
     - Review all collected preferences
     - Summarize the itinerary
     - List all bookings and reservations
     - Provide important travel information
     - Confirm the final plan with the user""",
    handoff_description="A summary agent",
)

booking_agent = Agent[TripPlannerContext](
    name="booking_agent",
    instructions="""You are the fourth agent in the sequence. Your role is to handle all booking and reservation tasks:
     - Book accommodations
     - Reserve activities that require advance booking
     - Arrange transportation
     - Make restaurant reservations
     Once bookings are complete, hand off to the summary agent.""",
    handoff_description="A booking agent",
    handoffs=[summary_agent],
)

itinerary_agent = Agent[TripPlannerContext](
    name="itinerary_agent",
    instructions="""You are the third agent in the sequence. Your goal is to create a detailed day-by-day itinerary using the researched information. For each day:
     - Organize activities in a logical sequence
     - Include meal times and restaurant recommendations
     - Consider travel time between locations
     - Balance active and relaxing activities
     Once the itinerary is complete, hand off to the booking agent.""",
    handoff_description="An itinerary agent",
    handoffs=[booking_agent],
)


destination_research_agent = Agent[TripPlannerContext](
    name="destination_research_agent",
    instructions="""You are the second agent in the sequence. Your goal is to research and find activities at the destination that match the traveler's preferences. Use the WebSearchTool to find:
     - Popular attractions and activities
     - Local events during the travel dates
     - Recommended restaurants
     - Transportation options
     Once you have gathered sufficient information, hand off to the itinerary agent.""",
    handoff_description="A destination research agent",
    tools=[WebSearchTool()],
    handoffs=[itinerary_agent],
)

user_preferences_agent = Agent[TripPlannerContext](
    name="user_preferences_agent",
    instructions="""You are the first agent in the trip planning sequence. Your role is to collect all necessary user preferences and constraints. Follow this sequence:
     1. Ask for the destination.
     2. Ask for the start date.
     3. Ask for the end date.
     4. Ask for the budget.
     5. Ask for the travel style.
     6. Ask for the number of people.
     Once you have collected all information, hand off to the destination research agent.""",
    handoff_description="A user preferences and constraints collector agent",
    tools=[update_context_tool],
    handoffs=[destination_research_agent],
)


async def main():
    current_agent: Agent[TripPlannerContext] = user_preferences_agent
    input_items: list[TResponseInputItem] = []
    context = TripPlannerContext()

    conversation_id = uuid.uuid4().hex[:16]

    while True:
        msg = input("Enter your message: ")
        with trace("Trip Planner", group_id=conversation_id):
            input_items.append({"content": msg, "role": "user"})
            response = await Runner.run(current_agent, input_items, context=context)
            
            for item in response.new_items:
                if isinstance(item, MessageOutputItem):
                    text = ItemHelpers.text_message_output(item)
                    if text:
                        print(text)
                elif isinstance(item, HandoffOutputItem):
                    print(f"Handed off from {item.source_agent.name} to {item.target_agent.name}")
                    current_agent = item.target_agent
                elif isinstance(item, ToolCallItem):
                    print(f"{item.agent.name}: Calling a tool")
                elif isinstance(item, ToolCallOutputItem):
                    print(f"{item.agent.name}: Tool call output: {item.output}")
            
            input_items = response.to_input_list()

if __name__ == "__main__":
    asyncio.run(main())