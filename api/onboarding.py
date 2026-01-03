"""
Account onboarding API endpoints
"""
import uuid
import json
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from pathlib import Path
from datetime import datetime

from onboarding.database.dynamodb_operations import (
    get_tenant, create_tenant, get_provider_by_tenant_and_type,
    create_provider, create_account, get_account, update_account,
    list_accounts_by_tenant
)
from onboarding.models.account import AccountCreate, AccountResponse, AccountUpdate
from onboarding.validators import (
    AWSValidator, AzureValidator, GCPValidator,
    AliCloudValidator, OCIValidator, IBMValidator
)
from onboarding.storage.secrets_manager_storage import secrets_manager_storage
from onboarding.utils.helpers import generate_external_id
from onboarding.config import settings

router = APIRouter(prefix="/api/v1/onboarding", tags=["onboarding"])


def get_validator(provider_type: str, credential_type: str):
    """Get appropriate validator for provider and credential type"""
    provider_lower = provider_type.lower()
    
    if provider_lower == 'aws':
        return AWSValidator()
    elif provider_lower == 'azure':
        return AzureValidator()
    elif provider_lower == 'gcp':
        return GCPValidator()
    elif provider_lower == 'alicloud':
        return AliCloudValidator()
    elif provider_lower == 'oci':
        return OCIValidator()
    elif provider_lower == 'ibm':
        return IBMValidator()
    else:
        raise ValueError(f"Unsupported provider: {provider_type}")


@router.get("/{provider}/methods")
async def get_available_auth_methods(provider: str):
    """Get available authentication methods for a provider"""
    methods = {
        "aws": [
            {
                "method": "iam_role",
                "name": "IAM Role (Recommended)",
                "description": "Secure cross-account role assumption",
                "requires": ["role_arn", "external_id", "account_number"],
                "cloudformation_supported": True
            },
            {
                "method": "access_key",
                "name": "Access Key",
                "description": "IAM user access key and secret",
                "requires": ["access_key_id", "secret_access_key"],
                "cloudformation_supported": False
            }
        ],
        "azure": [
            {
                "method": "service_principal",
                "name": "Service Principal",
                "description": "Azure AD service principal with client secret",
                "requires": ["client_id", "client_secret", "tenant_id", "subscription_id"]
            }
        ],
        "gcp": [
            {
                "method": "service_account",
                "name": "Service Account JSON",
                "description": "Service account key file (JSON)",
                "requires": ["service_account_json"]
            }
        ],
        "alicloud": [
            {
                "method": "access_key",
                "name": "Access Key",
                "description": "AliCloud AccessKey ID and Secret",
                "requires": ["access_key_id", "access_key_secret"]
            }
        ],
        "oci": [
            {
                "method": "user_principal",
                "name": "User Principal",
                "description": "OCI user OCID with API key",
                "requires": ["user_ocid", "tenancy_ocid", "fingerprint", "private_key", "region"]
            }
        ],
        "ibm": [
            {
                "method": "api_key",
                "name": "API Key",
                "description": "IBM Cloud API key",
                "requires": ["api_key"]
            }
        ]
    }
    
    if provider.lower() not in methods:
        raise HTTPException(404, f"Provider {provider} not supported")
    
    return {"provider": provider, "methods": methods[provider.lower()]}


@router.post("/{provider}/init")
async def init_onboarding(
    provider: str,
    request: Dict[str, Any]
):
    """Initialize onboarding for any provider"""
    tenant_id = request.get("tenant_id")
    account_name = request.get("account_name")
    auth_method = request.get("auth_method", "iam_role" if provider.lower() == "aws" else "service_principal")
    
    if not all([tenant_id, account_name]):
        raise HTTPException(400, "Missing required fields: tenant_id, account_name")
    
    # Verify tenant exists
    tenant = get_tenant(tenant_id)
    if not tenant:
        raise HTTPException(404, f"Tenant {tenant_id} not found")
    
    # Get or create provider
    provider_obj = get_provider_by_tenant_and_type(tenant_id, provider.lower())
    
    if not provider_obj:
        provider_obj = create_provider(tenant_id, provider.lower())
    
    # Generate onboarding data
    onboarding_id = str(uuid.uuid4())
    external_id = generate_external_id() if provider.lower() == "aws" and auth_method == "iam_role" else None
    
    # Create account record
    account = create_account(
        provider_id=provider_obj['provider_id'],
        tenant_id=tenant_id,
        account_name=account_name
    )
    
    # Update account with onboarding_id
    update_account(account['account_id'], {'onboarding_id': onboarding_id})
    
    onboarding_data = {
        "onboarding_id": onboarding_id,
        "account_id": account['account_id'],
        "provider": provider.lower(),
        "auth_method": auth_method,
        "account_name": account_name,
        "external_id": external_id
    }
    
    if provider.lower() == "aws" and auth_method == "iam_role" and external_id:
        onboarding_data["cloudformation_template_url"] = (
            f"/api/v1/onboarding/aws/cloudformation-template?external_id={external_id}"
        )
    
    return onboarding_data


