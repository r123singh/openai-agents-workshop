from agents import Agent, Runner, InputGuardrail, GuardrailFunctionOutput, function_tool
from pydantic import BaseModel
import asyncio

# building an HR assistant

# 1. Define the HR assistant model
# 2. Define the runner
# 3. Run the runner

class HRAssistant(BaseModel):
    is_hr_question: bool
    question: str
    employee_id: str | None
    department: str | None
    request_type: str  # e.g., "leave", "benefits", "policy", "complaint"
    priority: str  # "low", "medium", "high"

benefits_policy = """ 
1. All employees are eligible for a life insurance policy.
2. The policy covers the employee and their immediate family members.
3. Perks are not taxable. You will get a 10% discount on all perks.
4  Food coupon provided per month is 1000 on all food items purchased from the company cafeteria.
5. Gym membership is provided to all employees. Members can use the gym facilities at no cost.
6. Health insurance coverage is provided to all employees and their immediate family members. The coverage includes:
   - Medical expenses up to 5 lakhs per year
   - Dental coverage up to 50,000 per year
   - Vision coverage up to 25,000 per year
   - Mental health services with 20 sessions per year
7. Annual health check-up is mandatory for all employees and is fully covered by the company.

"""
employee_policy = """ 
1. All employees are eligible for a life insurance policy. There is an accidental insurance coverage upto 9 lakh for each employee.
2. Shift policy is as follows:
    - Day shift: 9am to 5pm
    - Night shift: 5pm to 1am
    - Weekend shift: 10am to 6pm
    - If you are working on night shift, you will get a 10% discount on your food.
    - If you are working on weekend shift, you will get a 10% discount on your food.
3. If you are working on night shift, you will get a 10% discount on your food.
4. There will be performance review every 6 months for all employees. Bonus will be rewarded based on the performance.
5. In case of any emergency, you can take a leave without any penalty.
"""
leave_policy = """ 
1. All employees are eligible for a leave policy.
2. 20 days casual leave is provided to all employees.
3. 6 days of sick leave is provided to all employees.
4. For maternity leave, 180 days of leave is provided before delivery and 120 days of leave is provided after delivery.
5. Parental leave for new born child is provided upto 10 days which can be upon prior approval.
6. Employees working in night shift are eligible for 10 days of extra leave.
7. Leave request needs to be made 2 days in advance.
8. If you are missing 3 days of leave without any valid reason, you will be penalized.
"""

@function_tool
def create_leave_request(employee_id: str, department: str, leave_type: str, start_date: str, end_date: str):
    print(f"Tool called: create_leave_request")
    return f"Leave request created for {employee_id} in {department} from {start_date} to {end_date} for {leave_type}."

@function_tool
def register_complaint(employee_id: str, department: str, complaint_type: str, description: str):
    print(f"Tool called: register_complaint")
    return f"Complaint registered for {employee_id} in {department} for {complaint_type} with description {description}."

# Context wrapper to store the context of the conversation
class HRContext(BaseModel):
    conversation_history: list[tuple[str, str]] = []


# Guardrail agent
guardrail_agent = Agent(
    name="Guardrail check",
    instructions="Check if the user is asking about HR. Return true if the user is asking about HR or if the user is greeting, otherwise return false.",
    output_type=HRAssistant,
)

leaves_agent = Agent(
    name="Leaves Agent",
    handoff_description="Specialist agent for leave requests",
    instructions=(
        f"You provide help with leave requests including queries related to maternity, parental leave, etc. "
        f"Ask the user for their employee id and department only when they ask for leave. "
        f"Based on the leave policy, answer the user's question {leave_policy} only. "
        f"Don't assume anything and don't provide any information outside the policy. "
        f"Be polite and professional. "
        f"If the user requests to create a leave, use the create_leave_request tool."
    ),
    tools=[create_leave_request],
)

benefits_agent = Agent(
    name="Benefits Agent",
    handoff_description="Specialist agent for benefits questions",
    instructions=(
        f"You provide help with benefits questions. "
        f"Based on the benefits policy, answer the user's question {benefits_policy} only. "
        f"If the user is asking about benefits, use the benefits_policy. "
        f"Don't assume anything and don't provide any information outside the policy. "
        f"Be polite and professional. "
        f"If the user requests to create a leave, use the create_leave_request tool."
    ),
)

policy_agent = Agent(
    name="Policy Agent",
    handoff_description="Specialist agent for policy questions",
    instructions=(
        f"You are a policy specialist who provides guidance on employee policies. "
        f"Only reference and answer questions based on the provided employee policy {employee_policy}. "
        f"Maintain a professional and courteous demeanor while ensuring responses are strictly within policy guidelines. "
        f"Answer queries related to insurance, shift, performance review, emergency leave only "
    ),
)

complaints_agent = Agent(
    name="Complaints Agent",
    handoff_description="Specialist agent for complaints",
    instructions=(
        f"You provide help with complaints. "
        f"Act as counsellor and provide support to the user. "
        f"Register their complaints and provide them with the status of the complaint. "
        f"Ask for their employee id and department. "
        f"Be polite and professional. "
        f"If the user requests to create a complaint, use the register_complaint tool."
    ),
    tools = [register_complaint]
)


async def hr_guardrail(ctx, agent, input_data):
    result = await Runner.run(guardrail_agent, input_data, context=ctx.context)
    final_output = result.final_output_as(HRAssistant)
    return GuardrailFunctionOutput(
        output_info=final_output,
        tripwire_triggered=not final_output.is_hr_question,
    )

triage_agent = Agent(
    name="Triage Agent",
    instructions="You determine which agent to use based on the user's question",
    handoffs=[leaves_agent, benefits_agent, policy_agent, complaints_agent],
    input_guardrails=[
        InputGuardrail(guardrail_function=hr_guardrail),
    ],
)


# 3. Run the runner
async def main(): 
    ctx = HRContext()  # Persistent context for the conversation
    print("Welcome to the HR service. How can I help you today?")
    # First user message
    user_input = "I need to take a leave"
    result = await Runner.run(triage_agent, user_input, context=ctx)
    print(result.final_output)
    ctx.conversation_history.append(("user", user_input))
    ctx.conversation_history.append(("assistant", str(result.final_output)))

    # Second user message
    user_input = "what is life insurance?"
    result = await Runner.run(triage_agent, user_input, context=ctx)
    print(result.final_output)
    ctx.conversation_history.append(("user", user_input))
    ctx.conversation_history.append(("assistant", str(result.final_output)))
    user_input = "what is the policy for maternity leave?"
    result = await Runner.run(triage_agent, user_input, context=ctx)
    print(result.final_output)
    ctx.conversation_history.append(("user", user_input))
    ctx.conversation_history.append(("assistant", str(result.final_output)))
    user_input = "How many days of leave can I take in a year?"
    result = await Runner.run(triage_agent, user_input, context=ctx)
    print(result.final_output)
    ctx.conversation_history.append(("user", user_input))
    ctx.conversation_history.append(("assistant", str(result.final_output)))

if __name__ == "__main__":
    asyncio.run(main())


