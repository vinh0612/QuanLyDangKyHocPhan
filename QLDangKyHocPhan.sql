-- ============================================================
-- ĐỀ TÀI 2: QUẢN LÝ ĐĂNG KÝ HỌC PHẦN
-- Môn: Bảo mật Cơ sở Dữ liệu
-- HQTCSDL: SQL Server
-- Chính sách quyền: ĐÓNG (mặc định không có quyền gì)
-- ============================================================

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'QLDangKyHocPhan')
    DROP DATABASE QLDangKyHocPhan;
GO

CREATE DATABASE QLDangKyHocPhan;
GO

USE QLDangKyHocPhan;
GO

-- ============================================================
-- PHẦN 1: TẠO SCHEMA
-- ============================================================

-- 1.1 Bảng Khoa
CREATE TABLE Khoa (
    MaKhoa      VARCHAR(10)  PRIMARY KEY,
    TenKhoa     NVARCHAR(100) NOT NULL,
    MaTruongKhoa VARCHAR(10) NULL  -- FK đến GiaoVien (thêm sau)
);
GO

-- 1.2 Bảng BộMôn
CREATE TABLE BoMon (
    MaBoMon         VARCHAR(10)  PRIMARY KEY,
    TenBoMon        NVARCHAR(100) NOT NULL,
    MaKhoa          VARCHAR(10)  NOT NULL REFERENCES Khoa(MaKhoa),
    MaTruongBoMon   VARCHAR(10)  NULL   -- FK đến GiaoVien (thêm sau)
);
GO

-- 1.3 Bảng GiaoVien
CREATE TABLE GiaoVien (
    MaGV        VARCHAR(10)  PRIMARY KEY,
    HoTen       NVARCHAR(100) NOT NULL,
    NgaySinh    DATE,
    GioiTinh    NCHAR(1),
    DiaChi      NVARCHAR(200),
    SoDT        VARCHAR(15),
    Email       VARCHAR(100),
    MaBoMon     VARCHAR(10)  NOT NULL REFERENCES BoMon(MaBoMon),
    -- Tài khoản SQL login liên kết (để Row-Level Security)
    TenLogin    VARCHAR(100)
);
GO

-- 1.4 Bảng SinhVien
CREATE TABLE SinhVien (
    MaSV        VARCHAR(10)  PRIMARY KEY,
    HoTen       NVARCHAR(100) NOT NULL,
    NgaySinh    DATE,
    GioiTinh    NCHAR(1),
    DiaChi      NVARCHAR(200),
    SoDT        VARCHAR(15),
    Email       VARCHAR(100),
    MaKhoa      VARCHAR(10)  NOT NULL REFERENCES Khoa(MaKhoa),
    TenLogin    VARCHAR(100)
);
GO

-- 1.5 Bảng MônHọc
CREATE TABLE MonHoc (
    MaMH        VARCHAR(10)  PRIMARY KEY,
    TenMH       NVARCHAR(200) NOT NULL,
    SoTinChi    INT NOT NULL,
    MaKhoa      VARCHAR(10)  NOT NULL REFERENCES Khoa(MaKhoa)
        -- môn học thuộc khoa nào
);
GO

-- 1.6 Bảng GiaoVien_DayDuoc (môn nào GV có thể dạy)
CREATE TABLE GV_MonDayDuoc (
    MaGV        VARCHAR(10)  NOT NULL REFERENCES GiaoVien(MaGV),
    MaMH        VARCHAR(10)  NOT NULL REFERENCES MonHoc(MaMH),
    PRIMARY KEY (MaGV, MaMH)
);
GO

-- 1.7 Bảng HocKy
CREATE TABLE HocKy (
    MaHK        VARCHAR(10)  PRIMARY KEY,  -- VD: '2024_1', '2024_2'
    TenHK       NVARCHAR(50) NOT NULL,
    NamHoc      INT          NOT NULL,
    KyHoc       INT          NOT NULL,     -- 1, 2, 3
    NgayBatDau  DATE,
    NgayKetThuc DATE,
    LaHKHienTai BIT DEFAULT 0
);
GO

-- 1.8 Bảng LopHocPhan (môn mở trong một học kỳ)
CREATE TABLE LopHocPhan (
    MaLHP       VARCHAR(10)  PRIMARY KEY,
    MaMH        VARCHAR(10)  NOT NULL REFERENCES MonHoc(MaMH),
    MaHK        VARCHAR(10)  NOT NULL REFERENCES HocKy(MaHK),
    MaGV        VARCHAR(10)  NOT NULL REFERENCES GiaoVien(MaGV),
    SoSVToiDa   INT          NOT NULL DEFAULT 50,
    Phong       NVARCHAR(20),
    ThoiGian    NVARCHAR(100)  -- VD: 'Thứ 2, 7h-9h'
);
GO

-- 1.9 Bảng LịchDạy (chi tiết lịch của GV)
CREATE TABLE LichDay (
    MaLichDay   INT IDENTITY(1,1) PRIMARY KEY,
    MaGV        VARCHAR(10)  NOT NULL REFERENCES GiaoVien(MaGV),
    MaLHP       VARCHAR(10)  NOT NULL REFERENCES LopHocPhan(MaLHP),
    MaHK        VARCHAR(10)  NOT NULL REFERENCES HocKy(MaHK),
    ThuTrongTuan INT,         -- 2-8
    TietBD       INT,
    TietKT       INT,
    Phong        NVARCHAR(20)
);
GO

