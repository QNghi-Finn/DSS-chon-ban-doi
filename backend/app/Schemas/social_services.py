from backend.app.db.sessin import get_conn
from backend.app.db.base import fetchall_dict
from backend.app.Schemas.social import SwipeReq, SwipeResp, MatchItem, MsgItem, SendMsgReq
from typing import List

class SocialService:
    def swipe(self, req: SwipeReq) -> SwipeResp:
        conn = get_conn(); cur = conn.cursor()
        cur.execute("""
          IF NOT EXISTS(SELECT 1 FROM dbo.Swipes WHERE FromUserID=? AND ToUserID=?)
            INSERT dbo.Swipes(ID,FromUserID,ToUserID,Direction)
            VALUES(NEWID(),?,?,?);
        """, (req.fromUserId, req.toUserId, req.fromUserId, req.toUserId, req.direction))

        match_id = None
        if req.direction == 1:
            cur.execute("""
              SELECT TOP 1 1 FROM dbo.Swipes WHERE FromUserID=? AND ToUserID=? AND Direction=1
            """, (req.toUserId, req.fromUserId))
            if cur.fetchone():
                cur.execute("""
                  DECLARE @mid UNIQUEIDENTIFIER;
                  IF NOT EXISTS(SELECT 1 FROM dbo.Matches WHERE (UserA=? AND UserB=?) OR (UserA=? AND UserB=?))
                  BEGIN
                    SET @mid = NEWID();
                    INSERT dbo.Matches(ID,UserA,UserB) VALUES(@mid,?,?);
                  END
                  ELSE
                    SELECT TOP 1 @mid = ID FROM dbo.Matches WHERE (UserA=? AND UserB=?) OR (UserA=? AND UserB=?);
                  SELECT @mid;
                """, (req.fromUserId, req.toUserId, req.toUserId, req.fromUserId,
                      req.fromUserId, req.toUserId,
                      req.fromUserId, req.toUserId, req.toUserId, req.fromUserId))
                r = cur.fetchone()
                match_id = str(r[0]) if r and r[0] else None

        conn.commit(); cur.close(); conn.close()
        return SwipeResp(ok=True, matchId=match_id)

    def matches(self, me: str) -> List[MatchItem]:
        conn = get_conn(); cur = conn.cursor()
        cur.execute("SELECT ID,UserA,UserB,MatchedAt FROM dbo.Matches WHERE UserA=? OR UserB=? ORDER BY MatchedAt DESC", (me, me))
        rows = fetchall_dict(cur); cur.close(); conn.close()
        return [MatchItem(id=str(r["ID"]), userA=str(r["UserA"]), userB=str(r["UserB"]),
                          matchedAt=str(r["MatchedAt"]) if r["MatchedAt"] else None) for r in rows]

    def messages(self, match_id: str) -> List[MsgItem]:
        conn = get_conn(); cur = conn.cursor()
        cur.execute("SELECT ID,FromUserID,Body,CreatedAt FROM dbo.Messages WHERE MatchID=? ORDER BY CreatedAt ASC", (match_id,))
        rows = fetchall_dict(cur); cur.close(); conn.close()
        return [MsgItem(id=str(r["ID"]), fromUserId=str(r["FromUserID"]), body=r["Body"], createdAt=str(r["CreatedAt"])) for r in rows]

    def send_message(self, req: SendMsgReq):
        conn = get_conn(); cur = conn.cursor()
        cur.execute("INSERT dbo.Messages(ID,MatchID,FromUserID,Body) VALUES(NEWID(),?,?,?)",
                    (req.matchId, req.fromUserId, req.body))
        conn.commit(); cur.close(); conn.close()
        return {"ok": True}
