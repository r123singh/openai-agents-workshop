from agents import function_tool
import openai
import uuid
from datetime import datetime
from docx import Document
import openai


def get_template_content(contract_type: str) -> str:
    template_file_path = f"contract_templates/{contract_type}_agreement.docx"
    try:
        doc = Document(template_file_path)
        return doc
    except Exception as e:
        print(f"Error reading template file: {e}")
        return None

@function_tool(name_override="determine_contract_type", description_override="Determine the type of contract based on the contract requirements.")
def determine_contract_type(requirements: str) -> str:
    """
    This function is used to determine the type of contract based on the contract requirements.
    Args:
        requirements: A string containing the requirements of the contract.
    Returns:
        A string containing the type of contract.
    """
    requirements = requirements.lower()
    if any(keyword in requirements for keyword in ["purchase", "buy", "goods", "product"]):
        return "purchase"
    elif any(keyword in requirements for keyword in ["franchise", "brand", "license"]):
        return "franchise"
    elif any(keyword in requirements for keyword in ["consulting", "hourly", "time","material", "maintenance"]):
        return "timeandmaterial"
    return "Unknown"

@function_tool(name_override="draft_contract", description_override="Draft a contract based on the contract type and contract details.")
def draft_contract(contract_type: str, contract_details: str) -> str:
    try:
        template_content = get_template_content(contract_type)
        if not template_content:
            return {"error": f"No template found for the contract type {contract_type}"}
        
         # Prepare prompt for the LLM
        prompt = f"""
        Act as a legal contract expert. Using this contract template:
        {template_content}
        
        And these contract details:
        {contract_details}
        
        Generate a professional contract that:
        1. Maintains legal compliance
        2. Uses appropriate legal terminology
        3. Expands clauses where necessary
        4. Adds relevant standard clauses
        5. Ensures all terms are clearly defined
        
        Return only the generated contract text without any additional explanations.
        """
        # Call the LLM to generate the contract
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
        #Extract the contract text from the response
        try:
            contract_text = response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Error parsing model response: {e}")
            return {"error": f"Error parsing model response: {e}"}
        
        #Create contract object with metadata
        contract = {
            "contract_id": str(uuid.uuid4()),
            "contract_type": contract_type,
            "created_date": datetime.now().strftime("%B %d, %Y"),
            "content": contract_text,
            "details": contract_details,
            "status": "DRAFT",
            "model_metrics": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            },
        }

        return contract
    except Exception as e:
        print(f"Error drafting contract: {e}")
        return {"error": f"Error drafting contract: {e}"}
    
@function_tool(name_override="get_contract_questions", description_override="Get the questions for the contract type.")
def get_contract_questions(contract_type: str) -> list[str]:
    """
    This function is used to get the questions for the contract type.
    Args:
        contract_type: A string containing the type of contract.
    Returns:
        A list of strings containing the questions for the contract type.
    """
    questions = {
        "purchase": [
            "What is the buyer entity name?",
            "What is the seller entity name?",
            "What are the goods/products being purchased?",
            "What is the total purchase amount?",
            "What are the delivery terms?",
            "What are the payment terms?",
        ],
        "franchise": [
            "What is the franchisor name?",
            "What is the franchisee name?",
            "What is the franchise territory?",
            "What is the initial franchise fee?",
            "What is the royalty percentage?",
            "What is the term length in years?",
        ],
        "timeandmaterial": [
            "What is the service provider name?",
            "What is the client name?",
            "What is the hourly rate?",
            "What is the estimated number of hours?",
            "What is the payment schedule?",
            "What is the scope of work?",
        ],
    }
    return questions.get(contract_type, [])