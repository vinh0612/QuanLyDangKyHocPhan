const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/db'); 
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// 🔒 KÍCH HOẠT TƯỜNG LỬA: Chỉ cho phép quyền GiangVien (bao gồm cả TruongBoMon và TruongKhoa nhờ cơ chế thừa kế của Middleware)
router.use(verifyToken);
router.use(checkRole(['GiangVien']));

// ============================================================
// 1. API: LẤY THÔNG TIN CÁ NHÂN GIẢNG VIÊN
// ============================================================
router.get('/ho-so', async (req, res) => {
    try {
        const result = await executeQuery("SELECT * FROM vw_GV_ThongTinCaNhan", {}, req.user.name);
        if (result && result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).json({ message: "Không tìm thấy hồ sơ giảng viên!" });
        }
    } catch (err) {
        res.status(500).json({ message: "Lỗi truy xuất hồ sơ: " + err.message });
    }
});

// ============================================================
// 2. API: XEM LỊCH DẠY CHI TIẾT
// ============================================================
router.get('/lich-day', async (req, res) => {
    try {
        const result = await executeQuery("SELECT * FROM vw_GV_LichDay", {}, req.user.name);
        res.json(result || []);
    } catch (err) {
        res.status(500).json({ message: "Lỗi tải lịch dạy: " + err.message });
    }
});

// ============================================================
// 3. API: XEM DANH SÁCH LỚP HỌC PHẦN ĐANG PHỤ TRÁCH
// ============================================================
router.get('/lop-phu-trach', async (req, res) => {
    try {
        const result = await executeQuery("SELECT * FROM vw_GV_LopPhuTrach", {}, req.user.name);
        res.json(result || []);
    } catch (err) {
        res.status(500).json({ message: "Lỗi tải lớp phụ trách: " + err.message });
    }
});

// ============================================================
// 4. API: XEM ĐIỂM SỐ CỦA LỚP MÌNH DẠY
// ============================================================
router.get('/diem-lop-minh', async (req, res) => {
    try {
        const result = await executeQuery("SELECT * FROM vw_GV_DiemLopMinh", {}, req.user.name);
        res.json(result || []);
    } catch (err) {
        res.status(500).json({ message: "Lỗi tải bảng điểm lớp: " + err.message });
    }
});

// ============================================================
// 5. API: NHẬP ĐIỂM / SỬA ĐIỂM CHO SINH VIÊN (sp_GV_NhapDiem)
// ============================================================
router.post('/nhap-diem', async (req, res) => {
    const { maDK, diemGiuaKy, diemCuoiKy } = req.body;

    if (!maDK || diemGiuaKy === undefined || diemCuoiKy === undefined) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ Mã đăng ký, Điểm GK và Điểm CK!" });
    }

    try {
        // Thực thi Stored Procedure bảo mật (Kiểm tra xem GV có dạy lớp này không ngay dưới DB)
        await executeQuery(
            "EXEC sp_GV_NhapDiem @MaDK, @DiemGiuaKy, @DiemCuoiKy", 
            { MaDK: maDK, DiemGiuaKy: parseFloat(diemGiuaKy), DiemCuoiKy: parseFloat(diemCuoiKy) }, 
            req.user.name
        );
        res.json({ message: "Cập nhật điểm số thành công!" });
    } catch (err) {
        // Gọt bỏ rác từ thông báo lỗi của SQL Server
        const errMsg = err.message.replace(/\[.*?\]/g, '').trim();
        res.status(400).json({ message: errMsg });
    }
});

// ============================================================
// 6. API: CẬP NHẬT THÔNG TIN CÁ NHÂN GIẢNG VIÊN (sp_GV_CapNhatCaNhan)
// ============================================================
router.post('/cap-nhat-ho-so', async (req, res) => {
    const { diaChi, soDT, email } = req.body;
    try {
        await executeQuery(
            "EXEC sp_GV_CapNhatCaNhan @DiaChi, @SoDT, @Email",
            { DiaChi: diaChi || null, SoDT: soDT || null, Email: email || null },
            req.user.name
        );
        res.json({ message: "Cập nhật thông tin cá nhân thành công!" });
    } catch (err) {
        res.status(400).json({ message: err.message.replace(/\[.*?\]/g, '').trim() });
    }
});

