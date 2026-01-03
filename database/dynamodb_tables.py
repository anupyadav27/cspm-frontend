"""
DynamoDB table definitions and schemas
"""
from typing import Dict, Any, List
import boto3
from botocore.exceptions import ClientError
import os
import logging

logger = logging.getLogger(__name__)

# DynamoDB client
dynamodb = boto3.client('dynamodb', region_name=os.getenv('AWS_REGION', 'ap-south-1'))

# Table names
TENANTS_TABLE = os.getenv('DYNAMODB_TENANTS_TABLE', 'threat-engine-tenants')
PROVIDERS_TABLE = os.getenv('DYNAMODB_PROVIDERS_TABLE', 'threat-engine-providers')
ACCOUNTS_TABLE = os.getenv('DYNAMODB_ACCOUNTS_TABLE', 'threat-engine-accounts')
SCHEDULES_TABLE = os.getenv('DYNAMODB_SCHEDULES_TABLE', 'threat-engine-schedules')
EXECUTIONS_TABLE = os.getenv('DYNAMODB_EXECUTIONS_TABLE', 'threat-engine-executions')
SCAN_RESULTS_TABLE = os.getenv('DYNAMODB_SCAN_RESULTS_TABLE', 'threat-engine-scan-results')


def create_tables():
    """Create all DynamoDB tables if they don't exist"""
    
    # Tenants table
    create_tenants_table()
    
    # Providers table
    create_providers_table()
    
    # Accounts table
    create_accounts_table()
    
    # Schedules table
    create_schedules_table()
    
    # Executions table
    create_executions_table()
    
    # Scan results table
    create_scan_results_table()
    
    logger.info("All DynamoDB tables created/verified")


def create_tenants_table():
    """Create tenants table"""
    try:
        dynamodb.create_table(
            TableName=TENANTS_TABLE,
            KeySchema=[
                {'AttributeName': 'tenant_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'tenant_id', 'AttributeType': 'S'},
                {'AttributeName': 'tenant_name', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'tenant-name-index',
                    'KeySchema': [
                        {'AttributeName': 'tenant_name', 'KeyType': 'HASH'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            BillingMode='PAY_PER_REQUEST'  # On-demand pricing
        )
        logger.info(f"Created table: {TENANTS_TABLE}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            logger.info(f"Table {TENANTS_TABLE} already exists")
        else:
            raise


def create_providers_table():
    """Create providers table"""
    try:
        dynamodb.create_table(
            TableName=PROVIDERS_TABLE,
            KeySchema=[
                {'AttributeName': 'provider_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'provider_id', 'AttributeType': 'S'},
                {'AttributeName': 'tenant_id', 'AttributeType': 'S'},
                {'AttributeName': 'provider_type', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'tenant-provider-index',
                    'KeySchema': [
                        {'AttributeName': 'tenant_id', 'KeyType': 'HASH'},
                        {'AttributeName': 'provider_type', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'},
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        logger.info(f"Created table: {PROVIDERS_TABLE}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            logger.info(f"Table {PROVIDERS_TABLE} already exists")
        else:
            raise


def create_accounts_table():
    """Create accounts table"""
    try:
        dynamodb.create_table(
            TableName=ACCOUNTS_TABLE,
            KeySchema=[
                {'AttributeName': 'account_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'account_id', 'AttributeType': 'S'},
                {'AttributeName': 'tenant_id', 'AttributeType': 'S'},
                {'AttributeName': 'provider_id', 'AttributeType': 'S'},
                {'AttributeName': 'status', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'tenant-accounts-index',
                    'KeySchema': [
                        {'AttributeName': 'tenant_id', 'KeyType': 'HASH'},
                        {'AttributeName': 'status', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'},
                },
                {
                    'IndexName': 'provider-accounts-index',
                    'KeySchema': [
                        {'AttributeName': 'provider_id', 'KeyType': 'HASH'},
                        {'AttributeName': 'status', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'},
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        logger.info(f"Created table: {ACCOUNTS_TABLE}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            logger.info(f"Table {ACCOUNTS_TABLE} already exists")
        else:
            raise


def create_schedules_table():
    """Create schedules table"""
    try:
        dynamodb.create_table(
            TableName=SCHEDULES_TABLE,
            KeySchema=[
                {'AttributeName': 'schedule_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'schedule_id', 'AttributeType': 'S'},
                {'AttributeName': 'tenant_id', 'AttributeType': 'S'},
                {'AttributeName': 'account_id', 'AttributeType': 'S'},
                {'AttributeName': 'next_run_at', 'AttributeType': 'S'},
                {'AttributeName': 'enabled', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'tenant-schedules-index',
                    'KeySchema': [
                        {'AttributeName': 'tenant_id', 'KeyType': 'HASH'},
                        {'AttributeName': 'schedule_id', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'},
                },
                {
                    'IndexName': 'account-schedules-index',
                    'KeySchema': [
                        {'AttributeName': 'account_id', 'KeyType': 'HASH'},
                        {'AttributeName': 'schedule_id', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'},
                },
                {
                    'IndexName': 'next-run-index',
                    'KeySchema': [
                        {'AttributeName': 'enabled', 'KeyType': 'HASH'},
                        {'AttributeName': 'next_run_at', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'},
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        logger.info(f"Created table: {SCHEDULES_TABLE}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            logger.info(f"Table {SCHEDULES_TABLE} already exists")
        else:
            raise


def create_executions_table():
    """Create schedule executions table"""
    try:
        dynamodb.create_table(
            TableName=EXECUTIONS_TABLE,
            KeySchema=[
                {'AttributeName': 'execution_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'execution_id', 'AttributeType': 'S'},
                {'AttributeName': 'schedule_id', 'AttributeType': 'S'},
                {'AttributeName': 'account_id', 'AttributeType': 'S'},
                {'AttributeName': 'started_at', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'schedule-executions-index',
                    'KeySchema': [
                        {'AttributeName': 'schedule_id', 'KeyType': 'HASH'},
                        {'AttributeName': 'started_at', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'},
                },
                {
                    'IndexName': 'account-executions-index',
                    'KeySchema': [
                        {'AttributeName': 'account_id', 'KeyType': 'HASH'},
                        {'AttributeName': 'started_at', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'},
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        logger.info(f"Created table: {EXECUTIONS_TABLE}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            logger.info(f"Table {EXECUTIONS_TABLE} already exists")
        else:
            raise


def create_scan_results_table():
    """Create scan results table"""
    try:
        dynamodb.create_table(
            TableName=SCAN_RESULTS_TABLE,
            KeySchema=[
                {'AttributeName': 'scan_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'scan_id', 'AttributeType': 'S'},
                {'AttributeName': 'account_id', 'AttributeType': 'S'},
                {'AttributeName': 'status', 'AttributeType': 'S'},
                {'AttributeName': 'started_at', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'account-scans-index',
                    'KeySchema': [
                        {'AttributeName': 'account_id', 'KeyType': 'HASH'},
                        {'AttributeName': 'started_at', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'},
                },
                {
                    'IndexName': 'status-scans-index',
                    'KeySchema': [
                        {'AttributeName': 'status', 'KeyType': 'HASH'},
                        {'AttributeName': 'started_at', 'KeyType': 'RANGE'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'},
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        logger.info(f"Created table: {SCAN_RESULTS_TABLE}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            logger.info(f"Table {SCAN_RESULTS_TABLE} already exists")
        else:
            raise

