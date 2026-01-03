# Credential Storage Approach

## Why We Store Credentials

We store encrypted credentials in the database for **two main scenarios**:

### 1. **Scheduled Scans** (Automated)
- Users create schedules (e.g., "scan every day at 2 AM")
- The scheduler service runs in the background
- When a scheduled scan triggers, it needs credentials **automatically** without user interaction
- Credentials are retrieved from storage, decrypted, and passed to the engine

### 2. **Manual API-Triggered Scans**
- UI or API can trigger scans on-demand
- Credentials are retrieved from storage instead of requiring users to provide them each time
- Better UX: users don't need to re-enter credentials for every scan

## Two Authentication Methods for AWS

### Method 1: IAM Role (Recommended) ✅
**What's Stored:**
```json
{
  "credential_type": "aws_iam_role",
  "role_arn": "arn:aws:iam::123456789012:role/ThreatEngineComplianceRole",
  "external_id": "unique-external-id-per-customer",
  "account_number": "123456789012"
}
```

**How It Works:**
1. User deploys CloudFormation template in their AWS account
2. CloudFormation creates IAM role that trusts your platform account
3. User provides Role ARN + External ID during onboarding
4. **No long-lived credentials stored** - only role ARN and external ID
5. When scan runs:
   - Platform uses IRSA to get temporary credentials
   - Platform assumes customer's IAM role using Role ARN + External ID
   - Gets temporary credentials (1 hour TTL) from customer account
   - Performs scan with temporary credentials

**Security:** ✅ Most secure - uses temporary credentials, no long-lived keys

---

### Method 2: Access Key + Secret Key (Alternative)
**What's Stored:**
```json
{
  "credential_type": "aws_access_key",
  "access_key_id": "AKIAIOSFODNN7EXAMPLE",
  "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "account_number": "123456789012"
}
```

**How It Works:**
1. User creates IAM user in their AWS account
2. User creates Access Key + Secret Key for that IAM user
3. User provides Access Key ID + Secret Access Key during onboarding
4. **Credentials are encrypted** using Fernet (symmetric encryption) before storing
5. When scan runs:
   - Scheduler retrieves encrypted credentials from database
   - Credentials are decrypted
   - Engine API receives decrypted credentials
   - Engine sets environment variables:
     ```python
     os.environ['AWS_ACCESS_KEY_ID'] = credentials['access_key_id']
     os.environ['AWS_SECRET_ACCESS_KEY'] = credentials['secret_access_key']
     ```
   - boto3 automatically picks up these environment variables
   - Scan runs using these credentials

**Security:** ⚠️ Less secure - long-lived credentials, but encrypted at rest

---

## Complete Flow: Access Key Scenario

### Step 1: User Onboarding
```
User → Portal → Provides:
  - Access Key ID: AKIAIOSFODNN7EXAMPLE
  - Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
  - Account Number: 123456789012
```

### Step 2: Credential Validation
```
Onboarding API → AWSValidator → Tests credentials:
  - Creates boto3 session with access key
  - Calls sts.get_caller_identity()
  - Verifies credentials work
```

### Step 3: Encrypted Storage
```
Onboarding API → CredentialStorage:
  1. Encrypts credentials using Fernet key
  2. Stores encrypted blob in database
  3. Stores credential_type = "aws_access_key"
```

### Step 4: Scheduled Scan Trigger
```
Scheduler Service (runs every 60 seconds):
  1. Checks for due schedules
  2. Finds schedule for account X
  3. Retrieves encrypted credentials from database
  4. Decrypts credentials
  5. Calls Engine API with credentials
```

### Step 5: Engine Execution
```
Engine API receives:
{
  "account": "123456789012",
  "credentials": {
    "credential_type": "aws_access_key",
    "access_key_id": "AKIAIOSFODNN7EXAMPLE",
    "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
  }
}

Engine API:
  1. Sets environment variables
  2. Calls scan() function
  3. boto3 uses environment variables automatically
  4. Scan executes
```

## Code Flow

