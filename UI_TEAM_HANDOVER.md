# Threat Engine Onboarding API - UI Team Handover Document

## 📋 Overview

This document provides all information needed for the UI team to integrate with the Threat Engine Onboarding API.

**API Base URL:**
```
http://a2d474d5fbb694ac5a295b05ba4ee566-8ce5ff8e72034235.elb.ap-south-1.amazonaws.com
```

**API Documentation (Interactive):**
```
http://a2d474d5fbb694ac5a295b05ba4ee566-8ce5ff8e72034235.elb.ap-south-1.amazonaws.com/docs
```

**API Version:** 1.0.0

---

## 🚀 Quick Start

### Base URL
```javascript
const API_BASE_URL = 'http://a2d474d5fbb694ac5a295b05ba4ee566-8ce5ff8e72034235.elb.ap-south-1.amazonaws.com';
```

### Health Check
```javascript
// Check if API is available
fetch(`${API_BASE_URL}/api/v1/health`)
  .then(res => res.json())
  .then(data => console.log(data));
// Response: { status: "healthy", dynamodb: "connected", secrets_manager: "connected", version: "1.0.0" }
```

---

## 📚 API Endpoints

### 1. Health Check

**GET** `/api/v1/health`

Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "dynamodb": "connected",
  "secrets_manager": "connected",
  "version": "1.0.0"
}
```

---

### 2. Get Available Authentication Methods

**GET** `/api/v1/onboarding/{provider}/methods`

Get available authentication methods for a cloud provider.

**Path Parameters:**
- `provider`: `aws`, `azure`, `gcp`, `alicloud`, `oci`, `ibm`

**Example:**
```javascript
fetch(`${API_BASE_URL}/api/v1/onboarding/aws/methods`)
  .then(res => res.json())
  .then(data => console.log(data));
```

**Response:**
```json
{
  "provider": "aws",
  "methods": [
    {
      "method": "iam_role",
      "name": "IAM Role (Recommended)",
      "description": "Secure cross-account role assumption",
      "requires": ["role_arn", "external_id", "account_number"],
      "cloudformation_supported": true
    },
    {
      "method": "access_key",
      "name": "Access Key",
      "description": "IAM user access key and secret",
      "requires": ["access_key_id", "secret_access_key"],
      "cloudformation_supported": false
    }
  ]
}
```

---

### 3. Initialize Onboarding

**POST** `/api/v1/onboarding/{provider}/init`

Start the onboarding process for a new account.

**Path Parameters:**
- `provider`: `aws`, `azure`, `gcp`, `alicloud`, `oci`, `ibm`

**Request Body:**
```json
{
  "tenant_id": "string (required)",
  "account_name": "string (required)",
  "auth_method": "string (optional, default: iam_role for AWS)"
}
```

**Example:**
```javascript
const response = await fetch(`${API_BASE_URL}/api/v1/onboarding/aws/init`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tenant_id: 'tenant-123',
    account_name: 'Production Account',
    auth_method: 'iam_role'
  })
});

const data = await response.json();
// Response includes: onboarding_id, account_id, external_id, cloudformation_template_url
```

**Response:**
```json
{
  "onboarding_id": "uuid",
  "account_id": "uuid",
  "provider": "aws",
  "auth_method": "iam_role",
  "account_name": "Production Account",
  "external_id": "threat-engine-abc123...",
  "cloudformation_template_url": "/api/v1/onboarding/aws/cloudformation-template?external_id=..."
}
```

---

### 4. Get CloudFormation Template (AWS Only)

**GET** `/api/v1/onboarding/aws/cloudformation-template?external_id={external_id}`

Get the CloudFormation template for AWS IAM role setup.

**Query Parameters:**
- `external_id`: External ID from init response

**Example:**
```javascript
const externalId = data.external_id; // From init response
fetch(`${API_BASE_URL}/api/v1/onboarding/aws/cloudformation-template?external_id=${externalId}`)
  .then(res => res.json())
  .then(data => {
    // data.template contains the CloudFormation YAML
    // data.external_id and data.platform_account_id are included
  });