-- 1.10 Bảng DangKyHocPhan
CREATE TABLE DangKy (
    MaDK        INT IDENTITY(1,1) PRIMARY KEY,
    MaSV        VARCHAR(10)  NOT NULL REFERENCES SinhVien(MaSV),
    MaLHP       VARCHAR(10)  NOT NULL REFERENCES LopHocPhan(MaLHP),
    NgayDangKy  DATETIME     DEFAULT GETDATE(),
    TrangThai   NVARCHAR(20) DEFAULT N'Đã đăng ký',  -- 'Đã đăng ký', 'Đã hủy'
    UNIQUE (MaSV, MaLHP)
);
GO

-- 1.11 Bảng Điểm
CREATE TABLE Diem (
    MaDiem      INT IDENTITY(1,1) PRIMARY KEY,
    MaSV        VARCHAR(10)  NOT NULL REFERENCES SinhVien(MaSV),
    MaLHP       VARCHAR(10)  NOT NULL REFERENCES LopHocPhan(MaLHP),
    MaGV        VARCHAR(10)  NOT NULL REFERENCES GiaoVien(MaGV),
    DiemGK      FLOAT,
    DiemCK      FLOAT,
    DiemTK      AS (DiemGK * 0.4 + DiemCK * 0.6) PERSISTED,
    UNIQUE (MaSV, MaLHP)
);
GO

-- 1.12 Bảng GiaoVu (người dùng giáo vụ)
CREATE TABLE GiaoVu (
    MaGiaoVu    VARCHAR(10)  PRIMARY KEY,
    HoTen       NVARCHAR(100) NOT NULL,
    MaKhoa      VARCHAR(10)  NOT NULL REFERENCES Khoa(MaKhoa),
    Email       VARCHAR(100),
    TenLogin    VARCHAR(100)
);
GO

-- Thêm FK vòng cho Khoa và BoMon
ALTER TABLE Khoa ADD CONSTRAINT FK_Khoa_TruongKhoa
    FOREIGN KEY (MaTruongKhoa) REFERENCES GiaoVien(MaGV);

ALTER TABLE BoMon ADD CONSTRAINT FK_BoMon_TruongBoMon
    FOREIGN KEY (MaTruongBoMon) REFERENCES GiaoVien(MaGV);
GO

-- ============================================================
-- PHẦN 2: DỮ LIỆU MẪU
-- ============================================================

INSERT INTO Khoa (MaKhoa, TenKhoa) VALUES
('KHMT', N'Khoa Học Máy Tính'),
('HTTT', N'Hệ Thống Thông Tin'),
('KTPM', N'Kỹ Thuật Phần Mềm');

INSERT INTO BoMon (MaBoMon, TenBoMon, MaKhoa) VALUES
('BM_HTTT', N'Bộ môn HTTT', 'HTTT'),
('BM_KHMT', N'Bộ môn KHMT', 'KHMT'),
('BM_KTPM', N'Bộ môn KTPM', 'KTPM');

INSERT INTO GiaoVien (MaGV, HoTen, NgaySinh, Email, MaBoMon, TenLogin) VALUES
('GV001', N'Nguyễn Văn An',   '1975-03-10', 'an.nv@uni.edu', 'BM_HTTT', 'gv_an'),
('GV002', N'Trần Thị Bình',   '1980-07-22', 'binh.tt@uni.edu', 'BM_HTTT', 'gv_binh'),
('GV003', N'Lê Văn Cường',    '1978-11-05', 'cuong.lv@uni.edu', 'BM_KHMT', 'gv_cuong'),
('GV004', N'Phạm Thị Dung',   '1985-01-15', 'dung.pt@uni.edu', 'BM_KTPM', 'gv_dung');

-- Trưởng bộ môn, trưởng khoa
UPDATE BoMon SET MaTruongBoMon = 'GV001' WHERE MaBoMon = 'BM_HTTT';
UPDATE BoMon SET MaTruongBoMon = 'GV003' WHERE MaBoMon = 'BM_KHMT';
UPDATE Khoa SET MaTruongKhoa = 'GV001' WHERE MaKhoa = 'HTTT';

INSERT INTO SinhVien (MaSV, HoTen, NgaySinh, Email, MaKhoa, TenLogin) VALUES
('SV001', N'Lý Minh Khoa',   '2002-05-10', 'khoa@sv.edu', 'HTTT', 'sv_khoa'),
('SV002', N'Hoàng Thị Lan',  '2003-08-20', 'lan@sv.edu',  'HTTT', 'sv_lan'),
('SV003', N'Đặng Quốc Huy',  '2002-12-01', 'huy@sv.edu',  'KHMT', 'sv_huy');

INSERT INTO GiaoVu (MaGiaoVu, HoTen, MaKhoa, Email, TenLogin) VALUES
('GVU001', N'Võ Thị Giao Vụ', 'HTTT', 'giaovu@uni.edu', 'giaovu_httt');

