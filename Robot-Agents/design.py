import google.generativeai as genai
import gradio as gr
import json

genai.configure(api_key="your_api_key")
model = genai.GenerativeModel("gemini-1.5-flash")

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
    

# if __name__ == "__main__":
#     demo.launch()

    # Example: Use genai to generate a robot control plan or task sequence from a natural language prompt

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

    # Example usage:
    # plan = gemini_generate_control_plan("Have the robot pick up a red ball from the table and place it in the box.")
    # print(plan)

    # You could also add a Gradio interface for this functionality:
with gr.Blocks() as control_plan_demo:
        gr.Markdown("## Robot Task Planner (Powered by Gemini)")
        task_input = gr.Textbox(label="Describe the robot task", value="Pick up the blue cube and stack it on the red cube.")
        task_btn = gr.Button("Generate Control Plan")
        plan_output = gr.Textbox(label="Control Plan", lines=8)

        def on_task_run(task_input):
            return gemini_generate_control_plan(task_input)
        task_btn.click(on_task_run, inputs=[task_input], outputs=[plan_output])

    # To launch this additional interface, uncomment the following line:
control_plan_demo.launch()

