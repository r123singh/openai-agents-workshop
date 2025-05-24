# gradio_ui.py
import gradio as gr
from hr_agent import triage_agent, HRContext
from agents import Runner
from agents.exceptions import InputGuardrailTripwireTriggered

async def handle_user_input(user_input, ctx): 
    # Build a prompt that includes the conversation history
    history_text = ""
    for role, message in ctx.conversation_history:
        history_text += f"{role}: {message}\n"
    history_text += f"user: {user_input}\n"

    result = await Runner.run(triage_agent, history_text, context=ctx)
    return result.final_output

ctx = HRContext()

with gr.Blocks(theme=gr.themes.Soft()) as demo:
    with gr.Row():
        with gr.Column(scale=1):
            gr.Markdown("""
            # HR Assistant 🤖
            Welcome to your HR assistant! I can help you with:
            - Employee policies and procedures
            - Benefits and compensation
            - Workplace guidelines
            - General HR inquiries
            """)
            
            examples = gr.Examples(
                examples=[
                    "What is our vacation policy?",
                    "How do I request time off?",
                    "What are the company benefits?",
                    "What is the dress code policy?"
                ],
                inputs=gr.Textbox(),
            )
        with gr.Column(scale=3):
            chatbot = gr.Chatbot(height=400)
            with gr.Row():
                msg = gr.Textbox(
                    placeholder="Type your HR question here...",
                    show_label=False,
                    container=False
                )
            submit = gr.Button("Send", variant="primary")
            clear = gr.ClearButton([msg, chatbot], variant="secondary")

    def clear_chat_history():
        ctx.conversation_history = []
        return "", []

    async def respond(message, chat_history):
        if not message.strip():
            return message, chat_history
            
        try:
            bot_message = await handle_user_input(message, ctx)
            ctx.conversation_history.append(("user", message))
            ctx.conversation_history.append(("assistant", bot_message))
        except InputGuardrailTripwireTriggered:
            bot_message = "Sorry, your input could not be processed due to content restrictions. Please ask only HR-related questions."
        chat_history.append((message, bot_message))
        return "", chat_history
    
    msg.submit(respond, [msg, chatbot], [msg, chatbot])
    submit.click(respond, [msg, chatbot], [msg, chatbot])
    clear.click(clear_chat_history, [], [chatbot, msg])

demo.launch()
