/* RefElement */
IF NOT EXISTS (SELECT 1 FROM dbo.RefElement)
INSERT dbo.RefElement(ElementID,Name) VALUES (1,N'Kim'),(2,N'Moc'),(3,N'Thuy'),(4,N'Hoa'),(5,N'Tho');

/* RefCan */
IF NOT EXISTS (SELECT 1 FROM dbo.RefCan)
INSERT dbo.RefCan(ID,Name,ElementTD) VALUES
(1,N'Giap',2),(2,N'At',2),(3,N'Binh',4),(4,N'Dinh',4),(5,N'Mau',5),
(6,N'Ky',5),(7,N'Canh',1),(8,N'Tan',1),(9,N'Nhan',3),(10,N'Quy',3);

/* RefChi */
IF NOT EXISTS (SELECT 1 FROM dbo.RefChi)
INSERT dbo.RefChi(ID,Name,TamHopGroup,TuXungGroup) VALUES
(1,N'Ty',1,3),(2,N'Suu',2,2),(3,N'Dan',3,1),(4,N'Mao',4,3),
(5,N'Thin',1,2),(6,N'Ty_',2,1),(7,N'Ngo',3,3),(8,N'Mui',2,2),
(9,N'Than',1,1),(10,N'Dau',2,3),(11,N'Tuat',3,2),(12,N'Hoi',4,1);

/* RefHourChi */
IF NOT EXISTS (SELECT 1 FROM dbo.RefHourChi)
INSERT dbo.RefHourChi(ID,FromHour,ToHour) VALUES
(1,23,1),(2,1,3),(3,3,5),(4,5,7),(5,7,9),(6,9,11),
(7,11,13),(8,13,15),(9,15,17),(10,17,19),(11,19,21),(12,21,23);

/* Ngũ hành quan hệ: Sinh / Khắc / Same/Neutral */
IF NOT EXISTS (SELECT 1 FROM dbo.RefElementRelation)
BEGIN
  INSERT dbo.RefElementRelation VALUES (3,2,N'Sinh'),(2,4,N'Sinh'),(4,5,N'Sinh'),(5,1,N'Sinh'),(1,3,N'Sinh');
  INSERT dbo.RefElementRelation VALUES (2,5,N'Khac'),(3,4,N'Khac'),(1,2,N'Khac'),(4,1,N'Khac'),(5,3,N'Khac');
  INSERT dbo.RefElementRelation
  SELECT a.ElementID,b.ElementID, CASE WHEN a.Name=b.Name THEN N'Same' ELSE N'Neutral' END
  FROM dbo.RefElement a CROSS JOIN dbo.RefElement b
  WHERE NOT EXISTS(SELECT 1 FROM dbo.RefElementRelation r WHERE r.FromElementID=a.ElementID AND r.ToElementID=b.ElementID);
END

/* Thiên can: lục hợp / lục xung */
IF NOT EXISTS (SELECT 1 FROM dbo.RefCanRelation)
BEGIN
  INSERT dbo.RefCanRelation VALUES (1,6,N'LucHop'),(2,7,N'LucHop'),(3,8,N'LucHop'),(4,9,N'LucHop'),(5,10,N'LucHop');
  INSERT dbo.RefCanRelation VALUES (1,5,N'LucXung'),(2,6,N'LucXung'),(3,7,N'LucXung'),(4,8,N'LucXung'),(5,9,N'LucXung'),(6,10,N'LucXung');
END

/* Địa chi: tam hợp / lục hợp / lục hại / tứ xung */
IF NOT EXISTS (SELECT 1 FROM dbo.RefChiRelation)
BEGIN
  -- tam hop
  INSERT dbo.RefChiRelation VALUES (1,9,N'TamHop'),(1,5,N'TamHop'),(9,5,N'TamHop');
  INSERT dbo.RefChiRelation VALUES (6,10,N'TamHop'),(6,2,N'TamHop'),(10,2,N'TamHop');
  INSERT dbo.RefChiRelation VALUES (3,7,N'TamHop'),(3,11,N'TamHop'),(7,11,N'TamHop');
  INSERT dbo.RefChiRelation VALUES (12,4,N'TamHop'),(12,8,N'TamHop'),(4,8,N'TamHop');
  -- luc hop
  INSERT dbo.RefChiRelation VALUES (1,2,N'LucHop'),(3,12,N'LucHop'),(4,11,N'LucHop'),(5,10,N'LucHop'),(6,9,N'LucHop'),(7,8,N'LucHop');
  -- luc hai
  INSERT dbo.RefChiRelation VALUES (1,8,N'LucHai'),(2,7,N'LucHai'),(3,6,N'LucHai'),(4,5,N'LucHai'),(9,12,N'LucHai'),(10,11,N'LucHai');
  -- tu xung
  INSERT dbo.RefChiRelation VALUES (3,9,N'TuXung'),(3,6,N'TuXung'),(9,12,N'TuXung'),(6,12,N'TuXung');
  INSERT dbo.RefChiRelation VALUES (5,11,N'TuXung'),(5,2,N'TuXung'),(11,8,N'TuXung'),(2,8,N'TuXung');
  INSERT dbo.RefChiRelation VALUES (1,7,N'TuXung'),(1,4,N'TuXung'),(7,10,N'TuXung'),(4,10,N'TuXung');
