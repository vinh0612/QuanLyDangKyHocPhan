const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/db'); 
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Kích hoạt tường lửa bảo mật
router.use(verifyToken);
router.use(checkRole(['TruongKhoa']));

// =====================================================================
// TAB 0: DASHBOARD (TỔNG QUAN KHOA)
// =====================================================================

// 15. API Lấy toàn bộ số liệu thống kê cho Dashboard
router.get('/dashboard-stats', async (req, res) => {
    try {
        // Gọi Stored Procedure đã được bảo kê
        const sql = `EXEC sp_TruongKhoa_ThongKeDashboard`;
        
        const result = await executeQuery(sql, {}, req.user.name);
        
        if (result && result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({ message: "Không tìm thấy dữ liệu thống kê" });
        }
    } catch (err) {
        console.error("Lỗi tải Dashboard:", err);
        res.status(500).json({ message: "Lỗi hệ thống: " + err.message });
    }
});

// =====================================================================
// TAB 1: QUẢN LÝ MÔN HỌC (CRUD)
// =====================================================================

// 1. API Lấy danh sách môn học của Khoa (Kèm thông tin phân công)
// 1. API Lấy danh sách môn học của Khoa
router.get('/mon-hoc', async (req, res) => {
    try {
        // Thay vì truy vấn loằng ngoằng, giờ chỉ cần SELECT thẳng từ View bảo mật
        const sql = `SELECT * FROM vw_TK_DanhSachMonHoc`;
        
        const result = await executeQuery(sql, {}, req.user.name);
        res.json(result || []);
    } catch (err) { 
        console.error("Lỗi API get /mon-hoc:", err);
        res.status(500).json({ message: "Lỗi truy xuất danh mục môn học" }); 
    }
});

// 2. API Thêm môn học
// API Thêm môn học mới (Tự động gán đúng Khoa của Trưởng Khoa)
// API Thêm môn học mới (Tự động gán đúng Khoa của Trưởng Khoa)
// API Thêm môn học mới (Tự động gán đúng Khoa của Trưởng Khoa)
router.post('/mon-hoc', async (req, res) => {
    const { maMH, tenMH, soTinChi } = req.body;

    try {
        // 🔥 Đã fix: Dùng cú pháp INSERT ... SELECT để né lỗi "Not prepared" của Node.js
        const sql = `
            INSERT INTO MonHoc (MaMH, TenMH, SoTinChi, MaKhoa)
            SELECT @MaMH, @TenMH, @SoTinChi, MaKhoa 
            FROM Khoa 
            WHERE MaTruongKhoa = (SELECT MaGV FROM GiaoVien WHERE TenLogin = SUSER_SNAME());
        `;

        await executeQuery(sql, { 
            MaMH: maMH,
            TenMH: tenMH, 
            SoTinChi: soTinChi 
        }, req.user.name);
        
        res.status(201).json({ message: "Thêm môn học thành công!" });
    } catch (err) {
        console.error("Lỗi thêm môn học:", err);
        let errMsg = err.message;
        if(errMsg.includes('PRIMARY KEY') || errMsg.includes('Violation of PRIMARY KEY')) {
            errMsg = 'Mã môn học này đã tồn tại trong hệ thống!';
        } else {
            errMsg = errMsg.replace(/\[.*?\]/g, '').trim();
        }
        res.status(400).json({ message: errMsg });
    }
});

// 3. API Sửa môn học
router.put('/mon-hoc', async (req, res) => {
    const { MaMH, TenMH, SoTinChi } = req.body;
    try {
        await executeQuery(
            "EXEC sp_TruongKhoa_SuaMonHoc @MaMH, @TenMH, @SoTinChi", 
            { MaMH, TenMH, SoTinChi: parseInt(SoTinChi) }, 
            req.user.name
        );
        res.json({ message: "Cập nhật môn học thành công!" });
    } catch (err) {
        res.status(400).json({ message: err.message.replace(/\[.*?\]/g, '').trim() });
    }
});

// 4. API Xóa môn học
router.delete('/mon-hoc/:maMH', async (req, res) => {
    const { maMH } = req.params;
    try {
        await executeQuery(
            "EXEC sp_TruongKhoa_XoaMonHoc @MaMH", 
            { MaMH: maMH }, 
            req.user.name
        );
        res.json({ message: "Xóa môn học thành công!" });
    } catch (err) {
        let errMsg = err.message;
        if(errMsg.includes('REFERENCE') || errMsg.includes('FK_')) {
            errMsg = 'Không thể xóa môn học đã có lớp học phần hoặc đã được phân công!';
        } else {
            errMsg = errMsg.replace(/\[.*?\]/g, '').trim();
        }
        res.status(400).json({ message: errMsg });
    }
});