INSERT INTO MonHoc (MaMH, TenMH, SoTinChi, MaKhoa) VALUES
('CSDL',  N'Cơ Sở Dữ Liệu',             3, 'HTTT'),
('BMCSDL',N'Bảo Mật Cơ Sở Dữ Liệu',    3, 'HTTT'),
('LTHDT', N'Lập Trình Hướng Đối Tượng', 3, 'KTPM'),
('CTDL',  N'Cấu Trúc Dữ Liệu',          3, 'KHMT');

INSERT INTO GV_MonDayDuoc VALUES
('GV001','CSDL'), ('GV001','BMCSDL'),
('GV002','CSDL'), ('GV003','CTDL'), ('GV004','LTHDT');

INSERT INTO HocKy (MaHK, TenHK, NamHoc, KyHoc, NgayBatDau, NgayKetThuc, LaHKHienTai) VALUES
('HK2024_1', N'HK1 2024-2025', 2024, 1, '2024-09-01', '2025-01-15', 0),
('HK2024_2', N'HK2 2024-2025', 2024, 2, '2025-02-01', '2025-06-15', 1);

INSERT INTO LopHocPhan (MaLHP, MaMH, MaHK, MaGV, SoSVToiDa, Phong, ThoiGian) VALUES
('LHP001', 'CSDL',   'HK2024_2', 'GV001', 50, 'B101', N'Thứ 2, 7h-9h'),
('LHP002', 'BMCSDL', 'HK2024_2', 'GV001', 40, 'B102', N'Thứ 4, 13h-15h'),
('LHP003', 'CTDL',   'HK2024_2', 'GV003', 45, 'A201', N'Thứ 3, 9h-11h'),
('LHP004', 'LTHDT',  'HK2024_1', 'GV004', 50, 'A301', N'Thứ 5, 7h-9h');

INSERT INTO DangKy (MaSV, MaLHP) VALUES
('SV001', 'LHP001'), ('SV001', 'LHP002'),
('SV002', 'LHP001'),
('SV003', 'LHP003');

INSERT INTO Diem (MaSV, MaLHP, MaGV, DiemGK, DiemCK) VALUES
('SV001','LHP001','GV001', 7.5, 8.0),
('SV002','LHP001','GV001', 6.0, 7.0);
GO

-- ============================================================
-- PHẦN 3: TẠO ROLE VÀ LOGIN (Chính sách ĐÓNG)
-- ============================================================
-- Tạo các Database Role ứng với từng loại người dùng

CREATE ROLE role_TruongKhoa;
CREATE ROLE role_PhoKhoa;
CREATE ROLE role_TruongBoMon;
CREATE ROLE role_GiaoVu;
CREATE ROLE role_GiaoVien;
CREATE ROLE role_SinhVien;
GO

-- ============================================================
-- PHẦN 4: CÁC VIEW HỖ TRỢ PHÂN QUYỀN ROW-LEVEL
-- ============================================================

-- VIEW 4.1: Sinh viên chỉ xem đăng ký của chính mình
CREATE VIEW vw_SV_DangKyCuaMình AS
SELECT dk.MaDK, dk.MaSV, dk.MaLHP, dk.NgayDangKy, dk.TrangThai,
       lhp.MaMH, mh.TenMH, lhp.MaHK, hk.TenHK, hk.NamHoc, hk.KyHoc,
       lhp.MaGV, gv.HoTen AS TenGV, lhp.Phong, lhp.ThoiGian
FROM DangKy dk
JOIN LopHocPhan lhp ON dk.MaLHP = lhp.MaLHP
JOIN MonHoc mh      ON lhp.MaMH  = mh.MaMH
JOIN HocKy hk       ON lhp.MaHK  = hk.MaHK
JOIN GiaoVien gv    ON lhp.MaGV  = gv.MaGV
JOIN SinhVien sv    ON dk.MaSV   = sv.MaSV
WHERE sv.TenLogin = SUSER_SNAME();  -- chỉ dữ liệu SV đang đăng nhập
GO

-- VIEW 4.2: Sinh viên xem điểm của chính mình
CREATE VIEW vw_SV_DiemCuaMình AS
SELECT d.MaSV, d.MaLHP, mh.TenMH, hk.TenHK, hk.NamHoc,
       d.DiemGK, d.DiemCK, d.DiemTK
FROM Diem d
JOIN LopHocPhan lhp ON d.MaLHP = lhp.MaLHP
JOIN MonHoc mh      ON lhp.MaMH = mh.MaMH
JOIN HocKy hk       ON lhp.MaHK = hk.MaHK
JOIN SinhVien sv    ON d.MaSV   = sv.MaSV
WHERE sv.TenLogin = SUSER_SNAME();
GO

-- VIEW 4.3: Sinh viên xem LHP đang mở trong HK hiện tại
CREATE VIEW vw_LHP_HienTai AS
SELECT lhp.MaLHP, lhp.MaMH, mh.TenMH, mh.SoTinChi,
       lhp.MaHK, hk.TenHK, hk.NamHoc, hk.KyHoc,
       lhp.MaGV, gv.HoTen AS TenGV,
       lhp.SoSVToiDa, lhp.Phong, lhp.ThoiGian
