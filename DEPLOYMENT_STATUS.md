# Deployment Status

## ✅ Completed

1. **Kubernetes Resources Applied:**
   - ✅ ConfigMap: `platform-config` (configured)
   - ✅ Service Account: `aws-compliance-engine-sa` (unchanged)
   - ✅ Deployment: `onboarding-api` (created)
   - ✅ Deployment: `scheduler-service` (created)
   - ✅ Service: `onboarding-api` (created)

2. **Namespace:** `threat-engine-engines` (exists)

## ⚠️ Current Issue

**Pods Status:** `ImagePullBackOff`

**Reason:** Docker images don't exist in Docker Hub yet.

**Error:**
```
Failed to pull image "yadavanup84/threat-engine-onboarding-api:latest": 
pull access denied, repository does not exist
```

## 📋 Next Steps

### Step 1: Build and Push Docker Images

You have 3 options:

#### Option 1: Use Onboarding Build Script (Recommended)
```bash
cd /Users/apple/Desktop/onboarding
chmod +x build-and-push.sh
./build-and-push.sh
```

#### Option 2: Use Main Build Script
```bash
cd /Users/apple/Desktop/threat-engine
chmod +x kubernetes/build-and-push-images.sh
./kubernetes/build-and-push-images.sh yadavanup84
```

#### Option 3: Manual Build
```bash
# Login to Docker Hub
docker login -u yadavanup84

# Build onboarding API
cd /Users/apple/Desktop/onboarding
docker build -t yadavanup84/threat-engine-onboarding-api:latest .
docker push yadavanup84/threat-engine-onboarding-api:latest

# Build scheduler
cd /Users/apple/Desktop/onboarding/scheduler
docker build -t yadavanup84/threat-engine-scheduler:latest -f Dockerfile ..
docker push yadavanup84/threat-engine-scheduler:latest
```

### Step 2: Restart Deployments

After images are pushed:
```bash
kubectl rollout restart deployment/onboarding-api -n threat-engine-engines
kubectl rollout restart deployment/scheduler-service -n threat-engine-engines
```

### Step 3: Verify Deployment

```bash
# Watch pod status
kubectl get pods -n threat-engine-engines -w

# Check logs
kubectl logs -f deployment/onboarding-api -n threat-engine-engines
kubectl logs -f deployment/scheduler-service -n threat-engine-engines

# Test health endpoint
kubectl port-forward svc/onboarding-api 8000:80 -n threat-engine-engines
curl http://localhost:8000/api/v1/health
```

## Expected Results

After images are pushed and pods restart:

1. **Pod Status:** `Running` (1/1 Ready)
2. **Logs:** Should show:
   - "DynamoDB tables initialized successfully"
   - "Application startup complete"
   - No database connection errors

3. **Health Check:**
   ```json
   {
     "status": "healthy",
     "dynamodb": "connected",
     "secrets_manager": "connected",
     "version": "1.0.0"
   }
   ```

## Troubleshooting

### If pods still fail after pushing images:

1. **Check image exists:**
   ```bash
   docker pull yadavanup84/threat-engine-onboarding-api:latest
   ```

2. **Check pod events:**
   ```bash
   kubectl describe pod <pod-name> -n threat-engine-engines
   ```

3. **Check image pull secrets (if using private registry):**
   ```bash
   kubectl get secrets -n threat-engine-engines
   ```

### If pods start but crash:

1. **Check logs:**
   ```bash
   kubectl logs <pod-name> -n threat-engine-engines
   ```

2. **Check environment variables:**
   ```bash
   kubectl exec <pod-name> -n threat-engine-engines -- env | grep AWS
   ```

3. **Test AWS connectivity:**
   ```bash
   kubectl exec <pod-name> -n threat-engine-engines -- aws sts get-caller-identity
   ```

## Current Pod Status

```bash
# Check current status
kubectl get pods -n threat-engine-engines

# Expected output after images are pushed:
# NAME                              READY   STATUS    RESTARTS   AGE
# onboarding-api-xxxxx-xxxxx        1/1     Running   0          1m
# scheduler-service-xxxxx           1/1     Running   0          1m
```

---

**Last Updated:** 2026-01-03
**Status:** Waiting for Docker images to be built and pushed

