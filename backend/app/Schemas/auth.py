from pydantic import BaseModel, EmailStr
from typing import Optional

class SignupReq(BaseModel):
    email: EmailStr
    password: str
    fullName: str
    gender: str
    birthday: str            # yyyy-mm-dd
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    avatarUrl: Optional[str] = None
    hobbiesText: Optional[str] = None
    habitsText: Optional[str] = None
    valuesText: Optional[str] = None

class SignupResp(BaseModel):
    userId: str

class LoginReq(BaseModel):
    email: EmailStr
    password: str

class LoginResp(BaseModel):
    userId: str
    email: EmailStr
    fullName: str | None = None
