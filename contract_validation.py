import asyncio

from pydantic import BaseModel

from agents import Agent, Runner, trace, function_tool
from dotenv import load_dotenv

load_dotenv()


"""
This example demonstrates a deterministic flow for contract drafting, where each step is performed by an agent.
1. The first agent determines the contract type based on requirements
2. We feed the contract type into the second agent
3. The second agent validates if the contract type is appropriate and if all required fields are present
4. If the contract type is not appropriate or required fields are missing, we stop here
5. If the contract type is appropriate and all fields are present, we feed the details into the third agent
6. The third agent generates the final contract
"""

@function_tool(name_override="determine_contract_type", description_override="Determine the appropriate contract type based on the user's requirements. Type of contract can be Purchase Agreement, Franchise Agreement, or Time and Materials Contract.")
def determine_contract_type(requirements: str) -> str:
    requirements = requirements.lower()
    if any(keyword in requirements for keyword in ["purchase", "buy", "goods", "product"]):
        return "purchase"
    elif any(keyword in requirements for keyword in ["franchise", "brand", "license"]):
        return "franchise"
    elif any(keyword in requirements for keyword in ["consulting", "hourly", "time","material", "maintenance"]):
        return "timeandmaterial"
    return "Unknown"

contract_type_agent = Agent(
    name="contract_type_agent",
    instructions="Determine the appropriate contract type based on the user's requirements. Type of contract can be Purchase Agreement, Franchise Agreement, or Time and Materials Contract. Use tool to determine the contract type. If the contract type is not appropriate, stop here.",
    tools=[determine_contract_type],
)


class ContractValidatorOutput(BaseModel):
    is_valid_type: bool
    has_required_fields: bool


contract_validator_agent = Agent(
    name="contract_validator_agent",
    instructions="Validate the contract type and check if all required fields are present that is - type, name, date, buying party, selling party, payment terms, and other relevant fields. If the contract type is appropriate and all fields are present, return contract validator output else stop here saying some fields are missing. ",
    output_type=ContractValidatorOutput,
)

contract_generator_agent = Agent(
    name="contract_generator_agent",
    instructions="Generate a complete contract based on the validated contract type and details.",
    output_type=str,
)


async def main():
    input_prompt = input("What are your contract requirements? ")

    # Ensure the entire workflow is a single trace
    with trace("Deterministic contract flow"):
        # 1. Determine contract type
        type_result = await Runner.run(
            contract_type_agent,
            input_prompt,
        )
        print("Contract type determined")

        # 2. Validate contract type and fields
        validator_result = await Runner.run(
            contract_validator_agent,
            type_result.final_output,
        )

        # 3. Add a gate to stop if the contract type is not valid or required fields are missing
        assert isinstance(validator_result.final_output, ContractValidatorOutput)
        if not validator_result.final_output.is_valid_type:
            print("Contract type is not appropriate, so we stop here.")
            exit(0)

        if not validator_result.final_output.has_required_fields:
            print("Required fields are missing, so we stop here.")
            exit(0)

        print("Contract type is valid and all required fields are present, proceeding to generate contract.")

        # 4. Generate the contract
        contract_result = await Runner.run(
            contract_generator_agent,
            type_result.final_output,
        )
        print(f"Contract: {contract_result.final_output}")


if __name__ == "__main__":
    asyncio.run(main())