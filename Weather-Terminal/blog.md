# Agents105: Executing Multi-Agent Flow Following Routing Pattern

I was working on OpenAI Agents SDK patterns and wanted to find the best approach to execute agent handover flow - the transfer of control from one Agent to another. My focus was on complex use-case flows where a single LLM application or single Agent can become very messy and difficult to manage.

For example, consider a Weather Application with advanced features - forecast, history, current weather, etc. Along with custom API calls per feature, where endpoints vary significantly. In such scenarios, having a specialized agent for each feature is a good architectural decision. But how do we ensure that the specific agent is called based on the user input?

The answer lies in the **Handoffs/Routing Pattern** provided by OpenAI Agents SDK. The additional benefit here is streamed responses to the user, which the SDK provides within this pattern as well.

Below is my experience with the conversation flow using the OpenAI agent SDK framework following the handoffs pattern. I will start with the basic agent setup and then explain the handoffs pattern in detail.

## Supervisor Agent
This is the main agent that will be responsible for routing the user input to the appropriate agent. In this case, it is the Triage Agent:

```python
Supervisor = Agent(
    name="triage_agent",
    instructions="""You are a triage weather agent. Route the user input to the appropriate agent..."
    """,
    handoffs = [handoff(agent = A_agent, on_handoff = on_handoff_A ), ...]
)
```

In the handoffs parameter, we add the sub-agents to be called. An interesting aspect is that we can add a function to be called when the handoff is made. For example, if we want to control the context being passed, like marking agent A as active when passing control to it.

## Sub-Agents
Likewise, other sub-agents are assembled:

```python
A = Agent(
    name = "A_agent",
    instructions = "You are a weather agent that will be responsible for handling the user input...",
    tools = [tool1, tool2, ...]
)
```

The tools are function_tools which can be called by the agent. These can be external API calls, database invocations, or any other internal logic. The `@function_tools` decorator is used to define these tools.

## Execution Flow
Once all tools and agents are defined, we can call them in either async or sync manner. The SDK provides `RawResponseStream` and `Runner.run_streamed` for smooth streaming responses to the user.

## How It Works
When the user asks any query, it goes to the Supervisor agent, which routes to agent A, B, or C based on the Supervisor's decision. The A/B/C agents then call their respective tools and the response is streamed to the user.

## Complete Setup
With this setup complete, we can run the conversation and see the multi-agent system in action.

To see my use-case in action, you can access the complete code in my GitHub repository:
[Weather-Terminal](https://github.com/r123singh/Weather-Terminal)

Below is a demo of the conversation flow.
