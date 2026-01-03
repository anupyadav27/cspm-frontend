"""
DynamoDB operations for onboarding data
"""
import boto3
from botocore.exceptions import ClientError
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import uuid
import os
import logging
from decimal import Decimal

from onboarding.database.dynamodb_tables import (
    TENANTS_TABLE, PROVIDERS_TABLE, ACCOUNTS_TABLE,
    SCHEDULES_TABLE, EXECUTIONS_TABLE, SCAN_RESULTS_TABLE
)

logger = logging.getLogger(__name__)

dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'ap-south-1'))


class DecimalEncoder(json.JSONEncoder):
    """Helper to convert Decimal to int/float for JSON"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)


def serialize_item(item: Dict[str, Any]) -> Dict[str, Any]:
    """Convert DynamoDB item to Python dict"""
    if not item:
        return {}
    
    result = {}
    for key, value in item.items():
        if isinstance(value, Decimal):
            result[key] = int(value) if value % 1 == 0 else float(value)
        elif isinstance(value, dict):
            result[key] = serialize_item(value)
        elif isinstance(value, list):
            result[key] = [serialize_item(v) if isinstance(v, dict) else v for v in value]
        else:
            result[key] = value
    return result


# ==================== TENANTS ====================

def create_tenant(tenant_name: str, description: Optional[str] = None) -> Dict[str, Any]:
    """Create a new tenant"""
    tenant_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    item = {
        'tenant_id': tenant_id,
        'tenant_name': tenant_name,
        'description': description or '',
        'status': 'active',
        'created_at': now,
        'updated_at': now
    }
    
    table = dynamodb.Table(TENANTS_TABLE)
    table.put_item(Item=item)
    return item


def get_tenant(tenant_id: str) -> Optional[Dict[str, Any]]:
    """Get tenant by ID"""
    table = dynamodb.Table(TENANTS_TABLE)
    response = table.get_item(Key={'tenant_id': tenant_id})
    return serialize_item(response.get('Item'))


def get_tenant_by_name(tenant_name: str) -> Optional[Dict[str, Any]]:
    """Get tenant by name"""
    table = dynamodb.Table(TENANTS_TABLE)
    response = table.query(
        IndexName='tenant-name-index',
        KeyConditionExpression='tenant_name = :name',
        ExpressionAttributeValues={':name': tenant_name}
    )
    items = response.get('Items', [])
    return serialize_item(items[0]) if items else None


def list_tenants() -> List[Dict[str, Any]]:
    """List all tenants"""
    table = dynamodb.Table(TENANTS_TABLE)
    response = table.scan()
    return [serialize_item(item) for item in response.get('Items', [])]


# ==================== PROVIDERS ====================

def create_provider(tenant_id: str, provider_type: str) -> Dict[str, Any]:
    """Create a new provider"""
    provider_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    item = {
        'provider_id': provider_id,
        'tenant_id': tenant_id,
        'provider_type': provider_type,
        'status': 'active',
        'created_at': now,
        'updated_at': now
    }
    
    table = dynamodb.Table(PROVIDERS_TABLE)
    table.put_item(Item=item)
    return item


def get_provider(provider_id: str) -> Optional[Dict[str, Any]]:
    """Get provider by ID"""
    if not provider_id:
        return None
    table = dynamodb.Table(PROVIDERS_TABLE)
    response = table.get_item(Key={'provider_id': provider_id})
    return serialize_item(response.get('Item'))


def get_provider_by_tenant_and_type(tenant_id: str, provider_type: str) -> Optional[Dict[str, Any]]:
    """Get provider by tenant and type"""
    table = dynamodb.Table(PROVIDERS_TABLE)
    response = table.query(
        IndexName='tenant-provider-index',
        KeyConditionExpression='tenant_id = :tid AND provider_type = :ptype',
        ExpressionAttributeValues={
            ':tid': tenant_id,
            ':ptype': provider_type
        }
    )
    items = response.get('Items', [])
    return serialize_item(items[0]) if items else None


# ==================== ACCOUNTS ====================

def create_account(
    provider_id: str,
    tenant_id: str,
    account_name: str,
    account_number: Optional[str] = None
) -> Dict[str, Any]:
    """Create a new account"""
    account_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    item = {
        'account_id': account_id,
        'provider_id': provider_id,
        'tenant_id': tenant_id,
        'account_name': account_name,
        'account_number': account_number or '',
        'status': 'pending',
        'onboarding_status': 'pending',
        'created_at': now,
        'updated_at': now
    }
    
    table = dynamodb.Table(ACCOUNTS_TABLE)
    table.put_item(Item=item)
    return item


def get_account(account_id: str) -> Optional[Dict[str, Any]]:
    """Get account by ID"""
    table = dynamodb.Table(ACCOUNTS_TABLE)
    response = table.get_item(Key={'account_id': account_id})
    return serialize_item(response.get('Item'))


def update_account(account_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update account"""
    table = dynamodb.Table(ACCOUNTS_TABLE)
    
    # Build update expression
    update_expr = "SET updated_at = :now"
    expr_values = {':now': datetime.utcnow().isoformat()}
    expr_names = {}
    
    for key, value in updates.items():
        if key not in ['account_id', 'created_at']:
            placeholder = f"#{key}"
            expr_names[placeholder] = key
            value_placeholder = f":{key}"
            expr_values[value_placeholder] = value
            update_expr += f", {placeholder} = {value_placeholder}"
    
    response = table.update_item(
        Key={'account_id': account_id},
        UpdateExpression=update_expr,
        ExpressionAttributeValues=expr_values,
        ExpressionAttributeNames=expr_names,
        ReturnValues='ALL_NEW'
    )
    return serialize_item(response.get('Attributes', {}))


