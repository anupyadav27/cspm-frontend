# Threat Engine Onboarding Module

Complete onboarding, credential management, and scheduling system for multi-cloud compliance scanning.

## Architecture

- **Onboarding API**: FastAPI service for account onboarding and management
- **Scheduler Service**: Background service for scheduled scan execution
- **Database**: PostgreSQL for storing tenants, accounts, credentials, and schedules
- **Engine APIs**: FastAPI wrappers for all compliance engines (AWS, Azure, GCP, AliCloud, OCI, IBM)
- **YAML Rule Builder API**: FastAPI wrapper for rule generation

## Quick Start

### 1. Start PostgreSQL Database

```bash
cd /Users/apple/Desktop/onboarding
docker-compose -f docker-compose.db.yml up -d
```

### 2. Initialize Database

```bash
# Connect to database
psql -h localhost -U threatengine -d threatengine

# Run schema
\i database/schema.sql
```

Or use Python:

```python
from onboarding.database.connection import init_db
init_db()
```

### 3. Run Onboarding API

```bash
cd onboarding
pip install -r requirements.txt
python main.py
```

API will be available at `http://localhost:8000`

## API Endpoints

### Onboarding
- `POST /api/v1/onboarding/{provider}/init` - Initialize account onboarding
- `GET /api/v1/onboarding/{provider}/methods` - Get available auth methods
- `POST /api/v1/onboarding/{provider}/validate` - Validate credentials
- `GET /api/v1/onboarding/accounts` - List accounts

### Schedules
- `POST /api/v1/schedules` - Create schedule
- `GET /api/v1/schedules` - List schedules
- `POST /api/v1/schedules/{schedule_id}/trigger` - Manual trigger

### Health
- `GET /api/v1/health` - Health check

## Environment Variables

```bash
DATABASE_URL=postgresql://threatengine:password@localhost:5432/threatengine
CREDENTIAL_ENCRYPTION_KEY=<generate-fernnet-key>
PLATFORM_AWS_ACCOUNT_ID=<your-aws-account-id>
```

## Kubernetes Deployment

All services are configured as ClusterIP for internal communication:

- `onboarding-api.threat-engine-engines.svc.cluster.local`
- `aws-compliance-engine.threat-engine-engines.svc.cluster.local`
- `yaml-rule-builder.threat-engine-engines.svc.cluster.local`

Deploy with:

```bash
kubectl apply -f kubernetes/
```

## Features

- Multi-tenant support
- Multiple authentication methods per CSP
- Encrypted credential storage
- Scheduled scan execution
- Execution history tracking
- CloudFormation template generation

