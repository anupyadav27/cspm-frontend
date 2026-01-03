# AWS Services Setup Guide - DynamoDB, Secrets Manager, and KMS

## Overview

This guide covers setting up AWS DynamoDB, Secrets Manager, and KMS for the Threat Engine onboarding system.

## Architecture

```
┌─────────────────────────────────────────┐
│  DynamoDB (Metadata Storage)            │
│  - Tenants                              │
│  - Accounts                             │
│  - Schedules                            │
│  - Executions                           │
│  - Scan Results                         │
└─────────────────────────────────────────┘
                    │
                    │ References
                    ▼
┌─────────────────────────────────────────┐
│  AWS Secrets Manager (Credentials)      │
│  - Encrypted Credentials                │
│  - Automatic Rotation (optional)         │
│  - CloudTrail Logging                   │
└─────────────────────────────────────────┘
                    │
                    │ Uses
                    ▼
┌─────────────────────────────────────────┐
│  AWS KMS (Encryption Keys)              │
│  - Customer Managed Key (CMK)           │
│  - Automatic Key Rotation               │
│  - Access Control                       │
└─────────────────────────────────────────┘
```

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- IAM permissions for:
  - DynamoDB (create tables, read/write)
  - Secrets Manager (create, read, update, delete secrets)
  - KMS (use key for encryption/decryption)

## Step 1: Create KMS Key

### Option A: Use AWS Managed Key (Default)

Secrets Manager automatically uses AWS managed keys if you don't specify a KMS key. This is the simplest option.

**No action needed** - Secrets Manager will use the default AWS managed key.

### Option B: Create Customer Managed Key (Recommended for Production)

For better control and compliance:

```bash
# Create KMS key
aws kms create-key \
  --description "Threat Engine Secrets Manager encryption key" \
  --key-usage ENCRYPT_DECRYPT \
  --key-spec SYMMETRIC_DEFAULT \
  --region ap-south-1

# Note the KeyId from output
# Example: "arn:aws:kms:ap-south-1:588989875114:key/12345678-1234-1234-1234-123456789012"

# Enable automatic key rotation (optional but recommended)
aws kms enable-key-rotation \
  --key-id <KEY_ID> \
  --region ap-south-1

# Create alias for easier reference
aws kms create-alias \
  --alias-name alias/threat-engine-secrets \
  --target-key-id <KEY_ID> \
  --region ap-south-1
```

**Key Policy** (attach to KMS key):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Allow Secrets Manager",
      "Effect": "Allow",
      "Principal": {
        "Service": "secretsmanager.amazonaws.com"
      },
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:CreateGrant",
        "kms:DescribeKey"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Allow EKS Service Account",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::588989875114:role/threat-engine-platform-role"
      },
      "Action": [
        "kms:Decrypt",
        "kms:DescribeKey"
      ],
      "Resource": "*"
    }
  ]
}
```

**Set Environment Variable:**

```bash
export SECRETS_MANAGER_KMS_KEY_ID="arn:aws:kms:ap-south-1:588989875114:key/12345678-1234-1234-1234-123456789012"
# Or use alias:
export SECRETS_MANAGER_KMS_KEY_ID="alias/threat-engine-secrets"
```

## Step 2: Create DynamoDB Tables

### Using Python Script

```bash
cd /Users/apple/Desktop/onboarding
python3 -c "from onboarding.database.dynamodb_tables import create_tables; create_tables()"
```

### Using AWS CLI

```bash
# Set region
export AWS_REGION=ap-south-1

# Create tables (run each command)
aws dynamodb create-table \
  --table-name threat-engine-tenants \
  --attribute-definitions \
    AttributeName=tenant_id,AttributeType=S \
    AttributeName=tenant_name,AttributeType=S \
  --key-schema \
    AttributeName=tenant_id,KeyType=HASH \
  --global-secondary-indexes \
    'IndexName=tenant-name-index,KeySchema=[{AttributeName=tenant_name,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}' \
  --billing-mode PAY_PER_REQUEST \
  --region $AWS_REGION

# Repeat for other tables (see dynamodb_tables.py for full schemas)
```

### Using CloudFormation

Create `infrastructure/dynamodb-tables.yaml`:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Threat Engine DynamoDB Tables'

Resources:
  TenantsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: threat-engine-tenants
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: tenant_id
          AttributeType: S
        - AttributeName: tenant_name
          AttributeType: S
      KeySchema:
        - AttributeName: tenant_id
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: tenant-name-index
          KeySchema:
            - AttributeName: tenant_name
              KeyType: HASH
          Projection:
            ProjectionType: ALL

  # Add other tables...
```

Deploy:

```bash
aws cloudformation create-stack \
  --stack-name threat-engine-dynamodb \
  --template-body file://infrastructure/dynamodb-tables.yaml \
  --region ap-south-1
```

## Step 3: Configure IAM Permissions

### For EKS Service Account

Update the platform IAM role to include DynamoDB and Secrets Manager permissions:

