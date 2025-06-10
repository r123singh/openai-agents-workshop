## Overview

This application demonstrates the use of OpenAI Agents SDK's multi-agent collaboration pattern with a supervisor agent that handles routing between specialized sub-agents. The supervisor agent uses LLM-based intent classification to route requests to the appropriate specialized agent, creating a seamless unified experience. In our implementation, we have 3 specialized agents: one for general Contract questions, one for handling conversations about Existing Contracts, and another for dealing with New Contracts.

## Architecture

The system uses a supervisor agent that can delegate to specialized sub-agents based on the type of request:
- Contract Drafting Agent: Handles creation of new contracts
- Existing Contract Agent: Manages queries about existing contracts
- General Contract Assistant: Answers general contract-related questions

Try sample prompts:

"I need help with a purchase agreement."
"Can you show me the status of contract #12345?"
Each of these gets routed to the appropriate specialized agent for processing. The conversation flow remains natural and seamless.

The supervisor agent maintains control and can handle complex requests that don't map cleanly to a single specialized agent.

## Caution

The sample contract templates are not legal advice, are for illustrative purposes only, and should not be relied upon without consulting the user's own attorney.

## Prerequisites

Clone and install repository
```bash
git clone https://github.com/r123singh/OpenAI-Agents-SDK
cd OpenAI-Agents-SDK
```

Install dependencies
```bash
pip install -r requirements.txt
```

Run the script
```bash
python main.py
```

## Sample Prompts

"I need help with a purchase agreement."
"Can you show me the status of contract #12345?"