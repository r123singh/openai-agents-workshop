# Trip Planner

Building a trip planner agent with agents handsoff flow approach. The agents execute in sequence from collecting user preferences to compiling the final itinerary. The user preferences agent is the frontline agent that collects the user preferences and handsoffs to the destination research agent. The destination research agent uses the WebSearchTool to find activities at the destination that match the traveler's preferences. The itinerary agent uses the destination research agent's output to create a detailed day-by-day itinerary. The booking agent uses the itinerary agent's output to book accommodations and activities. The summary agent uses the booking agent's output to provide a summary and confirmation of the trip plan.

# Installation

```bash
git clone https://github.com/r123singh/trip-planner.git
```

```bash
cd trip-planner
```

```bash
pip install -r requirements.txt
```

# Run the app

```bash
python app.py
```

