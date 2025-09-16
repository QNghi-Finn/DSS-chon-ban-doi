from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import os, json, uuid, shutil

router = APIRouter(prefix="/api/mock-auth", tags=["mock-auth"])
DATA_FILE = "MOCK_DATA.json"
UPLOAD_DIR = "app/static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def load_data():
    if not os.path.exists(DATA_FILE): return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        try: return json.load(f)
        except: return []

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@router.post("/signup")
async def signup(
    email: str = Form(...),
    password: str = Form(...),
    fullName: str = Form(...),
    gender: str = Form(...),
    birthday: str = Form(...),
    avatar: UploadFile = File(None),
):
    data = load_data()
    if any(u["email"] == email for u in data):
        raise HTTPException(400, "Email da ton tai")

    avatar_url = None
    if avatar:
        ext = os.path.splitext(avatar.filename)[1].lower()
        if ext not in [".jpg",".jpeg",".png",".webp"]:
            raise HTTPException(400, "File khong hop le")
        name = f"{uuid.uuid4().hex}{ext}"
        with open(os.path.join(UPLOAD_DIR, name), "wb") as f:
            shutil.copyfileobj(avatar.file, f)
        avatar_url = f"/uploads/{name}"

    new_user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password": password,   # demo
        "fullName": fullName,
        "gender": gender,
        "birthday": birthday,
        "avatarUrl": avatar_url
    }
    data.append(new_user); save_data(data)
    return {"ok": True, "user": new_user}
