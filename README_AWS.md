# Threat Engine Onboarding - AWS Services Architecture

## Overview

The Threat Engine onboarding system uses **AWS DynamoDB**, **Secrets Manager**, and **KMS** for data storage and credential management.

## Architecture

- **DynamoDB**: Stores metadata (tenants, accounts, schedules, executions, scan results)
- **Secrets Manager**: Stores encrypted credentials (access keys, role ARNs, etc.)
- **KMS**: Manages encryption keys for Secrets Manager

## Quick Start

### 1. Setup AWS Services

```bash
# Create KMS key
aws kms create-key --description "Threat Engine Secrets" --region ap-south-1

# Create DynamoDB tables
python3 -c "from onboarding.database.dynamodb_tables import create_tables; create_tables()"
```

See [AWS_SERVICES_SETUP.md](AWS_SERVICES_SETUP.md) for detailed setup.

### 2. Configure Environment

```bash
export AWS_REGION=ap-south-1
export SECRETS_MANAGER_PREFIX=threat-engine
export SECRETS_MANAGER_KMS_KEY_ID=alias/threat-engine-secrets
```

### 3. Run Application

```bash
cd /Users/apple/Desktop/onboarding
pip install -r requirements.txt
python main.py
```

## Key Components

### DynamoDB Tables

- `threat-engine-tenants` - Tenant information
- `threat-engine-providers` - CSP providers
- `threat-engine-accounts` - Account metadata
- `threat-engine-schedules` - Scan schedules
- `threat-engine-executions` - Execution history
- `threat-engine-scan-results` - Scan result metadata

### Secrets Manager

- Secret name pattern: `threat-engine/account/{account_id}`
- Stores: Credentials (encrypted with KMS)
- Features: Automatic rotation, versioning, audit logging

### KMS

- Customer Managed Key (CMK)
- Automatic rotation (365 days)
- Access control via IAM

## Documentation

- [AWS_SERVICES_SETUP.md](AWS_SERVICES_SETUP.md) - Setup guide
- [AWS_ARCHITECTURE.md](AWS_ARCHITECTURE.md) - Architecture details
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Migration from PostgreSQL
- [CREDENTIAL_STORAGE_APPROACH.md](CREDENTIAL_STORAGE_APPROACH.md) - Credential storage details

## API Endpoints

### Onboarding

- `POST /api/v1/onboarding/{provider}/init` - Initialize account onboarding
- `POST /api/v1/onboarding/{provider}/validate` - Validate credentials
- `GET /api/v1/onboarding/accounts` - List accounts

### Schedules

- `POST /api/v1/schedules` - Create schedule
- `GET /api/v1/schedules` - List schedules
- `POST /api/v1/schedules/{schedule_id}/trigger` - Manual trigger

## Security

- ✅ Encryption at rest (KMS)
- ✅ Encryption in transit (TLS)
- ✅ Access control (IAM)
- ✅ Audit logging (CloudTrail)
- ✅ Automatic key rotation

## Cost Estimation

- **DynamoDB**: ~$10-50/month
- **Secrets Manager**: ~$50-100/month (100 accounts)
- **KMS**: ~$1-5/month
- **Total**: ~$60-150/month

## Migration

If migrating from PostgreSQL, see [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md).

## Support

For issues or questions:
1. Check [AWS_SERVICES_SETUP.md](AWS_SERVICES_SETUP.md) troubleshooting section
2. Review CloudWatch logs
3. Check IAM permissions

