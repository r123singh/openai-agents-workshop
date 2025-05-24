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


