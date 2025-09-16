from pydantic import BaseModel
from typing import Optional, List

class SearchReq(BaseModel):
    q: Optional[str] = None
    gender: Optional[str] = None
    ageMin: Optional[int] = None
    ageMax: Optional[int] = None
    distanceKm: Optional[int] = None
    myLat: Optional[float] = None
    myLng: Optional[float] = None
    element: Optional[str] = None
    cungPhi: Optional[str] = None
    job: Optional[str] = None
    financeMin: Optional[int] = None
    financeMax: Optional[int] = None
    limit: int = 50
    offset: int = 0

class Candidate(BaseModel):
    id: str
    fullName: Optional[str] = None
    avatarUrl: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    finance: Optional[int] = None
    element: Optional[str] = None
    cungPhi: Optional[str] = None
    distanceKm: Optional[float] = None
