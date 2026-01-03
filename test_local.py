"""
Local testing script for onboarding and engine APIs
"""
import asyncio
import httpx
import json
from typing import Dict, Any
import time

# Configuration
ONBOARDING_API_URL = "http://localhost:8000"
AWS_ENGINE_URL = "http://localhost:8001"
YAML_BUILDER_URL = "http://localhost:8002"


class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'


def print_step(step: str, message: str):
    """Print a test step"""
    print(f"\n{Colors.BLUE}[{step}]{Colors.END} {message}")


def print_success(message: str):
    """Print success message"""
    print(f"{Colors.GREEN}✓{Colors.END} {message}")


def print_error(message: str):
    """Print error message"""
    print(f"{Colors.RED}✗{Colors.END} {message}")


def print_info(message: str):
    """Print info message"""
    print(f"{Colors.YELLOW}ℹ{Colors.END} {message}")


async def test_onboarding_health():
    """Test onboarding API health"""
    print_step("1", "Testing Onboarding API Health")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{ONBOARDING_API_URL}/api/v1/health")
            if response.status_code == 200:
                print_success(f"Onboarding API is healthy: {response.json()}")
                return True
            else:
                print_error(f"Onboarding API returned {response.status_code}")
                return False
    except Exception as e:
        print_error(f"Failed to connect to Onboarding API: {e}")
        print_info("Make sure onboarding API is running: cd /Users/apple/Desktop/onboarding && python main.py")
        return False


async def test_aws_engine_health():
    """Test AWS Engine API health"""
    print_step("2", "Testing AWS Engine API Health")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{AWS_ENGINE_URL}/api/v1/health")
            if response.status_code == 200:
                print_success(f"AWS Engine API is healthy: {response.json()}")
                return True
            else:
                print_error(f"AWS Engine API returned {response.status_code}")
                return False
    except Exception as e:
        print_error(f"Failed to connect to AWS Engine API: {e}")
        print_info("Make sure AWS engine is running: cd /Users/apple/Desktop/threat-engine/aws_compliance_python_engine && python api_server.py")
        return False


async def test_yaml_builder_health():
    """Test YAML Rule Builder API health"""
    print_step("3", "Testing YAML Rule Builder API Health")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{YAML_BUILDER_URL}/api/v1/health")
            if response.status_code == 200:
                print_success(f"YAML Rule Builder API is healthy: {response.json()}")
                return True
            else:
                print_error(f"YAML Rule Builder API returned {response.status_code}")
                return False
    except Exception as e:
        print_error(f"Failed to connect to YAML Rule Builder API: {e}")
        print_info("Make sure YAML builder is running: cd /Users/apple/Desktop/threat-engine/yaml-rule-builder && python api_server.py")
        return False


async def test_create_tenant():
    """Test creating a tenant (using direct database or API if available)"""
    print_step("4", "Creating Test Tenant")
    print_info("Note: Creating tenant via DynamoDB")
    
    try:
        # Create tenant via DynamoDB
        import sys
        import os
        sys.path.insert(0, '/Users/apple/Desktop')
        os.environ['AWS_REGION'] = 'ap-south-1'
        
        from onboarding.database.dynamodb_operations import create_tenant
        
        tenant = create_tenant("test-tenant", "Test Tenant")
        tenant_id = tenant['tenant_id']
        print_success(f"Tenant created: {tenant_id}")
        return tenant_id
    except Exception as e:
        print_error(f"Error creating tenant: {e}")
        print_info("You can manually create a tenant in the database or use an existing tenant_id")
        # Return a test UUID for testing purposes
        import uuid
        test_tenant_id = str(uuid.uuid4())
        print_info(f"Using test tenant_id: {test_tenant_id}")
        return test_tenant_id


async def test_init_aws_onboarding(tenant_id: str):
    """Test initializing AWS onboarding"""
    print_step("5", "Initializing AWS Account Onboarding")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{ONBOARDING_API_URL}/api/v1/onboarding/aws/init",
                json={
                    "tenant_id": tenant_id,
                    "account_name": "Test AWS Account",
                    "auth_method": "iam_role"
                }
            )
            if response.status_code == 200:
                data = response.json()
                print_success(f"AWS onboarding initialized: {data}")
                return data
            else:
                print_error(f"Failed to initialize AWS onboarding: {response.status_code} - {response.text}")
                return None
    except Exception as e:
        print_error(f"Error initializing AWS onboarding: {e}")
        return None


