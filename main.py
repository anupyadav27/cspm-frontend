"""
Main FastAPI application for onboarding service
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from onboarding.api import onboarding_router, credentials_router, schedules_router, health_router
from onboarding.config import settings
from onboarding.database.dynamodb_tables import create_tables

# Create FastAPI app
app = FastAPI(
    title="Threat Engine Onboarding API",
    description="API for account onboarding, credential management, and scheduling",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router)
app.include_router(onboarding_router)
app.include_router(credentials_router)
app.include_router(schedules_router)


@app.on_event("startup")
async def startup_event():
    """Initialize DynamoDB tables on startup"""
    try:
        create_tables()
        print("DynamoDB tables initialized successfully")
    except Exception as e:
        print(f"DynamoDB initialization error: {e}")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Threat Engine Onboarding API",
        "version": "1.0.0",
        "status": "running"
    }


if __name__ == "__main__":
    uvicorn.run(
        "onboarding.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True
    )

