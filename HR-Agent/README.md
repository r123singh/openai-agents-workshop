# HR Assistant

An AI-powered HR assistant built using OpenAI Agents SDK that can handle various HR-related queries, triage requests, and trigger backend actions.

## Features

- **Multi-Agent Architecture**: Specialized agents for different HR domains (leaves, benefits, policies, complaints)
- **Guardrails**: Input validation to ensure only HR-related queries are processed
- **Tool Integration**: Backend functions for actions like creating leave requests or registering complaints
- **Context Management**: Maintains conversation history for context-aware interactions
- **User Interface**: Gradio-based web UI for seamless chat experience

## Installation

1. Clone the repository:

```bash
git clone https://github.com/r123singh/hr-assistant-openai-agents.git
cd hr-assistant-openai-agents
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set your OpenAI API key:

```bash
export OPENAI_API_KEY="your_openai_api_key"
```

## Usage

1. Run the script:

```bash
python hr_gardio_ui.py
```

2. Chat with the assistant:

```markdown
demo queries:
1. Leave request
    - "I need to take a leave"
    - "How many days of leave can I take in a year?"
    - "I want to apply for sick leave"
2. Benefits request
    - "what is life insurance?"
    - "Tell me about health benefits"
    - "What dental coverage do we have?"
3. Policy request
    - "what is the policy for maternity leave?"
    - "What are the working hours?"
    - "What's the dress code policy?"
4. Complaint request
    - "I want to file a complaint"
    - "I have an issue with my manager"
    - "How do I report harassment?"
5. Greeting
    - "Hello"
    - "Hi there"
    - "Good morning"
6. Other
    - "What's the weather like?"
    - "Tell me a joke"
    - "What time is it?"
```

