"""
Main scheduler service
"""
import asyncio
from datetime import datetime
from typing import List, Dict, Any

from onboarding.database.dynamodb_operations import (
    get_due_schedules, get_schedule, update_schedule,
    create_execution, update_execution
)
from onboarding.scheduler.task_executor import TaskExecutor
from onboarding.utils.helpers import calculate_next_run_time
from onboarding.config import settings


class SchedulerService:
    """Main scheduler service that manages and executes scheduled scans"""
    
    def __init__(self):
        self.executor = TaskExecutor()
        self.running = False
    
    async def start(self):
        """Start the scheduler service"""
        self.running = True
        print("Scheduler service started")
        
        while self.running:
            try:
                # Get all active schedules due to run
                active_schedules = self.get_active_schedules()
                
                # Execute each schedule
                for schedule_obj in active_schedules:
                    if self.should_run(schedule_obj):
                        await self.execute_schedule(schedule_obj)
                
                # Sleep before next check
                await asyncio.sleep(settings.scheduler_interval_seconds)
                
            except Exception as e:
                print(f"Scheduler error: {e}")
                await asyncio.sleep(settings.scheduler_interval_seconds)
    
    def get_active_schedules(self) -> List[Dict[str, Any]]:
        """Get all active schedules that should be checked"""
        return get_due_schedules()
    
    def should_run(self, schedule_obj: Dict[str, Any]) -> bool:
        """Check if a schedule should run now"""
        if schedule_obj.get('enabled') != 'true' or schedule_obj.get('status') != 'active':
            return False
        
        next_run_at = schedule_obj.get('next_run_at')
        if not next_run_at:
            return False
        
        now = datetime.utcnow().isoformat()
        return next_run_at <= now
    
    async def execute_schedule(self, schedule_obj: Dict[str, Any]):
        """Execute a scheduled scan"""
        schedule_id = schedule_obj['schedule_id']
        account_id = schedule_obj['account_id']
        
        # Create execution record
        execution = create_execution(
            schedule_id=schedule_id,
            account_id=account_id,
            triggered_by='scheduler'
        )
        execution_id = execution['execution_id']
        started_at = datetime.fromisoformat(execution['started_at'].replace('Z', '+00:00'))
        
        try:
            # Execute the scan
            result = await self.executor.execute_scan(
                account_id=account_id,
                provider_type=schedule_obj['provider_type'],
                regions=schedule_obj.get('regions', []),
                services=schedule_obj.get('services', []),
                exclude_services=schedule_obj.get('exclude_services', [])
            )
            
            # Calculate execution time
            completed_at = datetime.utcnow()
            execution_time = int((completed_at - started_at.replace(tzinfo=None)).total_seconds())
            
            # Update execution
            update_execution(
                execution_id=execution_id,
                status='completed',
                scan_id=result.get('scan_id'),
                total_checks=result.get('total_checks', 0),
                passed_checks=result.get('passed_checks', 0),
                failed_checks=result.get('failed_checks', 0)
            )
            
            # Update schedule stats
            next_run = calculate_next_run_time(
                schedule_obj['schedule_type'],
                schedule_obj.get('cron_expression'),
                schedule_obj.get('interval_seconds', 0),
                schedule_obj.get('timezone', 'UTC')
            )
            
            update_schedule(schedule_id, {
                'last_run_at': started_at.isoformat(),
                'run_count': schedule_obj.get('run_count', 0) + 1,
                'success_count': schedule_obj.get('success_count', 0) + 1,
                'next_run_at': next_run.isoformat() if next_run else None
            })
            
        except Exception as e:
            completed_at = datetime.utcnow()
            execution_time = int((completed_at - started_at.replace(tzinfo=None)).total_seconds())
            
            # Update execution with error
            update_execution(
                execution_id=execution_id,
                status='failed',
                error_message=str(e)
            )
            
            # Update schedule stats
            next_run = calculate_next_run_time(
                schedule_obj['schedule_type'],
                schedule_obj.get('cron_expression'),
                schedule_obj.get('interval_seconds', 0),
                schedule_obj.get('timezone', 'UTC')
            )
            
            update_schedule(schedule_id, {
                'failure_count': schedule_obj.get('failure_count', 0) + 1,
                'next_run_at': next_run.isoformat() if next_run else None
            })
    
    def stop(self):
        """Stop the scheduler service"""
        self.running = False
        print("Scheduler service stopped")

