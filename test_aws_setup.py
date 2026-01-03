#!/usr/bin/env python3
"""
Test script to verify AWS services setup (DynamoDB, Secrets Manager, KMS)
"""
import os
import sys
import boto3
from botocore.exceptions import ClientError

# Add parent directory to path
sys.path.insert(0, '/Users/apple/Desktop')

def test_dynamodb():
    """Test DynamoDB tables"""
    print("\n📊 Testing DynamoDB Tables...")
    dynamodb = boto3.client('dynamodb', region_name='ap-south-1')
    
    tables = [
        'threat-engine-tenants',
        'threat-engine-providers',
        'threat-engine-accounts',
        'threat-engine-schedules',
        'threat-engine-executions',
        'threat-engine-scan-results'
    ]
    
    all_exist = True
    for table in tables:
        try:
            response = dynamodb.describe_table(TableName=table)
            status = response['Table']['TableStatus']
            billing = response['Table'].get('BillingModeSummary', {}).get('BillingMode', 'PROVISIONED')
            print(f"  ✅ {table}: {status} ({billing})")
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                print(f"  ❌ {table}: NOT FOUND")
                all_exist = False
            else:
                print(f"  ⚠️  {table}: {e}")
                all_exist = False
    
    return all_exist


def test_kms():
    """Test KMS key"""
    print("\n🔐 Testing KMS Key...")
    kms = boto3.client('kms', region_name='ap-south-1')
    
    try:
        # Test by alias
        response = kms.describe_key(KeyId='alias/threat-engine-secrets')
        key_id = response['KeyMetadata']['KeyId']
        key_state = response['KeyMetadata']['KeyState']
        rotation = response.get('KeyRotationEnabled', False)
        
        print(f"  ✅ Key ID: {key_id}")
        print(f"  ✅ State: {key_state}")
        print(f"  ✅ Rotation: {'Enabled' if rotation else 'Disabled'}")
        
        # Test encryption/decryption
        test_data = b"test encryption"
        encrypt_response = kms.encrypt(
            KeyId='alias/threat-engine-secrets',
            Plaintext=test_data
        )
        decrypt_response = kms.decrypt(
            CiphertextBlob=encrypt_response['CiphertextBlob']
        )
        
        if decrypt_response['Plaintext'] == test_data:
            print(f"  ✅ Encryption/Decryption: Working")
            return True
        else:
            print(f"  ❌ Encryption/Decryption: Failed")
            return False
            
    except ClientError as e:
        print(f"  ❌ Error: {e}")
        return False


def test_secrets_manager():
    """Test Secrets Manager"""
    print("\n🔒 Testing Secrets Manager...")
    secrets = boto3.client('secretsmanager', region_name='ap-south-1')
    
    try:
        # List secrets with prefix
        response = secrets.list_secrets(
            Filters=[
                {
                    'Key': 'name',
                    'Values': ['threat-engine']
                }
            ]
        )
        
        secret_count = len(response.get('SecretList', []))
        print(f"  ✅ Secrets Manager: Accessible")
        print(f"  ℹ️  Existing secrets with prefix: {secret_count}")
        
        # Test creating a test secret (will be cleaned up)
        test_secret_name = 'threat-engine/test-connection'
        try:
            secrets.create_secret(
                Name=test_secret_name,
                SecretString='{"test": "connection"}',
                Description='Test secret - will be deleted'
            )
            print(f"  ✅ Create Secret: Working")
            
            # Delete test secret
            secrets.delete_secret(
                SecretId=test_secret_name,
                ForceDeleteWithoutRecovery=True
            )
            print(f"  ✅ Delete Secret: Working")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceExistsException':
                # Secret already exists, delete and recreate
                secrets.delete_secret(
                    SecretId=test_secret_name,
                    ForceDeleteWithoutRecovery=True
                )
                print(f"  ✅ Secret cleanup: Done")
        
        return True
        
    except ClientError as e:
        print(f"  ❌ Error: {e}")
        return False


def test_iam_permissions():
    """Test IAM role permissions"""
    print("\n👤 Testing IAM Permissions...")
    iam = boto3.client('iam')
    
    try:
        role_name = 'threat-engine-platform-role'
        response = iam.list_attached_role_policies(RoleName=role_name)
        
        policies = response.get('AttachedPolicies', [])
        policy_names = [p['PolicyName'] for p in policies]
        
        required_policies = [
            'ThreatEngineDynamoDB',
            'ThreatEngineSecretsManager',
            'ThreatEngineAssumeCustomerRoles'
        ]
        
        all_attached = True
        for policy in required_policies:
            if policy in policy_names:
                print(f"  ✅ {policy}: Attached")
            else:
                print(f"  ❌ {policy}: NOT Attached")
                all_attached = False
        
        return all_attached
        
    except ClientError as e:
        print(f"  ❌ Error: {e}")
        return False


def test_dynamodb_operations():
    """Test DynamoDB operations"""
    print("\n🧪 Testing DynamoDB Operations...")
    
    try:
        from onboarding.database.dynamodb_operations import (
            create_tenant, get_tenant, create_provider, create_account
        )
        
        # Create test tenant
        tenant = create_tenant("test-tenant", "Test Tenant")
        print(f"  ✅ Create Tenant: {tenant['tenant_id']}")
        
        # Get tenant
        retrieved = get_tenant(tenant['tenant_id'])
        if retrieved:
            print(f"  ✅ Get Tenant: Working")
        else:
            print(f"  ❌ Get Tenant: Failed")
            return False
        
        # Create provider
        provider = create_provider(tenant['tenant_id'], 'aws')
        print(f"  ✅ Create Provider: {provider['provider_id']}")
        
        # Create account
        account = create_account(
            provider_id=provider['provider_id'],
            tenant_id=tenant['tenant_id'],
            account_name="Test Account"
        )
        print(f"  ✅ Create Account: {account['account_id']}")
        
        # Cleanup (optional - for testing)
        # from onboarding.database.dynamodb_operations import dynamodb, TENANTS_TABLE
        # table = dynamodb.Table(TENANTS_TABLE)
        # table.delete_item(Key={'tenant_id': tenant['tenant_id']})
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("AWS Services Setup Test")
    print("=" * 60)
    
    results = {
        'DynamoDB Tables': test_dynamodb(),
        'KMS Key': test_kms(),
        'Secrets Manager': test_secrets_manager(),
        'IAM Permissions': test_iam_permissions(),
        'DynamoDB Operations': test_dynamodb_operations()
    }
    
    print("\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)
    
    all_passed = True
    for test, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test}: {status}")
        if not passed:
            all_passed = False
    
    print("=" * 60)
    if all_passed:
        print("✅ All tests passed! AWS setup is complete.")
        return 0
    else:
        print("❌ Some tests failed. Please check the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())

