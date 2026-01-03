"""
Scheduler service entry point
"""
import asyncio
import os

from onboarding.scheduler.scheduler_service import SchedulerService
from onboarding.config import settings


def main():
    """Main entry point for scheduler service"""
    # Create scheduler (no database connection needed - uses DynamoDB)
    scheduler = SchedulerService()
    
    try:
        # Run scheduler
        asyncio.run(scheduler.start())
    except KeyboardInterrupt:
        print("Shutting down scheduler...")
        scheduler.stop()


if __name__ == "__main__":
    main()

