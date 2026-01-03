"""
Configuration management for onboarding module
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # AWS Services Configuration
    aws_region: str = os.getenv('AWS_REGION', 'ap-south-1')
    
    # DynamoDB table names (optional - defaults in dynamodb_tables.py)
    dynamodb_tenants_table: str = os.getenv('DYNAMODB_TENANTS_TABLE', 'threat-engine-tenants')
    dynamodb_providers_table: str = os.getenv('DYNAMODB_PROVIDERS_TABLE', 'threat-engine-providers')
    dynamodb_accounts_table: str = os.getenv('DYNAMODB_ACCOUNTS_TABLE', 'threat-engine-accounts')
    dynamodb_schedules_table: str = os.getenv('DYNAMODB_SCHEDULES_TABLE', 'threat-engine-schedules')
    dynamodb_executions_table: str = os.getenv('DYNAMODB_EXECUTIONS_TABLE', 'threat-engine-executions')
    dynamodb_scan_results_table: str = os.getenv('DYNAMODB_SCAN_RESULTS_TABLE', 'threat-engine-scan-results')
    
    # Secrets Manager configuration
    secrets_manager_prefix: str = os.getenv('SECRETS_MANAGER_PREFIX', 'threat-engine')
    secrets_manager_kms_key_id: Optional[str] = os.getenv('SECRETS_MANAGER_KMS_KEY_ID')
    
    # Platform configuration
    platform_aws_account_id: str = os.getenv('PLATFORM_AWS_ACCOUNT_ID', '')
    
    # Logging
    log_level: str = os.getenv('LOG_LEVEL', 'INFO')
    
    # Engine service URLs (ClusterIP)
    aws_engine_url: str = os.getenv(
        'AWS_ENGINE_URL',
        'http://aws-compliance-engine.threat-engine-engines.svc.cluster.local'
    )
    azure_engine_url: str = os.getenv(
        'AZURE_ENGINE_URL',
        'http://azure-compliance-engine.threat-engine-engines.svc.cluster.local'
    )
    gcp_engine_url: str = os.getenv(
        'GCP_ENGINE_URL',
        'http://gcp-compliance-engine.threat-engine-engines.svc.cluster.local'
    )
    alicloud_engine_url: str = os.getenv(
        'ALICLOUD_ENGINE_URL',
        'http://alicloud-compliance-engine.threat-engine-engines.svc.cluster.local'
    )
    oci_engine_url: str = os.getenv(
        'OCI_ENGINE_URL',
        'http://oci-compliance-engine.threat-engine-engines.svc.cluster.local'
    )
    ibm_engine_url: str = os.getenv(
        'IBM_ENGINE_URL',
        'http://ibm-compliance-engine.threat-engine-engines.svc.cluster.local'
    )
    yaml_rule_builder_url: str = os.getenv(
        'YAML_RULE_BUILDER_URL',
        'http://yaml-rule-builder.threat-engine-engines.svc.cluster.local'
    )
    
    # API Configuration
    api_host: str = os.getenv('API_HOST', '0.0.0.0')
    api_port: int = int(os.getenv('API_PORT', '8000'))
    
    # Scheduler
    scheduler_interval_seconds: int = int(os.getenv('SCHEDULER_INTERVAL_SECONDS', '60'))
    
    class Config:
        env_file = '.env'
        case_sensitive = False


# Global settings instance
settings = Settings()