```

**Response:**
```json
{
  "template": "AWSTemplateFormatVersion: '2010-09-09'...",
  "external_id": "threat-engine-abc123...",
  "platform_account_id": "588989875114"
}
```

---

### 5. Validate and Activate Account

**POST** `/api/v1/onboarding/{provider}/validate`

Validate credentials and activate the account.

**Path Parameters:**
- `provider`: `aws`, `azure`, `gcp`, `alicloud`, `oci`, `ibm`

**Request Body:**
```json
{
  "account_id": "uuid (required)",
  "auth_method": "string (required)",
  "credentials": {
    // Credentials vary by provider and auth_method
  }
}
```

**AWS IAM Role Example:**
```javascript
const response = await fetch(`${API_BASE_URL}/api/v1/onboarding/aws/validate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    account_id: 'account-uuid-from-init',
    auth_method: 'iam_role',
    credentials: {
      role_arn: 'arn:aws:iam::123456789012:role/ThreatEngineComplianceRole',
      external_id: 'threat-engine-abc123...',
      account_number: '123456789012'
    }
  })
});
```

**AWS Access Key Example:**
```javascript
const response = await fetch(`${API_BASE_URL}/api/v1/onboarding/aws/validate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    account_id: 'account-uuid-from-init',
    auth_method: 'access_key',
    credentials: {
      access_key_id: 'AKIAIOSFODNN7EXAMPLE',
      secret_access_key: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      account_number: '123456789012'
    }
  })
});
```

**Response:**
```json
{
  "success": true,
  "message": "Account successfully onboarded and validated",
  "account_id": "uuid",
  "account_number": "123456789012"
}
```

**Error Response:**
```json
{
  "detail": {
    "message": "Validation failed",
    "errors": ["Invalid credentials", "Account not found"]
  }
}
```

---

### 6. Validate from CloudFormation JSON (AWS Only)

**POST** `/api/v1/onboarding/aws/validate-json`

Validate account using JSON output from CloudFormation stack.

**Request Body:**
```json
{
  "account_id": "uuid (required)",
  "onboarding_json": {
    "account_id": "123456789012",
    "role_arn": "arn:aws:iam::123456789012:role/ThreatEngineComplianceRole",
    "external_id": "threat-engine-abc123..."
  }
}
```

**Example:**
```javascript
// After CloudFormation stack creation, user copies JSON output
const cfOutput = {
  account_id: "123456789012",
  role_arn: "arn:aws:iam::123456789012:role/ThreatEngineComplianceRole",
  external_id: "threat-engine-abc123..."
};

const response = await fetch(`${API_BASE_URL}/api/v1/onboarding/aws/validate-json`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    account_id: 'account-uuid-from-init',
    onboarding_json: cfOutput
  })
});
```

---

### 7. List Accounts

**GET** `/api/v1/onboarding/accounts?tenant_id={tenant_id}&provider_type={provider}`

List all accounts for a tenant.

**Query Parameters:**
- `tenant_id`: (required) Tenant ID
- `provider_type`: (optional) Filter by provider: `aws`, `azure`, `gcp`, etc.

**Example:**
```javascript
fetch(`${API_BASE_URL}/api/v1/onboarding/accounts?tenant_id=tenant-123`)
  .then(res => res.json())
  .then(data => console.log(data.accounts));
```

**Response:**
```json
{
  "accounts": [
    {
      "account_id": "uuid",
      "account_name": "Production Account",
      "account_number": "123456789012",
      "provider_type": "aws",
      "status": "active",
      "onboarding_status": "completed",
      "created_at": "2026-01-03T10:00:00Z"
    }
  ]
}
```

---

### 8. Get Account Details

**GET** `/api/v1/onboarding/accounts/{account_id}`

Get detailed information about a specific account.

**Path Parameters:**
- `account_id`: Account UUID

**Example:**
```javascript
fetch(`${API_BASE_URL}/api/v1/onboarding/accounts/${accountId}`)
  .then(res => res.json())
  .then(data => console.log(data));
```

**Response:**
```json
{
  "account_id": "uuid",
  "account_name": "Production Account",
  "account_number": "123456789012",
  "provider_type": "aws",
  "status": "active",
  "onboarding_status": "completed",
  "created_at": "2026-01-03T10:00:00Z",
  "updated_at": "2026-01-03T10:05:00Z",
  "last_validated_at": "2026-01-03T10:05:00Z"
}
```

---

### 9. Delete Account

**DELETE** `/api/v1/onboarding/accounts/{account_id}`

Delete an account and its associated credentials.

**Path Parameters:**
- `account_id`: Account UUID

**Example:**
```javascript
const response = await fetch(`${API_BASE_URL}/api/v1/onboarding/accounts/${accountId}`, {
  method: 'DELETE'
});