### Storage (Onboarding API)
```python
# onboarding/api/onboarding.py
@router.post("/{provider}/validate")
async def validate_credentials(...):
    # User provides access_key_id + secret_access_key
    credentials = {
        "credential_type": "aws_access_key",
        "access_key_id": request.access_key_id,
        "secret_access_key": request.secret_access_key
    }
    
    # Validate
    validator.validate(credentials)
    
    # Store encrypted
    credential_storage.store(
        account_id=account.account_id,
        credential_type="aws_access_key",
        credentials=credentials  # Will be encrypted
    )
```

### Retrieval (Scheduler)
```python
# onboarding/scheduler/task_executor.py
async def execute_scan(self, account_id, ...):
    # Retrieve and decrypt
    credentials = self.credential_storage.retrieve(account_id)
    # Returns: {"credential_type": "aws_access_key", "access_key_id": "...", ...}
    
    # Pass to engine
    result = await self.engine_client.scan_aws(
        credentials=credentials,  # Decrypted credentials
        account_number=account.account_number
    )
```

### Usage (Engine API)
```python
# aws_compliance_python_engine/api_server.py
async def run_scan(scan_id, request):
    if request.credentials:
        cred_type = request.credentials.get('credential_type')
        if cred_type == 'aws_access_key':
            # Set environment variables
            os.environ['AWS_ACCESS_KEY_ID'] = request.credentials['access_key_id']
            os.environ['AWS_SECRET_ACCESS_KEY'] = request.credentials['secret_access_key']
        
        # Scan function uses boto3, which picks up env vars
        results = scan(account=request.account, ...)
```

## Encryption Details

### Encryption Key
- Stored in Kubernetes Secret: `encryption-keys.credential-key`
- Generated using: `Fernet.generate_key()`
- Format: Base64-encoded 32-byte key
- Example: `YdUb0U2-Es-rx6k0WgabrZWzXQhFwXofjFws_FUX3Jc=`

### Encryption Process
```python
# onboarding/storage/encryption.py
from cryptography.fernet import Fernet

# Encrypt
credentials_json = json.dumps(credentials)
encrypted_data = fernet.encrypt(credentials_json.encode())

# Decrypt
decrypted_json = fernet.decrypt(encrypted_data).decode()
credentials = json.loads(decrypted_json)
```

### Storage Format
```sql
-- Database table: account_credentials
encrypted_data: BYTEA  -- Encrypted JSON blob
credential_type: VARCHAR  -- "aws_access_key" or "aws_iam_role"
```

## Security Considerations

### ✅ What's Protected
1. **Encryption at Rest**: All credentials encrypted before database storage
2. **Encryption Key**: Stored in Kubernetes Secret (not in code)
3. **Network**: Credentials passed over internal ClusterIP (not exposed externally)
4. **Access Control**: Only scheduler and onboarding API can access credentials

### ⚠️ Recommendations for Access Keys
1. **Rotate Regularly**: Users should rotate access keys every 90 days
2. **Least Privilege**: IAM user should have minimal required permissions
3. **Monitor Usage**: Track when credentials are used (last_used_at field)
4. **Prefer IAM Role**: Always recommend IAM Role over Access Keys when possible

## Comparison: IAM Role vs Access Key

| Aspect | IAM Role | Access Key |
|--------|----------|------------|
| **Security** | ✅ Temporary credentials (1hr) | ⚠️ Long-lived credentials |
| **Setup** | CloudFormation template | Manual IAM user creation |
| **Rotation** | Automatic (via STS) | Manual rotation required |
| **Best For** | Production, automated scans | Development, testing |
| **Stored Data** | Role ARN + External ID | Access Key ID + Secret |

## Summary

**Yes, credential storage is primarily for Access Key/Secret Key scenario**, but also supports IAM Role (stores role ARN, not credentials).

**Approach:**
1. User provides credentials → Encrypted → Stored in DB
2. Scheduler retrieves → Decrypts → Passes to Engine
3. Engine uses credentials → Performs scan
4. Credentials never exposed in logs or API responses

The encryption ensures that even if database is compromised, credentials remain protected (assuming encryption key is secure).

