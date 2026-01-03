# Migration Guide: PostgreSQL to DynamoDB + Secrets Manager

## Overview

This guide helps you migrate from PostgreSQL to AWS DynamoDB (for metadata) and Secrets Manager (for credentials).

## Migration Strategy

### Phase 1: Parallel Run (Recommended)
- Keep PostgreSQL running
- Start writing to both PostgreSQL and DynamoDB
- Verify data consistency
- Switch reads to DynamoDB
- Stop writing to PostgreSQL

### Phase 2: Direct Migration
- Export data from PostgreSQL
- Transform and import to DynamoDB/Secrets Manager
- Switch application
- Decommission PostgreSQL

## Pre-Migration Checklist

- [ ] AWS account configured
- [ ] DynamoDB tables created
- [ ] KMS key created
- [ ] IAM permissions configured
- [ ] Backup PostgreSQL database
- [ ] Test migration script on staging

## Step 1: Export Data from PostgreSQL

```python
# migration/export_postgres.py
import psycopg2
import json
from datetime import datetime

def export_tenants(conn):
    """Export tenants"""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tenants")
    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]

def export_accounts(conn):
    """Export accounts"""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM accounts")
    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]

def export_credentials(conn):
    """Export credentials (encrypted)"""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM account_credentials")
    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]

def export_schedules(conn):
    """Export schedules"""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM schedules")
    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]

# Export all data
conn = psycopg2.connect("postgresql://...")
data = {
    'tenants': export_tenants(conn),
    'accounts': export_accounts(conn),
    'credentials': export_credentials(conn),
    'schedules': export_schedules(conn),
    'executions': export_executions(conn),
    'scan_results': export_scan_results(conn)
}

# Save to JSON
with open('postgres_export.json', 'w') as f:
    json.dump(data, f, default=str)
```

## Step 2: Decrypt Credentials

```python
# migration/decrypt_credentials.py
from onboarding.storage.encryption import encryption_service
import json

def decrypt_credentials(encrypted_data):
    """Decrypt credentials from PostgreSQL"""
    decrypted_json = encryption_service.decrypt(encrypted_data)
    return json.loads(decrypted_json)

# Load exported data
with open('postgres_export.json', 'r') as f:
    data = json.load(f)

# Decrypt credentials
decrypted_creds = []
for cred in data['credentials']:
    try:
        decrypted = decrypt_credentials(cred['encrypted_data'])
        decrypted_creds.append({
            'account_id': str(cred['account_id']),
            'credential_type': cred['credential_type'],
            'credentials': decrypted
        })
    except Exception as e:
        print(f"Failed to decrypt credential {cred['credential_id']}: {e}")

# Save decrypted credentials
with open('decrypted_credentials.json', 'w') as f:
    json.dump(decrypted_creds, f)
```

## Step 3: Import to DynamoDB

```python
# migration/import_dynamodb.py
from onboarding.database.dynamodb_operations import (
    create_tenant, create_provider, create_account,
    create_schedule
)
from onboarding.storage.secrets_manager_storage import secrets_manager_storage
import json

def import_data():
    """Import data to DynamoDB and Secrets Manager"""
    
    # Load exported data
    with open('postgres_export.json', 'r') as f:
        data = json.load(f)
    
    with open('decrypted_credentials.json', 'r') as f:
        credentials = json.load(f)
    
    # Create credential lookup
    cred_lookup = {c['account_id']: c for c in credentials}
    
    # Import tenants
    tenant_map = {}
    for tenant in data['tenants']:
        new_tenant = create_tenant(
            tenant_name=tenant['tenant_name'],
            description=tenant.get('description')
        )
        tenant_map[str(tenant['tenant_id'])] = new_tenant['tenant_id']
        print(f"Imported tenant: {new_tenant['tenant_id']}")
    
    # Import providers
    provider_map = {}
    for provider in data['providers']:
        tenant_id = tenant_map[str(provider['tenant_id'])]
        new_provider = create_provider(
            tenant_id=tenant_id,
            provider_type=provider['provider_type']
        )
        provider_map[str(provider['provider_id'])] = new_provider['provider_id']
        print(f"Imported provider: {new_provider['provider_id']}")
    
    # Import accounts
    account_map = {}
    for account in data['accounts']:
        provider_id = provider_map[str(account['provider_id'])]
        tenant_id = tenant_map[str(account['tenant_id'])]
        
        new_account = create_account(
            provider_id=provider_id,
            tenant_id=tenant_id,
            account_name=account['account_name'],
            account_number=account.get('account_number')
        )
        account_map[str(account['account_id'])] = new_account['account_id']
        print(f"Imported account: {new_account['account_id']}")
        
        # Import credentials to Secrets Manager
        if str(account['account_id']) in cred_lookup:
            cred_data = cred_lookup[str(account['account_id'])]
            secrets_manager_storage.store(
                account_id=new_account['account_id'],
                credential_type=cred_data['credential_type'],
                credentials=cred_data['credentials']
            )
            print(f"Imported credentials for account: {new_account['account_id']}")
    
    # Import schedules
    schedule_map = {}
    for schedule in data['schedules']:
        tenant_id = tenant_map[str(schedule['tenant_id'])]
        account_id = account_map[str(schedule['account_id'])]
        
        new_schedule = create_schedule(
            tenant_id=tenant_id,
            account_id=account_id,
            name=schedule['name'],
            schedule_type=schedule['schedule_type'],
            provider_type=schedule['provider_type'],
            cron_expression=schedule.get('cron_expression'),
            interval_seconds=schedule.get('interval_seconds'),
            regions=schedule.get('regions', []),
            services=schedule.get('services', []),
            exclude_services=schedule.get('exclude_services', [])
        )
        schedule_map[str(schedule['schedule_id'])] = new_schedule['schedule_id']
        print(f"Imported schedule: {new_schedule['schedule_id']}")
    
    print("Migration complete!")

if __name__ == '__main__':
    import_data()
```

