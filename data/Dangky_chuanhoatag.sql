/* bỏ dấu + to_slug (không dấu, gạch nối) */
CREATE OR ALTER FUNCTION dbo.udf_vi_simplify(@s NVARCHAR(4000)) RETURNS NVARCHAR(4000) AS
BEGIN
  IF @s IS NULL RETURN NULL;
  DECLARE @r NVARCHAR(4000)=LOWER(@s);
  SET @r = REPLACE(@r,N'đ',N'd'); SET @r = REPLACE(@r,N'Đ',N'd');
  SET @r = TRANSLATE(@r,
    N'áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ',
    N'aaaaaaaaaaaaaaaaaeeeeeeeeeeiiiiiooooooooooooooouuuuuuuuuuyyyyy');
  RETURN @r;
END;
GO
CREATE OR ALTER FUNCTION dbo.udf_to_slug(@s NVARCHAR(4000)) RETURNS NVARCHAR(4000) AS
BEGIN
  DECLARE @t NVARCHAR(4000)=dbo.udf_vi_simplify(@s), @res NVARCHAR(4000)=''; IF @t IS NULL RETURN NULL;
  DECLARE @i INT=1,@len INT=LEN(@t),@ch NCHAR(1);
  WHILE @i<=@len BEGIN
    SET @ch=SUBSTRING(@t,@i,1);
    IF @ch LIKE N'[a-z0-9]' SET @res+=@ch ELSE SET @res+=N'-';
    SET @i+=1;
  END
  WHILE CHARINDEX(N'--',@res)>0 SET @res=REPLACE(@res,N'--',N'-');
  RETURN TRIM(N'-' FROM @res);
END;
GO

/* can/chi + cung phi (map theo ref) */
CREATE OR ALTER FUNCTION dbo.udf_year_to_can_id(@y INT) RETURNS TINYINT AS
BEGIN RETURN (ABS(@y-1984)%10)+1; END;
GO
CREATE OR ALTER FUNCTION dbo.udf_year_to_chi_id(@y INT) RETURNS TINYINT AS
BEGIN RETURN (ABS(@y-1984)%12)+1; END;
GO
CREATE OR ALTER FUNCTION dbo.udf_can_to_element_id(@canId TINYINT) RETURNS TINYINT AS
BEGIN DECLARE @e TINYINT; SELECT @e=ID FROM dbo.RefCan WHERE ID=@canId; RETURN @e; END;
GO
CREATE OR ALTER FUNCTION dbo.udf_calc_cungphi_id(@y INT, @gender NVARCHAR(16)) RETURNS TINYINT AS
BEGIN
  DECLARE @s INT=0,@t INT=@y; WHILE @t>0 BEGIN SET @s+=@t%10; SET @t=@t/10; END;
  WHILE @s>9 SET @s=(@s/10)+(@s%10);
  DECLARE @kua INT=CASE WHEN LOWER(@gender)='male' THEN 11-@s ELSE @s+4 END;
  IF @kua=5 SET @kua=CASE WHEN LOWER(@gender)='male' THEN 2 ELSE 8 END;
  IF @kua>9 SET @kua=@kua-9;
  RETURN CASE @kua WHEN 1 THEN 5 WHEN 2 THEN 2 WHEN 3 THEN 7 WHEN 4 THEN 8
                   WHEN 6 THEN 1 WHEN 7 THEN 4 WHEN 8 THEN 3 WHEN 9 THEN 6 ELSE 5 END;
END;
GO

/* split token theo dấu phẩy */
CREATE OR ALTER FUNCTION dbo.udf_split_to_tokens(@text NVARCHAR(2000))
RETURNS TABLE AS RETURN
  SELECT TRIM(value) token FROM STRING_SPLIT(ISNULL(@text,N''),N',') WHERE TRIM(value)<>N'';
GO

