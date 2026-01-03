#!/bin/bash

# Quick test script - starts services and runs tests

echo "=========================================="
echo "Quick Local Test Setup"
echo "=========================================="

# Start database if not running
if ! docker ps | grep -q threat-engine-postgres; then
    echo "Starting PostgreSQL database..."
    cd /Users/apple/Desktop/onboarding
    docker-compose -f docker-compose.db.yml up -d
    echo "Waiting for database to be ready..."
    sleep 5
fi

# Initialize database schema if needed
echo "Checking database schema..."
cd /Users/apple/Desktop/onboarding
export PYTHONPATH=/Users/apple/Desktop/onboarding:$PYTHONPATH
python3 << 'EOF'
import sys
import os
sys.path.insert(0, '/Users/apple/Desktop/onboarding')
os.chdir('/Users/apple/Desktop/onboarding')
try:
    from onboarding.database.connection import init_db
    init_db()
    print("Database schema initialized")
except Exception as e:
    print(f"Schema check: {e}")
    import traceback
    traceback.print_exc()
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

