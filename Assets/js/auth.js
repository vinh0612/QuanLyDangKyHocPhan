/**
 * auth.js
 * Xử lý đăng nhập, đăng xuất và phân quyền (Kết nối API Node.js thực tế)
 */

// Khóa cứng địa chỉ gốc của Backend Node.js
const API_BASE_URL = 'http://localhost:5123/api'; 

const Auth = {
    // 1. NÂNG CẤP: Hàm đăng nhập bất đồng bộ (async/await) kết nối Server
    async login(tenLogin, password) {
        try {
            // Gọi API đăng nhập đến Server Node.js
            const response = await fetch(`${API_BASE_URL}/Auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    username: tenLogin, 
                    password: password 
                })
            });

            const data = await response.json();

            // Nếu Server xác thực thành công (HTTP Status 200)
            if (response.ok) {
                const sessionData = {
                    TenLogin: data.username,
                    Role: data.role,
                    Token: data.token // Lưu JWT Token quyền lực để dùng cho các request sau
                };

                // Lưu thông tin phiên đăng nhập vào localStorage
                localStorage.setItem('currentUser', JSON.stringify(sessionData));

                // Tự động chuyển hướng trang theo vai trò (Role)
                this.redirectByRole(data.role);
                return true;
            } else {
                // Nếu sai tài khoản/mật khẩu hoặc lỗi từ SQL Server ném lên
                alert(data.message || 'Đăng nhập thất bại!');
                return false;
            }
        } catch (error) {
            console.error("Lỗi kết nối đến hệ thống Backend:", error);
            alert("Không thể kết nối đến máy chủ Backend Node.js! Vui lòng kiểm tra lại terminal.");
            return false;
        }
    },

    // 2. Chuyển hướng trang theo vai trò (Role) sau khi đăng nhập thành công
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
                window.location.href = '../Shared/profile.html';
        }
    },

    // 3. Đăng xuất hệ thống
    logout() {
        localStorage.removeItem('currentUser');
        window.location.href = '../Auth/login.html';
    },

    // 4. Lấy thông tin user hiện tại đang lưu trong máy
    getCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    },

    // 5. Kiểm tra quyền truy cập của trang (Chốt chặn bảo mật tầng Client)
    checkAuth(allowedRoles) {
        const user = this.getCurrentUser();
        
        // Nếu chưa đăng nhập hoặc không có Token -> Đá bay về trang login
        if (!user || !user.Token) {
            window.location.href = '../Auth/login.html';
            return;
        }

        // Logic phân cấp quyền kế thừa (Hierarchy)
        const effectiveRoles = [user.Role];
        if (user.Role === 'TruongKhoa' || user.Role === 'TruongBoMon') {
            effectiveRoles.push('GiangVien');
        }
        if (user.Role === 'TruongKhoa') {
            effectiveRoles.push('TruongBoMon');
        }

        // Kiểm tra xem vai trò hiện tại có nằm trong danh sách được phép vào trang không
        const hasPermission = allowedRoles.some(role => effectiveRoles.includes(role));
        if (!hasPermission) {
            alert('Bạn không có quyền truy cập trang này!');
            this.redirectByRole(user.Role);
        }
    },

    // ============================================================
    // 🛠️ HÀM BỔ SUNG SIÊU VIP: Dùng chung để gọi các API bảo mật RLS
    // ============================================================
    async fetchWithAuth(endpoint, options = {}) {
        const user = this.getCurrentUser();
        
        // Tạo cấu trúc Headers mặc định
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Nếu user đã đăng nhập, tự động đính kèm Token theo chuẩn Bearer Authentication
        if (user && user.Token) {
            headers['Authorization'] = `Bearer ${user.Token}`;
        }

        // Thực hiện fetch tự động cấu hình địa chỉ Server
        return fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
    }
};