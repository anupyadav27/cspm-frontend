# Deploy to EKS - Step by Step Guide

## Prerequisites ✅

All AWS services are set up and tested:
- ✅ DynamoDB tables created (6 tables)
- ✅ KMS key created with alias
- ✅ IAM policies attached to role
- ✅ All tests passed

## Step 1: Update Docker Images

Update the Docker Hub username in deployment manifests (already done):
- `onboarding-deployment.yaml`: `yadavanup84/threat-engine-onboarding-api:latest`
- `scheduler-deployment.yaml`: `yadavanup84/threat-engine-scheduler:latest`

## Step 2: Apply Kubernetes Resources

### 2.1 Apply ConfigMap
```bash
kubectl apply -f kubernetes/configmaps/platform-config.yaml
```

Verify:
```bash
kubectl get configmap platform-config -n threat-engine-engines -o yaml
```

### 2.2 Apply Service Account (if not already applied)
```bash
kubectl apply -f kubernetes/service-accounts/aws-engine-sa.yaml
```

Verify:
```bash
kubectl get serviceaccount aws-compliance-engine-sa -n threat-engine-engines
```

### 2.3 Apply Onboarding API Deployment
```bash
kubectl apply -f kubernetes/onboarding/onboarding-deployment.yaml
```

### 2.4 Apply Scheduler Deployment
```bash
kubectl apply -f kubernetes/scheduler/scheduler-deployment.yaml
```

## Step 3: Verify Deployment

### Check Pods
```bash
kubectl get pods -n threat-engine-engines | grep -E "onboarding|scheduler"
```

Expected output:
```
onboarding-api-xxxxx-xxxxx   1/1   Running   0   30s
scheduler-service-xxxxx      1/1   Running   0   30s
```

### Check Logs
```bash
# Onboarding API logs
kubectl logs -f deployment/onboarding-api -n threat-engine-engines

# Scheduler logs
kubectl logs -f deployment/scheduler-service -n threat-engine-engines
```

Look for:
- ✅ "DynamoDB tables initialized successfully"
- ✅ "Application startup complete"
- ✅ No database connection errors

### Check Service
```bash
kubectl get svc onboarding-api -n threat-engine-engines
```

### Test Health Endpoint
```bash
# Port forward
kubectl port-forward svc/onboarding-api 8000:80 -n threat-engine-engines

# In another terminal
curl http://localhost:8000/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "dynamodb": "connected",
  "secrets_manager": "connected",
  "version": "1.0.0"
}
```

## Step 4: Test API Endpoints

### Create a Tenant
```bash
curl -X POST http://localhost:8000/api/v1/onboarding/aws/init \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "test-tenant-123",
    "account_name": "Test Account"
  }'
```

### List Accounts
```bash
curl http://localhost:8000/api/v1/onboarding/accounts?tenant_id=test-tenant-123
```

## Troubleshooting

### Pod Not Starting

1. **Check pod status:**
   ```bash
   kubectl describe pod <pod-name> -n threat-engine-engines
   ```

2. **Check events:**
   ```bash
   kubectl get events -n threat-engine-engines --sort-by='.lastTimestamp'
   ```

3. **Common issues:**
   - **ImagePullBackOff**: Docker image not found or not accessible
   - **CrashLoopBackOff**: Check logs for errors
   - **InitContainerError**: Check service account and IRSA setup

### AWS Permissions Issues

1. **Verify service account:**
   ```bash
   kubectl describe serviceaccount aws-compliance-engine-sa -n threat-engine-engines
   ```

2. **Check IAM role annotation:**
   ```bash
   kubectl get serviceaccount aws-compliance-engine-sa -n threat-engine-engines -o jsonpath='{.metadata.annotations.eks\.amazonaws\.com/role-arn}'
   ```

3. **Test from pod:**
   ```bash
   kubectl exec -it <pod-name> -n threat-engine-engines -- aws sts get-caller-identity
   ```

### DynamoDB Connection Issues

1. **Check AWS credentials in pod:**
   ```bash
   kubectl exec -it <pod-name> -n threat-engine-engines -- env | grep AWS
   ```

2. **Test DynamoDB access:**
   ```bash
   kubectl exec -it <pod-name> -n threat-engine-engines -- aws dynamodb list-tables --region ap-south-1
   ```

### Secrets Manager Issues

1. **Test Secrets Manager access:**
   ```bash
   kubectl exec -it <pod-name> -n threat-engine-engines -- aws secretsmanager list-secrets --region ap-south-1
   ```

2. **Check KMS permissions:**
   ```bash
   kubectl exec -it <pod-name> -n threat-engine-engines -- aws kms describe-key --key-id alias/threat-engine-secrets --region ap-south-1
   ```

## Rollback

If deployment fails, rollback:

```bash
# Delete deployments
kubectl delete deployment onboarding-api -n threat-engine-engines
kubectl delete deployment scheduler-service -n threat-engine-engines

# Revert to previous version
kubectl rollout undo deployment/onboarding-api -n threat-engine-engines
```

## Next Steps

After successful deployment:

1. **Set up Ingress** (if needed):
   ```bash
   kubectl apply -f kubernetes/ingress/onboarding-ingress.yaml
   ```

2. **Monitor metrics:**
   ```bash
   kubectl top pods -n threat-engine-engines
   ```

3. **Set up alerts** (CloudWatch, Prometheus, etc.)

## Environment Variables Reference

| Variable | Source | Description |
|----------|--------|-------------|
| `AWS_REGION` | ConfigMap | AWS region (ap-south-1) |
| `SECRETS_MANAGER_PREFIX` | ConfigMap | Secrets prefix (threat-engine) |
| `SECRETS_MANAGER_KMS_KEY_ID` | ConfigMap | KMS key alias |
| `PLATFORM_AWS_ACCOUNT_ID` | ConfigMap | Platform AWS account ID |
| `DYNAMODB_*_TABLE` | ConfigMap | DynamoDB table names |
| `LOG_LEVEL` | ConfigMap | Logging level |

## Quick Deploy Script

```bash
#!/bin/bash
# Quick deploy script

echo "Deploying Threat Engine Onboarding to EKS..."

# Apply ConfigMap
kubectl apply -f kubernetes/configmaps/platform-config.yaml

# Apply Service Account
kubectl apply -f kubernetes/service-accounts/aws-engine-sa.yaml

# Apply Deployments
kubectl apply -f kubernetes/onboarding/onboarding-deployment.yaml
kubectl apply -f kubernetes/scheduler/scheduler-deployment.yaml

# Wait for rollout
kubectl rollout status deployment/onboarding-api -n threat-engine-engines
kubectl rollout status deployment/scheduler-service -n threat-engine-engines

echo "✅ Deployment complete!"
echo "Check status: kubectl get pods -n threat-engine-engines"
```

---

**Status:** Ready to deploy
**Last Updated:** 2026-01-03