FROM LopHocPhan lhp
JOIN MonHoc mh   ON lhp.MaMH = mh.MaMH
JOIN HocKy hk    ON lhp.MaHK = hk.MaHK
JOIN GiaoVien gv ON lhp.MaGV = gv.MaGV
WHERE hk.LaHKHienTai = 1;
GO

-- VIEW 4.4: Sinh viên xem thông tin cá nhân của mình
CREATE VIEW vw_SV_ThongTinCaNhan AS
SELECT MaSV, HoTen, NgaySinh, GioiTinh, DiaChi, SoDT, Email, MaKhoa
FROM SinhVien
WHERE TenLogin = SUSER_SNAME();
GO

-- VIEW 4.5: Giáo viên xem thông tin cá nhân của mình
CREATE VIEW vw_GV_ThongTinCaNhan AS
SELECT MaGV, HoTen, NgaySinh, GioiTinh, DiaChi, SoDT, Email, MaBoMon
FROM GiaoVien
WHERE TenLogin = SUSER_SNAME();
GO

-- VIEW 4.6: Giáo viên xem môn mình có thể dạy
CREATE VIEW vw_GV_MonDayDuoc AS
SELECT gm.MaGV, gm.MaMH, mh.TenMH, mh.SoTinChi
FROM GV_MonDayDuoc gm
JOIN MonHoc mh ON gm.MaMH = mh.MaMH
JOIN GiaoVien gv ON gm.MaGV = gv.MaGV
WHERE gv.TenLogin = SUSER_SNAME();
GO

-- VIEW 4.7: Giáo viên xem lịch dạy của mình
CREATE VIEW vw_GV_LichDay AS
SELECT ld.MaLichDay, ld.MaGV, ld.MaLHP, ld.MaHK,
       hk.TenHK, hk.NamHoc, hk.KyHoc,
       mh.TenMH, ld.ThuTrongTuan, ld.TietBD, ld.TietKT, ld.Phong
FROM LichDay ld
JOIN HocKy hk       ON ld.MaHK  = hk.MaHK
JOIN LopHocPhan lhp ON ld.MaLHP = lhp.MaLHP
JOIN MonHoc mh      ON lhp.MaMH = mh.MaMH
JOIN GiaoVien gv    ON ld.MaGV  = gv.MaGV
WHERE gv.TenLogin = SUSER_SNAME();
GO

-- VIEW 4.8: Giáo viên xem danh sách lớp mình phụ trách
CREATE VIEW vw_GV_LopPhuTrach AS
SELECT lhp.MaLHP, lhp.MaMH, mh.TenMH, lhp.MaHK,
       hk.TenHK, lhp.SoSVToiDa, lhp.Phong, lhp.ThoiGian
FROM LopHocPhan lhp
JOIN MonHoc mh   ON lhp.MaMH = mh.MaMH
JOIN HocKy hk    ON lhp.MaHK = hk.MaHK
JOIN GiaoVien gv ON lhp.MaGV = gv.MaGV
WHERE gv.TenLogin = SUSER_SNAME();
GO

-- VIEW 4.9: Giáo viên xem danh sách SV trong lớp mình dạy
CREATE VIEW vw_GV_DSSinhVienLopMinh AS
SELECT dk.MaSV, sv.HoTen, sv.Email, dk.MaLHP, dk.NgayDangKy,
       lhp.MaMH, mh.TenMH, lhp.MaHK
FROM DangKy dk
JOIN SinhVien sv    ON dk.MaSV  = sv.MaSV
JOIN LopHocPhan lhp ON dk.MaLHP = lhp.MaLHP
JOIN MonHoc mh      ON lhp.MaMH = mh.MaMH
JOIN GiaoVien gv    ON lhp.MaGV = gv.MaGV
WHERE gv.TenLogin = SUSER_SNAME()
  AND dk.TrangThai = N'Đã đăng ký';
GO

-- VIEW 4.10: Giáo viên xem/sửa điểm lớp mình dạy
CREATE VIEW vw_GV_DiemLopMinh AS
SELECT d.MaDiem, d.MaSV, sv.HoTen, d.MaLHP, mh.TenMH,
       d.DiemGK, d.DiemCK, d.DiemTK
FROM Diem d
JOIN SinhVien sv    ON d.MaSV   = sv.MaSV
JOIN LopHocPhan lhp ON d.MaLHP  = lhp.MaLHP
JOIN MonHoc mh      ON lhp.MaMH = mh.MaMH
JOIN GiaoVien gv    ON d.MaGV   = gv.MaGV
WHERE gv.TenLogin = SUSER_SNAME();
GO

-- VIEW 4.11: Trưởng bộ môn xem lịch dạy của GV trong BM mình
CREATE VIEW vw_TBM_LichDayBoMon AS
SELECT ld.MaLichDay, ld.MaGV, gv.HoTen AS TenGV,
       ld.MaLHP, ld.MaHK, hk.TenHK, hk.NamHoc, hk.KyHoc,
       mh.TenMH, ld.ThuTrongTuan, ld.TietBD, ld.TietKT, ld.Phong