def list_accounts_by_tenant(tenant_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
    """List accounts by tenant"""
    table = dynamodb.Table(ACCOUNTS_TABLE)
    
    if status:
        response = table.query(
            IndexName='tenant-accounts-index',
            KeyConditionExpression='tenant_id = :tid',
            FilterExpression='#status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':tid': tenant_id,
                ':status': status
            }
        )
    else:
        response = table.query(
            IndexName='tenant-accounts-index',
            KeyConditionExpression='tenant_id = :tid',
            ExpressionAttributeValues={':tid': tenant_id}
        )
    
    return [serialize_item(item) for item in response.get('Items', [])]


def list_accounts_by_provider(provider_id: str) -> List[Dict[str, Any]]:
    """List accounts by provider"""
    table = dynamodb.Table(ACCOUNTS_TABLE)
    response = table.query(
        IndexName='provider-accounts-index',
        KeyConditionExpression='provider_id = :pid',
        ExpressionAttributeValues={':pid': provider_id}
    )
    return [serialize_item(item) for item in response.get('Items', [])]


# ==================== SCHEDULES ====================

def create_schedule(
    tenant_id: str,
    account_id: str,
    name: str,
    schedule_type: str,
    provider_type: str,
    cron_expression: Optional[str] = None,
    interval_seconds: Optional[int] = None,
    regions: Optional[List[str]] = None,
    services: Optional[List[str]] = None,
    exclude_services: Optional[List[str]] = None,
    timezone: str = 'UTC'
) -> Dict[str, Any]:
    """Create a new schedule"""
    schedule_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    item = {
        'schedule_id': schedule_id,
        'tenant_id': tenant_id,
        'account_id': account_id,
        'name': name,
        'schedule_type': schedule_type,
        'provider_type': provider_type,
        'cron_expression': cron_expression or '',
        'interval_seconds': interval_seconds or 0,
        'regions': regions or [],
        'services': services or [],
        'exclude_services': exclude_services or [],
        'timezone': timezone,
        'status': 'active',
        'enabled': 'true',
        'run_count': 0,
        'success_count': 0,
        'failure_count': 0,
        'notify_on_success': False,
        'notify_on_failure': True,
        'created_at': now,
        'updated_at': now
    }
    
    table = dynamodb.Table(SCHEDULES_TABLE)
    table.put_item(Item=item)
    return item


