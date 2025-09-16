from pydantic import BaseModel
from typing import Optional, List

class SwipeReq(BaseModel):
    fromUserId: str
    toUserId: str
    direction: int  # 1 like, -1 skip

class SwipeResp(BaseModel):
    ok: bool
    matchId: Optional[str] = None

class MatchItem(BaseModel):
    id: str
    userA: str
    userB: str
    matchedAt: Optional[str] = None

class MsgItem(BaseModel):
    id: str
    fromUserId: str
    body: str
    createdAt: str

class SendMsgReq(BaseModel):
    matchId: str
    fromUserId: str
    body: str