const data = await response.json();
// Response: { "status": "deleted", "account_id": "uuid" }
```

---

### 10. Store Credentials

**POST** `/api/v1/accounts/{account_id}/credentials`

Store or update credentials for an account.

**Path Parameters:**
- `account_id`: Account UUID

**Request Body:**
```json
{
  "credential_type": "aws_iam_role",
  "credentials": {
    "role_arn": "...",
    "external_id": "...",
    "account_number": "..."
  }
}
```

**Example:**
```javascript
const response = await fetch(`${API_BASE_URL}/api/v1/accounts/${accountId}/credentials`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    credential_type: 'aws_iam_role',
    credentials: {
      role_arn: 'arn:aws:iam::123456789012:role/ThreatEngineComplianceRole',
      external_id: 'threat-engine-abc123...',
      account_number: '123456789012'
    }
  })
});
```

---

### 11. Re-validate Credentials

**GET** `/api/v1/accounts/{account_id}/credentials/validate`

Re-validate stored credentials.

**Path Parameters:**
- `account_id`: Account UUID

**Example:**
```javascript
fetch(`${API_BASE_URL}/api/v1/accounts/${accountId}/credentials/validate`)
  .then(res => res.json())
  .then(data => {
    // data.success: true/false
    // data.message: validation message
    // data.errors: array of errors if failed
  });
```

---

### 12. Delete Credentials

**DELETE** `/api/v1/accounts/{account_id}/credentials`

Delete credentials for an account.

**Path Parameters:**
- `account_id`: Account UUID

---

### 13. Create Schedule

**POST** `/api/v1/schedules`

Create a new scan schedule.

**Request Body:**
```json
{
  "tenant_id": "string (required)",
  "account_id": "uuid (required)",
  "name": "string (required)",
  "description": "string (optional)",
  "schedule_type": "cron | interval | one_time (required)",
  "cron_expression": "string (required if schedule_type=cron)",
  "interval_seconds": "number (required if schedule_type=interval)",
  "timezone": "string (optional, default: UTC)",
  "regions": ["string"] (optional),
  "services": ["string"] (optional),
  "exclude_services": ["string"] (optional),
  "notify_on_success": "boolean (optional)",
  "notify_on_failure": "boolean (optional)",
  "notification_channels": {} (optional)
}
```

**Example:**
```javascript
const response = await fetch(`${API_BASE_URL}/api/v1/schedules`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tenant_id: 'tenant-123',
    account_id: 'account-uuid',
    name: 'Daily Compliance Scan',
    description: 'Runs every day at 2 AM',
    schedule_type: 'cron',
    cron_expression: '0 2 * * *',
    timezone: 'UTC',
    regions: ['us-east-1', 'us-west-2'],
    notify_on_failure: true
  })
});

const data = await response.json();
// Response: { schedule_id: "uuid", name: "...", next_run_at: "...", status: "created" }
```

---

### 14. List Schedules

**GET** `/api/v1/schedules?tenant_id={tenant_id}&account_id={account_id}&status={status}`

List schedules with optional filters.

**Query Parameters:**
- `tenant_id`: (optional) Filter by tenant
- `account_id`: (optional) Filter by account
- `status`: (optional) Filter by status: `active`, `paused`, `error`

**Example:**
```javascript
fetch(`${API_BASE_URL}/api/v1/schedules?tenant_id=tenant-123`)
  .then(res => res.json())
  .then(data => console.log(data.schedules));
