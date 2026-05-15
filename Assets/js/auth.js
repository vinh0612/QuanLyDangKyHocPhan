/**
 * auth.js
 * Xu ly dang nhap, dang xuat va phan quyen
 */

const Auth = {
    login(tenLogin, password) {
        const users = JSON.parse(localStorage.getItem('Users') || '[]');
        const user = users.find(u => u.TenLogin === tenLogin && u.Password === password);

        if (user) {
            let hoTen = '';
            // Lay ho ten tuong ung voi MaNguoiDung
            if (user.Role === 'SinhVien') {
                const sv = JSON.parse(localStorage.getItem('SinhVien') || '[]').find(s => s.MaSV === user.MaNguoiDung);
                hoTen = sv ? sv.HoTen : user.TenLogin;
            } else if (user.Role === 'GiaoVu') {
                const gv = JSON.parse(localStorage.getItem('GiaoVu') || '[]').find(g => g.MaGV_GV === user.MaNguoiDung);
                hoTen = gv ? gv.HoTen : user.TenLogin;
            } else {
                // GiangVien, TruongBoMon, TruongKhoa
                const gv = JSON.parse(localStorage.getItem('GiaoVien') || '[]').find(g => g.MaGV === user.MaNguoiDung);
                hoTen = gv ? gv.HoTen : user.TenLogin;
            }

            const sessionData = {
                MaNguoiDung: user.MaNguoiDung,
                TenLogin: user.TenLogin,
                Role: user.Role,
                HoTen: hoTen
            };

            // Dung localStorage thay vi sessionStorage de thong tin khong bi mat khi reload
            localStorage.setItem('currentUser', JSON.stringify(sessionData));

            // Redirect theo Role
            this.redirectByRole(user.Role);
            return true;
        }
        return false;
    },

    redirectByRole(role) {
        switch (role) {
            case 'SinhVien':
                window.location.href = '../SinhVien/dashboard.html';
                break;
            case 'GiangVien':
                window.location.href = '../GiangVien/dashboard.html';
                break;
            case 'TruongBoMon':
                window.location.href = '../TruongBoMon/dashboard.html';
                break;
            case 'TruongKhoa':
                window.location.href = '../TruongKhoa/dashboard.html';
                break;
            case 'GiaoVu':
                window.location.href = '../GiaoVu/dashboard.html';
                break;
            default:
                window.location.href = '/Shared/profile.html';
        }
    },

    logout() {
        localStorage.removeItem('currentUser');
        window.location.href = '../Auth/login.html';
    },

    getCurrentUser() {
        // Uu tien localStorage (moi), fallback sessionStorage (cu) va tu dong migrate
        let userStr = localStorage.getItem('currentUser');
        if (!userStr) {
            // Kiem tra sessionStorage (du lieu cu truoc khi doi sang localStorage)
            userStr = sessionStorage.getItem('currentUser');
            if (userStr) {
                // Tu dong migrate sang localStorage
                localStorage.setItem('currentUser', userStr);
                sessionStorage.removeItem('currentUser');
            }
        }
        return userStr ? JSON.parse(userStr) : null;
    },

    checkAuth(allowedRoles) {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = '../Auth/login.html';
            return;
        }

        // Hierarchy logic: TruongKhoa/TruongBoMon have GiangVien rights
        const effectiveRoles = [user.Role];
        if (user.Role === 'TruongKhoa' || user.Role === 'TruongBoMon') {
            effectiveRoles.push('GiangVien');
        }
        if (user.Role === 'TruongKhoa') {
            effectiveRoles.push('TruongBoMon');
        }

        const hasPermission = allowedRoles.some(role => effectiveRoles.includes(role));
        if (!hasPermission) {
            alert('Bạn không có quyền truy cập trang này!');
            this.redirectByRole(user.Role);
        }
    }
};

