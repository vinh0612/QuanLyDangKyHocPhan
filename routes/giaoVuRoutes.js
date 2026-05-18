const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/db'); 
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// 🔒 KÍCH HOẠT TƯỜNG LỬA: Chỉ cho phép tài khoản có quyền GiaoVu đi qua
router.use(verifyToken);
router.use(checkRole(['GiaoVu']));

// ============================================================
// 1. API: LẤY HỒ SƠ CÁ NHÂN GIÁO VỤ
// ============================================================
router.get('/ho-so', async (req, res) => {
    try {
        const result = await executeQuery("SELECT * FROM vw_GiaoVu_CaNhan", {}, req.user.name);
        if (result && result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({ message: "Không tìm thấy hồ sơ giáo vụ!" });
        }
    } catch (err) {
        res.status(500).json({ message: "Lỗi truy xuất hồ sơ: " + err.message });
    }
});

// ============================================================
// 2. API: XEM TOÀN BỘ LỊCH DẠY TOÀN TRƯỜNG
// ============================================================
router.get('/lich-day-toan-truong', async (req, res) => {
    try {
        const result = await executeQuery("SELECT * FROM vw_GiaoVu_XemLichDay", {}, req.user.name);
        res.json(result || []);
    } catch (err) {
        res.status(500).json({ message: "Lỗi tải lịch dạy toàn trường: " + err.message });
    }
});

// ============================================================
// 3. API: XEM TOÀN BỘ TÌNH TRẠNG ĐĂNG KÝ HỌC PHẦN
// ============================================================
router.get('/danh-sach-dang-ky', async (req, res) => {
    try {
        const result = await executeQuery("SELECT * FROM vw_GiaoVu_XemDangKy", {}, req.user.name);
        res.json(result || []);
    } catch (err) {
        res.status(500).json({ message: "Lỗi tải danh sách đăng ký: " + err.message });
    }
});

// ============================================================
// 4. API: MỞ LỚP HỌC PHẦN MỚI (Dùng Stored Procedure sp_GiaoVu_MoLopHocPhan)
// ============================================================
router.post('/mo-lop-hoc-phan', async (req, res) => {
    const { maLHP, maMH, maHK, maGV, siSoToiDa, lichHoc, phongHoc, ngayBatDau, ngayKetThuc } = req.body;

    if (!maLHP || !maMH || !maHK || !maGV || !siSoToiDa) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ các trường bắt buộc (Mã LHP, Mã MH, Mã HK, Mã GV, Sĩ số)!" });
    }

    try {
        const sql = `
            EXEC sp_GiaoVu_MoLopHocPhan 
                @MaLHP, @MaMH, @MaHK, @MaGV, @SiSoToiDa, 
                @LichHoc, @PhongHoc, @NgayBatDau, @NgayKetThuc
        `;
        const params = {
            MaLHP: maLHP, 
            MaMH: maMH, 
            MaHK: maHK, 
            MaGV: maGV, 
            SiSoToiDa: parseInt(siSoToiDa),
            LichHoc: lichHoc || null,
            PhongHoc: phongHoc || null,
            NgayBatDau: ngayBatDau || null,
            NgayKetThuc: ngayKetThuc || null
        };

        await executeQuery(sql, params, req.user.name);
        res.json({ message: "Mở lớp học phần mới thành công!" });
    } catch (err) {
        const errMsg = err.message.replace(/\[.*?\]/g, '').trim();
        res.status(400).json({ message: errMsg });
    }
});

// ============================================================
// 5. API: LẤY TẤT CẢ LỚP HỌC PHẦN (Dành riêng cho Giáo vụ)
// ============================================================
router.get('/danh-sach-lop-hoc-phan', async (req, res) => {
    try {
        const sql = `
            SELECT lhp.MaLHP, lhp.MaMH, mh.TenMH, 
                   lhp.MaHK, hk.TenHK, hk.NamHoc,
                   lhp.MaGV, gv.HoTen AS TenGV,
                   lhp.SiSoToiDa, lhp.SiSoHienTai, 
                   lhp.LichHoc, lhp.PhongHoc
            FROM LopHocPhan lhp
            JOIN MonHoc mh ON lhp.MaMH = mh.MaMH
            JOIN HocKy hk ON lhp.MaHK = hk.MaHK
            JOIN GiaoVien gv ON lhp.MaGV = gv.MaGV
        `;
        const result = await executeQuery(sql, {}, req.user.name);
        res.json(result || []);
    } catch (err) {
        res.status(500).json({ message: "Lỗi tải danh sách lớp học phần: " + err.message });
    }
});