```

---

### 15. Get Schedule Details

**GET** `/api/v1/schedules/{schedule_id}`

Get detailed information about a schedule.

**Path Parameters:**
- `schedule_id`: Schedule UUID

---

### 16. Update Schedule

**PUT** `/api/v1/schedules/{schedule_id}`

Update an existing schedule.

**Request Body:** (all fields optional)
```json
{
  "name": "string",
  "description": "string",
  "schedule_type": "cron | interval",
  "cron_expression": "string",
  "interval_seconds": "number",
  "enabled": "boolean",
  "status": "active | paused",
  "regions": ["string"],
  "services": ["string"]
}
```

---

### 17. Trigger Schedule Manually

**POST** `/api/v1/schedules/{schedule_id}/trigger`

Manually trigger a scheduled scan.

**Path Parameters:**
- `schedule_id`: Schedule UUID

**Response:**
```json
{
  "status": "triggered",
  "scan_id": "uuid",
  "message": "Schedule executed manually"
}
```

---

### 18. Delete Schedule

**DELETE** `/api/v1/schedules/{schedule_id}`

Delete a schedule.

---

### 19. Get Schedule Executions

**GET** `/api/v1/schedules/{schedule_id}/executions?limit={limit}&offset={offset}`

Get execution history for a schedule.

**Query Parameters:**
- `limit`: (optional, default: 50) Number of results
- `offset`: (optional, default: 0) Pagination offset

**Response:**
```json
{
  "executions": [
    {
      "execution_id": "uuid",
      "started_at": "2026-01-03T10:00:00Z",
      "completed_at": "2026-01-03T10:05:00Z",
      "status": "completed",
      "total_checks": 150,
      "passed_checks": 145,
      "failed_checks": 5,
      "execution_time_seconds": 300,
      "triggered_by": "scheduler"
    }
  ],
  "total": 10
}
```

---

## 🔄 Complete Workflow Examples

### AWS Account Onboarding (IAM Role)

```javascript
// Step 1: Get available methods
const methods = await fetch(`${API_BASE_URL}/api/v1/onboarding/aws/methods`)
  .then(res => res.json());

// Step 2: Initialize onboarding
const initResponse = await fetch(`${API_BASE_URL}/api/v1/onboarding/aws/init`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: 'tenant-123',
    account_name: 'Production Account',
    auth_method: 'iam_role'
  })
}).then(res => res.json());

// Step 3: Get CloudFormation template
const cfTemplate = await fetch(
  `${API_BASE_URL}/api/v1/onboarding/aws/cloudformation-template?external_id=${initResponse.external_id}`
).then(res => res.json());

// Step 4: User deploys CloudFormation stack in their AWS account
// Step 5: User copies JSON output from CloudFormation

// Step 6: Validate using CloudFormation JSON
const validateResponse = await fetch(`${API_BASE_URL}/api/v1/onboarding/aws/validate-json`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    account_id: initResponse.account_id,
    onboarding_json: {
      // User pastes CloudFormation output here
      account_id: "123456789012",
      role_arn: "arn:aws:iam::123456789012:role/ThreatEngineComplianceRole",
      external_id: initResponse.external_id
    }
  })
}).then(res => res.json());

// Account is now onboarded and active!
```

### AWS Account Onboarding (Access Key)

```javascript
// Step 1: Initialize
const initResponse = await fetch(`${API_BASE_URL}/api/v1/onboarding/aws/init`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: 'tenant-123',
    account_name: 'Dev Account',
    auth_method: 'access_key'
  })
}).then(res => res.json());

// Step 2: User enters Access Key and Secret Key in UI

// Step 3: Validate
const validateResponse = await fetch(`${API_BASE_URL}/api/v1/onboarding/aws/validate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    account_id: initResponse.account_id,
    auth_method: 'access_key',
    credentials: {
      access_key_id: 'AKIAIOSFODNN7EXAMPLE',
      secret_access_key: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
    }
  })
}).then(res => res.json());
```

### Create and Manage Schedule

```javascript
// Step 1: Create schedule
const schedule = await fetch(`${API_BASE_URL}/api/v1/schedules`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: 'tenant-123',
    account_id: 'account-uuid',
    name: 'Daily Compliance Scan',
    schedule_type: 'cron',
    cron_expression: '0 2 * * *', // 2 AM daily
    timezone: 'UTC'
  })
}).then(res => res.json());

// Step 2: List schedules
const schedules = await fetch(
  `${API_BASE_URL}/api/v1/schedules?tenant_id=tenant-123`
).then(res => res.json());

// Step 3: Trigger manually (optional)
await fetch(`${API_BASE_URL}/api/v1/schedules/${schedule.schedule_id}/trigger`, {
  method: 'POST'
});

// Step 4: View execution history
const executions = await fetch(
  `${API_BASE_URL}/api/v1/schedules/${schedule.schedule_id}/executions`
).then(res => res.json());
```

---

## 📝 Request/Response Formats

### Common Response Structure

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "detail": {
    "message": "Error message",
    "errors": ["Error 1", "Error 2"]
  }
}
```

### HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 🔐 Authentication Methods by Provider

### AWS
- **IAM Role** (Recommended): `role_arn`, `external_id`, `account_number`
- **Access Key**: `access_key_id`, `secret_access_key`

### Azure
- **Service Principal**: `client_id`, `client_secret`, `tenant_id`, `subscription_id`

### GCP
- **Service Account**: `service_account_json` (full JSON key file)

### AliCloud
- **Access Key**: `access_key_id`, `access_key_secret`

### OCI
- **User Principal**: `user_ocid`, `tenancy_ocid`, `fingerprint`, `private_key`, `region`

### IBM
- **API Key**: `api_key`

---

## 🎨 UI Integration Recommendations

### 1. Onboarding Flow

```
1. Select Provider (AWS, Azure, GCP, etc.)
   ↓