@router.get("/aws/cloudformation-template")
async def get_cloudformation_template(external_id: str):
    """Get CloudFormation template for AWS IAM role"""
    template_path = Path(__file__).parent.parent / "templates" / "aws_cloudformation.yaml"
    
    if not template_path.exists():
        raise HTTPException(500, "CloudFormation template not found")
    
    template_content = template_path.read_text()
    
    # Replace placeholders
    template_content = template_content.replace(
        '{{EXTERNAL_ID}}', external_id
    ).replace(
        '{{PLATFORM_ACCOUNT_ID}}', settings.platform_aws_account_id or 'YOUR_PLATFORM_ACCOUNT_ID'
    )
    
    return {
        "template": template_content,
        "external_id": external_id,
        "platform_account_id": settings.platform_aws_account_id or 'YOUR_PLATFORM_ACCOUNT_ID'
    }


@router.post("/{provider}/validate")
async def validate_and_activate_account(
    provider: str,
    request: Dict[str, Any]
):
    """Validate credentials and activate account"""
    account_id = request.get("account_id")
    auth_method = request.get("auth_method")
    credentials_data = request.get("credentials")
    
    if not all([account_id, auth_method, credentials_data]):
        raise HTTPException(400, "Missing required fields: account_id, auth_method, credentials")
    
    # Get account
    account = get_account(account_id)
    if not account:
        raise HTTPException(404, f"Account {account_id} not found")
    
    # Get provider to determine provider_type
    from onboarding.database.dynamodb_operations import get_provider
    provider_obj = get_provider(account['provider_id'])
    if not provider_obj:
        raise HTTPException(404, f"Provider not found for account {account_id}")
    
    # Determine credential type
    credential_type_map = {
        "aws": {
            "iam_role": "aws_iam_role",
            "access_key": "aws_access_key"
        },
        "azure": {
            "service_principal": "azure_service_principal"
        },
        "gcp": {
            "service_account": "gcp_service_account"
        },
        "alicloud": {
            "access_key": "alicloud_access_key"
        },
        "oci": {
            "user_principal": "oci_user_principal"
        },
        "ibm": {
            "api_key": "ibm_api_key"
        }
    }
    
    credential_type = credential_type_map.get(provider.lower(), {}).get(auth_method)
    if not credential_type:
        raise HTTPException(400, f"Invalid auth method {auth_method} for provider {provider}")
    
    # Add credential type to credentials
    credentials_data['credential_type'] = credential_type
    
    # Validate credentials
    validator = get_validator(provider, credential_type)
    validation_result = await validator.validate(credentials_data)
    
    if not validation_result.success:
        update_account(account_id, {
            'status': 'error',
            'onboarding_status': 'failed'
        })
        raise HTTPException(400, detail={
            "message": validation_result.message,
            "errors": validation_result.errors
        })
    
    # Store credentials in Secrets Manager
    secrets_manager_storage.store(
        account_id=account_id,
        credential_type=credential_type,
        credentials=credentials_data
    )
    
    # Update account
    update_account(account_id, {
        'status': 'active',
        'onboarding_status': 'completed',
        'account_number': validation_result.account_number,
        'last_validated_at': datetime.utcnow().isoformat()
    })
    
    return {
        "success": True,
        "message": "Account successfully onboarded and validated",
        "account_id": account_id,
        "account_number": validation_result.account_number
    }


