require('dotenv').config(); // LUÔN LUÔN ĐẶT DÒNG NÀY Ở DÒNG SỐ 1

const express = require('express');
const cors = require('cors');
const path = require('path');

// Khởi tạo App
const app = express();
app.use(cors({ origin: '*' })); 
app.use(express.json());
app.use(express.static(__dirname));

// Định tuyến trang Frontend mặc định
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Auth', 'login.html'));
});

// ============================================================
// IMPORT ROUTES ĐÃ BÓC TÁCH
// ============================================================
const authRoutes = require('./routes/authRoutes');
const sinhVienRoutes = require('./routes/sinhVienRoutes');
const giangVienRoutes = require('./routes/giangVienRoutes');
const giaoVuRoutes = require('./routes/giaoVuRoutes');
const truongKhoaRoutes = require('./routes/truongKhoaRoutes');
const truongBoMonRoutes = require('./routes/truongBoMonRoutes');

// NỐI CÁC ROUTER VÀ O ĐƯỜNG DẪN TƯƠNG ỨNG
app.use('/api/Auth', authRoutes);
app.use('/api/SinhVien', sinhVienRoutes);
app.use('/api/GiangVien', giangVienRoutes);
app.use('/api/GiaoVu', giaoVuRoutes);
app.use('/api/TruongKhoa', truongKhoaRoutes);
app.use('/api/TruongBoMon', truongBoMonRoutes);


// ============================================================
// KHỞI ĐỘNG HỆ THỐNG
// ============================================================
const PORT = process.env.PORT || 5123;
app.listen(PORT, () => {
    console.log(`Server Modular Node.js đang chạy tại: http://localhost:${PORT}`);
    console.log(`Biến môi trường JWT_SECRET đã được kích hoạt tập trung!`);
});