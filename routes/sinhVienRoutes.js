const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/db'); 
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Kích hoạt tường lửa bảo mật cho toàn bộ Router Sinh Viên
router.use(verifyToken);
router.use(checkRole(['SinhVien']));

// 1. API Lấy hồ sơ (Có Fallback chống sập)
router.get('/ho-so', async (req, res) => {
    try {
        const result = await executeQuery("SELECT * FROM vw_SV_ThongTinCaNhan", {}, req.user.name);
        if (result && result.length > 0) res.json(result[0]);
        else throw new Error("View rỗng");
    } catch (err) {
        try {
            const fallbackResult = await executeQuery("SELECT * FROM SinhVien WHERE MaSV = @MaSV", { MaSV: req.user.name }, req.user.name);
            res.json(fallbackResult[0] || {});
        } catch (e) { res.status(500).json({ message: "Lỗi hệ thống" }); }
    }
});

// 2. API Xem lớp đang mở
router.get('/lhp-hien-tai', async (req, res) => {
    try {
        const result = await executeQuery("SELECT * FROM vw_LHP_HienTai", {}, req.user.name);
        res.json(result);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 3. API Lấy bảng điểm
router.get('/ket-qua-hoc-tap', async (req, res) => {
    try {
        const result = await executeQuery("SELECT * FROM vw_SV_DiemCuaMiNh", {}, req.user.name);
        res.json(result);
    } catch (err) { res.status(500).json({ message: "Lỗi truy xuất bảng điểm" }); }
});

// =====================================================================
// 🔥 4. API DANH SÁCH MÔN ĐÃ ĐĂNG KÝ (ĐÃ FIX: Chạy qua View bảo mật của nhóm)
// =====================================================================
router.get('/lhp-da-dang-ky', async (req, res) => {
    const masv = req.user.name;
    try {
        // Gọi trực tiếp View bảo mật mà nhóm bro đã gán quyền SELECT ở dòng 864
        // View này dưới SQL Server đã tự động RLS lọc đúng môn của SV001 rồi!
        const sqlView = `SELECT * FROM vw_SV_DangKyCuaMiNh`;
        
        const result = await executeQuery(sqlView, {}, masv);
        return res.json(result || []);
    } catch (err) {
        console.error("❌ Lỗi truy vấn View Đăng Ký của nhóm:", err.message);
        res.json([]); 
    }
});

// =====================================================================
// 🔥 5. API ĐĂNG KÝ (Tích hợp bộ lọc Dịch lỗi Vỡ Font ODBC)
// =====================================================================
router.post('/dang-ky', async (req, res) => {
    const { maLHP } = req.body;
    try {
        await executeQuery("EXEC sp_SV_DangKy @MaLHP", { MaLHP: maLHP }, req.user.name);
        res.json({ message: "Đăng ký lớp học phần thành công!" });
    } catch (err) {
        let errMsg = err.message;
        
        // Bắt Keyword vỡ font từ SQL Server
        if (errMsg.includes('ng k') || errMsg.includes('đã đăng ký')) {
            errMsg = 'Môn học này đã được bạn đăng ký trong học kỳ hiện tại!';
        } else if (errMsg.includes('s s') || errMsg.includes('sĩ số')) {
            errMsg = 'Rất tiếc, lớp học phần này đã đầy sĩ số!';
        } else if (errMsg.includes('trng') || errMsg.includes('trùng')) {
            errMsg = 'Lịch học bị trùng với một môn khác bạn đã đăng ký!';
        } else {
            // Gọt bỏ đoạn text rác [Microsoft][ODBC SQL Server Driver]
            errMsg = errMsg.replace(/\[.*?\]/g, '').trim();
        }
        
        res.status(400).json({ message: errMsg });
    }
});

// 6. API Hủy đăng ký
router.post('/huy-dang-ky', async (req, res) => {
    const { maLHP } = req.body;
    try {
        await executeQuery("EXEC sp_SV_HuyDangKy @MaLHP", { MaLHP: maLHP }, req.user.name);
        res.json({ message: "Hủy đăng ký thành công!" });
    } catch (err) {
        res.status(400).json({ message: err.message.replace(/\[.*?\]/g, '').trim() });
    }
});

module.exports = router;