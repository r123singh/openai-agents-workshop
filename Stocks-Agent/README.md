# Stocks-Agent: Multi-Agent Stock Market Expert

The **Stocks-Agent** is a multi-agent system leveraging the OpenAI Agents SDK to provide deep, conversational stock market analysis and research. This agent can help you analyze stocks, track trends, interpret financial statements, and provide actionable investment insights.

---

## Features

- **Multi-Agent Architecture**: Each agent specializes in aspects of stock analysis (fundamentals, price action, news, and more), collaborating for a holistic experience.
- **Automatic Data Retrieval**: Fetches live and historical financial data for stocks (e.g., income statements, balance sheets).
- **Conversational Assistant**: Ask questions in plain English; the assistant interprets, routes, and answers complex queries.
- **Financial Statement Analysis**: Trends, ratios, and insights on income, balance, and cash flow statements.
- **Stock Trend Insights**: Annual and quarterly performance reviews, growth rates, and sector comparisons.
- **Tool Execution**: Can call analysis tools for data transformation or visualization.
- **Extensible & Modifiable**: Easily add new agent skills or integrate APIs.

---

## Example Queries

- *"What was the revenue trend for IBM over the last 5 years?"*
- *"Compare the net profit margin of Apple and Microsoft."*
- *"Show me recent news affecting Tesla's stock price."*
- *"What are the key risks for Amazon?"*
- *"Summarize the latest income statement for Google."*

---

## Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/r123singh/openai-agents-workshop.git
   cd openai-agents-workshop/ai-agents/openai/Stocks-Agent
   ```

2. **Install dependencies**
   
   (Recommended: use a virtual environment)

   ```bash
   pip install -r requirements.txt
   ```

3. **Set up API keys**

   - Obtain an OpenAI API key and any required financial data provider keys (e.g., Alpha Vantage).
   - Create a `.env` file in this directory:

     ```
     OPENAI_API_KEY=your_openai_api_key_here
     ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
     # Add more as needed
     ```

4. **Run the agent**

   ```bash
   python app.py
   ```

   - The agent will take input in the terminal and respond interactively.
   - You can also adapt it for web or Gradio frontends.

---

## Architecture

- **app.py**: Entry point; main agent loop and message routing.
- **income_stmt_trend.py**: Example of trend/statement analysis logic.
- **site/**: Contains an optional static website frontend (`site.html`) for describing or demoing the project.

Each agent implements specialized analysis (e.g., statement parsing, ratio calculation, trends, risk news) and communicates through message objects.

---

## File Overview

| File/Folder           | Purpose                                    |
|-----------------------|--------------------------------------------|
| app.py                | Main execution logic                       |
| income_stmt_trend.py  | Income statement trend analysis logic      |
| requirements.txt      | Python dependencies                        |
| site/                 | Simple HTML frontend for showcase          |
| README.md             | This documentation                         |

---

## Customization

- **Add new skills** by extending existing agents or writing new modules.
- **Integrate APIs** by swapping out or expanding data providers in your analysis modules.
- **Upgrade models** by configuring your OpenAI model in `app.py`.

---

## Example: Income Statement Trend Analysis

The agent supports parsing and analyzing multi-year income statements. For example, given IBM's annual results, it can show growth rates, trends, and generate insights such as consistent profit growth, margin trends, or one-off impacts.

See the `income_stmt_trend.py` file for code samples.

---

## Demo / UI

- Terminal-based interaction: `python app.py`
- Static description page: open `site/site.html` in your browser

---

## Contributing

PRs are welcome! Please document changes and update this README for major updates.

---

## License

ISC
---

**Built with the OpenAI Agents SDK • by [r123singh](https://github.com/r123singh)**