// ============================================================
// 6. API: TRA CỨU ĐIỂM SỐ TOÀN TRƯỜNG (Dành riêng cho Giáo vụ)
// ============================================================
router.get('/tra-cuu-diem', async (req, res) => {
    try {
        // Lược bỏ cột MaBD (để tránh lỗi nếu bảng BangDiem của nhóm không có cột này)
        const sql = `
            SELECT dk.MaDK, dk.MaSV, sv.HoTen AS TenSV, dk.MaLHP, 
                   bd.DiemGiuaKy, bd.DiemCuoiKy, bd.DiemTongKet
            FROM DangKyHoc dk
            JOIN SinhVien sv ON dk.MaSV = sv.MaSV
            LEFT JOIN BangDiem bd ON dk.MaDK = bd.MaDK
        `;
        const result = await executeQuery(sql, {}, req.user.name);
        res.json(result || []);
    } catch (err) {
        // IN LỖI CHI TIẾT RA MÀN HÌNH ĐEN VS CODE ĐỂ DEBUG
        console.error("❌ LỖI SQL TẠI API TRA CỨU ĐIỂM:", err.message); 
        res.status(500).json({ message: "Lỗi tải dữ liệu điểm: " + err.message });
    }
});

// ============================================================
// 7. API: LẤY DANH MỤC MÔN HỌC (Dành riêng cho Giáo vụ)
// ============================================================
router.get('/tat-ca-mon-hoc', async (req, res) => {
    try {
        // Giáo vụ có quyền SELECT bảng MonHoc nên dùng logic dịch tên Khoa an toàn:
        const sql = `
            SELECT MaMH, TenMH, SoTinChi, MaKhoa,
                   CASE 
                       WHEN MaKhoa = 'K01' THEN N'Công nghệ thông tin'
                       WHEN MaKhoa = 'K02' THEN N'Kinh tế'
                       ELSE N'Khoa khác'
                   END AS TenKhoa
            FROM MonHoc
        `;
        const result = await executeQuery(sql, {}, req.user.name);
        res.json(result || []);
    } catch (err) {
        console.error("Lỗi truy vấn môn học của Giáo vụ:", err);
        res.status(500).json({ message: "Lỗi tải danh mục môn học: " + err.message });
    }
});

// ============================================================
// 8. API: CẬP NHẬT HỒ SƠ CÁ NHÂN GIÁO VỤ
// ============================================================
router.post('/cap-nhat-ho-so', async (req, res) => {
    const { soDT, email, diaChi } = req.body;
    try {
        // Cập nhật trực tiếp vào bảng GiaoVu (Giả định cột khóa chính là MaGV_GV)
        const sql = `
            UPDATE GiaoVu 
            SET SoDT = @SoDT, Email = @Email, DiaChi = @DiaChi 
            WHERE MaGV_GV = @MaGV_GV
        `;
        await executeQuery(sql, { 
            SoDT: soDT || null, 
            Email: email || null, 
            DiaChi: diaChi || null,
            MaGV_GV: req.user.name 
        }, req.user.name);
        
        res.json({ message: "Cập nhật hồ sơ Giáo vụ thành công!" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi cập nhật hồ sơ: " + err.message });
    }
});

// ============================================================
// CÁC API PHỤ TRỢ (Dùng để đổ dữ liệu vào thẻ <select> khi mở lớp mới)
// ============================================================

// 1. API đổ dữ liệu Học kỳ và Môn học (Load 1 lần lúc mở form)
router.get('/danh-muc-ho-tro', async (req, res) => {
    try {
        const monHoc = await executeQuery("SELECT MaMH, TenMH FROM MonHoc", {}, req.user.name);
        const hocKy = await executeQuery("SELECT MaHK, TenHK, NamHoc FROM HocKy ORDER BY NamHoc DESC", {}, req.user.name);
        // 🔥 Đã xóa cái lệnh lấy full Giảng Viên ở đây đi rồi!
        
        res.json({ monHoc, hocKy });
    } catch (err) {
        res.status(500).json({ message: "Lỗi tải danh mục hỗ trợ: " + err.message });
    }
});

// 2. Lấy Giảng Viên CÓ GIẤY PHÉP theo từng môn học
router.get('/giang-vien-theo-mon/:maMH', async (req, res) => {
    const { maMH } = req.params;
    try {
        // 🔥 Gọi thẳng vào View đã được cấp quyền cho Giáo Vụ
        const sql = `SELECT MaGV, HoTen FROM vw_GiaoVu_GiangVienDayMon WHERE MaMH = @MaMH`;
        
        const result = await executeQuery(sql, { MaMH: maMH }, req.user.name);
        res.json(result || []);
    } catch (err) {
        console.error("Lỗi lấy GV theo môn:", err);
        res.status(500).json({ message: "Lỗi lấy Giảng viên: " + err.message });
    }
});


module.exports = router;