FROM LichDay ld
JOIN GiaoVien gv    ON ld.MaGV  = gv.MaGV
JOIN LopHocPhan lhp ON ld.MaLHP = lhp.MaLHP
JOIN MonHoc mh      ON lhp.MaMH = mh.MaMH
JOIN HocKy hk       ON ld.MaHK  = hk.MaHK
JOIN BoMon bm       ON gv.MaBoMon = bm.MaBoMon
JOIN GiaoVien tbm   ON bm.MaTruongBoMon = tbm.MaGV
WHERE tbm.TenLogin = SUSER_SNAME();  -- chỉ GV trong BM mà user là trưởng
GO

-- VIEW 4.12: Giáo vụ - xem toàn bộ thông tin liên quan đến môn học
-- (Giáo vụ được xem mọi thứ ngoại trừ thông tin cá nhân của người khác)
CREATE VIEW vw_GV_XemDangKy AS
SELECT dk.MaDK, dk.MaSV, sv.HoTen AS TenSV,
       dk.MaLHP, lhp.MaMH, mh.TenMH,
       lhp.MaHK, hk.TenHK, dk.NgayDangKy, dk.TrangThai
FROM DangKy dk
JOIN SinhVien sv    ON dk.MaSV  = sv.MaSV
JOIN LopHocPhan lhp ON dk.MaLHP = lhp.MaLHP
JOIN MonHoc mh      ON lhp.MaMH = mh.MaMH
JOIN HocKy hk       ON lhp.MaHK = hk.MaHK;
GO

-- VIEW 4.13: Giáo vụ xem tất cả lịch dạy của mọi giáo viên
CREATE VIEW vw_GV_XemLichDay AS
SELECT ld.MaLichDay, gv.MaGV, gv.HoTen AS TenGV,
       ld.MaHK, hk.TenHK, mh.TenMH,
       ld.ThuTrongTuan, ld.TietBD, ld.TietKT, ld.Phong
FROM LichDay ld
JOIN GiaoVien gv    ON ld.MaGV  = gv.MaGV
JOIN LopHocPhan lhp ON ld.MaLHP = lhp.MaLHP
JOIN MonHoc mh      ON lhp.MaMH = mh.MaMH
JOIN HocKy hk       ON ld.MaHK  = hk.MaHK;
GO

-- VIEW 4.14: Giáo vụ xem thông tin cá nhân của chính mình
CREATE VIEW vw_GiaoVu_CaNhan AS
SELECT MaGiaoVu, HoTen, MaKhoa, Email
FROM GiaoVu
WHERE TenLogin = SUSER_SNAME();
GO

-- ============================================================
-- PHẦN 5: STORED PROCEDURE PHÂN QUYỀN HÀNH ĐỘNG
-- ============================================================

-- SP 5.1: Sinh viên đăng ký học phần (HK hiện tại)
CREATE PROCEDURE sp_SV_DangKy
    @MaLHP VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @MaSV VARCHAR(10);
    -- Lấy MaSV từ login hiện tại
    SELECT @MaSV = MaSV FROM SinhVien WHERE TenLogin = SUSER_SNAME();
    IF @MaSV IS NULL
    BEGIN RAISERROR(N'Không tìm thấy sinh viên tương ứng.', 16, 1); RETURN; END

    -- Kiểm tra LHP có thuộc HK hiện tại không
    IF NOT EXISTS (
        SELECT 1 FROM LopHocPhan lhp JOIN HocKy hk ON lhp.MaHK = hk.MaHK
        WHERE lhp.MaLHP = @MaLHP AND hk.LaHKHienTai = 1
    )
    BEGIN RAISERROR(N'Lớp học phần không thuộc học kỳ hiện tại.', 16, 1); RETURN; END

    -- Kiểm tra còn chỗ không
    DECLARE @SoSVToiDa INT, @SoDaDangKy INT;
    SELECT @SoSVToiDa = SoSVToiDa FROM LopHocPhan WHERE MaLHP = @MaLHP;
    SELECT @SoDaDangKy = COUNT(*) FROM DangKy
    WHERE MaLHP = @MaLHP AND TrangThai = N'Đã đăng ký';
    IF @SoDaDangKy >= @SoSVToiDa
    BEGIN RAISERROR(N'Lớp học phần đã đủ số lượng.', 16, 1); RETURN; END

    -- Kiểm tra đã đăng ký chưa
    IF EXISTS (SELECT 1 FROM DangKy WHERE MaSV = @MaSV AND MaLHP = @MaLHP AND TrangThai = N'Đã đăng ký')
    BEGIN RAISERROR(N'Sinh viên đã đăng ký lớp học phần này.', 16, 1); RETURN; END

    INSERT INTO DangKy (MaSV, MaLHP, TrangThai)
    VALUES (@MaSV, @MaLHP, N'Đã đăng ký');
END;
GO

