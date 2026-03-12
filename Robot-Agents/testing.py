import google.generativeai as genai

genai.configure(api_key="your_api_key") # your api key

model = genai.GenerativeModel("gemini-1.5-flash")

import gradio as gr

class Robot:
    def __init__(self, name="Robo"):
        self.name = name
        self.position = [0, 0]
        self.direction = "NORTH"  # Possible: NORTH, EAST, SOUTH, WEST

    def move_forward(self, steps=1):
        if self.direction == "NORTH":
            self.position[1] += steps
        elif self.direction == "SOUTH":
            self.position[1] -= steps
        elif self.direction == "EAST":
            self.position[0] += steps
        elif self.direction == "WEST":
            self.position[0] -= steps
        return f"{self.name} moved forward to {self.position}"

    def turn_left(self):
        directions = ["NORTH", "WEST", "SOUTH", "EAST"]
        idx = directions.index(self.direction)
        self.direction = directions[(idx + 1) % 4]
        return f"{self.name} turned left. Now facing {self.direction}"

    def turn_right(self):
        directions = ["NORTH", "EAST", "SOUTH", "WEST"]
        idx = directions.index(self.direction)
        self.direction = directions[(idx + 1) % 4]
        return f"{self.name} turned right. Now facing {self.direction}"

    def report(self):
        return f"{self.name} is at {self.position}, facing {self.direction}"
    

    def gemini_control(self, prompt):
        response = model.generate_content(f"You are a robot controller. You are given a prompt and you need to extract the action and steps. Return action,steps separated by semicolon only for example: Move Forward,3; Turn Right, 0. The prompt is: {prompt}")
        print("raw response", response.text)
        actions_steps = response.text.strip().split(";")
        return actions_steps

# Create a global robot instance for the UI session
robot = Robot("GeminiBot")

def control_robot(action, steps):
    if action == "Move Forward":
        msg = robot.move_forward(steps)
    elif action == "Turn Left":
        msg = robot.turn_left()
    elif action == "Turn Right":
        msg = robot.turn_right()
    elif action == "Report":
        msg = robot.report()
    else:
        msg = "Unknown action."
    status = robot.report()
    return f"{msg}\n{status}"

with gr.Blocks() as demo:
    gr.Markdown("# Simple Robot Controller UI")
    with gr.Row():
        action = gr.Dropdown(
            ["Move Forward", "Turn Left", "Turn Right", "Report"],
            label="Action",
            value="Move Forward"
        )
        steps = gr.Number(value=1, label="Steps (for Move Forward)", precision=0)
        nl_input = gr.Textbox(label="Natural Language Command", value="Move forward 3 steps and turn right")
        nl_btn = gr.Button("Send to Gemini")
    output = gr.Textbox(label="Robot Status", lines=3)
    run_btn = gr.Button("Execute")

    def on_nl_run(nl_input):
        actions_steps = robot.gemini_control(nl_input)
        print("actions_steps", actions_steps)
        print("len(actions_steps)", len(actions_steps))
        msg = ""
        for action_step in actions_steps:
            action, steps = action_step.split(",")
            steps = int(steps) if steps is not None else 1
            msg += control_robot(action, steps) + "\n"
        return msg

    def on_run(action, steps):
        # Only use steps for Move Forward, otherwise ignore
        steps = int(steps) if steps is not None else 1
        return control_robot(action, steps)

    run_btn.click(on_run, inputs=[action, steps], outputs=output)
    nl_btn.click(on_nl_run, inputs=[nl_input], outputs=output)

if __name__ == "__main__":
    demo.launch()
    # You can use Google Generative AI (genai) to allow users to control the robot using natural language commands.
    # For example, you could add a textbox for free-form instructions, send the input to a Gemini model,
    # and parse the model's response to determine the robot action and steps.
    #
    # Example approach:
    # 1. Add a gr.Textbox for user natural language input.
    # 2. On submit, send the input to the Gemini model (via genai API).
    # 3. Use the model's response to extract the intended action and steps.
    # 4. Call control_robot() with the parsed action and steps.
    #
    # This would let users type things like "Move forward 3 steps and turn right" or "Report position",
    # and the Gemini model would interpret and control the robot accordingly.
    #
    # To implement, you would:
    # - Load your Gemini API key and initialize the genai client.
    # - Add a function to send the user prompt to Gemini and parse the response.
    # - Add a UI element for natural language input and connect it to the function.
    #
    # Example (pseudo-code, not runnable as-is):
    #
    # import google.generativeai as genai
    # genai.configure(api_key="YOUR_API_KEY")
    # model = genai.GenerativeModel("gemini-pro")
    #
    # def gemini_control(prompt):
    #     response = model.generate_content(prompt)
    #     # Parse response to extract action and steps
    #     # For example, use regex or prompt Gemini to return a structured JSON
    #     action, steps = parse_response(response.text)
    #     return control_robot(action, steps)
    #
    # # In gradio UI:
    # nl_input = gr.Textbox(label="Natural Language Command")
    # nl_btn = gr.Button("Send to Gemini")
    # nl_btn.click(gemini_control, inputs=nl_input, outputs=output)
    #
    # This will let users control the robot with natural language via Gemini!


# list the core activities in credit card apart from activation, blocking or usage