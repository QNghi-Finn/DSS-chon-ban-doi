EXEC dbo.Sp_User_Signup
  @Email = 'nghi@example.com',
  @PasswordHash = 'hash123',            -- password đã hash (hoặc tạm text)
  @FullName = N'Bùi Quang Nghị',
  @Gender = 'male',
  @Birthday = '2004-03-13',
  @AvatarUrl = '/uploads/user1.jpg',    -- đường dẫn ảnh
  @HobbiesText = N'doc sach, gym, du lich',
  @HabitsText = N'khong hut thuoc, tap the duc',
  @ValuesText = N'gia dinh, trung thuc, phat trien ban than';