// =====================================================================
// TAB 2: PHÂN CÔNG GIẢNG VIÊN (AssignTab)
// =====================================================================

// 5. API Lấy danh sách giảng viên trong khoa (Đổ vào thẻ <select> formMaGV)
// API Lấy danh sách giảng viên trong khoa (Để đổ vào form Phân công)
// 5. API Lấy danh sách giảng viên trong khoa (Đổ vào thẻ <select> formMaGV)
router.get('/giang-vien-khoa', async (req, res) => {
    try {
        // Gọi thẳng vào View đã được cấp quyền, SQL Server tự động filter bằng SUSER_SNAME()
        const sql = `SELECT MaGV, HoTen FROM vw_TK_DanhSachGiangVien`;
        
        const result = await executeQuery(sql, {}, req.user.name);
        res.json(result || []);
    } catch (err) {
        console.error("Lỗi lấy DS Giảng viên:", err);
        res.status(500).json({ message: "Lỗi tải danh sách giảng viên" });
    }
});

// 6. API Phân công / Cập nhật người dạy môn học
router.post('/phan-cong', async (req, res) => {
    const { MaMH, MaGV } = req.body;
    try {
        await executeQuery(
            "EXEC sp_TruongKhoa_PhanCongDay @MaMH, @MaGV", 
            { MaMH, MaGV }, 
            req.user.name
        );
        res.json({ message: "Phân công giảng viên thành công!" });
    } catch (err) {
        res.status(400).json({ message: err.message.replace(/\[.*?\]/g, '').trim() });
    }
});

// 7. API Gỡ phân công giảng viên
router.delete('/phan-cong', async (req, res) => {
    const { MaMH, MaGV } = req.body;
    try {
        await executeQuery(
            "EXEC sp_TruongKhoa_XoaPhanCong @MaMH, @MaGV", 
            { MaMH, MaGV }, 
            req.user.name
        );
        res.json({ message: "Đã gỡ phân công giảng dạy!" });
    } catch (err) {
        res.status(400).json({ message: err.message.replace(/\[.*?\]/g, '').trim() });
    }
});

// =====================================================================
// TAB 3: LỊCH DẠY CÁ NHÂN (Lớp Học Phần)
// =====================================================================

// 8. API Lấy danh sách Học kỳ (Đổ vào thẻ <select>)
router.get('/hoc-ky', async (req, res) => {
    try {
        // Đã đổi DangMo thành LaHKHienTai chuẩn theo DB
        const sql = `SELECT MaHK, TenHK, NamHoc, LaHKHienTai FROM HocKy ORDER BY NamHoc DESC, MaHK DESC`;
        const result = await executeQuery(sql, {}, req.user.name);
        res.json(result || []);
    } catch (err) {
        console.error("Lỗi lấy Học kỳ:", err);
        res.status(500).json({ message: "Lỗi tải dữ liệu học kỳ" });
    }
});

// 9. API Lấy lịch dạy của riêng Trưởng khoa (Giảng viên) theo Học kỳ
router.get('/lich-day/:maHK', async (req, res) => {
    const { maHK } = req.params;
    try {
        // Dùng View bảo mật thay vì chọc thẳng vào LopHocPhan
        const sql = `SELECT * FROM vw_TK_LichDayCaNhan WHERE MaHK = @MaHK`;
        
        const result = await executeQuery(sql, { MaHK: maHK }, req.user.name);
        res.json(result || []);
    } catch (err) {
        console.error("Lỗi lấy Lịch dạy:", err);
        res.status(500).json({ message: "Lỗi tải thời khóa biểu" });
    }
});

// =====================================================================
// TAB 4: QUẢN LÝ ĐIỂM SỐ
// =====================================================================

// 10. API Lấy danh sách lớp học phần đang dạy (Đổ vào Dropdown)
router.get('/lop-hoc-phan', async (req, res) => {
    try {
        const sql = `SELECT * FROM vw_TK_LopCuaToi`;
        const result = await executeQuery(sql, {}, req.user.name);
        res.json(result || []);
    } catch (err) {
        console.error("Lỗi get Lớp HP:", err);
        res.status(500).json({ message: "Lỗi tải lớp học phần" });
    }
});

