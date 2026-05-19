const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/db'); 
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// 🔒 Tường lửa: Chỉ cho phép Trưởng Bộ Môn qua cổng
router.use(verifyToken);
router.use(checkRole(['TruongBoMon']));

// 1. API Lấy danh sách Học Kỳ (Đổ vào dropdown lọc)
router.get('/hoc-ky', async (req, res) => {
    try {
        const sql = `SELECT MaHK, TenHK, NamHoc, LaHKHienTai AS DangMo FROM HocKy ORDER BY NamHoc DESC, MaHK DESC`;
        
        const result = await executeQuery(sql, {}, req.user.name);
        res.json(result || []);
    } catch (err) {
        res.status(500).json({ message: "Lỗi tải học kỳ: " + err.message });
    }
});

// 2. API Lấy danh sách Lớp Học Phần thuộc quyền Bộ Môn
router.get('/lop-hoc-phan', async (req, res) => {
    try {
        const sql = `SELECT * FROM vw_TBM_QuanLyLopHoc`;
        const result = await executeQuery(sql, {}, req.user.name);
        res.json(result || []);
    } catch (err) {
        res.status(500).json({ message: "Lỗi tải danh sách lớp: " + err.message });
    }
});

// 3. API Cập nhật Sĩ số tối đa (Gọi Stored Procedure)
router.put('/cap-nhat-si-so', async (req, res) => {
    const { maLHP, siSoToiDa } = req.body;
    try {
        const sql = `EXEC sp_TBM_CapNhatSiSoToiDa @MaLHP, @SiSoToiDa`;
        await executeQuery(sql, { MaLHP: maLHP, SiSoToiDa: parseInt(siSoToiDa) }, req.user.name);
        res.json({ message: "Cập nhật giới hạn sĩ số thành công!" });
    } catch (err) {
        console.error("Lỗi cập nhật sĩ số:", err);
        // Bắt lỗi RAISERROR từ SQL Server trả về cho người dùng
        const errMsg = err.message.replace(/\[.*?\]/g, '').trim();
        res.status(400).json({ message: errMsg });
    }
});

// 4. API Lấy lịch giảng dạy cá nhân của Trưởng bộ môn (Vai trò Giảng viên)
router.get('/lich-day-ca-nhan', async (req, res) => {
    try {
        const sql = `SELECT * FROM vw_TBM_LichDayCaNhan`;
        const result = await executeQuery(sql, {}, req.user.name);
        res.json(result || []);
    } catch (err) {
        console.error("Lỗi get lịch dạy cá nhân:", err);
        res.status(500).json({ message: "Lỗi tải lịch dạy cá nhân: " + err.message });
    }
});

// 5. API Lấy chi tiết một Lớp học phần (Cho Modal)
router.get('/chi-tiet-lop/:maLHP', async (req, res) => {
    const { maLHP } = req.params;
    try {
        const sql = `SELECT * FROM vw_TBM_QuanLyLopHoc WHERE MaLHP = @MaLHP`;
        const result = await executeQuery(sql, { MaLHP: maLHP }, req.user.name);
        res.json(result.length > 0 ? result[0] : null);
    } catch (err) {
        res.status(500).json({ message: "Lỗi tải chi tiết lớp: " + err.message });
    }
});

// 6. API Lấy Danh sách Sinh viên + Điểm của một Lớp học phần
router.get('/danh-sach-sinh-vien/:maLHP', async (req, res) => {
    const { maLHP } = req.params;
    try {
        const sql = `SELECT * FROM vw_TBM_ChiTietLopHoc WHERE MaLHP = @MaLHP`;
        const result = await executeQuery(sql, { MaLHP: maLHP }, req.user.name);
        res.json(result || []);
    } catch (err) {
        res.status(500).json({ message: "Lỗi tải danh sách sinh viên: " + err.message });
    }
});

// 7. API Cập nhật bảng điểm (Lưu nhiều sinh viên cùng lúc)
router.put('/cap-nhat-diem', async (req, res) => {
    const { maLHP, bangDiem } = req.body; 
    // bangDiem có cấu trúc: [{ maSV: 'SV01', diemGK: 8, diemCK: 9 }, ...]
    try {
        for (let item of bangDiem) {
            const sql = `EXEC sp_TBM_CapNhatDiem @MaLHP, @MaSV, @DiemGK, @DiemCK`;
            await executeQuery(sql, { 
                MaLHP: maLHP, 
                MaSV: item.maSV, 
                DiemGK: item.diemGK, 
                DiemCK: item.diemCK 
            }, req.user.name);
        }
        res.json({ message: `Đã lưu thành công điểm cho ${bangDiem.length} sinh viên!` });
    } catch (err) {
        // Bắt lỗi RAISERROR từ SQL
        const errMsg = err.message.replace(/\[.*?\]/g, '').trim();
        res.status(400).json({ message: errMsg });
    }
});

// 8. API Thống kê Danh sách Môn học (Kèm số lớp đang mở theo Học Kỳ)
router.get('/danh-sach-mon-hoc/:maHK', async (req, res) => {
    const { maHK } = req.params;
    try {
        const sql = `EXEC sp_TBM_ThongKeMonHoc @MaHK`;
        const result = await executeQuery(sql, { MaHK: maHK }, req.user.name);
        res.json(result || []);
    } catch (err) {
        res.status(500).json({ message: "Lỗi tải danh mục môn học: " + err.message });
    }
});

