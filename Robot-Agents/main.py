# end to end interface demonstrating role Gemini AI in robot design, manufacturing, functioning, and maintenance
# This is a simple Gradio demo that lets users get suggestions for robotics use cases and GenAI applications.
# It also demonstrates how to use Gemini AI to generate a robot control plan or task sequence from a natural language prompt.
# It also demonstrates how to use Gemini AI to generate a list of robotics parts that will be required to procure from a supplier to build a robot with following design specs.
# It also demonstrates how to use Gemini AI to generate a simple robot controller UI.

# Gradio is a great Python library to showcase your robotics domain application in a UI.
# Here is a simple Gradio demo that lets users get suggestions for robotics use cases and GenAI applications.

import gradio as gr
import google.generativeai as genai

# set the api key for the google generative ai
genai.configure(api_key="your_api_key") # YOUR API KEY
model = genai.GenerativeModel("gemini-1.5-flash")

design_specs = """
    {
    'type':'bird_drone',
    'name':'Avianoid',
    'design_goals':['Autonomous Flight', 'Biomimicry', 'Miniaturization', 'Payload Capacity'],
    'mechanical_design':{
        'Wings': '4x carbon fiber wings with a span of 1 meter',
        'Body': 'Carbon fiber body with a weight of 1 kg',
    },
    'electrical_software_systems':{
        'Power System': '4x 1000mAh batteries with a voltage of 12V',
        'Flight Control System': '4x flight control board with a voltage of 12V',
    },
}
"""
example_r = """
    {
    'type':'bird_drone',
    'name':'Avianoid',
    'design_goals':['Autonomous Flight', 'Biomimicry', 'Miniaturization', 'Payload Capacity'],
    'mechanical_design':{
        'Wings': {...},
        'Body': {...},
        ...
    },
    'electrical_software_systems':{
        'Power System': {...},
        'Flight Control System': {...},
        ...
    },
    'materials':{
        'Wings & Body': "...",
        ...
    }
}"""

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

def gemini_control(prompt):
    response = model.generate_content(prompt)
    print(response.text)
    return response.text

with gr.Blocks() as demo:
    gr.Markdown("# Robot Builder")
    nl_input = gr.Textbox(label="Natural Language Command", value="A bird like robot. A bird like robot that can fly like a bird.")
    nl_btn = gr.Button("Send to Gemini")
    output = gr.Textbox(label="Robot Specification", lines=10)

    def on_nl_run(nl_input):
        complete_spec = gemini_control(f"Design based on the user prompt: {nl_input}. Return in a structured format like this: {example_r}")
        return complete_spec
    nl_btn.click(on_nl_run, inputs=[nl_input], outputs=[output])
    
def gemini_generate_control_plan(prompt):
        """
        Use Gemini to generate a step-by-step robot control plan or task sequence from a natural language prompt.
        """
        control_plan_prompt = (
            f"You are a robotics expert. Given the following user request, generate a step-by-step control plan "
            f"or task sequence for a robot to accomplish the task. "
            f"Format the output as a numbered list of actions. "
            f"User request: {prompt}"
        )
        response = model.generate_content(control_plan_prompt)
        print("Control Plan:\n", response.text)
        return response.text


def get_robotics_parts_list():
    response = model.generate_content(f"Suggest a list of robotics parts that will be required to procure from a supplier to build a robot with following design specs: {design_specs}. Return only the list of parts, no other text.")
    return response.text

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
    gr.Markdown("# Robotics Domain Application Showcase (Gradio Demo)")
   
    with gr.Tab("Design Specs"):
        gr.Markdown("# Robot Builder")
        nl_input = gr.Textbox(label="Natural Language Command", value="A bird like robot. A bird like robot that can fly like a bird.")
        nl_btn = gr.Button("Send to Gemini")
        output = gr.Textbox(label="Robot Specification", lines=10)

        def on_nl_run(nl_input):
            complete_spec = gemini_control(f"Design based on the user prompt: {nl_input}. Return in a structured format like this: {example_r}")
            return complete_spec
        nl_btn.click(on_nl_run, inputs=[nl_input], outputs=[output])

    with gr.Tab("Parts List"):
        with gr.Row():
            parts_list_btn = gr.Button("Suggest a List of Robotics Parts", variant="primary")
        parts_list_output = gr.Textbox(label="List of Robotics Parts", lines=10, placeholder="List of Robotics Parts will be displayed here")
        parts_list_btn.click(get_robotics_parts_list, outputs=parts_list_output)

    with gr.Tab("Control Plan"):
        gr.Markdown("## Robot Task Planner (Powered by Gemini)")
        task_input = gr.Textbox(label="Describe the robot task", value="Pick up the blue cube and stack it on the red cube.")
        task_btn = gr.Button("Generate Control Plan")
        plan_output = gr.Textbox(label="Control Plan", lines=8)
        # control
        def on_task_run(task_input):
            return gemini_generate_control_plan(task_input)
        task_btn.click(on_task_run, inputs=[task_input], outputs=[plan_output])

    with gr.Tab("NLP Testing"):
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
    demo.launch(share=True)
