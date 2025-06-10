from agents import function_tool
from datetime import datetime, timedelta

"""
This tool is used to get the details of an existing contract.
"""
@function_tool
def get_contract_details(contract_id: str) -> str:
    # TODO: Implement real business logic to retrieve contract details
    """
    This tool is used to get the details of an existing contract.
    Args:
        contract_id: The ID of the contract to get the details of.
    Returns:
        A dictionary containing the details of the contract.
    """
    return {
        "contract_id": contract_id,
        "contract_type": "Service Agreement",
        "start_date": "2024-01-01",
        "end_date": "2025-12-31",
        "contract_value": 75000.00,
        "payment_terms": "Net 30",
        "billing_frequency": "Monthly",
        "parties": {"customer": "ABC Corporation", "provider": "XYZ Services Ltd"},
        "key_terms": ["24/7 Support", "99.9% Uptime SLA", "Monthly reporting"],
    }


@function_tool
def get_contract_status(contract_id: str) -> str:
    # TODO: This is a dummy data for the contract status.
    """
    This tool is used to get the status of an existing contract.
    Args:
        contract_id: The ID of the contract to get the status of.
    Returns:
        A dictionary containing the status of the contract.
    """
    return {
        "contract_id": contract_id,
        "status": "Active",
        "compliance_status": "Compliant",
        "last_reviewed_date": str(datetime.today() - timedelta(days=30)).split(" ")[0],
        "next_review_date": str(datetime.today() + timedelta(days=60)).split(" ")[0],
        "days_until_expiration": 180,
        "renewal_status": "Auto-renewal enabled",
    }