@router.post("/{provider}/validate-json")
async def validate_from_json(
    provider: str,
    request: Dict[str, Any]
):
    """Validate account using JSON output from CloudFormation"""
    try:
        onboarding_json = request.get("onboarding_json")
        if isinstance(onboarding_json, str):
            cf_output = json.loads(onboarding_json)
        else:
            cf_output = onboarding_json
        
        # Extract values
        account_number = cf_output.get('account_id') or cf_output.get('AccountId')
        role_arn = cf_output.get('role_arn') or cf_output.get('RoleArn')
        external_id = cf_output.get('external_id') or cf_output.get('ExternalId')
        
        if not all([account_number, role_arn, external_id]):
            raise HTTPException(400, "Invalid JSON format - must contain: account_id, role_arn, external_id")
        
        # Find account by external_id (stored in onboarding_id or lookup)
        # For now, require account_id in request
        account_id = request.get("account_id")
        if not account_id:
            raise HTTPException(400, "account_id required in request")
        
        account = get_account(account_id)
        if not account:
            raise HTTPException(404, f"Account {account_id} not found")
        
        # Prepare credentials
        credentials = {
            "credential_type": "aws_iam_role",
            "role_arn": role_arn,
            "external_id": external_id,
            "account_number": account_number
        }
        
        # Validate
        return await validate_and_activate_account(
            provider="aws",
            request={
                "account_id": account_id,
                "auth_method": "iam_role",
                "credentials": credentials
            }
        )
        
    except json.JSONDecodeError as e:
        raise HTTPException(400, f"Invalid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(500, f"Validation error: {str(e)}")


@router.get("/accounts")
async def list_accounts(
    tenant_id: str = None,
    provider_type: str = None
):
    """List accounts with optional filters"""
    if tenant_id:
        accounts = list_accounts_by_tenant(tenant_id)
    else:
        # If no tenant_id, we'd need to scan - for now require tenant_id
        raise HTTPException(400, "tenant_id is required")
    
    # Filter by provider_type if specified
    if provider_type:
        from onboarding.database.dynamodb_operations import get_provider
        accounts = [
            a for a in accounts
            if get_provider(a['provider_id']) and 
            get_provider(a['provider_id'])['provider_type'] == provider_type.lower()
        ]
    
    return {
        "accounts": [
            {
                "account_id": a['account_id'],
                "account_name": a['account_name'],
                "account_number": a.get('account_number'),
                "provider_type": get_provider(a['provider_id'])['provider_type'] if get_provider(a['provider_id']) else None,
                "status": a['status'],
                "onboarding_status": a.get('onboarding_status', 'pending'),
                "created_at": a.get('created_at', '')
            }
            for a in accounts
        ]
    }


@router.get("/accounts/{account_id}")
async def get_account_details(account_id: str):
    """Get account details"""
    account = get_account(account_id)
    if not account:
        raise HTTPException(404, f"Account {account_id} not found")
    
    from onboarding.database.dynamodb_operations import get_provider
    provider = get_provider(account['provider_id'])
    
    return {
        "account_id": account['account_id'],
        "account_name": account['account_name'],
        "account_number": account.get('account_number'),
        "provider_type": provider['provider_type'] if provider else None,
        "status": account['status'],
        "onboarding_status": account.get('onboarding_status', 'pending'),
        "created_at": account.get('created_at', ''),
        "updated_at": account.get('updated_at', ''),
        "last_validated_at": account.get('last_validated_at')
    }


@router.delete("/accounts/{account_id}")
async def delete_account(account_id: str):
    """Delete account and associated credentials"""
    account = get_account(account_id)
    if not account:
        raise HTTPException(404, f"Account {account_id} not found")
    
    # Delete credentials from Secrets Manager
    try:
        secrets_manager_storage.delete(account_id)
    except ValueError:
        pass  # Credentials may not exist
    
    # Delete account from DynamoDB
    from onboarding.database.dynamodb_operations import dynamodb, ACCOUNTS_TABLE
    table = dynamodb.Table(ACCOUNTS_TABLE)
    table.delete_item(Key={'account_id': account_id})
    
    return {"status": "deleted", "account_id": account_id}