```bash
# Create policy for DynamoDB
cat > /tmp/dynamodb-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-south-1:588989875114:table/threat-engine-*",
        "arn:aws:dynamodb:ap-south-1:588989875114:table/threat-engine-*/index/*"
      ]
    }
  ]
}
EOF

# Create policy for Secrets Manager
cat > /tmp/secrets-manager-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:CreateSecret",
        "secretsmanager:GetSecretValue",
        "secretsmanager:UpdateSecret",
        "secretsmanager:DeleteSecret",
        "secretsmanager:DescribeSecret",
        "secretsmanager:RotateSecret"
      ],
      "Resource": "arn:aws:secretsmanager:ap-south-1:588989875114:secret:threat-engine/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:DescribeKey"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Attach policies to role
aws iam create-policy \
  --policy-name ThreatEngineDynamoDB \
  --policy-document file:///tmp/dynamodb-policy.json

aws iam create-policy \
  --policy-name ThreatEngineSecretsManager \
  --policy-document file:///tmp/secrets-manager-policy.json

aws iam attach-role-policy \
  --role-name threat-engine-platform-role \
  --policy-arn arn:aws:iam::588989875114:policy/ThreatEngineDynamoDB

aws iam attach-role-policy \
  --role-name threat-engine-platform-role \
  --policy-arn arn:aws:iam::588989875114:policy/ThreatEngineSecretsManager
```

## Step 4: Environment Variables

Update your Kubernetes ConfigMap or environment:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: aws-services-config
  namespace: threat-engine-engines
data:
  AWS_REGION: "ap-south-1"
  SECRETS_MANAGER_PREFIX: "threat-engine"
  SECRETS_MANAGER_KMS_KEY_ID: "alias/threat-engine-secrets"  # Optional
  DYNAMODB_TENANTS_TABLE: "threat-engine-tenants"
  DYNAMODB_PROVIDERS_TABLE: "threat-engine-providers"
  DYNAMODB_ACCOUNTS_TABLE: "threat-engine-accounts"
  DYNAMODB_SCHEDULES_TABLE: "threat-engine-schedules"
  DYNAMODB_EXECUTIONS_TABLE: "threat-engine-executions"
  DYNAMODB_SCAN_RESULTS_TABLE: "threat-engine-scan-results"
```

## Step 5: Update Application Code

### Update requirements.txt

Add boto3:

```txt
boto3>=1.34.0
botocore>=1.34.0
```

### Update imports

Replace:
```python
from onboarding.database.connection import get_db
from onboarding.database.models import Account
from onboarding.storage.credential_storage import CredentialStorage
```

With:
```python
from onboarding.database.dynamodb_operations import (
    get_account, create_account, update_account
)
from onboarding.storage.secrets_manager_storage import secrets_manager_storage
```

## Step 6: Verify Setup

### Test DynamoDB

```python
from onboarding.database.dynamodb_tables import create_tables
from onboarding.database.dynamodb_operations import create_tenant, get_tenant

# Create tables
create_tables()

# Test tenant creation
tenant = create_tenant("test-tenant", "Test tenant")
print(f"Created tenant: {tenant['tenant_id']}")

# Test retrieval
retrieved = get_tenant(tenant['tenant_id'])
print(f"Retrieved tenant: {retrieved['tenant_name']}")
```

### Test Secrets Manager

```python
from onboarding.storage.secrets_manager_storage import secrets_manager_storage

# Store credentials
result = secrets_manager_storage.store(
    account_id="test-account-id",
    credential_type="aws_access_key",
    credentials={
        "access_key_id": "AKIA...",
        "secret_access_key": "..."
    }
)
print(f"Stored secret: {result['secret_arn']}")

# Retrieve credentials
creds = secrets_manager_storage.retrieve("test-account-id")
print(f"Retrieved credentials: {creds['credential_type']}")
```

## Cost Estimation

### DynamoDB (On-Demand Pricing)
- **Write**: $1.25 per million requests
- **Read**: $0.25 per million requests
- **Storage**: $0.25 per GB-month
- **Estimated**: ~$10-50/month for typical usage

### Secrets Manager
- **Storage**: $0.40 per secret per month
- **API Calls**: $0.05 per 10,000 calls
- **Estimated**: ~$50-100/month for 100 accounts

### KMS
- **Customer Managed Key**: $1.00 per key per month
- **API Calls**: $0.03 per 10,000 calls
- **Estimated**: ~$1-5/month

**Total Estimated Cost**: ~$60-150/month

## Security Best Practices

1. **Use Customer Managed KMS Keys** for production
2. **Enable KMS Key Rotation** (automatic, every 365 days)
3. **Enable Secrets Manager Rotation** (optional, for access keys)
4. **Use IAM Policies** to restrict access
5. **Enable CloudTrail** for audit logging
6. **Use VPC Endpoints** for private access (optional)

## Troubleshooting

### DynamoDB Table Not Found

```bash
# List tables
aws dynamodb list-tables --region ap-south-1

# Check table exists
aws dynamodb describe-table --table-name threat-engine-tenants --region ap-south-1
```

### Secrets Manager Access Denied

```bash
# Check IAM permissions
aws iam get-role-policy \
  --role-name threat-engine-platform-role \
  --policy-name ThreatEngineSecretsManager

# Test access
aws secretsmanager list-secrets --region ap-south-1
```

### KMS Decrypt Failed

```bash
# Check key policy
aws kms get-key-policy \
  --key-id <KEY_ID> \
  --policy-name default

# Verify key is enabled
aws kms describe-key --key-id <KEY_ID>
```

## Next Steps

1. Update API endpoints to use DynamoDB operations
2. Update scheduler to use DynamoDB and Secrets Manager
3. Migrate existing data from PostgreSQL (if applicable)
4. Set up monitoring and alerts
5. Configure backup and disaster recovery