2. Get available methods: GET /api/v1/onboarding/{provider}/methods
   ↓
3. User selects method (IAM Role or Access Key)
   ↓
4. Initialize: POST /api/v1/onboarding/{provider}/init
   ↓
5a. If IAM Role:
    - Show CloudFormation template download
    - User deploys in AWS
    - User pastes CloudFormation JSON output
    - Validate: POST /api/v1/onboarding/aws/validate-json
   
5b. If Access Key:
    - Show form for Access Key ID and Secret Key
    - Validate: POST /api/v1/onboarding/{provider}/validate
   ↓
6. Show success message with account details
```

### 2. Account Management

```javascript
// List all accounts
const accounts = await fetch(
  `${API_BASE_URL}/api/v1/onboarding/accounts?tenant_id=${tenantId}`
).then(res => res.json());

// Display in table/cards
accounts.accounts.forEach(account => {
  // Show: account_name, provider_type, status, account_number
});

// Click to view details
const details = await fetch(
  `${API_BASE_URL}/api/v1/onboarding/accounts/${accountId}`
).then(res => res.json());
```

### 3. Schedule Management

```javascript
// Create schedule form
const scheduleData = {
  tenant_id: tenantId,
  account_id: selectedAccountId,
  name: formData.name,
  schedule_type: formData.type, // 'cron' or 'interval'
  cron_expression: formData.cronExpression, // if type is 'cron'
  interval_seconds: formData.intervalSeconds, // if type is 'interval'
  timezone: formData.timezone || 'UTC'
};

// Create
const schedule = await fetch(`${API_BASE_URL}/api/v1/schedules`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(scheduleData)
}).then(res => res.json());

// List schedules
const schedules = await fetch(
  `${API_BASE_URL}/api/v1/schedules?tenant_id=${tenantId}`
).then(res => res.json());

// Show schedule list with: name, next_run_at, status, enabled
```

---

## 🧪 Testing

### Test Health Endpoint
```bash
curl http://a2d474d5fbb694ac5a295b05ba4ee566-8ce5ff8e72034235.elb.ap-south-1.amazonaws.com/api/v1/health
```

### Test from Browser Console
```javascript
// Test API connectivity
fetch('http://a2d474d5fbb694ac5a295b05ba4ee566-8ce5ff8e72034235.elb.ap-south-1.amazonaws.com/api/v1/health')
  .then(res => res.json())
  .then(data => console.log('API Status:', data));
