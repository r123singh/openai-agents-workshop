from agents import Agent, Runner, trace, function_tool, MessageOutputItem, HandoffOutputItem, ToolCallItem, ToolCallOutputItem, ItemHelpers, TResponseInputItem
import asyncio
from pydantic import BaseModel
import uuid
from dotenv import load_dotenv
import os

# Building a dynamic quiz agent that will generate questions based on the user's input on the previous question. Will start with a single question, then wait for the user's response, once user responds, agent checks the response,evaluates the response and then generates another question to further probe the user. It should be fair if user is easily answerin the questions, then it should give next question bit more challenging. But if user is struggling with 1-2 questions, then it should give next question bit easier or be neutral if just 1 question is struggling for example. 

load_dotenv()


class QuizContext(BaseModel):
    topic: str = ""
    total_questions: int = 10
    question_count: int = 0
    correct_count: int = 0
    incorrect_count: int = 0
    performance_summary: str = ""
    current_question: str = ""

@function_tool
async def update_evaluation(ctx: QuizContext, is_correct: bool, feedback: str) -> None:
    """
    Update the evaluation of the current question.
    """
    ctx.question_count += 1
    ctx.correct_count += 1 if is_correct else 0
    ctx.incorrect_count += 1 if not is_correct else 0
    ctx.performance_summary += f"Q{ctx.question_count}: {feedback}\n"
    return ctx

@function_tool
async def performance_check(ctx: QuizContext) -> str:
    """
    Check the performance of the user till now in the quiz.
    """
    return ctx.performance_summary

quiz_agent = Agent[QuizContext](
    name="Quiz Agent 🤖",
    instructions=(
        "You are a quiz agent. Your job is to:\n"
        "1. If this is the first interaction or user says 'start', generate the first question using question_agent\n"
        "2. Check if 'question_count' till now have reached the 'total_questions' stored in the context, if yes, then end the quiz by returning only 'exit' to the user\n"
        "3. For subsequent interactions, first evaluate the user's response if its correct or incorrect answer, then generate the next question using question_agent\n"
        "4. Generate the next question by analyzing the user's performance progress till that point. If user is struggling with the questions, then generate a question that is easier or neutral if just 1 question is struggling for example. But if user is easily answering the questions, then generate a question that is bit more challenging.\n"
        "5. Always use the topic from context when generating questions\n"
        "6. Only return the question to the user, never show evaluation feedback\n"
        "7. Use update_evaluation tool to submit the true/false, and feedback on the current question's response\n"
        "8. Use performance_check tool to retrieve user's performance progress till now in the quiz\n"
        "9. If user says 'exit' any time in the quiz, then end the quiz by returning only 'exit' to the user\n"

    ),
    tools=[update_evaluation, performance_check],
)

async def main():
    ctx = QuizContext()
    current_agent: Agent[QuizContext] = quiz_agent
    input_items: list[TResponseInputItem] = []
    conversation_id = uuid.uuid4().hex[:16]
    
    # First Quiz Agent Message
    print("*I am your quiz agent, taking your exam now.*\n *You have a total of 10 questions and 30 minutes to complete the exam. \n*Each question will be timed for 3 minutes.*\n Type 'start' to start the quiz for the first time.\n Type 'exit' to exit the quiz at any time.")
    print("*Choose the topic to start the quiz[1-6]:*\n")
    print("1. General Knowledge\n")
    print("2. Science\n")
    print("3. History\n")
    print("4. Geography\n")
    print("5. Art\n")
    print("6. Music\n")

    # User Input
    while True:
        user_input = input("🧑‍💻 Your choice[1-6]: ")
        if user_input == "1":
             ctx.topic = "General Knowledge"
             break
        elif user_input == "2":
            ctx.topic = "Science"
            break
        elif user_input == "3":
            ctx.topic = "History"
            break
        elif user_input == "4":
            ctx.topic = "Geography"
            break
        elif user_input == "5":
            ctx.topic = "Art"
            break
        elif user_input == "6":
            ctx.topic = "Music"
            break
        elif user_input.lower() == "exit":
            ctx.topic = ""
            print("Exiting quiz. Thank you for playing! See you next time! \n")
            break
        else:
            print("Invalid choice. Please choose a valid topic. \n")
            continue
    if ctx.topic == "":
        return
    
    print(f"Starting quiz on {ctx.topic} topic. \n  *Note: At the start of the quiz you will be asked to answer a question even though there is no question so just answer it with 'start'. \n")

    # Quiz Loop
    ctx.total_questions = 5
    ctx.question_count = 0
    ctx.correct_count = 0
    ctx.incorrect_count = 0
    ctx.performance_summary = ""
    ctx.current_question = ""
    
    while True:
        with trace("Quiz Game", group_id=conversation_id):
            user_input = input("🧑‍💻 Your answer: ")
            input_items.append({"content": user_input, "role": "user"})
            result = await Runner.run(current_agent, input_items, context=ctx)
            # Process the results
            for new_item in result.new_items:
                if isinstance(new_item, MessageOutputItem):
                    # Only print agent messages (questions), not evaluation feedback
                    message_content = ItemHelpers.text_message_output(new_item)
                    if "question" in message_content.lower() or "?" in message_content:
                        print(f"{new_item.agent.name}: {message_content}")
                    elif "exit" in message_content.lower():
                        print(f"{new_item.agent.name}: {message_content}")
                        print(f"Quiz completed! You answered {ctx.question_count} questions.")
                        print(f"✅ Correct: {ctx.correct_count} | ❌ Incorrect: {ctx.incorrect_count}")
                        print(f"📊 Performance Summary:\n{performance_check(ctx)}")
                        return
                elif isinstance(new_item, HandoffOutputItem):
                    print(
                        f"Handed off from {new_item.source_agent.name} to {new_item.target_agent.name}"
                    )
                elif isinstance(new_item, ToolCallItem):
                    print(f"{new_item.agent.name}: Calling a tool")
                elif isinstance(new_item, ToolCallOutputItem):
                    # Handle tool outputs silently - update context but don't print
                    if hasattr(new_item.output, 'question') and new_item.output.question:
                        if new_item.output.question != ctx.current_question:
                            ctx.current_question = new_item.output.question
                            print(f"🤖 Question {ctx.question_count}: {ctx.current_question}")
                else:
                    print(f"{new_item.agent.name}: Skipping item: {new_item.__class__.__name__}")

            input_items = result.to_input_list()
            current_agent = result.last_agent

if __name__ == "__main__":
    asyncio.run(main())