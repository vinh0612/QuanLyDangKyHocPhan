const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

// Cấu hình chuỗi kết nối sử dụng ODBC Driver mặc định của Windows
const config = {
    connectionString: 'Driver={SQL Server};Server=localhost;Database=QLDangKyHocPhan;Trusted_Connection=yes;'
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('🔌 Kết nối thành công SQL Server dưới quyền Windows Auth!');
        return pool;
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối SQL Server tại db.js:', err.message);
    });

// Hàm thực thi câu lệnh hỗ trợ cơ chế bảo mật Impersonation nâng cao
async function executeQuery(queryText, params = {}, tenLogin = null) {
    const pool = await poolPromise;
    if (!pool) {
        throw new Error("Chưa kết nối được Cơ sở dữ liệu. Vui lòng kiểm tra lại SQL Server.");
    }

    // Sử dụng Transaction để giữ cố định 1 kết nối duy nhất trong suốt luồng xử lý câu lệnh
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);

        // Nạp các tham số an toàn (Chống SQL Injection)
        for (const key in params) {
            request.input(key, params[key]);
        }

        // Thực hiện mạo danh ngữ cảnh bảo mật (Impersonation) nếu có User đăng nhập
        if (tenLogin) {
            // EXECUTE AS USER giúp kích hoạt chuẩn đét RLS (USER_NAME()) và Role nhóm (IS_MEMBER())
            await transaction.request().query(`EXECUTE AS USER = '${tenLogin}'`);
        }

        // Thực thi câu lệnh chính (View hoặc Stored Procedure)
        const result = await request.query(queryText);

        // BẮT BUỘC: Hoàn trả lại ngữ cảnh về quyền Windows gốc hệ thống
        if (tenLogin) {
            await transaction.request().query('REVERT');
        }

        await transaction.commit();
        return result.recordset;
    } catch (err) {
        // Đảm bảo đóng và giải phóng kết nối an toàn kể cả khi câu lệnh SQL xảy ra lỗi
        try {
            await transaction.rollback();
        } catch (rollErr) {
            // Bỏ qua nếu transaction đã đóng
        }
        throw err;
    }
}

module.exports = { executeQuery, sql };