#!/bin/bash

# Quick test script - starts services and runs tests

echo "=========================================="
echo "Quick Local Test Setup"
echo "=========================================="

# Check AWS credentials
echo "Checking AWS configuration..."
if ! aws sts get-caller-identity &>/dev/null; then
    echo "⚠️  AWS credentials not configured. Set AWS_REGION and ensure credentials are available."
    echo "   The API will still start but DynamoDB/Secrets Manager operations may fail."
fi

# Initialize DynamoDB tables if needed
echo "Checking DynamoDB tables..."
cd /Users/apple/Desktop/onboarding
export PYTHONPATH=/Users/apple/Desktop:$PYTHONPATH
python3 << 'EOF'
import sys
import os
sys.path.insert(0, '/Users/apple/Desktop')
os.chdir('/Users/apple/Desktop/onboarding')
try:
    from onboarding.database.dynamodb_tables import create_tables
    create_tables()
    print("✅ DynamoDB tables verified/created")
except Exception as e:
    print(f"⚠️  DynamoDB check: {e}")
    print("   Tables may already exist or AWS credentials not configured")
EOF

# Start services
echo ""
echo "Starting services..."
./start_local_services.sh

# Wait a bit for services to start
echo ""
echo "Waiting for services to start..."
sleep 5

# Run tests
echo ""
echo "Running tests..."
export PYTHONPATH=/Users/apple/Desktop/onboarding:$PYTHONPATH
python3 test_local.py

echo ""
echo "=========================================="
echo "Test complete!"
echo "=========================================="
echo ""
echo "Services are still running. To stop them:"
echo "  pkill -f 'python.*main.py'"
echo "  pkill -f 'python.*api_server.py'"
echo ""

