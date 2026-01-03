# Local Testing Guide

This guide helps you test the onboarding, AWS engine, and YAML rule builder services locally.

## Prerequisites

1. **PostgreSQL Database** - Start the local database:
   ```bash
   cd /Users/apple/Desktop/onboarding
   docker-compose -f docker-compose.db.yml up -d
   ```

2. **Python Dependencies** - Install dependencies for all services:
   ```bash
   # Onboarding
   cd /Users/apple/Desktop/onboarding
   pip install -r requirements.txt
   
   # AWS Engine
   cd /Users/apple/Desktop/threat-engine/aws_compliance_python_engine
   pip install -r requirements.txt fastapi uvicorn
   
   # YAML Rule Builder
   cd /Users/apple/Desktop/threat-engine/yaml-rule-builder
   pip install -r requirements.txt fastapi uvicorn
   ```

## Quick Start

### Option 1: Automated Script

```bash
cd /Users/apple/Desktop/onboarding
./start_local_services.sh
```

Then in another terminal:
```bash
cd /Users/apple/Desktop/onboarding
python3 test_local.py
```

### Option 2: Manual Start

#### Terminal 1: Onboarding API
```bash
cd /Users/apple/Desktop/onboarding
python3 main.py
```
Service will run on: `http://localhost:8000`

#### Terminal 2: AWS Engine API
```bash
cd /Users/apple/Desktop/threat-engine/aws_compliance_python_engine
PORT=8001 python3 api_server.py
```
Service will run on: `http://localhost:8001`

#### Terminal 3: YAML Rule Builder API
```bash
cd /Users/apple/Desktop/threat-engine/yaml-rule-builder
PORT=8002 python3 api_server.py
```
Service will run on: `http://localhost:8002`

#### Terminal 4: Run Tests
```bash
cd /Users/apple/Desktop/onboarding
python3 test_local.py
```

## Test Flow

The test script (`test_local.py`) will:

1. **Health Checks** - Verify all services are running
2. **Create Tenant** - Create a test tenant
3. **Initialize AWS Onboarding** - Set up AWS account onboarding
4. **Validate Credentials** - Test credential validation (will fail with test credentials, but tests the flow)
5. **List AWS Services** - Get available AWS services from engine
6. **Create Scan** - Test scan creation (will fail without real credentials)
7. **Get Scan Status** - Check scan progress
8. **Get Metrics** - View engine metrics
9. **YAML Builder Tests**:
   - List services
   - Get service fields
   - Validate rule
   - Generate rule

## Manual Testing Examples

### 1. Test Onboarding API

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Create tenant
curl -X POST http://localhost:8000/api/v1/onboarding/tenants \
  -H "Content-Type: application/json" \
  -d '{"tenant_name": "Test Tenant"}'

# Initialize AWS onboarding
curl -X POST http://localhost:8000/api/v1/onboarding/aws/init \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "YOUR_TENANT_ID",
    "account_name": "Test AWS Account",
    "auth_method": "iam_role"
  }'
```

### 2. Test AWS Engine API

```bash
# Health check
curl http://localhost:8001/api/v1/health

# List services
curl http://localhost:8001/api/v1/services

# Create scan (replace with real credentials)
curl -X POST http://localhost:8001/api/v1/scan \
  -H "Content-Type: application/json" \
  -d '{
    "account": "123456789012",
    "credentials": {
      "credential_type": "aws_iam_role",
      "role_arn": "arn:aws:iam::123456789012:role/ThreatEngineComplianceRole",
      "external_id": "your-external-id",
      "account_number": "123456789012"
    },
    "include_regions": ["us-east-1"],
    "include_services": ["s3"]
  }'

# Get scan status (replace SCAN_ID)
curl http://localhost:8001/api/v1/scan/SCAN_ID/status

# Get metrics
curl http://localhost:8001/api/v1/metrics
```

### 3. Test YAML Rule Builder API

```bash
# Health check
curl http://localhost:8002/api/v1/health

# List services
curl http://localhost:8002/api/v1/services

# Get fields for a service
curl http://localhost:8002/api/v1/services/s3/fields

# Validate a rule
curl -X POST http://localhost:8002/api/v1/rules/validate \
  -H "Content-Type: application/json" \
  -d '{
    "service": "s3",
    "rule_id": "test-rule-1",
    "conditions": [
      {
        "field": "BucketName",
        "operator": "equals",
        "value": "test-bucket"
      }
    ],
    "logical_operator": "single"
  }'

# Generate a rule
curl -X POST http://localhost:8002/api/v1/rules/generate \
  -H "Content-Type: application/json" \
  -d '{
    "service": "s3",
    "title": "Test S3 Rule",
    "description": "Test rule for S3 bucket",
    "remediation": "Fix the bucket configuration",
    "rule_id": "test-rule-1",
    "conditions": [
      {
        "field": "BucketName",
        "operator": "equals",
        "value": "test-bucket"
      }
    ],
    "logical_operator": "single"
  }'
```

## Testing with Real AWS Credentials

To test with real AWS credentials:

1. **Set up AWS IAM Role**:
   - Deploy the CloudFormation template from `onboarding/templates/aws_cloudformation.yaml`
   - Get the Role ARN and External ID from the outputs

2. **Update test script**:
   - Edit `test_local.py` and replace test credentials with real ones
   - Or use the manual curl commands above with real credentials

3. **Run scan**:
   ```bash
   curl -X POST http://localhost:8001/api/v1/scan \
     -H "Content-Type: application/json" \
     -d '{
       "account": "YOUR_ACCOUNT_ID",
       "credentials": {
         "credential_type": "aws_iam_role",
         "role_arn": "YOUR_ROLE_ARN",
         "external_id": "YOUR_EXTERNAL_ID",
         "account_number": "YOUR_ACCOUNT_ID"
       },
       "include_regions": ["us-east-1"],
       "include_services": ["s3", "ec2"]
     }'
   ```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `docker ps`
- Check connection string in `.env` or environment variables
- Initialize schema: `psql -h localhost -U threatengine -d threatengine -f database/schema.sql`

### Port Already in Use
- Check what's using the port: `lsof -i :8000`
- Kill the process or use different ports
- Update URLs in `test_local.py` if using different ports

### Import Errors
- Ensure you're in the correct directory
- Check PYTHONPATH is set correctly
- Install missing dependencies: `pip install -r requirements.txt`

### Service Not Starting
- Check logs for errors
- Verify all dependencies are installed
- Ensure database is accessible (for onboarding service)

## Next Steps

After local testing:
1. Build Docker images
2. Deploy to Kubernetes
3. Test in cluster environment
4. Set up production credentials and secrets

