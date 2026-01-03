-- Threat Engine Onboarding Database Schema
-- PostgreSQL 15

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants table
CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Providers table (CSP providers)
CREATE TABLE providers (
    provider_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    provider_type VARCHAR(50) NOT NULL, -- 'aws', 'azure', 'gcp', 'alicloud', 'oci', 'ibm'
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, provider_type)
);

-- Accounts table (cloud accounts/subscriptions)
CREATE TABLE accounts (
    account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES providers(provider_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(255), -- AWS Account ID, Azure Subscription ID, GCP Project ID, etc.
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'error', 'disabled'
    onboarding_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
    onboarding_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_validated_at TIMESTAMP
);

-- Account credentials table (encrypted)
CREATE TABLE account_credentials (
    credential_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    credential_type VARCHAR(50) NOT NULL, -- 'aws_access_key', 'aws_iam_role', 'azure_service_principal', etc.
    encrypted_data BYTEA NOT NULL,
    encryption_key_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP
);

-- Schedules table
CREATE TABLE schedules (
    schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Schedule configuration
    schedule_type VARCHAR(50) NOT NULL, -- 'cron', 'interval', 'one_time'
    cron_expression VARCHAR(255),
    interval_seconds INTEGER,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Scan configuration
    provider_type VARCHAR(50) NOT NULL,
    regions TEXT[],
    services TEXT[],
    exclude_services TEXT[],
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'disabled'
    enabled BOOLEAN DEFAULT true,
    
    -- Metadata
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    run_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    
    -- Notifications
    notify_on_success BOOLEAN DEFAULT false,
    notify_on_failure BOOLEAN DEFAULT true,
    notification_channels JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID
);

-- Schedule execution history
CREATE TABLE schedule_executions (
    execution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES schedules(schedule_id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    
    -- Execution details
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    status VARCHAR(50) NOT NULL, -- 'running', 'completed', 'failed', 'cancelled'
    
    -- Results
    scan_id VARCHAR(255),
    total_checks INTEGER,
    passed_checks INTEGER,
    failed_checks INTEGER,
    error_message TEXT,
    
    -- Metadata
    triggered_by VARCHAR(50), -- 'scheduler', 'manual', 'api'
    execution_time_seconds INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Scan results metadata
CREATE TABLE scan_results (
    scan_id VARCHAR(255) PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
    provider_type VARCHAR(50) NOT NULL,
    scan_type VARCHAR(50), -- 'scheduled', 'manual', 'on_demand'
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    total_checks INTEGER,
    passed_checks INTEGER,
    failed_checks INTEGER,
    error_checks INTEGER,
    result_storage_path TEXT, -- Path to result files
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_providers_tenant ON providers(tenant_id);
CREATE INDEX idx_accounts_provider ON accounts(provider_id);
CREATE INDEX idx_accounts_tenant ON accounts(tenant_id);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_credentials_account ON account_credentials(account_id);
CREATE INDEX idx_schedules_tenant ON schedules(tenant_id);
CREATE INDEX idx_schedules_account ON schedules(account_id);
CREATE INDEX idx_schedules_next_run ON schedules(next_run_at) WHERE enabled = true AND status = 'active';
CREATE INDEX idx_executions_schedule ON schedule_executions(schedule_id);
CREATE INDEX idx_executions_account ON schedule_executions(account_id);
CREATE INDEX idx_executions_started ON schedule_executions(started_at);
CREATE INDEX idx_scan_results_account ON scan_results(account_id);
CREATE INDEX idx_scan_results_status ON scan_results(status);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credentials_updated_at BEFORE UPDATE ON account_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

