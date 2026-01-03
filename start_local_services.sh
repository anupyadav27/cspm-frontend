#!/bin/bash

# Script to start all services locally for testing

echo "=========================================="
echo "Starting Threat Engine Services Locally"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if services are already running
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Start Onboarding API
echo -e "${YELLOW}Starting Onboarding API on port 8000...${NC}"
if check_port 8000; then
    echo "Port 8000 is already in use. Skipping Onboarding API."
else
    cd /Users/apple/Desktop/onboarding
    python3 main.py &
    ONBOARDING_PID=$!
    echo -e "${GREEN}Onboarding API started (PID: $ONBOARDING_PID)${NC}"
    sleep 3
fi

# Start AWS Engine API
echo -e "${YELLOW}Starting AWS Engine API on port 8001...${NC}"
if check_port 8001; then
    echo "Port 8001 is already in use. Skipping AWS Engine API."
else
    cd /Users/apple/Desktop/threat-engine/aws_compliance_python_engine
    PORT=8001 python3 api_server.py &
    AWS_ENGINE_PID=$!
    echo -e "${GREEN}AWS Engine API started (PID: $AWS_ENGINE_PID)${NC}"
    sleep 3
fi

# Start YAML Rule Builder API
echo -e "${YELLOW}Starting YAML Rule Builder API on port 8002...${NC}"
if check_port 8002; then
    echo "Port 8002 is already in use. Skipping YAML Rule Builder API."
else
    cd /Users/apple/Desktop/threat-engine/yaml-rule-builder
    PORT=8002 python3 api_server.py &
    YAML_BUILDER_PID=$!
    echo -e "${GREEN}YAML Rule Builder API started (PID: $YAML_BUILDER_PID)${NC}"
    sleep 3
fi

echo ""
echo "=========================================="
echo -e "${GREEN}All services started!${NC}"
echo "=========================================="
echo "Onboarding API:    http://localhost:8000"
echo "AWS Engine API:    http://localhost:8001"
echo "YAML Builder API:  http://localhost:8002"
echo ""
echo "To stop services, run: kill $ONBOARDING_PID $AWS_ENGINE_PID $YAML_BUILDER_PID"
echo ""
echo "To run tests: python3 test_local.py"

