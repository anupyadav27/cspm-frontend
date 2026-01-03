# AWS Architecture - DynamoDB, Secrets Manager, and KMS

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  EKS Cluster (vulnerability-eks-cluster)                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Onboarding API Pod                                 │   │
│  │  - Service Account: aws-compliance-engine-sa        │   │
│  │  - IAM Role: threat-engine-platform-role            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Scheduler Pod                                       │   │
│  │  - Service Account: aws-compliance-engine-sa        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ IRSA (IAM Roles for Service Accounts)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  AWS Services                                                │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  DynamoDB (Metadata)                                │   │
│  │  - threat-engine-tenants                            │   │
│  │  - threat-engine-providers                          │   │
│  │  - threat-engine-accounts                           │   │
│  │  - threat-engine-schedules                          │   │
│  │  - threat-engine-executions                         │   │
│  │  - threat-engine-scan-results                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                        │                                     │
│                        │ References                          │
│                        ▼                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Secrets Manager (Credentials)                      │   │
│  │  - threat-engine/account/{account_id}                │   │
│  │  - Encrypted with KMS                               │   │
│  │  - Automatic rotation (optional)                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                        │                                     │
│                        │ Uses                                │
│                        ▼                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  KMS (Encryption Keys)                              │   │
│  │  - Customer Managed Key (CMK)                       │   │
│  │  - Automatic rotation                                │   │
│  │  - Access control via IAM                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Account Onboarding

```
User → Portal → Onboarding API
  ↓
1. Create Tenant (DynamoDB: tenants table)
  ↓
2. Create Provider (DynamoDB: providers table)
  ↓
3. Create Account (DynamoDB: accounts table)
  ↓
4. Validate Credentials (Test connection)
  ↓
5. Store Credentials (Secrets Manager)
   - Secret Name: threat-engine/account/{account_id}
   - Encrypted with KMS
   - Store: credential_type, credentials, metadata
  ↓
6. Update Account Status (DynamoDB: accounts table)
```

### 2. Scheduled Scan Execution

```
Scheduler Service (runs every 60 seconds)
  ↓
1. Query Due Schedules (DynamoDB: schedules table, GSI: next-run-index)
  ↓
2. For each schedule:
   a. Get Account (DynamoDB: accounts table)
   b. Get Credentials (Secrets Manager: threat-engine/account/{account_id})
      - KMS automatically decrypts
   c. Create Execution Record (DynamoDB: executions table)
   d. Call Engine API with credentials
   e. Update Execution Record (DynamoDB: executions table)
   f. Create Scan Result (DynamoDB: scan-results table)
```

### 3. Credential Retrieval

```
API Request → Onboarding API
  ↓
1. Get Account (DynamoDB: accounts table)
  ↓
2. Get Credentials (Secrets Manager)
   - Secret Name: threat-engine/account/{account_id}
   - KMS decrypts automatically
   - Returns: credential_type, credentials
  ↓
3. Return to caller (credentials never stored in memory long-term)
```

## Security Model

### Encryption at Rest

- **DynamoDB**: Encrypted by default (AWS managed keys)
- **Secrets Manager**: Encrypted with KMS (customer managed key)
- **KMS**: Hardware Security Module (HSM) backed

### Encryption in Transit

- **EKS → DynamoDB**: TLS 1.2+
- **EKS → Secrets Manager**: TLS 1.2+
- **EKS → KMS**: TLS 1.2+

### Access Control

- **IRSA**: Pods authenticate via OIDC
- **IAM Roles**: Fine-grained permissions
- **KMS Key Policy**: Controls who can encrypt/decrypt
- **Secrets Manager**: IAM-based access control

## Key Components

### DynamoDB Tables

| Table | Purpose | Key | GSIs |
|-------|---------|-----|------|
| `threat-engine-tenants` | Tenant information | `tenant_id` | `tenant-name-index` |
| `threat-engine-providers` | CSP providers | `provider_id` | `tenant-provider-index` |
| `threat-engine-accounts` | Account metadata | `account_id` | `tenant-accounts-index`, `provider-accounts-index` |
| `threat-engine-schedules` | Scan schedules | `schedule_id` | `tenant-schedules-index`, `account-schedules-index`, `next-run-index` |
| `threat-engine-executions` | Execution history | `execution_id` | `schedule-executions-index`, `account-executions-index` |
| `threat-engine-scan-results` | Scan result metadata | `scan_id` | `account-scans-index`, `status-scans-index` |

### Secrets Manager Secrets

| Secret Name Pattern | Content | Encryption |
|---------------------|---------|------------|
| `threat-engine/account/{account_id}` | Credentials (access keys, role ARNs, etc.) | KMS CMK |

### KMS Keys

| Key | Purpose | Rotation |
|-----|---------|----------|
| Customer Managed Key | Encrypt/decrypt secrets | Automatic (365 days) |

## Benefits

### DynamoDB
- ✅ Serverless (no infrastructure management)
- ✅ Auto-scaling
- ✅ Single-digit millisecond latency
- ✅ Built-in encryption
- ✅ Point-in-time recovery
- ✅ Global tables (multi-region)

### Secrets Manager
- ✅ Automatic rotation
- ✅ Versioning
- ✅ CloudTrail integration
- ✅ KMS encryption
- ✅ Access control
- ✅ Audit logging

### KMS
- ✅ Hardware-backed security
- ✅ Automatic key rotation
- ✅ Access control
- ✅ Audit logging
- ✅ Compliance ready

## Cost Optimization

### DynamoDB
- Use **On-Demand** billing for variable workloads
- Use **Provisioned** for predictable workloads
- Enable **Point-in-Time Recovery** only if needed
- Use **Global Tables** only for multi-region

### Secrets Manager
- Store only credentials (not metadata)
- Use rotation only for long-lived credentials
- Delete unused secrets

### KMS
- Use **Customer Managed Keys** for production
- Use **AWS Managed Keys** for development
- Enable rotation for compliance

## Monitoring

### CloudWatch Metrics

**DynamoDB:**
- `ConsumedReadCapacityUnits`
- `ConsumedWriteCapacityUnits`
- `UserErrors`
- `SystemErrors`

**Secrets Manager:**
- `GetSecretValue`
- `CreateSecret`
- `UpdateSecret`
- `DeleteSecret`

**KMS:**
- `Decrypt`
- `Encrypt`
- `GenerateDataKey`

### CloudWatch Alarms

Set up alarms for:
- DynamoDB throttling
- Secrets Manager API errors
- KMS API errors
- Unusual access patterns

## Disaster Recovery

### Backup

- **DynamoDB**: Point-in-time recovery (35 days)
- **Secrets Manager**: Automatic versioning
- **KMS**: Key material backed up by AWS

### Recovery

1. Restore DynamoDB table from backup
2. Secrets Manager secrets are automatically available
3. KMS keys are automatically available

## Compliance

### Supported Standards

- ✅ **SOC 2**: Audit logging, encryption
- ✅ **PCI-DSS**: Encryption, access control
- ✅ **HIPAA**: Encryption, audit logging
- ✅ **GDPR**: Encryption, access control
- ✅ **ISO 27001**: Encryption, key management

### Audit Trail

- **CloudTrail**: All API calls logged
- **DynamoDB**: Streams for change tracking
- **Secrets Manager**: Access logging
- **KMS**: Usage logging

