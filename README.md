# OpenAI Agents SDK Examples

This repository contains example implementations of agentic frameworks using the OpenAI Agents SDK. Each example demonstrates different capabilities and use cases of the SDK.

## Current Examples

### HR Assistant
A multi-agent HR assistant that handles various HR-related queries and actions. Features include:
- Specialized agents for different HR domains (leaves, benefits, policies, complaints)
- Input guardrails for query validation
- Tool integration for backend actions
- Context-aware conversations
- Gradio-based web UI

[View HR Assistant Example](HR-Agent/README.md)

### Trip Planner
A multi-agent trip planner that handles everything from initial preferences to final booking. Features include:
- Specialized agents for different trip planning domains (destination research, itinerary creation, booking, summary)
- Web search integration for real-time information
- Gradio-based web UI

[View Trip Planner Example](Trip-planner/README.md)

### Contract Assistant
A multi-agent contract assistant that handles everything from initial preferences to final booking. Features include:
- Specialized agents for different contract planning domains (contract drafting, existing contract, general contract assistant)
- Applied the Agent Pattern of Routing -using handoff -    
- handoff_description is used to describe the handoff to the sub-agent.
- Supervisor is frontline agent handling the conversationm, routes reqquiest to the appropriate sub-agent and also handles generale queries related to contract templates and guidelines.
- Subagents are -
    1. Contract Drafting Agent: Handles creation of new contracts. Works by first determing the contract type-> then asking relevant queries correcspoing to that typr adn finally drafting the contract. It uses **function_tools** for all the steps. Internally mapping relevant template files to the contract type. 
        1. Uses LLM based contract drafting generating a new contract as per the template file. Here we have used **gpt-4o** model.
        2. Currently limited to 3 contract types - Purchase Agreement, Franchise Agreement, and Time and Materials Contract. We are using ddraft files to extract the templates structure
    2. Existing Contract Agent: Handles queries about existing contracts, including retrieving contract status, details, and answering questions about existing agreements.
    3. General Contract Assistant: Answers general contract-related questions from the knowledge base, such as determining appropriate contract types.Speciufic fields under the contract type are asked to the user.
- Also applied **Streaming Outputs** to stream responses to the user queries for smooth conversation.

[View Contract Assistant Example](Contract-Assistant/README.md)

## Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a new branch for your feature
3. Add your example implementation
4. Include a detailed README.md explaining your implementation
5. Submit a pull request

### Guidelines for New Examples

When adding a new example, please follow these guidelines:

1. Create a new directory with a descriptive name
2. Include a comprehensive README.md that covers:
   - Overview of the implementation
   - Features and capabilities
   - Installation and setup instructions
   - Usage examples
   - Architecture and design decisions
3. Ensure your code is well-documented
4. Add appropriate tests
5. Include example queries or use cases

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/r123singh/openai-agents-workshop.git
cd openai-agents-workshop
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set your OpenAI API key:

```bash
export OPENAI_API_KEY="your_openai_api_key"
```


