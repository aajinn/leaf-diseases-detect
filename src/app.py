from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager

from src.image_utils import convert_image_to_base64_and_test
from src.database.connection import MongoDB
from src.auth.routes import router as auth_router
from src.routes.disease_detection import router as detection_router
from src.routes.admin import router as admin_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting up application...")
    await MongoDB.connect_db()
    yield
    # Shutdown
    logger.info("Shutting down application...")
    await MongoDB.close_db()


app = FastAPI(
    title="Leaf Disease Detection API",
    version="2.0.0",
    description="AI-powered leaf disease detection with authentication",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (frontend)
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Mount static files for CSS, JS, images
if os.path.exists("frontend"):
    # Serve static assets (js, css, images)
    app.mount("/js", StaticFiles(directory="frontend/js"), name="js")
    app.mount("/css", StaticFiles(directory="frontend/css"), name="css")
    
    # Serve HTML pages at root
    @app.get("/", response_class=FileResponse)
    async def serve_index():
        """Serve the landing page"""
        return FileResponse("frontend/index.html")
    
    @app.get("/register", response_class=FileResponse)
    async def serve_register():
        """Serve the registration page"""
        return FileResponse("frontend/register.html")
    
    @app.get("/login", response_class=FileResponse)
    async def serve_login():
        """Serve the login page"""
        return FileResponse("frontend/login.html")
    
    @app.get("/dashboard", response_class=FileResponse)
    async def serve_dashboard():
        """Serve the dashboard page"""
        return FileResponse("frontend/dashboard.html")
    
    @app.get("/history", response_class=FileResponse)
    async def serve_history():
        """Serve the history page"""
        return FileResponse("frontend/history.html")
    
    @app.get("/admin", response_class=FileResponse)
    async def serve_admin():
        """Serve the admin panel page"""
        return FileResponse("frontend/admin.html")
    
    @app.get("/live-detection", response_class=FileResponse)
    async def serve_live_detection():
        """Serve the live detection page"""
        return FileResponse("frontend/live-detection.html")
    
    @app.get("/diseases", response_class=FileResponse)
    async def serve_diseases():
        """Serve the diseases database page"""
        return FileResponse("frontend/diseases.html")

# Include routers
app.include_router(auth_router)
app.include_router(detection_router)
app.include_router(admin_router)


@app.post('/disease-detection-file')
async def disease_detection_file(file: UploadFile = File(...)):
    """
    Public endpoint for disease detection (no authentication required)
    For backward compatibility with existing clients
    """
    try:
        logger.info("Received image file for disease detection (public endpoint)")
        
        # Read uploaded file into memory
        contents = await file.read()
        
        # Process file directly from memory
        result = convert_image_to_base64_and_test(contents)
        
        if result is None:
            raise HTTPException(status_code=500, detail="Failed to process image file")
        logger.info("Disease detection from file completed successfully")
        return JSONResponse(content=result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in disease detection (file): {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api")
async def api_info():
    """API information endpoint"""
    return {
        "message": "Leaf Disease Detection API",
        "version": "2.0.0",
        "features": [
            "User authentication and authorization",
            "Admin user management",
            "Local image storage",
            "Analysis history tracking"
        ],
        "endpoints": {
            "public": {
                "disease_detection_file": "/disease-detection-file (POST, no auth)"
            },
            "auth": {
                "register": "/auth/register (POST)",
                "login": "/auth/login (POST)",
                "profile": "/auth/me (GET, requires auth)"
            },
            "protected": {
                "disease_detection": "/api/disease-detection (POST, requires auth)",
                "my_analyses": "/api/my-analyses (GET, requires auth)",
                "analysis_detail": "/api/analyses/{id} (GET, requires auth)"
            },
            "admin": {
                "list_users": "/auth/users (GET, admin only)",
                "delete_user": "/auth/users/{username} (DELETE, admin only)"
            }
        },
        "docs": "/docs"
    }