## Step 4: Verify Migration

```python
# migration/verify_migration.py
from onboarding.database.dynamodb_operations import (
    list_tenants, list_accounts_by_tenant
)
from onboarding.storage.secrets_manager_storage import secrets_manager_storage

def verify_migration():
    """Verify migrated data"""
    
    # Check tenants
    tenants = list_tenants()
    print(f"Tenants in DynamoDB: {len(tenants)}")
    
    # Check accounts
    for tenant in tenants:
        accounts = list_accounts_by_tenant(tenant['tenant_id'])
        print(f"Tenant {tenant['tenant_name']}: {len(accounts)} accounts")
        
        # Verify credentials
        for account in accounts:
            try:
                creds = secrets_manager_storage.retrieve(account['account_id'])
                print(f"  ✓ Account {account['account_name']}: Credentials OK")
            except Exception as e:
                print(f"  ✗ Account {account['account_name']}: {e}")

if __name__ == '__main__':
    verify_migration()
```

## Step 5: Update Application Code

### Update API Endpoints

Replace PostgreSQL queries with DynamoDB operations:

**Before:**
```python
from onboarding.database.connection import get_db
from onboarding.database.models import Account

@router.get("/accounts")
async def list_accounts(db: Session = Depends(get_db)):
    accounts = db.query(Account).filter(Account.tenant_id == tenant_id).all()
    return accounts
```

**After:**
```python
from onboarding.database.dynamodb_operations import list_accounts_by_tenant

@router.get("/accounts")
async def list_accounts(tenant_id: str):
    accounts = list_accounts_by_tenant(tenant_id)
    return accounts
```

### Update Credential Storage

**Before:**
```python
from onboarding.storage.credential_storage import CredentialStorage

credential_storage = CredentialStorage(db)
credential_storage.store(account_id, credential_type, credentials)
```

**After:**
```python
from onboarding.storage.secrets_manager_storage import secrets_manager_storage

secrets_manager_storage.store(account_id, credential_type, credentials)
```

## Step 6: Switch Application

1. **Update environment variables**
2. **Deploy updated code**
3. **Monitor for errors**
4. **Verify data access**

## Step 7: Decommission PostgreSQL

After verifying everything works:

1. **Stop PostgreSQL service**
2. **Take final backup**
3. **Delete RDS instance** (if using RDS)
4. **Remove PostgreSQL dependencies** from code

## Rollback Plan

If issues occur:

1. **Keep PostgreSQL running** during migration
2. **Maintain parallel writes** initially
3. **Switch reads back** to PostgreSQL if needed
4. **Fix issues** and retry migration

## Migration Script

Complete migration script:

```bash
# Run migration
cd /Users/apple/Desktop/onboarding
python3 migration/export_postgres.py
python3 migration/decrypt_credentials.py
python3 migration/import_dynamodb.py
python3 migration/verify_migration.py
```

## Post-Migration

- [ ] Update monitoring dashboards
- [ ] Update documentation
- [ ] Train team on new architecture
- [ ] Set up CloudWatch alarms
- [ ] Configure backup strategy

## Troubleshooting

### DynamoDB Import Errors

```bash
# Check table exists
aws dynamodb describe-table --table-name threat-engine-tenants

# Check IAM permissions
aws iam get-role-policy --role-name threat-engine-platform-role
```

### Secrets Manager Errors

```bash
# Check secret exists
aws secretsmanager describe-secret --secret-id threat-engine/account/{account_id}

# Check KMS permissions
aws kms describe-key --key-id <KEY_ID>
```

### Data Mismatch

```python
# Compare counts
postgres_count = len(postgres_data['accounts'])
dynamodb_count = len(list_accounts_by_tenant(tenant_id))
assert postgres_count == dynamodb_count
```

