from backend.app.db.sessin import get_conn
from ..db.base import fetchall_dict
from backend.app.Schemas.candidates import SearchReq, Candidate
from typing import List

class CandidateService:
    def search(self, req: SearchReq) -> List[Candidate]:
        conn = get_conn(); cur = conn.cursor()
        cur.execute("""
            EXEC dbo.sp_search_candidates
              @Q=?, @Gender=?, @AgeMin=?, @AgeMax=?,
              @DistanceKm=?, @MyLat=?, @MyLng=?,
              @Element=?, @CungPhi=?, @Job=?,
              @FinanceMin=?, @FinanceMax=?,
              @Limit=?, @Offset=?;
        """, (req.q, req.gender, req.ageMin, req.ageMax,
              req.distanceKm, req.myLat, req.myLng,
              req.element, req.cungPhi, req.job,
              req.financeMin, req.financeMax,
              req.limit, req.offset))
        rows = fetchall_dict(cur); cur.close(); conn.close()
        return [Candidate(**{
            "id": str(r.get("id") or r.get("UserId") or r.get("ID")),
            "fullName": r.get("fullName") or r.get("FullName"),
            "avatarUrl": r.get("avatarUrl") or r.get("AvatarUrl"),
            "age": r.get("age") or r.get("Age"),
            "gender": r.get("gender") or r.get("Gender"),
            "occupation": r.get("occupation") or r.get("Occupation"),
            "finance": r.get("finance") or r.get("FinanceMonthly"),
            "element": r.get("element") or r.get("ElementName"),
            "cungPhi": r.get("cungPhi") or r.get("CungPhiName"),
            "distanceKm": r.get("distanceKm") or r.get("DistanceKm"),
        }) for r in rows]
