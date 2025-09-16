CREATE OR ALTER VIEW dbo.vw_candidate_base AS
SELECT
  u.ID           AS UserId,
  p.FullName,
  p.Gender,
  p.Birthday,
  DATEDIFF(YEAR, p.Birthday, GETUTCDATE())
    - CASE WHEN DATEADD(YEAR, DATEDIFF(YEAR,p.Birthday,GETUTCDATE()), p.Birthday) > GETUTCDATE() THEN 1 ELSE 0 END AS Age,
  p.Occupation,
  NULL AS FinanceMonthly, -- neu ban chua co cot, de NULL (hoac thay = p.FinanceMonthly)
  fs.ElementID,
  re.Name      AS ElementName,   -- Kim/Moc/Thuy/Hoa/Tho
  fs.CungPhiID,
  rc.Name      AS CungPhiName,
  ph.Url       AS AvatarUrl,
  p.Latitude,
  p.Longitude
FROM dbo.[User] u
JOIN dbo.Profiles p ON p.UserID = u.ID
LEFT JOIN dbo.FengShuiProfile fs ON fs.UserID = u.ID
LEFT JOIN dbo.RefElement re ON re.ID = fs.ElementID
LEFT JOIN dbo.RefCungPhi rc ON rc.ID = fs.CungPhiID
OUTER APPLY (
  SELECT TOP 1 Url FROM dbo.Photos ph WHERE ph.UserID = u.ID ORDER BY IsPrimary DESC, SortOrder ASC
) ph;
GO
