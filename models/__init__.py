"""
Pydantic models for API requests/responses
"""
from onboarding.models.tenant import TenantCreate, TenantResponse
from onboarding.models.provider import ProviderCreate, ProviderResponse
from onboarding.models.account import AccountCreate, AccountResponse, AccountUpdate
from onboarding.models.credential import (
    CredentialSubmit, CredentialResponse, AWSAccessKeyCredentials,
    AWSIAMRoleCredentials, AzureServicePrincipalCredentials,
    GCPServiceAccountCredentials, AliCloudAccessKeyCredentials
)
from onboarding.models.schedule import (
    ScheduleCreate, ScheduleUpdate, ScheduleResponse, ScheduleExecutionResponse
)

__all__ = [
    'TenantCreate',
    'TenantResponse',
    'ProviderCreate',
    'ProviderResponse',
    'AccountCreate',
    'AccountResponse',
    'AccountUpdate',
    'CredentialSubmit',
    'CredentialResponse',
    'AWSAccessKeyCredentials',
    'AWSIAMRoleCredentials',
    'AzureServicePrincipalCredentials',
    'GCPServiceAccountCredentials',
    'AliCloudAccessKeyCredentials',
    'ScheduleCreate',
    'ScheduleUpdate',
    'ScheduleResponse',
    'ScheduleExecutionResponse'
]

