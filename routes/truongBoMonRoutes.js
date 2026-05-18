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

module.exports = router;