END

/* Cung phi (Type = DongTu/TayTu) */
IF NOT EXISTS (SELECT 1 FROM dbo.RefCungPhi)
INSERT dbo.RefCungPhi(ID,Name,Type) VALUES
(1,N'Can',N'TayTu'),(2,N'Khon',N'TayTu'),(3,N'Can_',N'TayTu'),(4,N'Doai',N'TayTu'),
(5,N'Kham',N'DongTu'),(6,N'Ly',N'DongTu'),(7,N'Chan',N'DongTu'),(8,N'Ton',N'DongTu');

/* Bát trạch 8x8 */
IF NOT EXISTS (SELECT 1 FROM dbo.RefBatTrach)
BEGIN
  INSERT dbo.RefBatTrach VALUES
  (1,2,N'DienNien',30),(1,3,N'ThienY',34),(1,4,N'PhucVi',24),(1,5,N'LucSat',-24),(1,6,N'NguQuy',-32),(1,7,N'HoaHai',-16),(1,8,N'TuyetMenh',-40);
  INSERT dbo.RefBatTrach VALUES
  (2,1,N'DienNien',30),(2,4,N'ThienY',34),(2,3,N'PhucVi',24),(2,5,N'NguQuy',-32),(2,6,N'LucSat',-24),(2,7,N'TuyetMenh',-40),(2,8,N'HoaHai',-16);
  INSERT dbo.RefBatTrach VALUES
  (3,1,N'ThienY',34),(3,2,N'PhucVi',24),(3,4,N'DienNien',30),(3,5,N'TuyetMenh',-40),(3,6,N'HoaHai',-16),(3,7,N'LucSat',-24),(3,8,N'NguQuy',-32);
  INSERT dbo.RefBatTrach VALUES
  (4,1,N'PhucVi',24),(4,2,N'ThienY',34),(4,3,N'DienNien',30),(4,5,N'HoaHai',-16),(4,6,N'TuyetMenh',-40),(4,7,N'NguQuy',-32),(4,8,N'LucSat',-24);
  INSERT dbo.RefBatTrach VALUES
  (5,6,N'DienNien',30),(5,7,N'ThienY',34),(5,8,N'PhucVi',24),(5,1,N'LucSat',-24),(5,2,N'NguQuy',-32),(5,3,N'TuyetMenh',-40),(5,4,N'HoaHai',-16);
  INSERT dbo.RefBatTrach VALUES
  (6,5,N'DienNien',30),(6,8,N'ThienY',34),(6,7,N'PhucVi',24),(6,1,N'NguQuy',-32),(6,2,N'LucSat',-24),(6,3,N'HoaHai',-16),(6,4,N'TuyetMenh',-40);
  INSERT dbo.RefBatTrach VALUES
  (7,8,N'DienNien',30),(7,5,N'ThienY',34),(7,6,N'PhucVi',24),(7,1,N'HoaHai',-16),(7,2,N'TuyetMenh',-40),(7,3,N'LucSat',-24),(7,4,N'NguQuy',-32);
  INSERT dbo.RefBatTrach VALUES
  (8,7,N'DienNien',30),(8,6,N'ThienY',34),(8,5,N'PhucVi',24),(8,1,N'TuyetMenh',-40),(8,2,N'HoaHai',-16),(8,3,N'NguQuy',-32),(8,4,N'LucSat',-24);
  -- self (PhucVi)
  INSERT dbo.RefBatTrach VALUES
  (1,1,N'PhucVi',24),(2,2,N'PhucVi',24),(3,3,N'PhucVi',24),(4,4,N'PhucVi',24),
  (5,5,N'PhucVi',24),(6,6,N'PhucVi',24),(7,7,N'PhucVi',24),(8,8,N'PhucVi',24);
END
GO
