#!/bin/bash
# Build and push Docker images to Docker Hub

set -e

DOCKER_USERNAME="yadavanup84"
REGISTRY="docker.io"

echo "=========================================="
echo "Building and Pushing Docker Images"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    echo ""
    echo "On macOS:"
    echo "  1. Open Docker Desktop application"
    echo "  2. Wait for it to start (whale icon in menu bar)"
    echo "  3. Run this script again"
    exit 1
fi

# Check if logged in to Docker Hub
if ! docker info | grep -q "Username"; then
    echo "🔐 Please login to Docker Hub..."
    docker login -u $DOCKER_USERNAME
    echo ""
fi

# Build onboarding API image
echo "🏗️  Building onboarding-api image..."
cd /Users/apple/Desktop/onboarding
docker build -t $DOCKER_USERNAME/threat-engine-onboarding-api:latest .
echo "✅ onboarding-api image built"
echo ""

# Build scheduler image
echo "🏗️  Building scheduler image..."
cd /Users/apple/Desktop/onboarding
# Check if scheduler Dockerfile exists in scheduler directory
if [ -f "scheduler/Dockerfile" ]; then
    docker build -t $DOCKER_USERNAME/threat-engine-scheduler:latest -f scheduler/Dockerfile .
    echo "✅ scheduler image built"
else
    echo "⚠️  Using onboarding image for scheduler (scheduler Dockerfile not found)"
    docker tag $DOCKER_USERNAME/threat-engine-onboarding-api:latest $DOCKER_USERNAME/threat-engine-scheduler:latest
fi
echo ""

# Push onboarding API image
echo "📤 Pushing onboarding-api image to Docker Hub..."
docker push $DOCKER_USERNAME/threat-engine-onboarding-api:latest
echo "✅ onboarding-api pushed successfully"
echo ""

# Push scheduler image
echo "📤 Pushing scheduler image to Docker Hub..."
docker push $DOCKER_USERNAME/threat-engine-scheduler:latest
echo "✅ scheduler pushed successfully"
echo ""

echo "=========================================="
echo "✅ All images pushed successfully!"
echo "=========================================="
echo ""
echo "Images pushed:"
echo "  - $DOCKER_USERNAME/threat-engine-onboarding-api:latest"
echo "  - $DOCKER_USERNAME/threat-engine-scheduler:latest"
echo ""
echo "Next steps:"
echo "  1. Restart deployments:"
echo "     kubectl rollout restart deployment/onboarding-api -n threat-engine-engines"
echo "     kubectl rollout restart deployment/scheduler-service -n threat-engine-engines"
echo ""
echo "  2. Check pod status:"
echo "     kubectl get pods -n threat-engine-engines -w"
echo ""

