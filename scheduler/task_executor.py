"""
Task executor for scheduled scans
"""
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import uuid4

from onboarding.database.dynamodb_operations import (
    get_account, create_execution, update_execution
)
from onboarding.storage.secrets_manager_storage import secrets_manager_storage
from onboarding.utils.engine_client import EngineClient


class TaskExecutor:
    """Executes scheduled scans by calling appropriate engine"""
    
    def __init__(self):
        self.engine_client = EngineClient()
    
    async def execute_scan(
        self,
        account_id: str,
        provider_type: str,
        regions: Optional[List[str]] = None,
        services: Optional[List[str]] = None,
        exclude_services: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Execute a compliance scan"""
        
        # Get account
        account = get_account(account_id)
        if not account:
            raise ValueError(f"Account {account_id} not found")
        
        if account.get('status') != "active":
            raise ValueError(f"Account {account_id} is not active")
        
        # Get credentials from Secrets Manager
        credentials = secrets_manager_storage.retrieve(account_id)
        
        # Call appropriate engine
        if provider_type == "aws":
            result = await self.engine_client.scan_aws(
                credentials=credentials,
                account_number=account.get('account_number'),
                regions=regions,
                services=services,
                exclude_services=exclude_services
            )
        elif provider_type == "azure":
            result = await self.engine_client.scan_azure(
                credentials=credentials,
                subscription_id=account.get('account_number'),
                regions=regions,
                services=services
            )
        elif provider_type == "gcp":
            result = await self.engine_client.scan_gcp(
                credentials=credentials,
                project_id=account.get('account_number'),
                regions=regions,
                services=services
            )
        elif provider_type == "alicloud":
            result = await self.engine_client.scan_alicloud(
                credentials=credentials,
                account_id=account.get('account_number'),
                regions=regions,
                services=services
            )
        else:
            raise ValueError(f"Unsupported provider: {provider_type}")
        
        return result
    
    async def execute_scheduled_scan(
        self,
        schedule_id: str,
        account_id: str,
        provider_type: str,
        regions: Optional[List[str]] = None,
        services: Optional[List[str]] = None,
        exclude_services: Optional[List[str]] = None,
        triggered_by: str = "scheduler"
    ) -> Dict[str, Any]:
        """Execute a scan and record execution history"""
        
        # Create execution record
        execution = create_execution(
            schedule_id=schedule_id,
            account_id=account_id,
            triggered_by=triggered_by
        )
        execution_id = execution['execution_id']
        started_at = datetime.fromisoformat(execution['started_at'].replace('Z', '+00:00'))
        
        try:
            # Execute scan
            result = await self.execute_scan(
                account_id=account_id,
                provider_type=provider_type,
                regions=regions,
                services=services,
                exclude_services=exclude_services
            )
            
            # Calculate execution time
            completed_at = datetime.utcnow()
            execution_time = int((completed_at - started_at.replace(tzinfo=None)).total_seconds())
            
            # Update execution
            update_execution(
                execution_id=execution_id,
                status='completed',
                scan_id=result.get('scan_id', str(uuid4())),
                total_checks=result.get('total_checks', 0),
                passed_checks=result.get('passed_checks', 0),
                failed_checks=result.get('failed_checks', 0)
            )
            
            return {
                "execution_id": execution_id,
                "status": "completed",
                "result": result
            }
            
        except Exception as e:
            completed_at = datetime.utcnow()
            execution_time = int((completed_at - started_at.replace(tzinfo=None)).total_seconds())
            
            # Update execution with error
            update_execution(
                execution_id=execution_id,
                status='failed',
                error_message=str(e)
            )
            
            raise

