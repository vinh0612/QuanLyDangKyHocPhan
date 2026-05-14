/**
 * layout.js
 * Tự động render Navbar và Sidebar bằng Material Symbols
 */

document.addEventListener('DOMContentLoaded', () => {
    const user = Auth.getCurrentUser();
    if (!user) return;

    renderLayout(user);
});

function renderLayout(user) {
    const body = document.body;
    
    // Inject Google Font Link if not exists
    if (!document.getElementById('material-symbols-link')) {
        const link = document.createElement('link');
        link.id = 'material-symbols-link';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0';
        document.head.appendChild(link);
    }

    if (!document.getElementById('main-wrapper')) {
        const content = body.innerHTML;
        body.innerHTML = `
            <div id="main-wrapper">
                <nav class="navbar" id="top-navbar"></nav>
                <div class="app-container" style="display: flex; flex: 1;">
                    <aside class="sidebar" id="app-sidebar"></aside>
                    <main class="main-content">
                        ${content}
                    </main>
                </div>
            </div>
        `;
    }

    renderNavbar(user);
    renderSidebar(user);
}

function renderNavbar(user) {
    const navbar = document.getElementById('top-navbar');
    if (!navbar) return;

    navbar.innerHTML = `
        <div class="nav-brand-desktop" style="font-weight: 700; color: #1e293b; font-size: 1.2rem;">
            Quản lý Đăng ký Học phần
        </div>
        <div class="nav-user">
            <div class="user-info text-end d-none d-md-block">
                <div class="fw-bold" style="font-size: 0.95rem;">${user.HoTen}</div>
                <div class="text-muted small">${user.Role}</div>
            </div>
            <button onclick="Auth.logout()" class="btn-logout">
                <span class="material-symbols-outlined" style="font-size: 18px;">logout</span>
                Đăng xuất
            </button>
        </div>
    `;
}

function renderSidebar(user) {
    const sidebar = document.getElementById('app-sidebar');
    if (!sidebar) return;

    let menuItems = [];
    const profileItem = { label: 'Cá nhân', icon: 'person', url: '/Shared/profile.html' };

    if (user.Role === 'SinhVien') {
        menuItems = [
            { label: 'Đăng ký học', icon: 'edit_calendar', url: '/SinhVien/dang-ky-mon.html' },
            { label: 'Kết quả học tập', icon: 'grade', url: '/SinhVien/xem-diem.html' },
            profileItem
        ];
    } else if (user.Role === 'GiaoVu') {
        menuItems = [
            { label: 'Mở lớp HP', icon: 'add_home', url: '/GiaoVu/mo-lop-hoc-phan.html' },
            { label: 'Danh sách ĐK', icon: 'list_alt', url: '/GiaoVu/xem-danh-sach-dk.html' },
            { label: 'Danh mục môn', icon: 'auto_stories', url: '/Shared/mon-hoc.html' },
            { label: 'Lịch dạy GV', icon: 'calendar_month', url: '/GiangVien/lich-day.html' },
            profileItem
        ];
    } else {
        // Teacher / Heads
        menuItems = [
            { label: 'Lịch dạy', icon: 'calendar_month', url: '/GiangVien/lich-day.html' },
            { label: 'Lớp phụ trách', icon: 'groups', url: '/GiangVien/lop-phu-trach.html' },
            { label: 'Nhập điểm', icon: 'edit_square', url: '/GiangVien/nhap-diem.html' },
            { label: 'Danh mục môn', icon: 'auto_stories', url: '/Shared/mon-hoc.html' }
        ];

        if (user.Role === 'TruongBoMon') {
            menuItems.push(
                { label: 'Quản lý sĩ số', icon: 'monitoring', url: '/TruongBoMon/quan-ly-si-so.html' },
                { label: 'Lịch dạy bộ môn', icon: 'view_agenda', url: '/TruongBoMon/lich-day-bo-mon.html' }
            );
        }

        if (user.Role === 'TruongKhoa') {
            menuItems.push(
                { label: 'Quản lý môn học', icon: 'menu_book', url: '/TruongKhoa/quan-ly-mon-hoc.html' }
            );
        }

        menuItems.push(profileItem);
    }

    const currentPath = window.location.pathname;
    
    sidebar.innerHTML = `
        <div class="nav-brand">PORTAL</div>
        <ul class="nav-menu">
            ${menuItems.map(item => `
                <li class="${currentPath.includes(item.url) ? 'active' : ''}">
                    <a href="${item.url}">
                        <span class="material-symbols-outlined menu-icon">${item.icon}</span>
                        <span class="menu-label">${item.label}</span>
                    </a>
                </li>
            `).join('')}
        </ul>
    `;
}
