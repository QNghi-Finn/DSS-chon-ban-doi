from fastapi import APIRouter
from typing import List
from backend.app.Schemas.candidates import SearchReq, Candidate
from backend.app.Services.candidate_services import CandidateService

router = APIRouter(prefix="/api/candidates", tags=["candidates"])
svc = CandidateService()

@router.post("/search", response_model=List[Candidate])
def search(req: SearchReq):
    return svc.search(req)