// ============================================================
// 7. API: LẤY DANH MỤC TẤT CẢ MÔN HỌC ĐÀO TẠO (Bản fix lỗi 500)
// ============================================================
router.get('/tat-ca-mon-hoc', async (req, res) => {
    try {
        // TUÂN THỦ BẢO MẬT: Không JOIN bảng Khoa nữa để tránh dính lỗi Permission Denied.
        // Dùng CASE WHEN dịch trực tiếp MaKhoa sang tên hiển thị dựa trên CSDL mẫu của nhóm!
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
        console.error("❌ Lỗi truy vấn danh mục môn học:", err.message);
        res.status(500).json({ message: "Lỗi tải danh mục môn học: " + err.message });
    }
});

// ============================================================
// 8. API: LẤY DỮ LIỆU ĐIỂM DANH THEO NGÀY
// ============================================================
router.get('/lay-diem-danh', async (req, res) => {
    const { maLHP, ngay } = req.query;
    if (!maLHP || !ngay) return res.status(400).json({ message: "Thiếu tham số lớp hoặc ngày!" });
    
    try {
        const sql = "SELECT MaSV, CoMat, GhiChu FROM DiemDanh WHERE MaLHP = @MaLHP AND Ngay = @Ngay";
        const result = await executeQuery(sql, { MaLHP: maLHP, Ngay: ngay }, req.user.name);
        res.json(result || []);
    } catch (err) {
        res.status(500).json({ message: "Lỗi lấy dữ liệu điểm danh: " + err.message });
    }
});

// ============================================================
// 9. API: LƯU / CẬP NHẬT KẾT QUẢ ĐIỂM DANH (UPSERT)
// ============================================================
router.post('/luu-diem-danh', async (req, res) => {
    const { maLHP, ngay, danhSach } = req.body;
    if (!maLHP || !ngay || !danhSach) return res.status(400).json({ message: "Dữ liệu không hợp lệ!" });

    try {
        // Dùng vòng lặp chạy lệnh UPSERT (Nếu đã điểm danh rồi thì UPDATE, chưa thì INSERT)
        for (const sv of danhSach) {
            const sql = `
                IF EXISTS (SELECT 1 FROM DiemDanh WHERE MaLHP = @MaLHP AND Ngay = @Ngay AND MaSV = @MaSV)
                    UPDATE DiemDanh SET CoMat = @CoMat, GhiChu = @GhiChu WHERE MaLHP = @MaLHP AND Ngay = @Ngay AND MaSV = @MaSV
                ELSE
                    INSERT INTO DiemDanh (MaLHP, Ngay, MaSV, CoMat, GhiChu) VALUES (@MaLHP, @Ngay, @MaSV, @CoMat, @GhiChu)
            `;
            await executeQuery(sql, { 
                MaLHP: maLHP, Ngay: ngay, MaSV: sv.MaSV, 
                CoMat: sv.CoMat ? 1 : 0, GhiChu: sv.GhiChu || '' 
            }, req.user.name);
        }
        res.json({ message: "Lưu kết quả điểm danh thành công!" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi lưu điểm danh: " + err.message });
    }
});

// API: Lấy danh sách Học kỳ cho Giảng Viên
router.get('/hoc-ky', async (req, res) => {
    try {
        const sql = `SELECT MaHK, TenHK, NamHoc, LaHKHienTai FROM HocKy ORDER BY NamHoc DESC, MaHK DESC`;
        const result = await executeQuery(sql, {}, req.user.name);
        res.json(result || []);
    } catch (err) {
        res.status(500).json({ message: "Lỗi tải học kỳ: " + err.message });
    }
});

module.exports = router;