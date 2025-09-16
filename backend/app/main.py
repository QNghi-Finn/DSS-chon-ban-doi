from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from  app.Core.Config import settings
from .routers.auth import router as auth_router
from .routers.candidates import router as candidates_router
from .routers.social import router as social_router
from .routers.media import router as media_router
from .routers.mock_profiles import router as mock_profiles_router, router as mock_router
from pathlib import Path
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount /uploads (ảnh mặc định & ảnh user)
ROOT = Path(__file__).resolve().parents[1]
UPLOAD_DIR = ROOT / "static" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Đăng ký router mock
app.include_router(mock_profiles_router)
app = FastAPI(title="DSS Mate Mock API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# mount uploads
os.makedirs("app/static/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="app/static/uploads"), name="uploads")

# include router
# app.include_router(auth_mock_router)  # Removed or commented out as auth_mock_router is not defined

@app.get("/")
def root():
    return {"ok": True}

# phục vụ ảnh upload
os.makedirs("app/static/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="app/static/uploads"), name="uploads")

# mount router
app.include_router(auth_router)
app.include_router(candidates_router)
app.include_router(social_router)
app.include_router(media_router)

@app.get("/")
def root():
    return {"ok": True, "app": settings.app_name}
