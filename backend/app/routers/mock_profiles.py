# backend/app/routers/mock_profiles.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path
import json, uuid, shutil, threading, os

router = APIRouter(prefix="/api/mock", tags=["mock"])

# ===== Paths tuyệt đối =====
# ROOT: thư mục gốc project (nơi bạn đặt MOCK_DATA.json)
ROOT = Path(__file__).resolve().parents[2]

DATA_FILE  = ROOT / "MOCK_DATA.json"
UPLOAD_DIR = ROOT / "backend" / "app" / "static" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# lock chống ghi chồng file khi có nhiều request
_lock = threading.Lock()

def _load():
    if not DATA_FILE.exists():
        return []
    with DATA_FILE.open("r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def _save(data):
    tmp = DATA_FILE.with_suffix(".json.tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    tmp.replace(DATA_FILE)

def _next_id(items):
    return max([int(i.get("UserID", 0)) for i in items] + [0]) + 1

def _map_gender(g: str) -> str:
    s = (g or "").lower()
    if s in ("nam", "male", "m"): return "Male"
    if s in ("nu", "female", "f"): return "Female"
    return g or "Other"

@router.post("/signup")
async def signup(
    email: str = Form(...),           # có thể lưu sang file khác nếu bạn muốn
    password: str = Form(...),
    fullName: str = Form(...),
    gender: str = Form(...),
    birthday: str = Form(...),        # yyyy-mm-dd hoặc yyyy
    education: str = Form(""),
    occupation: str = Form(""),
    nativeland: str = Form("Vietnam"),
    bio: str = Form(""),
    avatar: UploadFile | None = File(None),
):
    # 1) Lấy năm sinh từ birthday
    try:
        year = int(birthday[:4])
    except Exception:
        raise HTTPException(400, "birthday must be yyyy-mm-dd or yyyy")

    # 2) Lưu ảnh
    avatar_url = "/uploads/default_1.jpg"
    if avatar:
        ext = os.path.splitext(avatar.filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            raise HTTPException(400, "invalid image type")
        name = f"{uuid.uuid4().hex}{ext}"
        with (UPLOAD_DIR / name).open("wb") as f:
            shutil.copyfileobj(avatar.file, f)
        avatar_url = f"/uploads/{name}"

    # 3) Append vào MOCK_DATA.json
    with _lock:
        data = _load()
        row = {
            "UserID": _next_id(data),
            "FullName": fullName,
            "gender": _map_gender(gender),
            "Birthday": year,                 # theo mẫu mock: năm (int)
            "Education": education,
            "Occupation": occupation,
            "Nativeland": nativeland,
            "Bio": bio,
            "Avatar": avatar_url
        }
        data.append(row)
        _save(data)

    return JSONResponse({"ok": True, "profile": row})

@router.get("/profiles")
def list_profiles():
    """Đọc toàn bộ danh sách từ MOCK_DATA.json (phục vụ FE khi cần)."""
    return _load()