-- SP 5.2: Sinh viên hủy đăng ký
CREATE PROCEDURE sp_SV_HuyDangKy
    @MaLHP VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @MaSV VARCHAR(10);
    SELECT @MaSV = MaSV FROM SinhVien WHERE TenLogin = SUSER_SNAME();
    IF @MaSV IS NULL
    BEGIN RAISERROR(N'Không tìm thấy sinh viên tương ứng.', 16, 1); RETURN; END

    UPDATE DangKy SET TrangThai = N'Đã hủy'
    WHERE MaSV = @MaSV AND MaLHP = @MaLHP AND TrangThai = N'Đã đăng ký';

    IF @@ROWCOUNT = 0
        RAISERROR(N'Không tìm thấy đăng ký hợp lệ để hủy.', 16, 1);
END;
GO

-- SP 5.3: Giáo viên nhập/cập nhật điểm
CREATE PROCEDURE sp_GV_NhapDiem
    @MaSV   VARCHAR(10),
    @MaLHP  VARCHAR(10),
    @DiemGK FLOAT,
    @DiemCK FLOAT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @MaGV VARCHAR(10);
    SELECT @MaGV = MaGV FROM GiaoVien WHERE TenLogin = SUSER_SNAME();

    -- Kiểm tra GV có phụ trách LHP đó không
    IF NOT EXISTS (SELECT 1 FROM LopHocPhan WHERE MaLHP = @MaLHP AND MaGV = @MaGV)
    BEGIN RAISERROR(N'Bạn không phụ trách lớp học phần này.', 16, 1); RETURN; END

    -- Kiểm tra SV có đăng ký LHP không
    IF NOT EXISTS (SELECT 1 FROM DangKy WHERE MaSV = @MaSV AND MaLHP = @MaLHP AND TrangThai = N'Đã đăng ký')
    BEGIN RAISERROR(N'Sinh viên không đăng ký lớp học phần này.', 16, 1); RETURN; END

    IF EXISTS (SELECT 1 FROM Diem WHERE MaSV = @MaSV AND MaLHP = @MaLHP)
        UPDATE Diem SET DiemGK = @DiemGK, DiemCK = @DiemCK
        WHERE MaSV = @MaSV AND MaLHP = @MaLHP AND MaGV = @MaGV;
    ELSE
        INSERT INTO Diem (MaSV, MaLHP, MaGV, DiemGK, DiemCK)
        VALUES (@MaSV, @MaLHP, @MaGV, @DiemGK, @DiemCK);
END;
GO

-- SP 5.4: Giáo viên tự cập nhật thông tin cá nhân
CREATE PROCEDURE sp_GV_CapNhatCaNhan
    @DiaChi  NVARCHAR(200) = NULL,
    @SoDT    VARCHAR(15)   = NULL,
    @Email   VARCHAR(100)  = NULL
AS
BEGIN
    UPDATE GiaoVien
    SET DiaChi = ISNULL(@DiaChi, DiaChi),
        SoDT   = ISNULL(@SoDT,   SoDT),
        Email  = ISNULL(@Email,  Email)
    WHERE TenLogin = SUSER_SNAME();
END;
GO

-- SP 5.5: Trưởng bộ môn cập nhật SoSVToiDa của LHP trong BM mình
CREATE PROCEDURE sp_TBM_CapNhatSoSVToiDa
    @MaLHP      VARCHAR(10),
    @SoSVToiDa  INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @MaGV_TBM VARCHAR(10);
    SELECT @MaGV_TBM = MaGV FROM GiaoVien WHERE TenLogin = SUSER_SNAME();

    -- Kiểm tra LHP có thuộc môn của BM mình quản lý không
    IF NOT EXISTS (
        SELECT 1
        FROM LopHocPhan lhp
        JOIN GiaoVien gv_day ON lhp.MaGV = gv_day.MaGV
        JOIN BoMon bm        ON gv_day.MaBoMon = bm.MaBoMon
        WHERE lhp.MaLHP = @MaLHP AND bm.MaTruongBoMon = @MaGV_TBM
    )
    BEGIN RAISERROR(N'Lớp học phần không thuộc bộ môn bạn quản lý.', 16, 1); RETURN; END

    UPDATE LopHocPhan SET SoSVToiDa = @SoSVToiDa WHERE MaLHP = @MaLHP;
END;
GO

-- SP 5.6: Giáo vụ mở môn học trong học kỳ (thừa hành trưởng khoa)
CREATE PROCEDURE sp_GiaoVu_MoLopHocPhan
    @MaLHP      VARCHAR(10),
    @MaMH       VARCHAR(10),
    @MaHK       VARCHAR(10),
    @MaGV       VARCHAR(10),
    @SoSVToiDa  INT,
    @Phong      NVARCHAR(20),
    @ThoiGian   NVARCHAR(100)
AS
BEGIN
    INSERT INTO LopHocPhan (MaLHP, MaMH, MaHK, MaGV, SoSVToiDa, Phong, ThoiGian)
    VALUES (@MaLHP, @MaMH, @MaHK, @MaGV, @SoSVToiDa, @Phong, @ThoiGian);
END;
GO

