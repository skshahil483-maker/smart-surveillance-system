import os
import sys
import logging

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.session import init_db
from app.api.endpoints import router as api_router
from app.websocket.manager import ws_manager


logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("surveillance.main")

app = FastAPI(
    title="Deep Learning Smart Surveillance System API",
    description="Backend API for real-time suspicious activity detection using YOLOv8, ByteTrack, and temporal sequence models.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static snapshot directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORAGE_DIR = os.path.join(BASE_DIR, "storage")
os.makedirs(os.path.join(STORAGE_DIR, "snapshots"), exist_ok=True)
os.makedirs(os.path.join(STORAGE_DIR, "events"), exist_ok=True)
os.makedirs(os.path.join(STORAGE_DIR, "crops"), exist_ok=True)

app.mount("/storage", StaticFiles(directory=STORAGE_DIR), name="storage")

# Include REST API router
app.include_router(api_router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing Smart Surveillance Database...")
    init_db()

    # Store the running event loop for thread-safe WebSocket broadcast
    import asyncio
    from app.services.camera_service import camera_manager
    camera_manager.set_event_loop(asyncio.get_event_loop())

    # Load saved settings and apply to AI pipeline
    from app.database.session import SessionLocal
    from app.models.models import SystemSetting
    db = SessionLocal()
    try:
        setting = db.query(SystemSetting).first()
        if setting:
            camera_manager.apply_settings(
                confidence_threshold=setting.confidence_threshold,
                alert_cooldown=setting.alert_cooldown,
                loitering_threshold=setting.loitering_threshold,
                weapon_detection_enabled=getattr(setting, 'weapon_detection_enabled', True),
                weapon_confidence_threshold=getattr(setting, 'weapon_confidence_threshold', 0.60),
                weapon_confirmation_frames=getattr(setting, 'weapon_confirmation_frames', 3)
            )
    finally:
        db.close()

    logger.info("Smart Surveillance Backend Server Started Successfully.")

@app.get("/")
def root():
    return {
        "system": "Deep Learning-Based Smart Surveillance System",
        "status": "Online",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.websocket("/ws/surveillance")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep-alive receive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

