from fastapi import APIRouter
from typing import List
from backend.app.Schemas.social import SwipeReq, SwipeResp, MatchItem, MsgItem, SendMsgReq
from backend.app.Schemas.social_services import SocialService

router = APIRouter(prefix="/api", tags=["social"])
svc = SocialService()

@router.post("/swipe", response_model=SwipeResp)
def swipe(req: SwipeReq):
    return svc.swipe(req)

@router.get("/matches/{me}", response_model=List[MatchItem])
def matches(me: str):
    return svc.matches(me)

@router.get("/messages/{matchId}", response_model=List[MsgItem])
def messages(matchId: str):
    return svc.messages(matchId)

@router.post("/messages")
def send_message(req: SendMsgReq):
    return svc.send_message(req)