/* upsert tags + link */
CREATE OR ALTER PROCEDURE dbo.sp_upsert_tags_from_text
  @UserID UNIQUEIDENTIFIER, @Type NVARCHAR(16), @Text NVARCHAR(2000)
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @slug NVARCHAR(128), @id INT, @tk NVARCHAR(256);
  DECLARE c CURSOR LOCAL FOR SELECT token FROM dbo.udf_split_to_tokens(@Text);
  OPEN c; FETCH NEXT FROM c INTO @tk;
  WHILE @@FETCH_STATUS=0
  BEGIN
    SET @slug = dbo.udf_to_slug(@tk);
    IF NOT EXISTS(SELECT 1 FROM dbo.Tags WHERE NameSlug=@slug)
      INSERT dbo.Tags(Type,NameOriginal,NameSlug) VALUES(@Type,@tk,@slug);
    SELECT @id = ID FROM dbo.Tags WHERE NameSlug=@slug;
    IF NOT EXISTS(SELECT 1 FROM dbo.ProfileTag WHERE UserID=@UserID AND TagID=@id)
      INSERT dbo.ProfileTag(UserID,TagID) VALUES(@UserID,@id);
    FETCH NEXT FROM c INTO @tk;
  END
  CLOSE c; DEALLOCATE c;
END;
GO

/* đăng ký user theo diagram (tạo đủ record liên quan) */
CREATE OR ALTER PROCEDURE dbo.sp_user_signup
  @Email NVARCHAR(256), @PasswordHash NVARCHAR(256),
  @FullName NVARCHAR(128), @Gender NVARCHAR(16), @Birthday DATE,
  @Latitude FLOAT = NULL, @Longitude FLOAT = NULL, @AvatarUrl NVARCHAR(260) = NULL,
  @HobbiesText NVARCHAR(1000) = NULL, @HabitsText NVARCHAR(1000) = NULL, @ValuesText NVARCHAR(1000) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @UserID UNIQUEIDENTIFIER = NEWID();
  INSERT dbo.[User](ID,Email,PasswordHash) VALUES(@UserID,@Email,@PasswordHash);

  INSERT dbo.Profiles(UserID,FullName,Gender,Birthday,Education,Occupation,Bio,Zodiac,MBTI,CreatedAt,Nativeland)
  VALUES(@UserID,@FullName,@Gender,@Birthday,NULL,NULL,N'auto-create',NULL,NULL,SYSUTCDATETIME(),NULL);

  INSERT dbo.Ctiteria(UserID,LookingForGender,AgeMin,AgeMax,DistanceKm,EducationMin,HasPhotoOnly)
  VALUES(@UserID,CASE WHEN LOWER(@Gender)='male' THEN N'female' ELSE N'male' END,18,30,30,N'HighSchool',1);

  IF @AvatarUrl IS NULL SET @AvatarUrl=N'/uploads/default_1.jpg';
  INSERT dbo.Photos(UserID,Url,IsPrimary,SortOrder) VALUES(@UserID,@AvatarUrl,1,1);

  DECLARE @y INT=YEAR(@Birthday),
          @can TINYINT=dbo.udf_year_to_can_id(@Birthday),
          @chi TINYINT=dbo.udf_year_to_chi_id(@Birthday),
          @elm TINYINT=dbo.udf_can_to_element_id(@Birthday),
          @cung TINYINT=dbo.udf_calc_cungphi_id(@Birthday,@Gender),
          @group NVARCHAR(8)=(SELECT [Type] FROM dbo.RefCungPhi WHERE ID=@Birthday);

  INSERT dbo.FengShuiProfile(UserID,SolarDob,BirthHourChild,YearCanID,YearChildID,ElementID,CungPhiID,GroupMenh,Ready)
  VALUES(@UserID,@Birthday,NULL,@can,@chi,@elm,@cung,@group,1);

  INSERT dbo.ProfileFreeText(UserID,HobbiesText,HabitsText,ValuesText)
  VALUES(@UserID,@HobbiesText,@HabitsText,@ValuesText);

  EXEC dbo.sp_upsert_tags_from_text @UserID,'hobby',@HobbiesText;
  EXEC dbo.sp_upsert_tags_from_text @UserID,'thoi_quen',@HabitsText;
  EXEC dbo.sp_upsert_tags_from_text @UserID,'quan_diem',@ValuesText;

  SELECT @UserID AS NewUserID;
END;
GO
