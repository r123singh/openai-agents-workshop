from __future__ import annotations as _annotations

import asyncio
import random
import uuid

from pydantic import BaseModel

from agents import (
    Agent,
    HandoffOutputItem,
    ItemHelpers,
    MessageOutputItem,
    RunContextWrapper,
    Runner,
    ToolCallItem,
    ToolCallOutputItem,
    TResponseInputItem,
    function_tool,
    handoff,
    trace,
)
from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX

### CONTEXT


class RestaurantOrderContext(BaseModel):
    customer_name: str | None = None
    order_number: str | None = None
    order_type: str | None = None  # "dine-in", "takeout", "delivery"
    table_number: str | None = None
    delivery_agent_number: str | None = "123-456-7000"


### TOOLS



@function_tool(
    name_override="menu_lookup_tool", description_override="Lookup menu items and restaurant information."
)
async def menu_lookup_tool(question: str) -> str:
    if "menu" in question or "food" in question or "dish" in question:
        return (
            "Our menu includes appetizers, main courses, desserts, and beverages. "
            "Popular items include Caesar salad, grilled salmon, and chocolate cake. "
            "We also offer vegetarian and gluten-free options."
        )
    elif "hours" in question or "time" in question:
        return (
            "We're open Monday-Sunday from 11:00 AM to 10:00 PM. "
            "Kitchen closes at 9:30 PM. "
            "Reservations are recommended for dinner service."
        )
    elif "price" in question or "cost" in question:
        return "Appetizers range from $8-15, main courses from $18-35, and desserts from $6-12."
    elif "delivery" in question or "takeout" in question:
        return "We offer takeout and delivery through our website and phone orders. Delivery fee is $3 within 5 miles."
    return "I'm sorry, I don't have information about that. Please ask our staff for assistance."


@function_tool
async def place_order(
    context: RunContextWrapper[RestaurantOrderContext], order_type: str, table_number: str = None
) -> str:
    """
    Place a new restaurant order.

    Args:
        order_type: The type of order (dine-in, takeout, delivery).
        table_number: The table number for dine-in orders.
    """
    # Update the context based on the customer's input
    context.context.order_type = order_type
    context.context.table_number = table_number
    # Generate a new order number
    order_number = f"ORD-{random.randint(1000, 9999)}"
    context.context.order_number = order_number
    
    if order_type == "dine-in":
        return f"Order placed for dine-in at table {table_number}. Order number: {order_number}"
    elif order_type == "takeout":
        return f"Takeout order placed. Order number: {order_number}. Ready in 20-30 minutes."
    elif order_type == "delivery":  # delivery
        context.context.delivery_agent_number = "123-456-7000"
        return f"Delivery order placed. Order number: {order_number}. Delivery time: 30-45 minutes."
    else:
        return f"Order placed successfully. Order number: {order_number}"

@function_tool
async def status_lookup_tool(order_number: str) -> str:
    """
    Lookup the status of a restaurant order.
    """
    return f"Order {order_number} is currently being prepared."


@function_tool
async def delivery_faq_tool(question: str) -> str:
    """
    Answer frequently asked questions about delivery.
    """
    if "delivery" in question.lower() or "takeout" in question.lower():
        return (
            "We offer delivery within 5 miles of our restaurant. Delivery fee is $3. "
            "Delivery times are typically 30-45 minutes. You can place orders through our website or by calling us directly."
        )
    elif "delivery time" in question.lower() or "how long" in question.lower():
        return "Standard delivery time is 30-45 minutes. During peak hours (6-8 PM), it may take up to 60 minutes."
    elif "delivery fee" in question.lower() or "cost" in question.lower():
        return "Delivery fee is $3 for orders within 5 miles. Free delivery for orders over $50."
    elif "delivery area" in question.lower() or "where" in question.lower():
        return "We deliver within a 5-mile radius of our restaurant. Enter your address on our website to check if you're in our delivery zone."
    elif "track" in question.lower() or "status" in question.lower():
        return "You can track your delivery order by calling us with your order number or checking the status on our website."
    elif "minimum order" in question.lower():
        return "Minimum delivery order is $15. For orders under $50, there's a $3 delivery fee."
    elif "payment" in question.lower() or "pay" in question.lower():
        return "We accept cash, credit cards, and digital payments. Payment is collected upon delivery or can be paid online when ordering."
    elif "driver tip" in question.lower() or "gratuity" in question.lower():
        return "Tips for our delivery drivers are appreciated but not required. You can add a tip when placing your order online or give cash to the driver."
    return "I'm sorry, I don't have information about that. Please ask our staff for assistance."

@function_tool
async def escalate_tool(context: RunContextWrapper[RestaurantOrderContext]) -> str:
    """
    Escalate a customer's question to the appropriate agent.
    """
    return f"I'm sorry, I don't have information about that. I have sent your query to the delivery team. You can directly contact the delivery team at {context.context.delivery_agent_number}."

