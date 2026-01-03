"""
API endpoints for onboarding
"""
from onboarding.api.onboarding import router as onboarding_router
from onboarding.api.credentials import router as credentials_router
from onboarding.api.schedules import router as schedules_router
from onboarding.api.health import router as health_router

__all__ = [
    'onboarding_router',
    'credentials_router',
    'schedules_router',
    'health_router'
]

