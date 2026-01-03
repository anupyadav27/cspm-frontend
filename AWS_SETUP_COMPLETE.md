# AWS Services Setup - COMPLETE ✅

## Summary

All AWS services have been successfully set up for the Threat Engine onboarding service.

## ✅ Completed Setup

### 1. DynamoDB Tables Created
All 6 tables created successfully:
- ✅ `threat-engine-tenants`
- ✅ `threat-engine-providers`
- ✅ `threat-engine-accounts`
- ✅ `threat-engine-schedules`
- ✅ `threat-engine-executions`
- ✅ `threat-engine-scan-results`

**Billing Mode:** PAY_PER_REQUEST (on-demand)

### 2. KMS Key Created
- ✅ **Key ID:** `41a80ea0-2102-44d7-a527-58d8a5489e59`
- ✅ **ARN:** `arn:aws:kms:ap-south-1:588989875114:key/41a80ea0-2102-44d7-a527-58d8a5489e59`
- ✅ **Alias:** `alias/threat-engine-secrets`
- ✅ **Key Rotation:** Enabled

### 3. IAM Policies Created
- ✅ **ThreatEngineDynamoDB** - DynamoDB access
  - ARN: `arn:aws:iam::588989875114:policy/ThreatEngineDynamoDB`
- ✅ **ThreatEngineSecretsManager** - Secrets Manager + KMS access
  - ARN: `arn:aws:iam::588989875114:policy/ThreatEngineSecretsManager`

### 4. IAM Role Updated
- ✅ Policies attached to `threat-engine-platform-role`
- ✅ Role used by EKS service account via IRSA

## Configuration

### Environment Variables
Set these in your Kubernetes ConfigMap or `.env` file:

```bash
AWS_REGION=ap-south-1
SECRETS_MANAGER_PREFIX=threat-engine
SECRETS_MANAGER_KMS_KEY_ID=alias/threat-engine-secrets
```

### KMS Key Alias
Use this in your application:
```python
SECRETS_MANAGER_KMS_KEY_ID = "alias/threat-engine-secrets"
```

## Why No PostgreSQL?

**We DON'T need PostgreSQL anymore!** Everything has been migrated to:

1. **DynamoDB** - For all metadata (tenants, accounts, schedules, etc.)
2. **Secrets Manager** - For credentials (encrypted with KMS)
3. **KMS** - For encryption keys (automatic rotation)

### Benefits:
- ✅ No database server to manage
- ✅ Automatic scaling
- ✅ Built-in encryption
- ✅ Pay-per-use pricing
- ✅ AWS managed service
- ✅ Automatic backups

## Next Steps

1. **Update Kubernetes ConfigMap:**
   ```bash
   kubectl create configmap onboarding-config \
     --from-literal=AWS_REGION=ap-south-1 \
     --from-literal=SECRETS_MANAGER_PREFIX=threat-engine \
     --from-literal=SECRETS_MANAGER_KMS_KEY_ID=alias/threat-engine-secrets \
     -n threat-engine-engines
   ```

2. **Deploy Services:**
   ```bash
   kubectl apply -f kubernetes/onboarding/onboarding-deployment.yaml
   kubectl apply -f kubernetes/scheduler/scheduler-deployment.yaml
   ```

3. **Verify:**
   ```bash
   kubectl logs -f deployment/onboarding-api -n threat-engine-engines
   ```

## Verification Commands

### Check DynamoDB Tables
```bash
aws dynamodb list-tables --region ap-south-1 | grep threat-engine
```

### Check KMS Key
```bash
aws kms describe-key --key-id alias/threat-engine-secrets --region ap-south-1
```

### Check IAM Policies
```bash
aws iam list-attached-role-policies --role-name threat-engine-platform-role
```

## Architecture

```
┌─────────────────┐
│   EKS Cluster   │
│                 │
│  ┌───────────┐  │
│  │ Onboarding│  │──┐
│  │   API     │  │  │
│  └───────────┘  │  │
│                 │  │
│  ┌───────────┐  │  │
│  │ Scheduler │  │──┼──► DynamoDB (Metadata)
│  │  Service  │  │  │
│  └───────────┘  │  │
│                 │  │
│  Service Account│  │
│  (IRSA)         │  │
└─────────────────┘  │
                     │
                     ▼
         ┌──────────────────────┐
         │   AWS Services       │
         │                      │
         │  ┌──────────────┐   │
         │  │  DynamoDB    │   │
         │  │  (Metadata)  │   │
         │  └──────────────┘   │
         │                      │
         │  ┌──────────────┐   │
         │  │   Secrets    │   │
         │  │   Manager    │   │
         │  │ (Credentials)│   │
         │  └──────────────┘   │
         │         │            │
         │         ▼            │
         │  ┌──────────────┐   │
         │  │     KMS      │   │
         │  │ (Encryption) │   │
         │  └──────────────┘   │
         └──────────────────────┘
```

## Troubleshooting

### If tables already exist:
```bash
# Delete and recreate (careful - deletes data!)
aws dynamodb delete-table --table-name threat-engine-tenants --region ap-south-1
```

### If KMS key not found:
```bash
aws kms list-aliases --region ap-south-1 | grep threat-engine
```

### If IAM permissions fail:
```bash
# Check role policies
aws iam list-attached-role-policies --role-name threat-engine-platform-role
```

## Cost Estimation

- **DynamoDB:** ~$0.25 per million reads, $1.25 per million writes
- **Secrets Manager:** $0.40 per secret per month
- **KMS:** $1.00 per key per month
- **Data Transfer:** Standard AWS pricing

For typical usage (100 tenants, 1000 accounts):
- DynamoDB: ~$5-10/month
- Secrets Manager: ~$400/month (1000 secrets)
- KMS: $1/month
- **Total: ~$406-411/month**

## Security

✅ All data encrypted at rest
✅ All credentials in Secrets Manager (encrypted)
✅ KMS key rotation enabled
✅ IAM role-based access (IRSA)
✅ No hardcoded credentials

---

**Status:** ✅ Ready for deployment
**Date:** 2026-01-03
**Region:** ap-south-1 (Mumbai)