```

### Test Onboarding Flow
```javascript
// Complete test flow
async function testOnboarding() {
  // 1. Get methods
  const methods = await fetch(`${API_BASE_URL}/api/v1/onboarding/aws/methods`).then(r => r.json());
  console.log('Methods:', methods);
  
  // 2. Init
  const init = await fetch(`${API_BASE_URL}/api/v1/onboarding/aws/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenant_id: 'test-tenant',
      account_name: 'Test Account'
    })
  }).then(r => r.json());
  console.log('Init:', init);
  
  // 3. Get CloudFormation template
  const cf = await fetch(
    `${API_BASE_URL}/api/v1/onboarding/aws/cloudformation-template?external_id=${init.external_id}`
  ).then(r => r.json());
  console.log('CloudFormation:', cf);
}
```

---

## ⚠️ Error Handling

### Common Errors

**400 Bad Request:**
```json
{
  "detail": {
    "message": "Missing required fields: tenant_id, account_name",
    "errors": []
  }
}
```

**404 Not Found:**
```json
{
  "detail": "Account {account_id} not found"
}
```

**Validation Error:**
```json
{
  "detail": {
    "message": "Validation failed",
    "errors": [
      "Invalid role ARN format",
      "External ID mismatch"
    ]
  }
}
```

### Error Handling Example

```javascript
async function apiCall(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      // Handle API errors
      if (response.status === 400) {
        console.error('Validation Error:', data.detail);
        // Show validation errors to user
        if (data.detail.errors) {
          data.detail.errors.forEach(error => {
            // Display error in UI
          });
        }
      } else if (response.status === 404) {
        console.error('Not Found:', data.detail);
        // Show "Resource not found" message
      } else {
        console.error('API Error:', data);
        // Show generic error message
      }
      throw new Error(data.detail?.message || 'API Error');
    }
    
    return data;
  } catch (error) {
    console.error('Network Error:', error);
    // Show network error message
    throw error;
  }
}
```

---

## 📊 Status Values

### Account Status
- `pending` - Account created but not validated
- `active` - Account validated and ready
- `error` - Validation failed or credentials invalid

### Onboarding Status
- `pending` - Onboarding in progress
- `completed` - Onboarding successful
- `failed` - Onboarding failed

### Schedule Status
- `active` - Schedule is active and running
- `paused` - Schedule is paused
- `error` - Schedule has errors

### Execution Status
- `running` - Scan in progress
- `completed` - Scan completed successfully
- `failed` - Scan failed

---

## 🔗 Additional Resources

### API Documentation
- **Swagger UI:** http://a2d474d5fbb694ac5a295b05ba4ee566-8ce5ff8e72034235.elb.ap-south-1.amazonaws.com/docs
- **ReDoc:** http://a2d474d5fbb694ac5a295b05ba4ee566-8ce5ff8e72034235.elb.ap-south-1.amazonaws.com/redoc
- **OpenAPI JSON:** http://a2d474d5fbb694ac5a295b05ba4ee566-8ce5ff8e72034235.elb.ap-south-1.amazonaws.com/openapi.json

### Support
- **API Base URL:** http://a2d474d5fbb694ac5a295b05ba4ee566-8ce5ff8e72034235.elb.ap-south-1.amazonaws.com
- **Health Check:** http://a2d474d5fbb694ac5a295b05ba4ee566-8ce5ff8e72034235.elb.ap-south-1.amazonaws.com/api/v1/health

---

## 📝 Notes

1. **CORS:** Currently configured to allow all origins. For production, update CORS settings.
2. **Authentication:** No authentication required currently. Consider adding API keys or OAuth for production.
3. **HTTPS:** Currently HTTP only. Consider setting up HTTPS/TLS for production.
4. **Rate Limiting:** Not implemented. Consider adding rate limiting for production.
5. **Pagination:** Some list endpoints support pagination via `limit` and `offset` parameters.

---

## 🚀 Quick Integration Template

```javascript
// API Client Class
class OnboardingAPI {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }
  
  async health() {
    const res = await fetch(`${this.baseURL}/api/v1/health`);
    return res.json();
  }
  
  async getMethods(provider) {
    const res = await fetch(`${this.baseURL}/api/v1/onboarding/${provider}/methods`);
    return res.json();
  }
  
  async initOnboarding(provider, tenantId, accountName, authMethod = 'iam_role') {
    const res = await fetch(`${this.baseURL}/api/v1/onboarding/${provider}/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: tenantId, account_name: accountName, auth_method: authMethod })
    });
    return res.json();
  }
  
  async validateAccount(provider, accountId, authMethod, credentials) {
    const res = await fetch(`${this.baseURL}/api/v1/onboarding/${provider}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: accountId, auth_method: authMethod, credentials })
    });
    return res.json();
  }
  
  async listAccounts(tenantId, providerType = null) {
    const url = `${this.baseURL}/api/v1/onboarding/accounts?tenant_id=${tenantId}`;
    const finalUrl = providerType ? `${url}&provider_type=${providerType}` : url;
    const res = await fetch(finalUrl);
    return res.json();
  }
  
  async createSchedule(scheduleData) {
    const res = await fetch(`${this.baseURL}/api/v1/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scheduleData)
    });
    return res.json();
  }
  
  async listSchedules(tenantId, accountId = null) {
    const url = `${this.baseURL}/api/v1/schedules?tenant_id=${tenantId}`;
    const finalUrl = accountId ? `${url}&account_id=${accountId}` : url;
    const res = await fetch(finalUrl);
    return res.json();
  }
}

// Usage
const api = new OnboardingAPI('http://a2d474d5fbb694ac5a295b05ba4ee566-8ce5ff8e72034235.elb.ap-south-1.amazonaws.com');

// Check health
const health = await api.health();

// Get AWS methods
const methods = await api.getMethods('aws');

// Initialize onboarding
const init = await api.initOnboarding('aws', 'tenant-123', 'My Account');
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-03  
**API Version:** 1.0.0