def get_schedule(schedule_id: str) -> Optional[Dict[str, Any]]:
    """Get schedule by ID"""
    table = dynamodb.Table(SCHEDULES_TABLE)
    response = table.get_item(Key={'schedule_id': schedule_id})
    return serialize_item(response.get('Item'))


def update_schedule(schedule_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update schedule"""
    table = dynamodb.Table(SCHEDULES_TABLE)
    
    update_expr = "SET updated_at = :now"
    expr_values = {':now': datetime.utcnow().isoformat()}
    expr_names = {}
    
    for key, value in updates.items():
        if key not in ['schedule_id', 'created_at']:
            placeholder = f"#{key}"
            expr_names[placeholder] = key
            value_placeholder = f":{key}"
            expr_values[value_placeholder] = value
            update_expr += f", {placeholder} = {value_placeholder}"
    
    response = table.update_item(
        Key={'schedule_id': schedule_id},
        UpdateExpression=update_expr,
        ExpressionAttributeValues=expr_values,
        ExpressionAttributeNames=expr_names,
        ReturnValues='ALL_NEW'
    )
    return serialize_item(response.get('Attributes', {}))


def list_schedules_by_tenant(tenant_id: str) -> List[Dict[str, Any]]:
    """List schedules by tenant"""
    table = dynamodb.Table(SCHEDULES_TABLE)
    response = table.query(
        IndexName='tenant-schedules-index',
        KeyConditionExpression='tenant_id = :tid',
        ExpressionAttributeValues={':tid': tenant_id}
    )
    return [serialize_item(item) for item in response.get('Items', [])]


def list_schedules_by_account(account_id: str) -> List[Dict[str, Any]]:
    """List schedules by account"""
    table = dynamodb.Table(SCHEDULES_TABLE)
    response = table.query(
        IndexName='account-schedules-index',
        KeyConditionExpression='account_id = :aid',
        ExpressionAttributeValues={':aid': account_id}
    )
    return [serialize_item(item) for item in response.get('Items', [])]


def get_due_schedules() -> List[Dict[str, Any]]:
    """Get schedules that are due to run"""
    table = dynamodb.Table(SCHEDULES_TABLE)
    now = datetime.utcnow().isoformat()
    
    response = table.query(
        IndexName='next-run-index',
        KeyConditionExpression='enabled = :enabled AND next_run_at <= :now',
        ExpressionAttributeValues={
            ':enabled': 'true',
            ':now': now
        }
    )
    return [serialize_item(item) for item in response.get('Items', [])]


# ==================== EXECUTIONS ====================

def create_execution(
    schedule_id: str,
    account_id: str,
    triggered_by: str = 'scheduler'
) -> Dict[str, Any]:
    """Create a new execution record"""
    execution_id = str(uuid.uuid4())
    started_at = datetime.utcnow().isoformat()
    
    item = {
        'execution_id': execution_id,
        'schedule_id': schedule_id,
        'account_id': account_id,
        'started_at': started_at,
        'status': 'running',
        'triggered_by': triggered_by,
        'created_at': started_at
    }
    
    table = dynamodb.Table(EXECUTIONS_TABLE)
    table.put_item(Item=item)
    return item


def update_execution(
    execution_id: str,
    status: str,
    scan_id: Optional[str] = None,
    total_checks: Optional[int] = None,
    passed_checks: Optional[int] = None,
    failed_checks: Optional[int] = None,
    error_message: Optional[str] = None
) -> Dict[str, Any]:
    """Update execution record"""
    table = dynamodb.Table(EXECUTIONS_TABLE)
    
    update_expr = "SET #status = :status, completed_at = :completed"
    expr_values = {
        ':status': status,
        ':completed': datetime.utcnow().isoformat()
    }
    expr_names = {'#status': 'status'}
    
    if scan_id:
        update_expr += ", scan_id = :scan_id"
        expr_values[':scan_id'] = scan_id
    
    if total_checks is not None:
        update_expr += ", total_checks = :total"
        expr_values[':total'] = total_checks
    
    if passed_checks is not None:
        update_expr += ", passed_checks = :passed"
        expr_values[':passed'] = passed_checks
    
    if failed_checks is not None:
        update_expr += ", failed_checks = :failed"
        expr_values[':failed'] = failed_checks
    
    if error_message:
        update_expr += ", error_message = :error"
        expr_values[':error'] = error_message
    
    response = table.update_item(
        Key={'execution_id': execution_id},
        UpdateExpression=update_expr,
        ExpressionAttributeValues=expr_values,
        ExpressionAttributeNames=expr_names,
        ReturnValues='ALL_NEW'
    )
    return serialize_item(response.get('Attributes', {}))


def list_executions_by_schedule(schedule_id: str) -> List[Dict[str, Any]]:
    """List executions by schedule"""
    table = dynamodb.Table(EXECUTIONS_TABLE)
    response = table.query(
        IndexName='schedule-executions-index',
        KeyConditionExpression='schedule_id = :sid',
        ExpressionAttributeValues={':sid': schedule_id},
        ScanIndexForward=False  # Most recent first
    )
    return [serialize_item(item) for item in response.get('Items', [])]


# ==================== SCAN RESULTS ====================

def create_scan_result(
    scan_id: str,
    account_id: str,
    provider_type: str,
    scan_type: str = 'scheduled'
) -> Dict[str, Any]:
    """Create a new scan result record"""
    started_at = datetime.utcnow().isoformat()
    
    item = {
        'scan_id': scan_id,
        'account_id': account_id,
        'provider_type': provider_type,
        'scan_type': scan_type,
        'started_at': started_at,
        'status': 'running',
        'created_at': started_at
    }
    
    table = dynamodb.Table(SCAN_RESULTS_TABLE)
    table.put_item(Item=item)
    return item


def update_scan_result(
    scan_id: str,
    status: str,
    total_checks: Optional[int] = None,
    passed_checks: Optional[int] = None,
    failed_checks: Optional[int] = None,
    error_checks: Optional[int] = None,
    result_storage_path: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Update scan result"""
    table = dynamodb.Table(SCAN_RESULTS_TABLE)
    
    update_expr = "SET #status = :status, completed_at = :completed"
    expr_values = {
        ':status': status,
        ':completed': datetime.utcnow().isoformat()
    }
    expr_names = {'#status': 'status'}
    
    if total_checks is not None:
        update_expr += ", total_checks = :total"
        expr_values[':total'] = total_checks
    
    if passed_checks is not None:
        update_expr += ", passed_checks = :passed"
        expr_values[':passed'] = passed_checks
    
    if failed_checks is not None:
        update_expr += ", failed_checks = :failed"
        expr_values[':failed'] = failed_checks
    
    if error_checks is not None:
        update_expr += ", error_checks = :error"
        expr_values[':error'] = error_checks
    
    if result_storage_path:
        update_expr += ", result_storage_path = :path"
        expr_values[':path'] = result_storage_path
    
    if metadata:
        update_expr += ", metadata = :meta"
        expr_values[':meta'] = metadata
    
    response = table.update_item(
        Key={'scan_id': scan_id},
        UpdateExpression=update_expr,
        ExpressionAttributeValues=expr_values,
        ExpressionAttributeNames=expr_names,
        ReturnValues='ALL_NEW'
    )
    return serialize_item(response.get('Attributes', {}))


def list_scan_results_by_account(account_id: str) -> List[Dict[str, Any]]:
    """List scan results by account"""
    table = dynamodb.Table(SCAN_RESULTS_TABLE)
    response = table.query(
        IndexName='account-scans-index',
        KeyConditionExpression='account_id = :aid',
        ExpressionAttributeValues={':aid': account_id},
        ScanIndexForward=False  # Most recent first
    )
    return [serialize_item(item) for item in response.get('Items', [])]

