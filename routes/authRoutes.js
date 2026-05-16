const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { executeQuery, sql } = require('../config/db'); // Trỏ ra thư mục gốc lấy db.js
require('dotenv').config();

// API: POST /api/Auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Vui lòng nhập tài khoản và mật khẩu.' });
    }

    // Cấu hình chuỗi kết nối riêng biệt cho từng người dùng để SQL Server xác thực (Windows Auth ngầm)
    const testConfig = {
        connectionString: `Driver={SQL Server};Server=localhost;Database=QLDangKyHocPhan;Uid=${username};Pwd=${password};`
    };

    try {
        const testPool = new sql.ConnectionPool(testConfig);
        await testPool.connect(); 

        const request = new sql.Request(testPool);
        
        // Truy vấn phân quyền bằng IS_MEMBER thần thánh
        const roleQuery = `
            SELECT 
                CASE 
                    WHEN IS_MEMBER('role_TruongKhoa') = 1 THEN 'TruongKhoa'
                    WHEN IS_MEMBER('role_TruongBoMon') = 1 THEN 'TruongBoMon'
                    WHEN IS_MEMBER('role_GiangVien') = 1 THEN 'GiangVien'
                    WHEN IS_MEMBER('role_GiaoVu') = 1 THEN 'GiaoVu'
                    WHEN IS_MEMBER('role_SinhVien') = 1 THEN 'SinhVien'
                    ELSE 'None'
                END AS RoleName`;
        
        const roleResult = await request.query(roleQuery);
        const role = roleResult.recordset[0]?.RoleName || 'None';
        await testPool.close(); 

        // Ghi Log Audit Đăng nhập thành công
        try {
            await executeQuery("EXEC sp_AuditDangNhap @TenLogin, 'LOGIN_OK', N'Đăng nhập thành công (Node.js)'", { TenLogin: username });
        } catch (auditErr) {
            console.error("Lỗi ghi log audit thành công:", auditErr.message);
        }

        // Cấp thẻ thông hành JWT
        const token = jwt.sign(
            { name: username, role: role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        return res.json({ message: 'Đăng nhập thành công', token, role, username });

    } catch (err) {
        console.error(`❌ Phát hiện đăng nhập thất bại cho user [${username}]:`, err.message);
        
        // Ghi Log Audit Đăng nhập Thất bại
        try {
            await executeQuery("EXEC sp_AuditDangNhap @TenLogin, 'LOGIN_FAIL', N'Sai tài khoản hoặc mật khẩu'", { TenLogin: username });
        } catch (auditErr) {
            console.error("Lỗi ghi log audit thất bại:", auditErr.message);
        }
        
        return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không chính xác!' });
    }
});

module.exports = router;