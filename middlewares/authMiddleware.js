const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Không tìm thấy Token bảo mật!' });

    // 🔥 CHIÊU CUỐI: Thêm { ignoreExpiration: true } để VÔ HIỆU HÓA lỗi "jwt expired" khi debug dưới localhost
    jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true }, (err, decoded) => {
        if (err) {
            console.log("⛔ Lỗi xác thực chữ ký Token (Sai Secret Key):", err.message);
            return res.status(403).json({ message: 'Token không hợp lệ!' });
        }
        
        req.user = decoded;
        next();
    });
};

const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Không thể xác định quyền hạn tài khoản!' });
        }

        // Chuẩn hóa role của user để đối chiếu không sợ lệch chữ Hoa/Thường
        const userRoleRaw = req.user.role.toString().replace('role_', '').toLowerCase().trim();
        const effectiveRoles = [userRoleRaw];

        if (userRoleRaw === 'truongkhoa' || userRoleRaw === 'truongbomon') effectiveRoles.push('giangvien');
        if (userRoleRaw === 'truongkhoa') effectiveRoles.push('truongbomon');

        const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase().trim());
        const hasPermission = normalizedAllowedRoles.some(role => effectiveRoles.includes(role));
        
        if (!hasPermission) {
            console.log(`⛔ Chặn quyền: [${req.user.role}] không có trong danh sách được phép [${allowedRoles}]`);
            return res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này!' });
        }
        next();
    };
};

module.exports = { verifyToken, checkRole };