// 11. API Lấy danh sách Sinh viên và Điểm theo Mã Lớp
router.get('/diem-lhp/:maLHP', async (req, res) => {
    const { maLHP } = req.params;
    try {
        const sql = `SELECT * FROM vw_TK_DanhSachDiem WHERE MaLHP = @MaLHP`;
        const result = await executeQuery(sql, { MaLHP: maLHP }, req.user.name);
        res.json(result || []);
    } catch (err) {
        console.error("Lỗi get Bảng điểm:", err);
        res.status(500).json({ message: "Lỗi tải bảng điểm" });
    }
});

// 12. API Lưu điểm (Dùng chung Stored Procedure của Giảng Viên)
router.post('/luu-diem', async (req, res) => {
    const { danhSachDiem } = req.body; 
    // danhSachDiem là mảng: [{ MaDK: 'DK01', DiemGiuaKy: 8, DiemCuoiKy: 7.5 }, ...]
    
    try {
        // Lặp qua từng sinh viên để gọi Stored Procedure lưu điểm
        for (const diem of danhSachDiem) {
            await executeQuery(
                "EXEC sp_GiangVien_NhapDiem @MaDK, @DiemGiuaKy, @DiemCuoiKy",
                { 
                    MaDK: diem.MaDK, 
                    DiemGiuaKy: diem.DiemGiuaKy, 
                    DiemCuoiKy: diem.DiemCuoiKy 
                },
                req.user.name
            );
        }
        res.json({ message: "Lưu toàn bộ điểm thành công!" });
    } catch (err) {
        console.error("Lỗi lưu điểm:", err);
        res.status(400).json({ message: "Lỗi khi lưu điểm: " + err.message });
    }
});

// =====================================================================
// TAB 5: HỒ SƠ CÁ NHÂN
// =====================================================================

// 13. API Lấy thông tin cá nhân (Dùng View)
router.get('/ho-so', async (req, res) => {
    try {
        // 1. Gọi View lấy thông tin cơ bản
        const sql = `SELECT * FROM vw_TK_HoSoCaNhan`;
        const result = await executeQuery(sql, {}, req.user.name);

        if (result && result.length > 0) {
            const profile = result[0];
            
            // 2. Gọi View lấy danh sách môn học
            const sqlMonDay = `SELECT TenMH FROM vw_TK_MonPhuTrach`;
            const monDayResult = await executeQuery(sqlMonDay, {}, req.user.name);
            
            // Ép thành mảng tên môn, cách nhau bằng dấu phẩy
            profile.MonDay = monDayResult.map(m => m.TenMH).join(', '); 
            
            res.json(profile);
        } else {
            res.status(404).json({ message: "Không tìm thấy dữ liệu cá nhân" });
        }
    } catch (err) {
        console.error("Lỗi get hồ sơ:", err);
        res.status(500).json({ message: "Lỗi tải hồ sơ: " + err.message });
    }
});

// 14. API Cập nhật Email và SĐT (Dùng Stored Procedure)
router.put('/ho-so', async (req, res) => {
    const { email, soDT } = req.body;
    try {
        const sql = `EXEC sp_TruongKhoa_CapNhatHoSo @Email, @SoDT`;
        await executeQuery(sql, { Email: email || null, SoDT: soDT || null }, req.user.name);
        res.json({ message: "Cập nhật hồ sơ thành công!" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi cập nhật hồ sơ: " + err.message });
    }
});

// API Cập nhật thông tin môn học (Sửa môn)
router.put('/mon-hoc/:maMH', async (req, res) => {
    const { maMH } = req.params;
    const { tenMH, soTinChi } = req.body;
    
    try {
        const sql = `
            UPDATE MonHoc 
            SET TenMH = @TenMH, SoTinChi = @SoTinChi 
            WHERE MaMH = @MaMH
        `;
        
        await executeQuery(sql, { 
            MaMH: maMH, 
            TenMH: tenMH, 
            SoTinChi: soTinChi 
        }, req.user.name);
        
        res.json({ message: "Cập nhật môn học thành công!" });
    } catch (err) {
        console.error("Lỗi cập nhật môn học:", err);
        res.status(500).json({ message: "Lỗi khi cập nhật: " + err.message });
    }
});

module.exports = router;