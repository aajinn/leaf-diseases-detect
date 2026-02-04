import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.auth.routes import router as auth_router
from src.database.connection import MongoDB
from src.image_utils import convert_image_to_base64_and_test
from src.routes.admin import router as admin_router
from src.routes.disease_detection import router as detection_router
from src.routes.enterprise_api import router as enterprise_router
from src.routes.feedback_routes import router as feedback_router
from src.routes.notification_routes import router as notification_router
from src.routes.prescription_routes import router as prescription_router
from src.routes.programmatic_api import router as programmatic_router
from src.routes.subscription_routes import router as subscription_router
from src.routes.system_status import router as system_status_router

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
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware
from src.middleware.rate_limiting import RateLimitMiddleware
app.add_middleware(RateLimitMiddleware)

import os

from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

# Mount static files for CSS, JS, images
if os.path.exists("frontend"):
    # Serve static assets (js, css, images)
    app.mount("/js", StaticFiles(directory="frontend/js"), name="js")
    app.mount("/css", StaticFiles(directory="frontend/css"), name="css")
    
    # Serve favicon
    @app.get("/favicon.ico", response_class=FileResponse)
    async def serve_favicon():
        return FileResponse("frontend/leaf-16.ico")
    
    @app.get("/leaf-16.ico", response_class=FileResponse)
    async def serve_leaf_favicon():
        return FileResponse("frontend/leaf-16.ico")

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

    @app.get("/prescriptions", response_class=FileResponse)
    async def serve_prescriptions():
        """Serve the prescriptions page"""
        return FileResponse("frontend/prescriptions.html")
    
    @app.get("/subscription", response_class=FileResponse)
    async def serve_subscription():
        """Serve the subscription page"""
        return FileResponse("frontend/subscription.html")
    
    @app.get("/enterprise-dashboard", response_class=FileResponse)
    async def serve_enterprise_dashboard():
        """Serve the enterprise dashboard page"""
        return FileResponse("frontend/enterprise-dashboard.html")
    
    @app.get("/about", response_class=FileResponse)
    async def serve_about():
        return FileResponse("frontend/about.html")
    @app.get("/faq", response_class=FileResponse)
    async def serve_faq():
        return FileResponse("frontend/faq.html")


# Include routers
app.include_router(auth_router)
app.include_router(detection_router)
app.include_router(admin_router)
app.include_router(feedback_router)
app.include_router(notification_router)
app.include_router(prescription_router)
app.include_router(subscription_router)
app.include_router(enterprise_router)
app.include_router(programmatic_router)
app.include_router(system_status_router)


@app.post("/disease-detection-file")
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


@app.get("/images/{username}/{filename}")
async def serve_image(username: str, filename: str):
    """Serve analysis images"""
    import os
    from fastapi import HTTPException
    
    image_path = f"storage/uploads/{username}/{filename}"
    logger.info(f"Looking for image at: {image_path}")
    
    if os.path.exists(image_path):
        return FileResponse(image_path)
    else:
        logger.warning(f"Image not found: {image_path}")
        # Return a placeholder image or 404
        raise HTTPException(status_code=404, detail=f"Image not found: {filename}")


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
            "Analysis history tracking",
        ],
        "endpoints": {
            "public": {"disease_detection_file": "/disease-detection-file (POST, no auth)"},
            "auth": {
                "register": "/auth/register (POST)",
                "login": "/auth/login (POST)",
                "profile": "/auth/me (GET, requires auth)",
            },
            "protected": {
                "disease_detection": "/api/disease-detection (POST, requires auth)",
                "my_analyses": "/api/my-analyses (GET, requires auth)",
                "analysis_detail": "/api/analyses/{id} (GET, requires auth)",
            },
            "enterprise": {
                "status": "/api/enterprise/status (GET, enterprise only)",
                "bulk_analysis": "/api/enterprise/bulk-analysis (POST, enterprise only)",
                "analytics": "/api/enterprise/analytics (GET, enterprise only)",
                "api_keys": "/api/enterprise/api-keys (GET/POST/DELETE, enterprise only)",
                "export_csv": "/api/enterprise/export/csv (GET, enterprise only)",
                "dashboard": "/enterprise-dashboard (GET, web interface)",
            },
            "programmatic": {
                "health": "/api/v1/health (GET, API key required)",
                "analyze": "/api/v1/analyze (POST, API key required)",
                "analyze_base64": "/api/v1/analyze-base64 (POST, API key required)",
                "batch_analyze": "/api/v1/batch-analyze (POST, API key required)",
                "get_analyses": "/api/v1/analyses (GET, API key required)",
            },
            "admin": {
                "list_users": "/auth/users (GET, admin only)",
                "delete_user": "/auth/users/{username} (DELETE, admin only)",
                "analytics_trends": "/admin/analytics/trends (GET, admin only)",
                "user_activity": "/admin/analytics/user-activity (GET, admin only)",
                "cost_breakdown": "/admin/analytics/cost-breakdown (GET, admin only)",
            },
        },
        "docs": "/docs",
    }
