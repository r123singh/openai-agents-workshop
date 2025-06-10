import asyncio
import uuid

from openai.types.responses import ResponseContentPartDoneEvent, ResponseTextDeltaEvent

from agents import Agent, RawResponsesStreamEvent, Runner, TResponseInputItem, trace
from existing_contract_details import get_contract_details, get_contract_status
from contract_drafting_function import determine_contract_type, draft_contract, get_contract_questions
"""
This example shows the handoffs/routing pattern. The contract supervisor agent receives the first message, and
then hands off to the appropriate specialized contract agent based on the type of request. Responses are
streamed to the user.
"""
kb_contract = """
Contract Templates and Guidelines:

1. Purchase Agreement Template:
   - Standard terms for buying/selling goods
   - Includes delivery, payment, and warranty clauses
   - Used for one-time purchases or recurring supply agreements
   - Typical duration: 1-3 years

2. Franchise Agreement Template:
   - Terms for brand licensing and franchise operations
   - Includes territory rights, fees, and operational guidelines
   - Used for business expansion and brand licensing
   - Typical duration: 5-20 years

3. Time and Materials Contract Template:
   - Flexible terms for service-based work
   - Includes hourly rates, scope of work, and payment schedules
   - Used for consulting, maintenance, and project-based work
   - Typical duration: 3-12 months

General Guidelines:
- All contracts must include clear termination clauses
- Payment terms should be explicitly stated
- Confidentiality clauses are mandatory
- Dispute resolution methods must be specified
- Governing law and jurisdiction must be defined
"""

contract_drafting_agent = Agent(
    name="contract_drafting_agent",
    instructions="""You help draft new contracts by collecting required information, selecting appropriate
            templates, and generating contract drafts. You can handle purchase agreements,
            franchise agreements, and time and materials contracts. Call the tools in relevant order to draft the contract. Always call the tools in the order of determine_contract_type, get_contract_questions, draft_contract if not already done.""",
    tools=[determine_contract_type, get_contract_questions, draft_contract]
)

existing_contract_agent = Agent(
    name="existing_contract_agent",
    instructions="""You handle queries about existing contracts, including retrieving contract status,
            details, and answering questions about existing agreements.""",
    tools=[get_contract_status, get_contract_details]
)

general_contract_assistant = Agent(
    name="general_contract_assistant",
    instructions="""Handle conversations about general contract or legal questions, like based on the requirement determine appropriate contract type. Use this knowledge base to answer general questions about contract or agreement type.""",
)

contract_supervisor_agent = Agent(
    name="contract_supervisor_agent",
    handoff_description="A supervisor agent that can delegate a customer's request to the appropriate agent.",
    instructions=    f"""
            Act as a helpful contracts assistant, managing conversations about:
            - general questions like determining appropriate contract types
            - Retrieving existing contract information
            - Drafting new contracts
            Delegate the request to the appropriate agent based on the type of request.
            Use the knowledge base for queries related to only contract templates and guidelines- {kb_contract}""",
    handoffs=[contract_drafting_agent, existing_contract_agent, general_contract_assistant],
)


async def main():
    # We'll create an ID for this conversation, so we can link each trace
    conversation_id = str(uuid.uuid4().hex[:16])

    msg = input("Welcome to the Contract Assistant! How can I help you with your contract needs? ")
    agent = contract_supervisor_agent
    inputs: list[TResponseInputItem] = [{"content": msg, "role": "user"}]

    while True:
        # Each conversation turn is a single trace. Normally, each input from the user would be an
        # API request to your app, and you can wrap the request in a trace()
        with trace("Contract Assistant", group_id=conversation_id):
            result = Runner.run_streamed(
                agent,
                input=inputs,
            )
            async for event in result.stream_events():
                if not isinstance(event, RawResponsesStreamEvent):
                    continue
                data = event.data
                if isinstance(data, ResponseTextDeltaEvent):
                    print(data.delta, end="", flush=True)
                elif isinstance(data, ResponseContentPartDoneEvent):
                    print("\n")

        inputs = result.to_input_list()
        print("\n")

        user_msg = input("Enter your next question or request: ")
        inputs.append({"content": user_msg, "role": "user"})
        agent = result.current_agent


if __name__ == "__main__":
    asyncio.run(main())