// =====================================================================
// 9. API Lấy thông tin cá nhân (Hồ sơ)
// =====================================================================
router.get('/ho-so', async (req, res) => {
    try {
        // Lấy đúng người đang đăng nhập bằng SUSER_SNAME() thần thánh
        const sql = `
            SELECT gv.MaGV, gv.HoTen, gv.NgaySinh, gv.DiaChi, gv.SoDT, gv.Email,
                   bm.TenBoMon, k.TenKhoa
            FROM GiaoVien gv
            LEFT JOIN BoMon bm ON gv.MaBoMon = bm.MaBoMon
            LEFT JOIN Khoa k ON gv.MaKhoa = k.MaKhoa
            WHERE gv.TenLogin = SUSER_SNAME()
        `;
        const result = await executeQuery(sql, {}, req.user.name);
        
        if (result && result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({ message: "Không tìm thấy thông tin hồ sơ" });
        }
    } catch (err) {
        console.error("Lỗi get hồ sơ:", err);
        res.status(500).json({ message: "Lỗi tải hồ sơ: " + err.message });
    }
});

// =====================================================================
// 10. API Cập nhật thông tin cá nhân
// =====================================================================
router.put('/ho-so', async (req, res) => {
    const { soDT, email, diaChi } = req.body;
    try {
        const sql = `
            UPDATE GiaoVien 
            SET SoDT = @SoDT, Email = @Email, DiaChi = @DiaChi 
            WHERE TenLogin = SUSER_SNAME()
        `;
        await executeQuery(sql, { SoDT: soDT, Email: email, DiaChi: diaChi }, req.user.name);
        res.json({ message: "Cập nhật hồ sơ cá nhân thành công!" });
    } catch (err) {
        console.error("Lỗi update hồ sơ:", err);
        res.status(500).json({ message: "Lỗi cập nhật: " + err.message });
    }
});

// =====================================================================
// 11. API Dashboard - Tổng hợp dữ liệu Tổng quan
// =====================================================================
router.get('/dashboard', async (req, res) => {
    try {
        // 1. Lấy Thống kê tổng quan
        const sqlStats = `
            DECLARE @MaBoMon VARCHAR(10), @HoTen NVARCHAR(100), @TenBoMon NVARCHAR(100);
            SELECT @MaBoMon = gv.MaBoMon, @HoTen = gv.HoTen, @TenBoMon = bm.TenBoMon 
            FROM GiaoVien gv LEFT JOIN BoMon bm ON gv.MaBoMon = bm.MaBoMon 
            WHERE gv.TenLogin = SUSER_SNAME();

            DECLARE @MaHK VARCHAR(10) = (SELECT TOP 1 MaHK FROM HocKy WHERE LaHKHienTai = 1);

            SELECT 
                @HoTen AS HoTen, @TenBoMon AS TenBoMon,
                (SELECT COUNT(*) FROM GiaoVien WHERE MaBoMon = @MaBoMon) AS SoGV,
                (SELECT COUNT(*) FROM LopHocPhan lhp JOIN GiaoVien gv ON lhp.MaGV = gv.MaGV WHERE gv.MaBoMon = @MaBoMon AND lhp.MaHK = @MaHK) AS SoLop,
                (SELECT COUNT(dk.MaDK) FROM DangKyHoc dk JOIN LopHocPhan lhp ON dk.MaLHP = lhp.MaLHP JOIN GiaoVien gv ON lhp.MaGV = gv.MaGV WHERE gv.MaBoMon = @MaBoMon AND lhp.MaHK = @MaHK AND dk.TrangThai NOT LIKE N'%Huy%') AS SoDangKy;
        `;
        const stats = await executeQuery(sqlStats, {}, req.user.name);

        // 2. Lấy Top 5 Lịch dạy của bộ môn
        const sqlLich = `
            DECLARE @MaBoMon VARCHAR(10) = (SELECT MaBoMon FROM GiaoVien WHERE TenLogin = SUSER_SNAME());
            DECLARE @MaHK VARCHAR(10) = (SELECT TOP 1 MaHK FROM HocKy WHERE LaHKHienTai = 1);
            
            SELECT TOP 5 
                gv.HoTen, mh.TenMH, lhp.LichHoc, lhp.PhongHoc, lhp.SiSoToiDa,
                (SELECT COUNT(*) FROM DangKyHoc WHERE MaLHP = lhp.MaLHP AND TrangThai NOT LIKE N'%Huy%') AS SiSoHienTai
            FROM LopHocPhan lhp 
            JOIN GiaoVien gv ON lhp.MaGV = gv.MaGV 
            JOIN MonHoc mh ON lhp.MaMH = mh.MaMH
            WHERE gv.MaBoMon = @MaBoMon AND lhp.MaHK = @MaHK;
        `;
        const lich = await executeQuery(sqlLich, {}, req.user.name);

        // 3. Lấy Danh sách nhân sự
        const sqlNhanSu = `
            DECLARE @MaBoMon VARCHAR(10) = (SELECT MaBoMon FROM GiaoVien WHERE TenLogin = SUSER_SNAME());
            SELECT HoTen, Email FROM GiaoVien WHERE MaBoMon = @MaBoMon;
        `;
        const nhanSu = await executeQuery(sqlNhanSu, {}, req.user.name);

        // Gửi trả toàn bộ 3 cục data về Frontend trong 1 nhịp
        res.json({
            stats: stats[0] || {},
            lich: lich || [],
            nhanSu: nhanSu || []
        });
    } catch (err) {
        console.error("Lỗi get dashboard:", err);
        res.status(500).json({ message: "Lỗi tải dashboard: " + err.message });
    }
});

module.exports = router;