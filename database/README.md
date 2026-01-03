# Database Module - DynamoDB

## Overview

This module uses **AWS DynamoDB** for all data storage. PostgreSQL is no longer used.

## Files

- `dynamodb_tables.py` - Table definitions and creation functions
- `dynamodb_operations.py` - CRUD operations for all entities

## Legacy Files (Deprecated)

The following files are kept for reference but are **NOT used**:
- `models.py` - Old SQLAlchemy models (PostgreSQL)
- `connection.py` - Old PostgreSQL connection (not used)
- `schema.sql` - Old PostgreSQL schema (not used)
- `migrations/` - Old PostgreSQL migrations (not used)

These can be removed after migration is complete.

## Usage

```python
from onboarding.database.dynamodb_operations import (
    create_tenant, get_tenant, create_account, get_account
)

# Create tenant
tenant = create_tenant("acme-corp", "Acme Corporation")

# Create account
account = create_account(
    provider_id=provider_id,
    tenant_id=tenant_id,
    account_name="Production Account"
)
```

## Setup

See `AWS_SERVICES_SETUP.md` for DynamoDB table creation.