-- SP 5.7: Trưởng khoa quản lý môn học của khoa mình
CREATE PROCEDURE sp_TruongKhoa_ThemMonHoc
    @MaMH       VARCHAR(10),
    @TenMH      NVARCHAR(200),
    @SoTinChi   INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @MaGV_TK VARCHAR(10), @MaKhoa VARCHAR(10);
    SELECT @MaGV_TK = MaGV FROM GiaoVien WHERE TenLogin = SUSER_SNAME();
    SELECT @MaKhoa = MaKhoa FROM Khoa WHERE MaTruongKhoa = @MaGV_TK;
    IF @MaKhoa IS NULL
    BEGIN RAISERROR(N'Bạn không phải trưởng khoa.', 16, 1); RETURN; END

    INSERT INTO MonHoc (MaMH, TenMH, SoTinChi, MaKhoa)
    VALUES (@MaMH, @TenMH, @SoTinChi, @MaKhoa);
END;
GO

CREATE PROCEDURE sp_TruongKhoa_SuaMonHoc
    @MaMH       VARCHAR(10),
    @TenMH      NVARCHAR(200) = NULL,
    @SoTinChi   INT           = NULL
AS
BEGIN
    DECLARE @MaGV_TK VARCHAR(10), @MaKhoa VARCHAR(10);
    SELECT @MaGV_TK = MaGV FROM GiaoVien WHERE TenLogin = SUSER_SNAME();
    SELECT @MaKhoa = MaKhoa FROM Khoa WHERE MaTruongKhoa = @MaGV_TK;

    -- Chỉ sửa môn thuộc khoa mình
    IF NOT EXISTS (SELECT 1 FROM MonHoc WHERE MaMH = @MaMH AND MaKhoa = @MaKhoa)
    BEGIN RAISERROR(N'Môn học không thuộc khoa của bạn.', 16, 1); RETURN; END

    UPDATE MonHoc
    SET TenMH     = ISNULL(@TenMH, TenMH),
        SoTinChi  = ISNULL(@SoTinChi, SoTinChi)
    WHERE MaMH = @MaMH;
END;
GO

CREATE PROCEDURE sp_TruongKhoa_XoaMonHoc
    @MaMH VARCHAR(10)
AS
BEGIN
    DECLARE @MaGV_TK VARCHAR(10), @MaKhoa VARCHAR(10);
    SELECT @MaGV_TK = MaGV FROM GiaoVien WHERE TenLogin = SUSER_SNAME();
    SELECT @MaKhoa = MaKhoa FROM Khoa WHERE MaTruongKhoa = @MaGV_TK;

    IF NOT EXISTS (SELECT 1 FROM MonHoc WHERE MaMH = @MaMH AND MaKhoa = @MaKhoa)
    BEGIN RAISERROR(N'Môn học không thuộc khoa của bạn.', 16, 1); RETURN; END

    DELETE FROM MonHoc WHERE MaMH = @MaMH;
END;
GO

-- ============================================================
-- PHẦN 6: CẤP QUYỀN THEO TỪNG ROLE (Chính sách ĐÓNG)
-- Mặc định không có quyền gì → chỉ cấp đúng những gì cần
-- ============================================================

-- ---- ROLE: role_SinhVien ----
-- Xem danh sách môn học, LHP đang mở
GRANT SELECT ON MonHoc      TO role_SinhVien;
GRANT SELECT ON HocKy       TO role_SinhVien;
GRANT SELECT ON vw_LHP_HienTai TO role_SinhVien;
-- Xem GV dạy môn nào (trong LHP)
GRANT SELECT ON LopHocPhan  TO role_SinhVien;
GRANT SELECT ON GiaoVien    TO role_SinhVien;  -- chỉ xem tên GV

-- Xem đăng ký, điểm của chính mình (qua view RLS)
GRANT SELECT ON vw_SV_DangKyCuaMình TO role_SinhVien;
GRANT SELECT ON vw_SV_DiemCuaMình   TO role_SinhVien;
GRANT SELECT ON vw_SV_ThongTinCaNhan TO role_SinhVien;

-- Đăng ký, hủy đăng ký qua SP
GRANT EXECUTE ON sp_SV_DangKy     TO role_SinhVien;
GRANT EXECUTE ON sp_SV_HuyDangKy  TO role_SinhVien;
GO

-- ---- ROLE: role_GiaoVien ----
-- Xem danh sách môn học, LHP
GRANT SELECT ON MonHoc      TO role_GiaoVien;
GRANT SELECT ON HocKy       TO role_GiaoVien;
GRANT SELECT ON LopHocPhan  TO role_GiaoVien;  -- tất cả LHP (đề bài: xem danh sách)

-- Thông tin cá nhân + dữ liệu của mình (qua view RLS)
GRANT SELECT ON vw_GV_ThongTinCaNhan   TO role_GiaoVien;
GRANT SELECT ON vw_GV_MonDayDuoc       TO role_GiaoVien;
GRANT SELECT ON vw_GV_LichDay          TO role_GiaoVien;
GRANT SELECT ON vw_GV_LopPhuTrach      TO role_GiaoVien;
GRANT SELECT ON vw_GV_DSSinhVienLopMinh TO role_GiaoVien;
GRANT SELECT ON vw_GV_DiemLopMinh      TO role_GiaoVien;

-- Cập nhật thông tin cá nhân, nhập điểm
GRANT EXECUTE ON sp_GV_CapNhatCaNhan TO role_GiaoVien;
GRANT EXECUTE ON sp_GV_NhapDiem      TO role_GiaoVien;
GO

