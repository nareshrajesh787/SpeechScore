from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging
from contextlib import asynccontextmanager

from routers.analyze import router as analyze_router
from routers.coach import router as coach_router

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup validation
    required_vars = ["GEMINI_API_KEY", "ASSEMBLYAI_API_KEY"]
    missing = [v for v in required_vars if not os.getenv(v)]
    if missing:
        logger.critical(f"Missing required environment variables: {', '.join(missing)}")
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")
    
    logger.info("Environment variables verified.")
    yield

app = FastAPI(
    title="SpeechScore API",
    description="AI-powered speech analysis API",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration - supports both development and production
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
# Split by comma and strip whitespace from each origin
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]
# Log allowed origins for debugging (remove in production if sensitive)
print(f"CORS Allowed Origins: {allowed_origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analyze_router)
app.include_router(coach_router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "SpeechScore API",
        "status": "running",
        "version": "2.0.0",
        "endpoints": {
            "health": "/api/health",
            "analyze": "/api/analyze"
        }
    }

# Health check endpoint
@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "SpeechScore API"}
