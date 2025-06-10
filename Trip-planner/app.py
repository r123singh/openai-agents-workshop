import gradio as gr
import asyncio
from main import (
    user_preferences_agent,
    TripPlannerContext,
    Runner,
    trace,
    ItemHelpers,
    MessageOutputItem,
    TResponseInputItem,
    HandoffOutputItem,
    ToolCallItem,
    ToolCallOutputItem,
)

def format_message(item):
    if isinstance(item, MessageOutputItem):
        text = ItemHelpers.text_message_output(item)
        if text:
            return text
    elif isinstance(item, HandoffOutputItem):
        return f"Handed off from {item.source_agent.name} to {item.target_agent.name}"
    elif isinstance(item, ToolCallItem):
        return f"{item.agent.name}: Calling a tool"
    elif isinstance(item, ToolCallOutputItem):
        return f"{item.agent.name}: Tool call output: {item.output}"
    return ""

async def respond(message, history):
    current_agent = user_preferences_agent
    input_items = []
    context = TripPlannerContext()
    conversation_id = "trip_planner_chat"

    with trace("Trip Planner", group_id=conversation_id):
        input_items.append({"content": message, "role": "user"})
        response = await Runner.run(current_agent, input_items, context=context)
        
        bot_response = ""
        for item in response.new_items:
            formatted_message = format_message(item)
            if formatted_message:
                bot_response += formatted_message + "\n"
            
            if isinstance(item, HandoffOutputItem):
                current_agent = item.target_agent
        
        return bot_response.strip()

def create_chatbot():
    with gr.Blocks() as demo:
        chatbot = gr.Chatbot(
        label="Trip Planner Assistant",
        height=600,
    )
    
        msg = gr.Textbox(
        label="Message",
        placeholder="Type your message here...",
        lines=2,
    )
    
        clear = gr.Button("Clear")
    
        msg.submit(
        lambda message, history: asyncio.run(respond(message, history)),
        [msg, chatbot],
        chatbot,
        queue=True
    ).then(
        lambda: "",
        None,
        msg,
        queue=False
    )
    
        clear.click(lambda: None, None, chatbot, queue=False)
    
    return demo

if __name__ == "__main__":
    demo = create_chatbot()
    demo.launch()