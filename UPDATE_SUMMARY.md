# API and Scheduler Update Summary - DynamoDB + Secrets Manager

## ✅ Completed Updates

### 1. API Endpoints Updated

#### `/api/onboarding.py`
- ✅ Removed SQLAlchemy dependencies
- ✅ Updated to use DynamoDB operations:
  - `create_tenant()`, `get_tenant()`, `get_provider_by_tenant_and_type()`
  - `create_provider()`, `create_account()`, `get_account()`, `update_account()`
  - `list_accounts_by_tenant()`
- ✅ Updated credential storage to use `secrets_manager_storage`
- ✅ All endpoints now use DynamoDB and Secrets Manager

#### `/api/credentials.py`
- ✅ Removed SQLAlchemy dependencies
- ✅ Updated to use:
  - `get_account()` from DynamoDB
  - `secrets_manager_storage` for credential operations
  - `update_account()` for account status updates

#### `/api/schedules.py`
- ✅ Removed SQLAlchemy dependencies
- ✅ Updated to use DynamoDB operations:
  - `create_schedule()`, `get_schedule()`, `update_schedule()`
  - `list_schedules_by_tenant()`, `list_schedules_by_account()`
  - `list_executions_by_schedule()`
- ✅ Fixed `calculate_next_run_time` usage bugs

### 2. Scheduler Updated

#### `/scheduler/task_executor.py`
- ✅ Removed database session dependency
- ✅ Updated to use:
  - `get_account()` from DynamoDB
  - `secrets_manager_storage.retrieve()` for credentials
  - `create_execution()`, `update_execution()` for execution tracking

#### `/scheduler/scheduler_service.py`
- ✅ Removed database session dependency
- ✅ Updated to use:
  - `get_due_schedules()` from DynamoDB
  - `update_schedule()` for schedule updates
  - `create_execution()`, `update_execution()` for execution tracking

#### `/scheduler/main.py`
- ✅ Removed PostgreSQL connection setup
- ✅ Simplified initialization (no database connection needed)

### 3. Main Application Updated

#### `/main.py`
- ✅ Updated startup event to initialize DynamoDB tables instead of PostgreSQL
- ✅ Changed `init_db()` to `create_tables()`

### 4. Configuration Updated

#### `/config.py`
- ✅ Removed `database_url` and `sql_echo`
- ✅ Added AWS services configuration:
  - `aws_region`
  - DynamoDB table names
  - Secrets Manager prefix and KMS key ID

## Key Changes

### Before (PostgreSQL)
```python
from onboarding.database.connection import get_db
from onboarding.database.models import Account
from onboarding.storage.credential_storage import CredentialStorage

account = db.query(Account).filter(Account.account_id == account_id).first()
credentials = credential_storage.retrieve(account.account_id)
```

### After (DynamoDB + Secrets Manager)
```python
from onboarding.database.dynamodb_operations import get_account
from onboarding.storage.secrets_manager_storage import secrets_manager_storage

account = get_account(account_id)
credentials = secrets_manager_storage.retrieve(account_id)
```

## Files Modified

1. ✅ `api/onboarding.py` - Complete rewrite for DynamoDB
2. ✅ `api/credentials.py` - Updated for Secrets Manager
3. ✅ `api/schedules.py` - Updated for DynamoDB
4. ✅ `scheduler/task_executor.py` - Updated for DynamoDB + Secrets Manager
5. ✅ `scheduler/scheduler_service.py` - Updated for DynamoDB
6. ✅ `scheduler/main.py` - Removed database connection
7. ✅ `main.py` - Updated startup event
8. ✅ `config.py` - Updated configuration

## Testing Checklist

- [ ] Test tenant creation
- [ ] Test account onboarding
- [ ] Test credential storage/retrieval
- [ ] Test schedule creation
- [ ] Test schedule execution
- [ ] Test execution history
- [ ] Verify DynamoDB tables created
- [ ] Verify Secrets Manager secrets created
- [ ] Test error handling

## Next Steps

1. **Setup AWS Resources:**
   ```bash
   # Create DynamoDB tables
   python3 -c "from onboarding.database.dynamodb_tables import create_tables; create_tables()"
   
   # Create KMS key (see AWS_SERVICES_SETUP.md)
   aws kms create-key --description "Threat Engine Secrets" --region ap-south-1
   ```

2. **Update IAM Permissions:**
   - Add DynamoDB permissions to `threat-engine-platform-role`
   - Add Secrets Manager permissions
   - Add KMS decrypt permissions

3. **Set Environment Variables:**
   ```bash
   export AWS_REGION=ap-south-1
   export SECRETS_MANAGER_PREFIX=threat-engine
   export SECRETS_MANAGER_KMS_KEY_ID=alias/threat-engine-secrets
   ```

4. **Test Locally:**
   ```bash
   cd /Users/apple/Desktop/onboarding
   python3 main.py
   ```

5. **Deploy to EKS:**
   - Update Kubernetes ConfigMap with AWS configuration
   - Deploy updated services
   - Verify all services are working

## Breaking Changes

⚠️ **Note:** This is a breaking change from PostgreSQL to DynamoDB. If you have existing data:

1. Export data from PostgreSQL (see `MIGRATION_GUIDE.md`)
2. Import to DynamoDB and Secrets Manager
3. Update application code
4. Deploy

## Documentation

- `AWS_SERVICES_SETUP.md` - Setup instructions
- `AWS_ARCHITECTURE.md` - Architecture details
- `MIGRATION_GUIDE.md` - Migration steps
- `AWS_IMPLEMENTATION_SUMMARY.md` - Implementation overview