### HOOKS

async def on_order_handoff(context: RunContextWrapper[RestaurantOrderContext]) -> None:
    # Generate a new order number when handoff occurs
    order_number = f"ORD-{random.randint(1000, 9999)}"
    context.context.order_number = order_number

### AGENTS
delivery_agent = Agent[RestaurantOrderContext](
    name="Delivery Agent",
    handoff_description="A helpful agent that can handle delivery tracking queries and address delivery-specific questions.",
    instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
    You are a delivery agent. If you are speaking to a customer, you probably were transferred to from the triage agent.
    Use the following routine and tools to support the customer. Placing order is not in your scope.
    # Routine
    1. Provide delivery status updates and estimated delivery times. Use the status lookup tool to answer the question.
    2. Address any delivery-specific concerns or questions. Use the delivery faq tool to answer the question.
    3. If delivery issues arise, provide appropriate solutions or escalate to staff. Use the escalate tool to escalate the question to the delivery team.
    If the customer asks a question that is not related to delivery tracking, transfer back to the triage agent.""",
    tools=[status_lookup_tool, delivery_faq_tool, escalate_tool],
)

menu_agent = Agent[RestaurantOrderContext](
    name="Menu Agent",
    handoff_description="A helpful agent that can answer questions about our menu and restaurant services.",
    instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
    You are a menu agent. If you are speaking to a customer, you probably were transferred to from the triage agent.
    Use the following routine to support the customer.
    # Routine
    1. Identify the last question asked by the customer.
    2. Use the menu lookup tool to answer the question. Do not rely on your own knowledge.
    3. If you cannot answer the question, transfer back to the triage agent.""",
    tools=[menu_lookup_tool],
)

order_agent = Agent[RestaurantOrderContext](
    name="Order Agent",
    handoff_description="A helpful agent that can place restaurant orders.",
    instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
    You are an order agent. If you are speaking to a customer, you probably were transferred to from the triage agent.
    Use the following routine to support the customer. Placing order is in your scope.
    # Routine
    1. Ask the customer what type of order they want (dine-in, takeout, or delivery).
    2. For dine-in orders, ask for their table number.
    3. Use the place order tool to create the order.
    If the customer asks a question that is not related to ordering, transfer back to the triage agent. """,
    tools=[place_order],
)

triage_agent = Agent[RestaurantOrderContext](
    name="Triage Agent",
    handoff_description="A triage agent that can delegate a customer's request to the appropriate agent.",
    instructions=(
        f"{RECOMMENDED_PROMPT_PREFIX} "
        "You are a helpful triaging agent for a restaurant. You can use your tools to delegate questions to other appropriate agents."
    ),
    handoffs=[
        menu_agent,
        handoff(agent=order_agent, on_handoff=on_order_handoff),
        delivery_agent,
    ],
)

menu_agent.handoffs.append(triage_agent)
order_agent.handoffs.append(triage_agent)


### RUN


async def main():
    current_agent: Agent[RestaurantOrderContext] = triage_agent
    input_items: list[TResponseInputItem] = []
    context = RestaurantOrderContext()

    # Normally, each input from the user would be an API request to your app, and you can wrap the request in a trace()
    # Here, we'll just use a random UUID for the conversation ID
    conversation_id = uuid.uuid4().hex[:16]

    while True:
        user_input = input("Enter your message: ")
        with trace("Restaurant service", group_id=conversation_id):
            input_items.append({"content": user_input, "role": "user"})
            result = await Runner.run(current_agent, input_items, context=context)

            for new_item in result.new_items:
                agent_name = new_item.agent.name
                if isinstance(new_item, MessageOutputItem):
                    print(f"{agent_name}: {ItemHelpers.text_message_output(new_item)}")
                elif isinstance(new_item, HandoffOutputItem):
                    print(
                        f"Handed off from {new_item.source_agent.name} to {new_item.target_agent.name}"
                    )
                elif isinstance(new_item, ToolCallItem):
                    print(f"{agent_name}: Calling a tool")
                elif isinstance(new_item, ToolCallOutputItem):
                    print(f"{agent_name}: Tool call output: {new_item.output}")
                else:
                    print(f"{agent_name}: Skipping item: {new_item.__class__.__name__}")
            input_items = result.to_input_list()
            current_agent = result.last_agent


if __name__ == "__main__":
    asyncio.run(main())

# sample queries
# Sample queries for restaurant ordering system:
# 1. "I'd like to order a pizza with pepperoni and mushrooms for delivery"
# 2. "What's on your menu today? I'm looking for vegetarian options"
# 3. "I want to place an order for pickup - 2 chicken burgers and fries"
# 4. "Can you tell me about your delivery times and minimum order amount?"
# 5. "I have a food allergy to nuts - what dishes are safe for me to order?"
# 6. "I'd like to modify my existing order - can I add a dessert to it?"