CREATE OR ALTER PROCEDURE dbo.sp_recommend_topN
  @Me UNIQUEIDENTIFIER, @Top INT = 30
AS
BEGIN
  SET NOCOUNT ON;
  WITH me AS (
    SELECT p.UserID, p.Gender, fs.YearChildID, fs.ElementID, fs.CungPhiID
    FROM dbo.Profiles p JOIN dbo.FengShuiProfile fs ON fs.UserID=p.UserID
    WHERE p.UserID=@Me
  ),
  cand AS (
    SELECT p.UserID, p.Gender, fs.YearChildID, fs.ElementID, fs.CungPhiID
    FROM dbo.Profiles p JOIN dbo.FengShuiProfile fs ON fs.UserID=p.UserID
    WHERE p.UserID<>@Me
  )
  SELECT TOP (@Top)
         c.UserID AS CandidateID,
         er.Relation AS ElementRelation,
         br.Result  AS BatTrach,
         br.Score   AS BtScore
  FROM me m
  JOIN cand c ON 1=1
  JOIN dbo.RefElementRelation er ON er.FromElementID=m.ElementID AND er.ToElementID=c.ElementID
  LEFT JOIN dbo.RefBatTrach br
     ON br.MaleCungID = CASE WHEN m.Gender='male' THEN m.CungPhiID ELSE c.CungPhiID END
    AND br.FemaleID   = CASE WHEN m.Gender='male' THEN c.CungPhiID ELSE m.CungPhiID END
  WHERE er.Relation IN (N'Sinh',N'Same')
  ORDER BY CASE er.Relation WHEN N'Sinh' THEN 0 ELSE 1 END, ISNULL(100-br.Score,100);
END;
GO
