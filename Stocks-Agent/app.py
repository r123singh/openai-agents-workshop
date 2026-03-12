from agents import Agent, Runner, TResponseInputItem, trace, handoff, RunContextWrapper, function_tool, MessageOutputItem, HandoffOutputItem, ToolCallItem, ToolCallOutputItem, ItemHelpers, WebSearchTool
from pydantic import BaseModel
import yfinance as yf
import requests
import os
import asyncio
import uuid
from income_stmt_trend import plot_default_metrics

ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")

class StockContext(BaseModel):
    stock_symbol: str | None = None
    time_frame: str | None = None
    topic: str | None = None
    income_stmt: str | None = None

class AdvancedAnalyticsContext(BaseModel):
    stock_symbols: str | None = None
    metrics: str | None = None
    time_frame: str | None = None
    interval: str | None = None
    ohlc: str | None = None
    calculations: str | None = None

# HOOKs
async def on_stock_analysis_handoff(context: RunContextWrapper[StockContext]) -> None:
    """
    On stock analysis handoff, set the stock symbol to AAPL.
    Args:
        context: The context of the stock analysis agent.
    """
    print(f"Stock analysis handoff for the stock symbol: {context.context.stock_symbol}")
    context.context.time_frame = "daily"

# Tools

@function_tool(name_override="get_stock_data", description_override="Get the stock data for the given stock symbol.")
async def get_stock_data(context: RunContextWrapper[StockContext], stock_symbol: str) -> str:
    """
    Get the stock data for the given stock symbol.
    Args:
        stock_symbol: The stock symbol to get the data for.
    Returns:
        The stock data for the given stock symbol.
    """
    context.context.stock_symbol = stock_symbol
    stock_data = yf.Ticker(stock_symbol).info
    if stock_data is None:
        # fetch using vantage API
        response = requests.get(f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={stock_symbol}&apikey={ALPHA_VANTAGE_API_KEY}")
        if response.status_code == 200:
            stock_data = response.json()
        else:
            return "Sorry unable to retrive data as of now. Please try again later."
    return stock_data

@function_tool(name_override="get_stock_news", description_override="Get the stock news for the given stock symbol.")
def get_stock_news(context: RunContextWrapper[StockContext], stock_symbol: str) -> str:
    """
    Get the stock news for the given stock symbol.
    Args:
        stock_symbol: The stock symbol to get the news for.
    Returns:
        The stock news for the given stock symbol.
    """
    context.context.stock_symbol = stock_symbol
    stock_news = yf.Ticker(stock_symbol).news
    if stock_news is None:
        # fetch using API
        response = requests.get(f"https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers={stock_symbol}&apikey={ALPHA_VANTAGE_API_KEY}&limit=3")
        if response.status_code == 200:
            stock_news = response.json()
        else:
            return "Sorry unable to retrive news as of now. Please try again later."
    return stock_news

@function_tool(name_override="get_topic_news", description_override="Get the topic news for the given topic.")
def get_topic_news(context: RunContextWrapper[StockContext], topic: str) -> str:
    """
    Get the topic news for the given topic.
    Args:
        topic: The topic to get the news for.
    Returns:
        The topic news for the given topic.
    """
    context.context.topic = topic
    response = requests.get(f"https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics={topic}&apikey={ALPHA_VANTAGE_API_KEY}&limit=3")
    if response.status_code == 200:
        topic_news = response.json()
    else:
        return "Sorry unable to retrive news as of now. Please try again later."
    return topic_news

@function_tool(name_override="get_etf_data", description_override="Get the ETF data for the given ETF symbol.")
def get_etf_data(context: RunContextWrapper[StockContext], stock_symbol: str) -> str:
    """
    Get the ETF data for the given stock symbol.
    Args:
        stock_symbol: The stock symbol to get the data for.
    Returns:
        The ETF data for the given stock symbol.
    """
    context.context.stock_symbol = stock_symbol
    # fetch using API
    response = requests.get(f"https://www.alphavantage.co/query?function=ETF_PROFILE&symbol={stock_symbol}&apikey={ALPHA_VANTAGE_API_KEY}")
    if response.status_code == 200:
        etf_data = response.json()
    else:
            return "Sorry unable to retrive etf data as of now. Please try again later."
    return etf_data

@function_tool(name_override="get_corporate_action_dividend_data", description_override="Get the corporate action dividend data for the given stock symbol.")
def get_corporate_action_dividend_data(context: RunContextWrapper[StockContext], stock_symbol: str) -> str:
    """
    Get the corporate action dividend data for the given stock symbol.
    Args:
        stock_symbol: The stock symbol to get the data for.
    Returns:
        The corporate action dividend data for the given stock symbol.
    """
    context.context.stock_symbol = stock_symbol
    # fetch using API
    response = requests.get(f"https://www.alphavantage.co/query?function=DIVIDENDS&symbol={stock_symbol}&apikey={ALPHA_VANTAGE_API_KEY}")
    if response.status_code == 200:
            corporate_action_dividend_data = response.json()
    else:
            return "Sorry unable to retrive corporate action dividend data as of now. Please try again later."
    return corporate_action_dividend_data

@function_tool(name_override="get_company_overview_data", description_override="Get the company overview data for the given stock symbol.")
def get_company_overview_data(context: RunContextWrapper[StockContext], stock_symbol: str) -> str:
    """
    Get the company overview data for the given stock symbol.
    Args:
        stock_symbol: The stock symbol to get the data for.
    Returns:
        The company overview data for the given stock symbol.
    """
    context.context.stock_symbol = stock_symbol
    # fetch using API
    response = requests.get(f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={stock_symbol}&apikey={ALPHA_VANTAGE_API_KEY}")
    if response.status_code == 200:
        company_overview_data = response.json()
    else:
        return "Sorry unable to retrive company overview data as of now. Please try again later."
    return company_overview_data

@function_tool(name_override="get_income_statement", description_override="Get the income statement data for the given stock symbol.")
def get_income_statement(context: RunContextWrapper[StockContext], stock_symbol: str) -> str:
    """
    Get the income statement data for the given stock symbol.
    Args:
        stock_symbol: The stock symbol to get the data for.
    Returns:
        The income statement data for the given stock symbol.
    """
    context.context.stock_symbol = stock_symbol
    # fetch using API
    response = requests.get(f"https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol={stock_symbol}&apikey={ALPHA_VANTAGE_API_KEY}")
    if response.status_code == 200: 
        income_statement_data = response.json()
    else:
        return "Sorry unable to retrive income statement data as of now. Please try again later."
    return income_statement_data

@function_tool(name_override="income_statement_pattern_analysis", description_override="Analyze the income statement pattern for the given stock symbol.")
def income_statement_pattern_analysis(context: RunContextWrapper[StockContext], income_stmt: str) -> str:
    """
    Analyze the income statement pattern for the given stock symbol.
    Args:
        stock_symbol: The stock symbol to analyze the income statement pattern for.
    Returns:
        The income statement pattern analysis for the given stock symbol.
    """
    context.context.income_stmt = income_stmt
    graph = plot_default_metrics(income_stmt)
    graph.show()
    return "Graph generated successfully and displayed in the browser."

@function_tool(name_override="get_earning_data", description_override="Get the earning data for the given stock symbol.")
def get_earning_data(context: RunContextWrapper[StockContext], stock_symbol: str) -> str:
    """
    Get the earning data for the given stock symbol.
    Args:
        stock_symbol: The stock symbol to get the data for.
    Returns:
        The earning data for the given stock symbol.
    """
    context.context.stock_symbol = stock_symbol
    # fetch using API
    response = requests.get(f"https://www.alphavantage.co/query?function=EARNINGS&symbol={stock_symbol}&apikey={ALPHA_VANTAGE_API_KEY}")
    if response.status_code == 200:
        earning_data = response.json()
    else:
        return "Sorry unable to retrive earning data as of now. Please try again later."
    return earning_data

@function_tool(name_override="get_cashflow_data", description_override="Get the cashflow data for the given stock symbol.")
def get_cashflow_data(context: RunContextWrapper[StockContext], stock_symbol: str) -> str:
    """
    Get the cashflow data for the given stock symbol.
    Args:
        stock_symbol: The stock symbol to get the data for.
    Returns:
        The cashflow data for the given stock symbol.
    """
    context.context.stock_symbol = stock_symbol
    # fetch using API
    response = requests.get(f"https://www.alphavantage.co/query?function=CASH_FLOW&symbol={stock_symbol}&apikey={ALPHA_VANTAGE_API_KEY}")
    if response.status_code == 200:
        cashflow_data = response.json()
    else:
        return "Sorry unable to retrive cashflow data as of now. Please try again later."
    return cashflow_data

@function_tool(name_override="get_top_gainers_loosers_active_tickers", description_override="Get the top gainers, loosers and the most active traded tickers for the given stock symbol.")
def get_top_gainers_loosers_active_tickers(context: RunContextWrapper[StockContext], stock_symbol: str) -> str:
    """
    Get the top gainers, loosers and the most active traded tickers for the given stock symbol.
    Args:
        stock_symbol: The stock symbol to get the data for.
    Returns:
        The top gainers, loosers and the most active traded tickers for the given stock symbol.
    """
    context.context.stock_symbol = stock_symbol
    # fetch using API
    response = requests.get(f"https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey={ALPHA_VANTAGE_API_KEY}")
    if response.status_code == 200:
        top_gainers_loosers_active_tickers_data = response.json()
    else:
        return "Sorry unable to retrive top gainers, loosers and the most active traded tickers data as of now. Please try again later."
    return top_gainers_loosers_active_tickers_data

@function_tool(name_override="get_insider_trades", description_override="Get the insider trades for the given stock symbol.")
def get_insider_trades(context: RunContextWrapper[StockContext], stock_symbol: str) -> str:
    """
    Get the insider trades for the given stock symbol.
    Args:
        stock_symbol: The stock symbol to get the data for.
    Returns:
        The insider trades for the given stock symbol.
    """
    context.context.stock_symbol = stock_symbol
    # fetch using API
    response = requests.get(f"https://www.alphavantage.co/query?function=INSIDER_TRANSACTIONS&symbol={stock_symbol}&apikey={ALPHA_VANTAGE_API_KEY}")
    if response.status_code == 200:
        insider_trades_data = response.json()
    else:
        return "Sorry unable to retrive insider trades data as of now. Please try again later."
    return insider_trades_data

# TOOLS FOR ANALYTICS_ADVANCED AGENT
@function_tool(name_override="get_data_retrieval_processing", description_override="Get the data retrieval & processing for the given stock symbol.")
def get_data_retrieval_processing(context: RunContextWrapper[AdvancedAnalyticsContext], stock_symbols: str, time_frame: str, interval: str, ohlc: str, calculations: str) -> str:
    """
    Get the data retrieval & processing for the given stock symbol.
    Args:
        stock_symbols: The stock symbols to get the data for.
    Returns:
        The data retrieval & processing for the given stock symbol.
    """
    context.context.stock_symbols = stock_symbols
    context.context.time_frame = time_frame
    context.context.interval = interval
    context.context.ohlc = ohlc
    context.context.calculations = calculations
    # fetch using API
    response = requests.get(f"https://www.alphavantage.co/query?function=ANALYTICS_FIXED_WINDOW&SYMBOLS={stock_symbols}&RANGE={time_frame}&INTERVAL={interval}&OHLC={ohlc}&CALCULATIONS={calculations}&apikey={ALPHA_VANTAGE_API_KEY}")
    if response.status_code == 200:
        data_retrieval_processing_data = response.json()
    else:
        return "Sorry unable to retrive data retrieval & processing data as of now. Please try again later."
    return data_retrieval_processing_data

@function_tool(name_override="get_statistical_analysis", description_override="Get the statistical analysis for the given stock symbol.")
def get_statistical_analysis(context: RunContextWrapper[AdvancedAnalyticsContext], stock_symbols: str, time_frame: str, interval: str, ohlc: str, calculations: str) -> str:
    """
    Get the statistical analysis for the given stock symbol.
    Args:
        stock_symbols: The stock symbols to get the data for.
    Returns:
        The statistical analysis for the given stock symbol.
    """
    context.context.stock_symbols = stock_symbols
    context.context.time_frame = time_frame
    context.context.interval = interval
    context.context.ohlc = ohlc
    context.context.calculations = calculations
    # fetch using API
    response = requests.get(f"https://www.alphavantage.co/query?function=ANALYTICS_FIXED_WINDOW&SYMBOLS={stock_symbols}&RANGE={time_frame}&INTERVAL={interval}&OHLC={ohlc}&CALCULATIONS={calculations}&apikey={ALPHA_VANTAGE_API_KEY}")
    if response.status_code == 200:
        statistical_analysis_data = response.json()
    else:
        return "Sorry unable to retrive statistical analysis data as of now. Please try again later."
    return statistical_analysis_data
# AGENTS

income_statement_agent = Agent[StockContext](name="Income Statement Agent", 
handoff_description="An income statement agent that can assist with income statement analysis.",
instructions="You are a income statement expert that performs income statement analysis for a company."
"Generate a 3-4 lines analysis per year for the last 5 years from income statement data."
"It should be engaging, simple and with emojis for better understanding for a layman."
"Tabulate quarterly income statements corresponding to the last 5 quarters including date, revenue, gross profit, operating income, net income, cogs, ebitda, operating expenses, operating income, net income, and other relevant metrics."
"Tabulate annual income statements corresponding to the last 5 years including date, revenue, gross profit, operating income, net income, cogs, ebitda, operating expenses, operating income, net income, and other relevant metrics."
"Use the get_income_statement tool to get the income statement data using the stock symbol."
"If you are unable to resolve the stock symbol, return 'Sorry this is not a valid stock symbol. Do you want to go with 'AMZN' for Amazon stock?'.",
tools=[get_income_statement],
)

company_overview_agent = Agent[StockContext](name="Company Overview Agent", 
handoff_description="A company overview agent that can assist with company information,financial ratios, and other key metrics for the equity specified.",
instructions="You are a company overview expert that performs financial analysis for a company."
"Generate a 3-4 lines analysis purely based on the real time data."
"It should be engaging, simple and with emojis for better understanding for a layman."
"Show basic information about the company like name, address, phone number, website, etc."
"Tabulate all the realtime data for information purposes (including financial ratios, key metrics, etc.)."
"Use the get_stock_data tool to get the company overview data using the stock symbol."
"If you are unable to resolve the stock symbol, return 'Sorry this is not a valid stock symbol. Do you want to go with 'AMZN' for Amazon stock?'.",
tools=[get_company_overview_data],
)

corporate_action_agent = Agent[StockContext](name="Corporate Action Dividend Agent", 
handoff_description="A corporate action dividend agent that can assist with dividends distribution of a company.",
instructions="You are a corporate action dividend expert that performs dividend distribution actions analysis."
"Generate a 3-4 lines analysis purely based on the real time data."
"It should be engaging, simple and with emojis for better understanding for a layman."
"Also tabulate the real time results for information purposes(including metrics like quick ratio, current ratio, debt to equity ratio, etc. if available)."
"Use the get_corporate_action_dividend_data tool to get the corporate action dividend data using the stock symbol."
"If you are unable to resolve the stock symbol, return 'Sorry this is not a valid stock symbol. Do you want to go with 'AMZN' for Amazon stock?'.",
tools=[get_corporate_action_dividend_data],
)

# sameple query - "What is the ETF profile for SPY?"
etf_agent = Agent[StockContext](name="ETF Agent", 
handoff_description="An ETF agent that can help with ETF analysis.",
instructions="You are a ETF analyst expert."
"Generate a 3-4 lines analysis for a given ETF only based on the real time data. "
"It should be engaging, simple and with emojis for better understanding for a layman."
"Also show the real time results with relevant fields in tabular format for better understanding including address, phone number, website, etc."
"Use the get_etf_data tool to get the ETF data using the stock ticker provided."
"If you are unable to resolve the stock ticker, return 'Sorry this is not a valid symbol. Do you want to go with 'SPY' for SPDR S&P 500 ETF?'.",
tools=[get_etf_data],
)

stock_analysis_agent = Agent[StockContext](name="Stock Analysis Agent", 
handoff_description="A stock analysis agent that can help with a company's stock analysis.",
instructions="A stock analysis agent that can help with stock market analysis and decision-making."
"You are a stock analyst expert. You generate a 3-4 lines analysis for a given stock only based on the real time data. "
"It should be engaging, simple and with emojis for better understanding for a layman."
"Use the get_stock_data tool to get the stock data using the stock symbol."
"If you are unable to resolve the stock symbol, return 'Sorry this is not a valid stock symbol. Do you want to go with 'AMZN' for Amazon stock?'.",
tools=[get_stock_data],
)

topic_news_agent = Agent[StockContext](name="Topic News Agent", 
handoff_description="A topic news agent that can help with the latest topic news.",
instructions="Fetch the latest topic news for the given topic using the get_topic_news tool."
"Topic should be one of: [blockchain, earnings, ipo, mergers_and_acquisitions, financial_markets, economy_fiscal, economy_monetary, economy_macro, energy_transportation, finance, life_sciences, manufacturing, real_estate, retail_wholesale, technology]"
"Sort the news items ordered by latest date in tabular format with columns - date, ticker, ticker_sentiment, title, link, source, summary, overall_sentiment, topic",
tools=[get_topic_news],
)

stock_news_agent = Agent[StockContext](name="Stock News Agent", 
handoff_description="A stock news agent that can help with the latest stock news.",
instructions="For topic related news, route it to the topic news agent."
"For a stock ticker related news, fetch the latest news using either WebSearch tool or get_stock_news tool."
"Generate 3-4 lines easy to understand summary of the news explaining using analogies and metaphors for a layman."
"For example"
"Apple AAPL Stock hits 52 week high (source: CNBC) [2025-06-18]![Link](https://www.cnbc.com/quotes/AAPL)"
"Seems like Apple is doing well. If you already have in portfolio,👍 to you..."
"If not you might need to buy it. 🤔"
"Do you wish to deep dive into stock analysis?",
tools=[get_stock_news, WebSearchTool(search_context_size="medium", user_location= None)],
handoffs=[topic_news_agent]
)

earning_analysis_agent = Agent[StockContext](name="Earning Analysis Agent(EPS)", 
handoff_description="An earning analysis agent that can help with a company's earning(EPS) analysis.",
instructions="You are a earning(EPS) analyst expert."
"- Generate a 3-4 lines analysis over the last 5 years only based on earnings data"
"- Comment on latest quarter earnings based on most recent quarter"
"- It should be engaging, simple and with emojis for better understanding for a layman."
"- Tabulate the earnings data for the last 5 years including reportedEPS."
"- Tabulate the earnings data for past 6 quarters including fiscal ending date, reportedEPS, estimatedEPS, surprise, surprise percentage, and other relevant metrics."
"- Use the 'get_earning_data' tool to get the earning data using the stock symbol."
"- If you are unable to resolve the stock symbol, return 'Sorry this is not a valid stock symbol. Do you want to go with 'AMZN' for Amazon stock?'.",
tools=[get_earning_data],
)

cashflow_analysis_agent = Agent[StockContext](name="Cashflow Analysis Agent", 
handoff_description="A cashflow analysis agent that can help with a company's cashflow analysis.",
instructions="You are a cashflow analyst expert."
"- Generate a 3-4 lines analysis over the last 5 years only based on cashflow data"
"- Comment on latest quarter cashflow based on most recent quarter"
"- It should be engaging, simple and with emojis for better understanding for a layman."
"- Tabulate annual cashflow for the last 5 years including fiscal ending date, operating cash flow, capital expenditure, dividend payout, netincome, cash flow from financing denoted by currency"
"- Tabulate quarterly cashflow for past 6 quarters including fiscal ending date, operating cash flow, capital expenditure, dividend payout, netincome, cash flow from financing denoted by currency"
"- Use the 'get_cashflow_data' tool to get the cashflow data using the stock symbol."
"- If you are unable to resolve the stock symbol, return 'Sorry this is not a valid stock symbol. Do you want to go with 'AMZN' for Amazon stock?'.",
tools=[get_cashflow_data],
)

top_gainers_loosers_agent = Agent[StockContext](name="Top Gainers/Loosers Agent", 
handoff_description="An agent that can assist with top 20 gainers, loosers and the most active traded tickers",
instructions="You are expert in gainers, loosers and active stocks."
"- Mention the date and time of the datas"
"- Generate a 3-4 lines analysis for the top 5 gainers of the day."
"- Generate a 3-4 lines analysis for the top 5 loosers of the day."
"- Generate a 3-4 lines analysis for the top 5 most active traded tickers of the day."
"- It should be engaging, simple and with emojis for better understanding for a layman."
"- Tabulate all the data for gainers including ticker, price, change_amount, change_percentage, and volume"
"- Tabulate all the data for loosers including ticker, price, change_amount, change_percentage, and volume"
"- Tabulate all the data for most active traded tickers including ticker, price, change_amount, change_percentage, and volume"
"- Use the 'get_top_gainers_loosers_data' tool to get the top gainers/loosers data using the stock symbol."
"- If you are unable to resolve the stock symbol, return 'Sorry this is not a valid stock symbol. Do you want to go with 'AMZN' for Amazon stock?'.",
tools=[get_top_gainers_loosers_active_tickers],
)

insider_trades_agent = Agent[StockContext](name="Insider Trades Agent", 
handoff_description="An insider trades agent that can help with a company's insider transactions.",
instructions="You are a insider trades analyst expert."
"- Generate a 3-4 lines analysis for the insider transactions that happened in the recent 10 occurrences."
"- It should be engaging, simple and with emojis for better understanding for a layman."
"- Tabulate all the data for insider transactions including date, ticker, executive_name, executive_title, security_type, acquisition_or_disposal, shares, and share_price"
"- Use the 'get_insider_trades' tool to get the insider transactions data using the stock symbol."
"- If you are unable to resolve the stock symbol, return 'Sorry this is not a valid stock symbol. Do you want to go with 'AMZN' for Amazon stock?'.",
tools=[get_insider_trades],
)

# Sub-Agents for ANALYTICS_ADVANCED AGENT

# 1. Data Retrieval & Processing Agent
data_retrieval_processing_agent = Agent[AdvancedAnalyticsContext](name="Data Retrieval & Processing Agent", 
handoff_description="A data retrieval & processing agent that can help with a company's data retrieval & processing.",
instructions="You are a data retrieval & processing expert."
"- Validate symbols and date ranges"
"- Fetch OHLC data and convert to specified intervals"
"- Calculate returns and handle missing data"
"- Manage API rate limits and caching",
tools=[get_data_retrieval_processing],
)

# 2. Statistical Analysis Agent
statistical_analysis_agent = Agent[AdvancedAnalyticsContext](name="Statistical Analysis Agent", 
handoff_description="A statistical analysis agent that can help with a company's statistical analysis.",
instructions="You are a statistical analysis expert."
"- Calculate MIN, MAX, MEAN, MEDIAN, VARIANCE, STDDEV"
"- Compute MAX_DRAWDOWN and CUMULATIVE_RETURN"
"- Generate HISTOGRAM distributions"
"- Handle annualization options for variance/standard deviation",
tools=[get_statistical_analysis],
)

# 3. Correlation & Time Series Agent
correlation_time_series_agent = Agent[AdvancedAnalyticsContext](name="Correlation & Time Series Agent", 
handoff_description="A correlation & time series agent that can help with a company's correlation & time series analysis.",
instructions="You are a correlation & time series expert."
"- Compute CORRELATION and COVARIANCE matrices"
"- Calculate AUTOCORRELATION with configurable lags"
"- Analyze time series patterns and seasonality"
"- Handle multi-symbol data synchronization",
tools=[get_correlation_time_series],
)

# 4. Output Formatting & Validation Agent
output_formatting_validation_agent = Agent[AdvancedAnalyticsContext](name="Output Formatting & Validation Agent", 
handoff_description="An output formatting & validation agent that can help with a company's output formatting & validation.",
instructions="You are a output formatting & validation expert."
"- Structure JSON responses with proper formatting"
"- Validate API parameters and calculation accuracy"
"- Handle edge cases and error conditions"
"- Generate human-readable summaries and reports",
tools=[get_output_formatting_validation],
)

advanced_analytics_agent = Agent[StockContext](name="Advanced Analytics Agent", 
handoff_description="An advanced analytics triage agent that can help with a company's advanced analytics.",
instructions="You are a expert in advanced analytics metrics (e.g. total return, variance, auto-correlation, etc.)."
"Your task is to call the appropriate agents based on the user's request. Prior to that, ask the user to provide the stock(s) they are interested in for advanced analytics(if not provided)."
"1. Ask for metrics to analyze( if not provided)."
"2. Ask for time frame to analyze(if not provided)."
"3. Assume interval as daily if not provided."
"4. Assume ohlc as close if not provided."
"*Assume calculations as mean, stddev, correlation if not provided."
"*You can use the WebSearch tool to resolve the stock symbols based on user input only if a stock symbol is not found in the user input.",
tools=[WebSearchTool(search_context_size="medium", user_location= None)],
handoffs=[
    data_retrieval_processing_agent,
    statistical_analysis_agent,
    correlation_time_series_agent,
    output_formatting_validation_agent,
]
)

stock_triage_agent = Agent(
    name="Stock Triage Agent",
    handoff_description="A stock triage agent that can delegate tasks to the appropriate agent based on the user's request.",
    instructions="You are a stock triage agent. You can use your tools to delegate tasks to the appropriate agent based on the user's request. You can also use the WebSearch tool to retrieve the stock symbol based on user input only if a stock symbol is not found in the user input.",
    tools=[WebSearchTool(search_context_size="medium", user_location= None)],
    handoffs=[ 
        handoff(agent=stock_analysis_agent, on_handoff=on_stock_analysis_handoff),
        stock_news_agent,
        etf_agent,
        corporate_action_agent,
        company_overview_agent,
        income_statement_agent,
        earning_analysis_agent,
        cashflow_analysis_agent,
        top_gainers_loosers_agent,
        insider_trades_agent,
        advanced_analytics_agent
     ]
)

# MAIN
async def main():
    current_agent: Agent[StockContext] = stock_triage_agent
    input_items: list[TResponseInputItem] = []
    context = StockContext()
    # Normally, each input from the user would be an API request to your app, and you can wrap the request in a trace()
    # Here, we'll just use a random UUID for the conversation ID
    conversation_id = uuid.uuid4().hex[:16]

    while True:
        user_input = input("Enter your message: ")
        with trace("Stock Triage", group_id=conversation_id):
            input_items.append({"content": user_input, "role": "user"})
            result = await Runner.run(current_agent, input_items, context=context)

            for new_item in result.new_items:
                agent_name = new_item.agent.name
                if isinstance(new_item, MessageOutputItem):
                    print(f"{agent_name}: {ItemHelpers.text_message_output(new_item)}")
                elif isinstance(new_item, HandoffOutputItem):
                    print(
                        f"Handed off from {new_item.source_agent.name} to {new_item.target_agent.name}"
                    )
                elif isinstance(new_item, ToolCallItem):
                    print(f"{agent_name}: Calling a tool")
                elif isinstance(new_item, ToolCallOutputItem):
                    print(f"{agent_name}: Tool call output: {new_item.output}")
                else:
                    print(f"{agent_name}: Skipping item: {new_item.__class__.__name__}")
            input_items = result.to_input_list()
            current_agent = result.last_agent


if __name__ == "__main__":
    asyncio.run(main())