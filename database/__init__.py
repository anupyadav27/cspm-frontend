"""
Database module for onboarding - DynamoDB
"""
# DynamoDB operations
from onboarding.database.dynamodb_operations import (
    # Tenants
    create_tenant, get_tenant, get_tenant_by_name, list_tenants,
    # Providers
    create_provider, get_provider, get_provider_by_tenant_and_type,
    # Accounts
    create_account, get_account, update_account,
    list_accounts_by_tenant, list_accounts_by_provider,
    # Schedules
    create_schedule, get_schedule, update_schedule,
    list_schedules_by_tenant, list_schedules_by_account, get_due_schedules,
    # Executions
    create_execution, update_execution, list_executions_by_schedule,
    # Scan Results
    create_scan_result, update_scan_result, list_scan_results_by_account
)

# DynamoDB table creation
from onboarding.database.dynamodb_tables import create_tables

__all__ = [
    # Table creation
    'create_tables',
    # Tenants
    'create_tenant', 'get_tenant', 'get_tenant_by_name', 'list_tenants',
    # Providers
    'create_provider', 'get_provider', 'get_provider_by_tenant_and_type',
    # Accounts
    'create_account', 'get_account', 'update_account',
    'list_accounts_by_tenant', 'list_accounts_by_provider',
    # Schedules
    'create_schedule', 'get_schedule', 'update_schedule',
    'list_schedules_by_tenant', 'list_schedules_by_account', 'get_due_schedules',
    # Executions
    'create_execution', 'update_execution', 'list_executions_by_schedule',
    # Scan Results
    'create_scan_result', 'update_scan_result', 'list_scan_results_by_account'
]

