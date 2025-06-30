# Restaurant-Agent 🍜 Your AI Restaurant Assistant 🍜

## Overview 📖

This is a pilot project for a restaurant management agent that uses OpenAI's GPT-4 to help with restaurant operations. Streamlining the restaurant management process for customers and staff alike by enabling AI-led restaurant operations through a chatbot interface. Built using OpenAI Agents SDK it uses the latest in LLM and Agentic AI to help with restaurant management.

## Repository Structure 📂

```bash
Restaurant-Agent/
├── frontend/
├── requirements.txt
├── .gitignore
├── README.md
├── LICENSE
├── .env.example
├── sample_queries.txt
├── agent.py
├── app.py
```
    - **app.py** is the main file to run the application server application baed on FastAPI
    - **agent.py** is the agents logic built using OpenAI Agents SDK.
    - **requirements.txt** is the dependencies for the backend part of the application and can be installed using pip install -r requirements.txt
    - **frontend** is the frontend part of the application and can be built using npm install and npm run dev

## Core Features 🚀

### Restaurant Buddy
- 💬 Restaurant Chatbot
- 🚀 Instant responses
- 🧠 Multi-step conversations
- 🔍 Contextual responses
- 🤖 Friendly Agentic AI

### Quick Actions ⚡
- 📋 FAQ & Help Center
- 📊 Claims Status Tracker
- ℹ️ Process Information Guide

### Restaurant Management 📝
- 📝 New Order
- 🏷️ Order Types Overview
- 🔍 Check Order Status
- 📄 Menu Management
- 🔄 Delivery Management
- ⚖️ Customer Support

### Dashboard Analytics 📈

#### Restaurant Analytics Dashboard 📊
- 📈 Interactive Daily Restaurant Chart
- 🔄 Real-time Data Updates
- 📤 Export Functionality

#### Order Status Overview 📋
- 🎯 Animated Status Breakdown
- 🎨 Color-coded Indicators
- 🔍 Detailed Drill-down Views

#### Restaurant Management Center 🎯
- ⚡ Recent Orders with Priority
- 🎯 Quick Action Buttons
- 🔔 Status Notifications

#### Order Workflow 📋
- 📝 Step-by-step Progress
- 📤 Order Status
- ✅ Confirmation

#### Restaurant Documentation 📚
- 👁️ Document Preview
- 📑 Version Control
- 🔒 Secure Sharing

#### Restaurant Communication 💬
- 💌 Integrated Messaging
- 🔔 Automated Notifications
- 🎫 Support Ticket System

## Tech Stack 🛠️

### Backend
- Python
- FastAPI
- OpenAI Agents SDK

### Frontend
- React
- TypeScript
- Tailwind CSS

## Installation 📦

1. Clone the repository

```bash
git clone https://github.com/r123singh/restaurant-agent.git
``` 

2. Install dependencies

```bash
pip install -r requirements.txt
```

3. Rename the .env.example file to .env and add your OpenAI API key 

```bash
OPENAI_API_KEY=your_openai_api_key
```

4. Run the application

```bash
python app.py
```

5. Open the application in your browser

```bash
http://localhost:8000
```

## Contributing 🤝

1. Fork the repository

2. Create a new branch

```bash
git checkout -b feature/new-feature
```

3. Make your changes and commit them

```bash
git add .
git commit -m "Add new feature"
```

4. Push your changes

```bash
git push origin feature/new-feature
```

5. Create a pull request

```bash
gh pr create --base main --head feature/new-feature --title "Add new feature" --body "This PR adds a new feature to the claims agent"
```

6. Test using the sample queries

```bash
cat sample_queries.txt
```
Test using the sample queries to see the claims agent in action by simply running agent.py

```bash
python agent.py
```

## License 📝

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact 📧

For any questions or feedback, please contact me at [rockycodes101@gmail.com](mailto:rockycodes101@gmail.com).
