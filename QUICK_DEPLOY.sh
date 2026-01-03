#!/bin/bash
# Quick deployment script for Threat Engine Onboarding

set -e

NAMESPACE="threat-engine-engines"
KUBECTL_CMD="kubectl"

echo "=========================================="
echo "Threat Engine Onboarding - EKS Deployment"
echo "=========================================="
echo ""

# Check if namespace exists
if ! $KUBECTL_CMD get namespace $NAMESPACE &>/dev/null; then
    echo "⚠️  Namespace $NAMESPACE not found. Creating..."
    $KUBECTL_CMD create namespace $NAMESPACE
fi

# Step 1: Apply ConfigMap
echo "📋 Step 1: Applying ConfigMap..."
$KUBECTL_CMD apply -f ../threat-engine/kubernetes/configmaps/platform-config.yaml
echo "✅ ConfigMap applied"
echo ""

# Step 2: Apply Service Account
echo "👤 Step 2: Applying Service Account..."
$KUBECTL_CMD apply -f ../threat-engine/kubernetes/service-accounts/aws-engine-sa.yaml
echo "✅ Service Account applied"
echo ""

# Step 3: Apply Onboarding API
echo "🚀 Step 3: Deploying Onboarding API..."
$KUBECTL_CMD apply -f ../threat-engine/kubernetes/onboarding/onboarding-deployment.yaml
echo "✅ Onboarding API deployment applied"
echo ""

# Step 4: Apply Scheduler
echo "⏰ Step 4: Deploying Scheduler Service..."
$KUBECTL_CMD apply -f ../threat-engine/kubernetes/scheduler/scheduler-deployment.yaml
echo "✅ Scheduler deployment applied"
echo ""

# Step 5: Wait for rollout
echo "⏳ Step 5: Waiting for deployments to be ready..."
$KUBECTL_CMD rollout status deployment/onboarding-api -n $NAMESPACE --timeout=300s
$KUBECTL_CMD rollout status deployment/scheduler-service -n $NAMESPACE --timeout=300s
echo "✅ Deployments ready"
echo ""

# Step 6: Show status
echo "📊 Step 6: Deployment Status"
echo "----------------------------------------"
$KUBECTL_CMD get pods -n $NAMESPACE | grep -E "onboarding|scheduler"
echo ""

# Step 7: Show services
echo "🌐 Step 7: Services"
echo "----------------------------------------"
$KUBECTL_CMD get svc -n $NAMESPACE | grep -E "onboarding|scheduler"
echo ""

echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Check logs: kubectl logs -f deployment/onboarding-api -n $NAMESPACE"
echo "2. Test health: kubectl port-forward svc/onboarding-api 8000:80 -n $NAMESPACE"
echo "3. Test API: curl http://localhost:8000/api/v1/health"
echo ""

