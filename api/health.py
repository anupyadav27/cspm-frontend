"""
Health check endpoints
"""
import os
from fastapi import APIRouter
from pydantic import BaseModel
import boto3

router = APIRouter(prefix="/api/v1/health", tags=["health"])


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    dynamodb: str
    secrets_manager: str
    version: str = "1.0.0"


@router.get("", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    # Check DynamoDB connectivity
    try:
        dynamodb = boto3.client('dynamodb', region_name=os.getenv('AWS_REGION', 'ap-south-1'))
        dynamodb.list_tables()
        dynamodb_status = "connected"
    except Exception:
        dynamodb_status = "disconnected"
    
    # Check Secrets Manager connectivity
    try:
        secrets = boto3.client('secretsmanager', region_name=os.getenv('AWS_REGION', 'ap-south-1'))
        secrets.list_secrets()
        secrets_status = "connected"
    except Exception:
        secrets_status = "disconnected"
    
    overall_status = "healthy" if (dynamodb_status == "connected" and secrets_status == "connected") else "unhealthy"
    
    return HealthResponse(
        status=overall_status,
        dynamodb=dynamodb_status,
        secrets_manager=secrets_status
    )

