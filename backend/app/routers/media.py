from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.app.Schemas.social_services import UploadResp
import os, uuid

router = APIRouter(prefix="/api/media", tags=["media"])

@router.post("/upload", response_model=UploadResp)
async def upload(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg",".jpeg",".png",".webp"]: raise HTTPException(400, "invalid file")
    data = await file.read()
    if len(data) > 5*1024*1024: raise HTTPException(400, "file too large")
    name = f"{uuid.uuid4().hex}{ext}"
    os.makedirs("app/static/uploads", exist_ok=True)
    with open(os.path.join("app/static/uploads", name), "wb") as f: f.write(data)
    return UploadResp(url=f"/uploads/{name}")