async def test_validate_aws_credentials(account_id: str):
    """Test validating AWS credentials (using test credentials)"""
    print_step("6", "Validating AWS Credentials")
    print_info("Note: This will fail with invalid credentials, but tests the flow")
    
    # Test with IAM Role credentials
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{ONBOARDING_API_URL}/api/v1/onboarding/aws/validate",
                json={
                    "account_id": account_id,
                    "credential_type": "aws_iam_role",
                    "credentials": {
                        "role_arn": "arn:aws:iam::123456789012:role/TestRole",
                        "external_id": "test-external-id-12345",
                        "account_number": "123456789012"
                    }
                }
            )
            data = response.json()
            if response.status_code == 200:
                if data.get("success"):
                    print_success(f"Credentials validated: {data}")
                else:
                    print_info(f"Validation failed (expected with test credentials): {data.get('message')}")
                return data
            else:
                print_info(f"Validation response: {response.status_code} - {data}")
                return data
    except Exception as e:
        print_error(f"Error validating credentials: {e}")
        return None


async def test_list_aws_services():
    """Test listing AWS services"""
    print_step("7", "Listing Available AWS Services")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{AWS_ENGINE_URL}/api/v1/services")
            if response.status_code == 200:
                data = response.json()
                services = data.get("services", [])
                print_success(f"Found {len(services)} AWS services")
                if services:
                    print_info(f"Sample services: {[s.get('name') for s in services[:5]]}")
                return True
            else:
                print_error(f"Failed to list services: {response.status_code}")
                return False
    except Exception as e:
        print_error(f"Error listing services: {e}")
        return False


async def test_create_scan():
    """Test creating a scan (will fail without real credentials, but tests the API)"""
    print_step("8", "Testing Scan Creation")
    print_info("Note: This will fail without real AWS credentials, but tests the API endpoint")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{AWS_ENGINE_URL}/api/v1/scan",
                json={
                    "account": "123456789012",
                    "credentials": {
                        "credential_type": "aws_iam_role",
                        "role_arn": "arn:aws:iam::123456789012:role/TestRole",
                        "external_id": "test-external-id",
                        "account_number": "123456789012"
                    },
                    "include_regions": ["us-east-1"],
                    "include_services": ["s3"],
                    "max_workers": 2
                }
            )
            if response.status_code == 200:
                data = response.json()
                print_success(f"Scan created: {data}")
                return data.get("scan_id")
            else:
                print_info(f"Scan creation response: {response.status_code} - {response.text}")
                return None
    except Exception as e:
        print_error(f"Error creating scan: {e}")
        return None


async def test_get_scan_status(scan_id: str):
    """Test getting scan status"""
    if not scan_id:
        print_info("Skipping scan status check (no scan_id)")
        return
    
    print_step("9", f"Getting Scan Status for {scan_id}")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{AWS_ENGINE_URL}/api/v1/scan/{scan_id}/status")
            if response.status_code == 200:
                data = response.json()
                print_success(f"Scan status: {data.get('status')}")
                print_info(f"Progress: {data.get('progress', {})}")
                return data
            else:
                print_error(f"Failed to get scan status: {response.status_code}")
                return None
    except Exception as e:
        print_error(f"Error getting scan status: {e}")
        return None


async def test_get_engine_metrics():
    """Test getting engine metrics"""
    print_step("10", "Getting AWS Engine Metrics")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{AWS_ENGINE_URL}/api/v1/metrics")
            if response.status_code == 200:
                data = response.json()
                print_success(f"Engine metrics: {data}")
                return data
            else:
                print_error(f"Failed to get metrics: {response.status_code}")
                return None
    except Exception as e:
        print_error(f"Error getting metrics: {e}")
        return None


async def test_yaml_builder_services():
    """Test YAML builder services listing"""
    print_step("11", "Listing Services in YAML Rule Builder")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{YAML_BUILDER_URL}/api/v1/services")
            if response.status_code == 200:
                data = response.json()
                services = data.get("services", [])
                print_success(f"Found {len(services)} services in YAML builder")
                if services:
                    print_info(f"Sample services: {services[:5]}")
                return services[0] if services else None
            else:
                print_error(f"Failed to list services: {response.status_code}")
                return None
    except Exception as e:
        print_error(f"Error listing services: {e}")
        return None


