const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/db');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Kích hoạt tường lửa JWT cho toàn bộ Router này
router.use(verifyToken);

// ============================================================
// LẤY HỒ SƠ GIẢNG VIÊN (Có cơ chế Fallback chống sập View)
// ============================================================
router.get('/ho-so', checkRole(['GiangVien']), async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM vw_GV_ThongTinCaNhan', {}, req.user.name);
        if (result && result.length > 0) {
            res.json(result[0]); 
        } else {
            throw new Error("View rỗng hoặc không tồn tại");
        }
    } catch (err) {
        try {
            const fallbackResult = await executeQuery('SELECT * FROM GiangVien WHERE MaGV = @MaGV', { MaGV: req.user.name }, req.user.name);
            res.json(fallbackResult[0] || {}); 
        } catch (e) {
            res.status(500).json({}); 
        }
    }
});

// ============================================================
// XEM LỊCH DẠY CHI TIẾT
// ============================================================
router.get('/lich-day', checkRole(['GiangVien']), async (req, res) => {
    try {
        const result = await executeQuery('SELECT * FROM vw_GV_LichDay', {}, req.user.name);
        res.json(result || []); 
    } catch (err) {
        try {
            const fallbackQuery = `
                SELECT 
                    lhp.MaLHP, lhp.MaMH, lhp.LichHoc, lhp.PhongHoc, lhp.SiSoHienTai,
                    mh.TenMH, mh.SoTinChi, 
                    hk.TenHK, hk.NamHoc
                FROM LopHocPhan lhp
                INNER JOIN MonHoc mh ON lhp.MaMH = mh.MaMH
                INNER JOIN HocKy hk ON lhp.MaHK = hk.MaHK
                WHERE lhp.MaGV = @MaGV
            `;
            const fallbackResult = await executeQuery(fallbackQuery, { MaGV: req.user.name }, req.user.name);
            res.json(fallbackResult || []);
        } catch(e) {
            res.status(500).json([]); 
        }
    }
});

// ============================================================
// DANH SÁCH SINH VIÊN (DÙNG ĐỂ CHẤM ĐIỂM)
// ============================================================
router.get('/danh-sach-sinh-vien', checkRole(['GiangVien', 'TruongBoMon']), async (req, res) => {
    const { maLHP } = req.query; 
    try {
        let sqlQuery = "SELECT * FROM vw_GV_DSSinhVienLopMinh";
        let params = {};
        if (maLHP) {
            sqlQuery += " WHERE MaLHP = @MaLHP";
            params.MaLHP = maLHP;
        }
        const result = await executeQuery(sqlQuery, params, req.user.name);
        res.json(result || []);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lấy danh sách sinh viên", error: err.message });
    }
});

// ============================================================
// NHẬP ĐIỂM HÀNG LOẠT (GỌI STORED PROCEDURE SP_GV_NHAPDIEM)
// ============================================================
router.post('/nhap-diem', checkRole(['GiangVien', 'TruongBoMon']), async (req, res) => {
    const { maLHP, bangDiem } = req.body; 
    try {
        for (const item of bangDiem) {
            const rawSql = `
                EXEC sp_GV_NhapDiem 
                    @MaSV = '${item.maSV}', 
                    @MaLHP = '${maLHP}', 
                    @DiemGiuaKy = ${item.diemGK !== null ? item.diemGK : 'NULL'}, 
                    @DiemCuoiKy = ${item.diemCK !== null ? item.diemCK : 'NULL'}
            `;
            // Chạy bằng quyền của Giảng viên để kích hoạt RLS
            await executeQuery(rawSql, {}, req.user.name);
        }
        res.json({ message: "Lưu toàn bộ bảng điểm thành công!" });
    } catch (err) {
        res.status(400).json({ message: "Lỗi lưu bảng điểm: " + err.message });
    }
});

module.exports = router;