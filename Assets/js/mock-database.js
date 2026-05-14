/**
 * mock-database.js
 * Khoi tao du lieu mau cho he thong quan ly dang ky hoc phan
 */

const MockDB = {
    init() {
        if (localStorage.getItem('isInitialized')) return;

        console.log('Initializing mock database...');

        // 1. Khoa
        const khoa = [
            { MaKhoa: 'K01', TenKhoa: 'Công nghệ thông tin', MaTruongKhoa: 'GV001' },
            { MaKhoa: 'K02', TenKhoa: 'Kinh tế', MaTruongKhoa: 'GV004' }
        ];

        // 2. Bo Mon
        const boMon = [
            { MaBoMon: 'BM01', TenBoMon: 'Hệ thống thông tin', MaKhoa: 'K01', MaTruongBoMon: 'GV001' },
            { MaBoMon: 'BM02', TenBoMon: 'Kỹ thuật phần mềm', MaKhoa: 'K01', MaTruongBoMon: 'GV002' },
            { MaBoMon: 'BM03', TenBoMon: 'Quản trị kinh doanh', MaKhoa: 'K02', MaTruongBoMon: 'GV004' },
            { MaBoMon: 'BM04', TenBoMon: 'Tài chính ngân hàng', MaKhoa: 'K02', MaTruongBoMon: 'GV005' }
        ];

        // 3. Giao Vien (3 moi bo mon, tong 12)
        const giaoVien = [
            { MaGV: 'GV001', HoTen: 'Nguyễn Văn A', NgaySinh: '1975-05-10', DiaChi: 'Quận 1, HCM', SDT: '0901234567', Email: 'nva@school.edu.vn', MaBoMon: 'BM01', MaKhoa: 'K01' },
            { MaGV: 'GV002', HoTen: 'Trần Thị B', NgaySinh: '1980-02-20', DiaChi: 'Quận 3, HCM', SDT: '0902345678', Email: 'ttb@school.edu.vn', MaBoMon: 'BM02', MaKhoa: 'K01' },
            { MaGV: 'GV003', HoTen: 'Lê Văn C', NgaySinh: '1985-11-15', DiaChi: 'Quận 7, HCM', SDT: '0903456789', Email: 'lvc@school.edu.vn', MaBoMon: 'BM01', MaKhoa: 'K01' },
            { MaGV: 'GV004', HoTen: 'Phạm Văn D', NgaySinh: '1978-08-05', DiaChi: 'Quận 10, HCM', SDT: '0904567890', Email: 'pvd@school.edu.vn', MaBoMon: 'BM03', MaKhoa: 'K02' },
            { MaGV: 'GV005', HoTen: 'Hoàng Thị E', NgaySinh: '1982-04-12', DiaChi: 'Bình Thạnh, HCM', SDT: '0905678901', Email: 'hte@school.edu.vn', MaBoMon: 'BM04', MaKhoa: 'K02' },
            { MaGV: 'GV006', HoTen: 'Ngô Văn F', NgaySinh: '1988-12-30', DiaChi: 'Phú Nhuận, HCM', SDT: '0906789012', Email: 'nvf@school.edu.vn', MaBoMon: 'BM03', MaKhoa: 'K02' },
            { MaGV: 'GV007', HoTen: 'Đặng Thị G', NgaySinh: '1990-01-01', DiaChi: 'Thủ Đức, HCM', SDT: '0907890123', Email: 'dtg@school.edu.vn', MaBoMon: 'BM02', MaKhoa: 'K01' },
            { MaGV: 'GV008', HoTen: 'Bùi Văn H', NgaySinh: '1983-06-25', DiaChi: 'Quận 5, HCM', SDT: '0908901234', Email: 'bvh@school.edu.vn', MaBoMon: 'BM01', MaKhoa: 'K01' },
            { MaGV: 'GV009', HoTen: 'Vũ Thị I', NgaySinh: '1987-09-18', DiaChi: 'Quận 8, HCM', SDT: '0909012345', Email: 'vti@school.edu.vn', MaBoMon: 'BM04', MaKhoa: 'K02' },
            { MaGV: 'GV010', HoTen: 'Phan Văn J', NgaySinh: '1981-03-22', DiaChi: 'Gò Vấp, HCM', SDT: '0910123456', Email: 'pvj@school.edu.vn', MaBoMon: 'BM02', MaKhoa: 'K01' },
            { MaGV: 'GV011', HoTen: 'Đỗ Thị K', NgaySinh: '1984-07-07', DiaChi: 'Tân Bình, HCM', SDT: '0911234567', Email: 'dtk@school.edu.vn', MaBoMon: 'BM03', MaKhoa: 'K02' },
            { MaGV: 'GV012', HoTen: 'Lý Văn L', NgaySinh: '1986-10-10', DiaChi: 'Hóc Môn, HCM', SDT: '0912345678', Email: 'lvl@school.edu.vn', MaBoMon: 'BM04', MaKhoa: 'K02' }
        ];

        // 4. Sinh Vien (5 moi khoa, tong 10)
        const sinhVien = [];
        for (let i = 1; i <= 10; i++) {
            const maSV = 'SV' + i.toString().padStart(3, '0');
            const maKhoa = i <= 5 ? 'K01' : 'K02';
            sinhVien.push({
                MaSV: maSV,
                HoTen: `Sinh Viên ${i}`,
                NgaySinh: '2004-01-01',
                DiaChi: 'TP. Hồ Chí Minh',
                SDT: `030000000${i}`,
                Email: `${maSV.toLowerCase()}@student.edu.vn`,
                MaKhoa: maKhoa,
                NamVao: 2022
            });
        }

        // 5. Giao Vu (2)
        const giaoVu = [
            { MaGV_GV: 'GVU01', HoTen: 'Nguyễn Thị Giao Vụ 1', DiaChi: 'Quận 1, HCM', SDT: '0281234567', Email: 'giaovu1@school.edu.vn' },
            { MaGV_GV: 'GVU02', HoTen: 'Trần Văn Giao Vụ 2', DiaChi: 'Quận 3, HCM', SDT: '0287654321', Email: 'giaovu2@school.edu.vn' }
        ];

        // 6. Mon Hoc
        const monHoc = [
            { MaMH: 'CS101', TenMH: 'Cơ sở dữ liệu', SoTinChi: 3, MaKhoa: 'K01' },
            { MaMH: 'CS102', TenMH: 'Lập trình Web', SoTinChi: 4, MaKhoa: 'K01' },
            { MaMH: 'EC101', TenMH: 'Kinh tế vĩ mô', SoTinChi: 3, MaKhoa: 'K02' },
            { MaMH: 'EC102', TenMH: 'Quản trị học', SoTinChi: 2, MaKhoa: 'K02' }
        ];

        // 7. Hoc Ky
        const hocKy = [
            { MaHK: 'HK231', TenHK: 'Học kỳ 1', NamHoc: '2023-2024', NgayBatDau: '2023-09-01', NgayKetThuc: '2024-01-15', DangMo: false },
            { MaHK: 'HK232', TenHK: 'Học kỳ 2', NamHoc: '2023-2024', NgayBatDau: '2024-02-15', NgayKetThuc: '2024-06-30', DangMo: true }
        ];

        // 8. Lop Hoc Phan (6 lop trong HK dang mo HK232)
        const lopHocPhan = [
            { MaLHP: 'LHP01', MaMH: 'CS101', MaGV: 'GV001', MaHK: 'HK232', SiSoToiDa: 50, SiSoHienTai: 10, LichHoc: 'Thứ 2 (7-11)', PhongHoc: 'A.101' },
            { MaLHP: 'LHP02', MaMH: 'CS102', MaGV: 'GV002', MaHK: 'HK232', SiSoToiDa: 40, SiSoHienTai: 5, LichHoc: 'Thứ 4 (7-11)', PhongHoc: 'B.202' },
            { MaLHP: 'LHP03', MaMH: 'EC101', MaGV: 'GV004', MaHK: 'HK232', SiSoToiDa: 60, SiSoHienTai: 12, LichHoc: 'Thứ 3 (13-17)', PhongHoc: 'C.303' },
            { MaLHP: 'LHP04', MaMH: 'CS101', MaGV: 'GV003', MaHK: 'HK232', SiSoToiDa: 50, SiSoHienTai: 8, LichHoc: 'Thứ 6 (7-11)', PhongHoc: 'A.102' },
            { MaLHP: 'LHP05', MaMH: 'EC102', MaGV: 'GV006', MaHK: 'HK232', SiSoToiDa: 45, SiSoHienTai: 7, LichHoc: 'Thứ 5 (13-17)', PhongHoc: 'D.404' },
            { MaLHP: 'LHP06', MaMH: 'CS102', MaGV: 'GV007', MaHK: 'HK232', SiSoToiDa: 40, SiSoHienTai: 0, LichHoc: 'Thứ 7 (7-11)', PhongHoc: 'Lab.01' }
        ];

        // 9. Dang Ky Hoc + Bang Diem
        const dangKyHoc = [];
        const bangDiem = [];
        sinhVien.forEach((sv, index) => {
            // Moi sinh vien dang ky 2 lop
            const lhpIndex1 = (index % 3); 
            const lhpIndex2 = (index % 3) + 3;
            
            const dk1 = { MaDK: `DK${index*2+1}`, MaSV: sv.MaSV, MaLHP: lopHocPhan[lhpIndex1].MaLHP, NgayDK: '2024-02-20', TrangThai: 'Thành công' };
            const dk2 = { MaDK: `DK${index*2+2}`, MaSV: sv.MaSV, MaLHP: lopHocPhan[lhpIndex2].MaLHP, NgayDK: '2024-02-21', TrangThai: 'Thành công' };
            
            dangKyHoc.push(dk1, dk2);
            
            // Diem cho hoc ky truoc (gia su co du lieu cu)
            bangDiem.push({ MaBD: `BD${index*2+1}`, MaDK: dk1.MaDK, DiemGiuaKy: 8, DiemCuoiKy: 7, DiemTongKet: 7.3 });
        });

        // 10. Giao Vien Day Mon
        const giaoVienDayMon = [
            { MaGV: 'GV001', MaMH: 'CS101' },
            { MaGV: 'GV003', MaMH: 'CS101' },
            { MaGV: 'GV002', MaMH: 'CS102' },
            { MaGV: 'GV007', MaMH: 'CS102' },
            { MaGV: 'GV004', MaMH: 'EC101' },
            { MaGV: 'GV006', MaMH: 'EC102' }
        ];

        // 11. Users (TenLogin, Password, Role, MaNguoiDung)
        const users = [];

        // Sinh Vien
        sinhVien.forEach(sv => {
            users.push({ TenLogin: sv.MaSV, Password: '123456', Role: 'SinhVien', MaNguoiDung: sv.MaSV });
        });

        // Giao Vu
        giaoVu.forEach(gv => {
            users.push({ TenLogin: gv.MaGV_GV, Password: '123456', Role: 'GiaoVu', MaNguoiDung: gv.MaGV_GV });
        });

        // Giao Vien + Heads
        giaoVien.forEach(gv => {
            let role = 'GiangVien';
            // Check Truong Khoa
            if (khoa.some(k => k.MaTruongKhoa === gv.MaGV)) {
                role = 'TruongKhoa';
            } else if (boMon.some(bm => bm.MaTruongBoMon === gv.MaGV)) {
                role = 'TruongBoMon';
            }
            users.push({ TenLogin: gv.MaGV, Password: '123456', Role: role, MaNguoiDung: gv.MaGV });
        });

        // Save to localStorage
        localStorage.setItem('Khoa', JSON.stringify(khoa));
        localStorage.setItem('BoMon', JSON.stringify(boMon));
        localStorage.setItem('GiaoVien', JSON.stringify(giaoVien));
        localStorage.setItem('SinhVien', JSON.stringify(sinhVien));
        localStorage.setItem('GiaoVu', JSON.stringify(giaoVu));
        localStorage.setItem('MonHoc', JSON.stringify(monHoc));
        localStorage.setItem('HocKy', JSON.stringify(hocKy));
        localStorage.setItem('LopHocPhan', JSON.stringify(lopHocPhan));
        localStorage.setItem('DangKyHoc', JSON.stringify(dangKyHoc));
        localStorage.setItem('BangDiem', JSON.stringify(bangDiem));
        localStorage.setItem('GiaoVienDayMon', JSON.stringify(giaoVienDayMon));
        localStorage.setItem('Users', JSON.stringify(users));

        localStorage.setItem('isInitialized', 'true');
        console.log('Database initialized successfully!');
    }
};

// Auto init
MockDB.init();