-- ---- ROLE: role_TruongBoMon ----
-- Thừa hưởng tất cả quyền GiaoVien
EXEC sp_addrolemember 'role_GiaoVien', 'role_TruongBoMon';

-- Thêm: xem lịch dạy của GV trong BM mình
GRANT SELECT ON vw_TBM_LichDayBoMon   TO role_TruongBoMon;
-- Thêm: sửa SoSVToiDa của LHP
GRANT EXECUTE ON sp_TBM_CapNhatSoSVToiDa TO role_TruongBoMon;
GO

-- ---- ROLE: role_TruongKhoa ----
-- Thừa hưởng quyền GiaoVien
EXEC sp_addrolemember 'role_GiaoVien', 'role_TruongKhoa';

-- Thêm: xem, thêm, xóa, sửa môn học của khoa mình
GRANT SELECT ON MonHoc TO role_TruongKhoa;
GRANT EXECUTE ON sp_TruongKhoa_ThemMonHoc TO role_TruongKhoa;
GRANT EXECUTE ON sp_TruongKhoa_SuaMonHoc  TO role_TruongKhoa;
GRANT EXECUTE ON sp_TruongKhoa_XoaMonHoc  TO role_TruongKhoa;
GO

-- ---- ROLE: role_PhoKhoa ----
-- Phó khoa có quyền như giáo viên (đề bài: có quyền như giáo viên)
EXEC sp_addrolemember 'role_GiaoVien', 'role_PhoKhoa';
GO

-- ---- ROLE: role_GiaoVu ----
-- Xem mọi thông tin liên quan môn học, đăng ký, lịch dạy, điểm
GRANT SELECT ON MonHoc          TO role_GiaoVu;
GRANT SELECT ON LopHocPhan      TO role_GiaoVu;
GRANT SELECT ON HocKy           TO role_GiaoVu;
GRANT SELECT ON GiaoVien        TO role_GiaoVu;
GRANT SELECT ON vw_GV_XemDangKy TO role_GiaoVu;
GRANT SELECT ON vw_GV_XemLichDay TO role_GiaoVu;
GRANT SELECT ON Diem             TO role_GiaoVu;

-- Thông tin cá nhân của chính giáo vụ
GRANT SELECT ON vw_GiaoVu_CaNhan    TO role_GiaoVu;
-- Giáo vụ được sửa thông tin cá nhân của mình thông qua view
-- (implement UPDATE trên view có INSTEAD OF trigger nếu cần)

-- Giáo vụ mở lớp học phần (thừa hành trưởng khoa)
GRANT EXECUTE ON sp_GiaoVu_MoLopHocPhan TO role_GiaoVu;
GO

-- ============================================================
-- PHẦN 7: VÍ DỤ TẠO LOGIN & USER GẮN VÀO ROLE
-- (Chạy trong môi trường thực tế — comment lại nếu test local)
-- ============================================================

-- Kiểm tra và tạo Login cấp server
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'sv_khoa')
    CREATE LOGIN sv_khoa WITH PASSWORD = 'Sv@12345!';

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'sv_lan')
    CREATE LOGIN sv_lan WITH PASSWORD = 'Sv@12345!';

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'gv_an')
    CREATE LOGIN gv_an WITH PASSWORD = 'Gv@12345!';

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'gv_binh')
    CREATE LOGIN gv_binh WITH PASSWORD = 'Gv@12345!';

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'giaovu_httt')
    CREATE LOGIN giaovu_httt WITH PASSWORD = 'Gvu@12345!';

-- Tạo User trong database
CREATE USER sv_khoa  FOR LOGIN sv_khoa;
CREATE USER sv_lan   FOR LOGIN sv_lan;
CREATE USER gv_an    FOR LOGIN gv_an;
CREATE USER gv_binh  FOR LOGIN gv_binh;
CREATE USER giaovu_httt FOR LOGIN giaovu_httt;

-- Gắn vào Role
EXEC sp_addrolemember 'role_SinhVien', 'sv_khoa';
EXEC sp_addrolemember 'role_SinhVien', 'sv_lan';
EXEC sp_addrolemember 'role_GiaoVien', 'gv_binh';
EXEC sp_addrolemember 'role_TruongBoMon', 'gv_an';
EXEC sp_addrolemember 'role_TruongKhoa',  'gv_an';
EXEC sp_addrolemember 'role_GiaoVu',  'giaovu_httt';


-- ============================================================
-- PHẦN 8: KIỂM TRA NHANH (DEMO QUERY)
-- ============================================================

-- Xem tất cả LHP đang mở
SELECT * FROM vw_LHP_HienTai;

-- Xem danh sách môn học
SELECT * FROM MonHoc;

-- Xem đăng ký của SV001
SELECT * FROM DangKy WHERE MaSV = 'SV001';

-- Xem điểm của SV001
SELECT * FROM Diem WHERE MaSV = 'SV001';

-- Kiểm tra SP đăng ký (khi đăng nhập bằng sv_khoa thì SUSER_SNAME() = 'sv_khoa')
-- EXEC sp_SV_DangKy @MaLHP = 'LHP003';
GO

PRINT N'=== Script QLDangKyHocPhan tạo thành công! ===';
