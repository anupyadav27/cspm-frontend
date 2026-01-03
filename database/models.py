"""
SQLAlchemy ORM models for onboarding database
"""
from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, TIMESTAMP, ARRAY, JSON
from sqlalchemy.dialects.postgresql import UUID, BYTEA
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from onboarding.database.connection import engine
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class TimestampMixin:
    """Mixin for created_at and updated_at timestamps"""
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)


class Tenant(Base, TimestampMixin):
    """Tenant model for multi-tenant support"""
    __tablename__ = 'tenants'
    
    tenant_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_name = Column(String(255), nullable=False, unique=True)
    description = Column(Text)
    status = Column(String(50), default='active', nullable=False)
    
    # Relationships
    providers = relationship("Provider", back_populates="tenant", cascade="all, delete-orphan")
    accounts = relationship("Account", back_populates="tenant", cascade="all, delete-orphan")
    schedules = relationship("Schedule", back_populates="tenant", cascade="all, delete-orphan")


class Provider(Base, TimestampMixin):
    """CSP Provider model"""
    __tablename__ = 'providers'
    
    provider_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.tenant_id', ondelete='CASCADE'), nullable=False)
    provider_type = Column(String(50), nullable=False)  # 'aws', 'azure', 'gcp', etc.
    status = Column(String(50), default='active', nullable=False)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="providers")
    accounts = relationship("Account", back_populates="provider", cascade="all, delete-orphan")


class Account(Base, TimestampMixin):
    """Cloud account/subscription model"""
    __tablename__ = 'accounts'
    
    account_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), ForeignKey('providers.provider_id', ondelete='CASCADE'), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.tenant_id', ondelete='CASCADE'), nullable=False)
    account_name = Column(String(255), nullable=False)
    account_number = Column(String(255))  # AWS Account ID, Azure Subscription ID, etc.
    status = Column(String(50), default='pending', nullable=False)
    onboarding_status = Column(String(50), default='pending', nullable=False)
    onboarding_id = Column(UUID(as_uuid=True))
    last_validated_at = Column(TIMESTAMP)
    
    # Relationships
    provider = relationship("Provider", back_populates="accounts")
    tenant = relationship("Tenant", back_populates="accounts")
    credentials = relationship("AccountCredential", back_populates="account", cascade="all, delete-orphan")
    schedules = relationship("Schedule", back_populates="account", cascade="all, delete-orphan")
    executions = relationship("ScheduleExecution", back_populates="account")
    scan_results = relationship("ScanResult", back_populates="account")


class AccountCredential(Base, TimestampMixin):
    """Encrypted account credentials"""
    __tablename__ = 'account_credentials'
    
    credential_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id = Column(UUID(as_uuid=True), ForeignKey('accounts.account_id', ondelete='CASCADE'), nullable=False)
    credential_type = Column(String(50), nullable=False)
    encrypted_data = Column(BYTEA, nullable=False)
    encryption_key_id = Column(String(255))
    expires_at = Column(TIMESTAMP)
    last_used_at = Column(TIMESTAMP)
    
    # Relationships
    account = relationship("Account", back_populates="credentials")


class Schedule(Base, TimestampMixin):
    """Scan schedule model"""
    __tablename__ = 'schedules'
    
    schedule_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey('tenants.tenant_id', ondelete='CASCADE'), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey('accounts.account_id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Schedule configuration
    schedule_type = Column(String(50), nullable=False)  # 'cron', 'interval', 'one_time'
    cron_expression = Column(String(255))
    interval_seconds = Column(Integer)
    timezone = Column(String(50), default='UTC', nullable=False)
    
    # Scan configuration
    provider_type = Column(String(50), nullable=False)
    regions = Column(ARRAY(String))
    services = Column(ARRAY(String))
    exclude_services = Column(ARRAY(String))
    
    # Status
    status = Column(String(50), default='active', nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    last_run_at = Column(TIMESTAMP)
    next_run_at = Column(TIMESTAMP)
    run_count = Column(Integer, default=0, nullable=False)
    success_count = Column(Integer, default=0, nullable=False)
    failure_count = Column(Integer, default=0, nullable=False)
    
    # Notifications
    notify_on_success = Column(Boolean, default=False, nullable=False)
    notify_on_failure = Column(Boolean, default=True, nullable=False)
    notification_channels = Column(JSON)
    
    created_by = Column(UUID(as_uuid=True))
    
    # Relationships
    tenant = relationship("Tenant", back_populates="schedules")
    account = relationship("Account", back_populates="schedules")
    executions = relationship("ScheduleExecution", back_populates="schedule", cascade="all, delete-orphan")


class ScheduleExecution(Base):
    """Schedule execution history"""
    __tablename__ = 'schedule_executions'
    
    execution_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    schedule_id = Column(UUID(as_uuid=True), ForeignKey('schedules.schedule_id', ondelete='CASCADE'), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey('accounts.account_id', ondelete='CASCADE'), nullable=False)
    
    # Execution details
    started_at = Column(TIMESTAMP, nullable=False)
    completed_at = Column(TIMESTAMP)
    status = Column(String(50), nullable=False)  # 'running', 'completed', 'failed', 'cancelled'
    
    # Results
    scan_id = Column(String(255))
    total_checks = Column(Integer)
    passed_checks = Column(Integer)
    failed_checks = Column(Integer)
    error_message = Column(Text)
    
    # Metadata
    triggered_by = Column(String(50))  # 'scheduler', 'manual', 'api'
    execution_time_seconds = Column(Integer)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    
    # Relationships
    schedule = relationship("Schedule", back_populates="executions")
    account = relationship("Account", back_populates="executions")


class ScanResult(Base):
    """Scan result metadata"""
    __tablename__ = 'scan_results'
    
    scan_id = Column(String(255), primary_key=True)
    account_id = Column(UUID(as_uuid=True), ForeignKey('accounts.account_id', ondelete='CASCADE'), nullable=False)
    provider_type = Column(String(50), nullable=False)
    scan_type = Column(String(50))  # 'scheduled', 'manual', 'on_demand'
    started_at = Column(TIMESTAMP, nullable=False)
    completed_at = Column(TIMESTAMP)
    status = Column(String(50), nullable=False)
    total_checks = Column(Integer)
    passed_checks = Column(Integer)
    failed_checks = Column(Integer)
    error_checks = Column(Integer)
    result_storage_path = Column(Text)
    metadata = Column(JSON)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    
    # Relationships
    account = relationship("Account", back_populates="scan_results")