async def test_get_service_fields(service: str):
    """Test getting fields for a service"""
    if not service:
        print_info("Skipping service fields test (no service)")
        return
    
    print_step("12", f"Getting Fields for Service: {service}")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{YAML_BUILDER_URL}/api/v1/services/{service}/fields")
            if response.status_code == 200:
                data = response.json()
                fields = data.get("fields", {})
                print_success(f"Found {len(fields)} fields for {service}")
                if fields:
                    sample_fields = list(fields.keys())[:3]
                    print_info(f"Sample fields: {sample_fields}")
                return True
            else:
                print_error(f"Failed to get fields: {response.status_code} - {response.text}")
                return False
    except Exception as e:
        print_error(f"Error getting fields: {e}")
        return False


async def test_validate_rule(service: str):
    """Test validating a rule"""
    if not service:
        print_info("Skipping rule validation test (no service)")
        return
    
    print_step("13", f"Validating Rule for Service: {service}")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{YAML_BUILDER_URL}/api/v1/rules/validate",
                json={
                    "service": service,
                    "rule_id": f"test-rule-{int(time.time())}",
                    "conditions": [
                        {
                            "field": "BucketName",
                            "operator": "equals",
                            "value": "test-bucket"
                        }
                    ],
                    "logical_operator": "single"
                }
            )
            if response.status_code == 200:
                data = response.json()
                print_success(f"Rule validation result: {data}")
                return True
            else:
                print_info(f"Validation response: {response.status_code} - {response.text}")
                return False
    except Exception as e:
        print_error(f"Error validating rule: {e}")
        return False


async def test_generate_rule(service: str):
    """Test generating a rule"""
    if not service:
        print_info("Skipping rule generation test (no service)")
        return
    
    print_step("14", f"Generating Rule for Service: {service}")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{YAML_BUILDER_URL}/api/v1/rules/generate",
                json={
                    "service": service,
                    "title": "Test Rule",
                    "description": "This is a test rule",
                    "remediation": "Fix the issue",
                    "rule_id": f"test-rule-{int(time.time())}",
                    "conditions": [
                        {
                            "field": "BucketName",
                            "operator": "equals",
                            "value": "test-bucket"
                        }
                    ],
                    "logical_operator": "single"
                }
            )
            if response.status_code == 200:
                data = response.json()
                print_success(f"Rule generated: {data.get('yaml_path', 'N/A')}")
                return data
            else:
                print_info(f"Generation response: {response.status_code} - {response.text}")
                return None
    except Exception as e:
        print_error(f"Error generating rule: {e}")
        return None


async def main():
    """Run all tests"""
    print(f"\n{Colors.BLUE}{'='*70}{Colors.END}")
    print(f"{Colors.BLUE}Threat Engine Local Testing{Colors.END}")
    print(f"{Colors.BLUE}{'='*70}{Colors.END}")
    
    # Health checks
    onboarding_ok = await test_onboarding_health()
    aws_engine_ok = await test_aws_engine_health()
    yaml_builder_ok = await test_yaml_builder_health()
    
    if not onboarding_ok:
        print_error("Onboarding API is not available. Please start it first.")
        return
    
    # Onboarding tests
    tenant_id = await test_create_tenant()
    if not tenant_id:
        print_error("Failed to create tenant. Cannot continue.")
        return
    
    onboarding_data = await test_init_aws_onboarding(tenant_id)
    if onboarding_data:
        account_id = onboarding_data.get("account_id")
        if account_id:
            await test_validate_aws_credentials(account_id)
    
    # AWS Engine tests
    if aws_engine_ok:
        await test_list_aws_services()
        scan_id = await test_create_scan()
        if scan_id:
            await test_get_scan_status(scan_id)
        await test_get_engine_metrics()
    
    # YAML Builder tests
    if yaml_builder_ok:
        service = await test_yaml_builder_services()
        if service:
            await test_get_service_fields(service)
            await test_validate_rule(service)
            await test_generate_rule(service)
    
    print(f"\n{Colors.BLUE}{'='*70}{Colors.END}")
    print(f"{Colors.GREEN}Testing Complete!{Colors.END}")
    print(f"{Colors.BLUE}{'='*70}{Colors.END}\n")


if __name__ == "__main__":
    asyncio.run(main())

