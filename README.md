# Web Đăng ký Xét Học Bổng Thạc sĩ K50 đợt 1

Ứng dụng web cho phép học viên cao học nộp đơn đề nghị xét, cấp chính sách học bổng hỗ trợ dành cho **Chương trình Phát triển nhà nghiên cứu trẻ** - Trường Đại học Kinh tế, Đại học Đà Nẵng.

---

## 🌟 Tính năng

- **Giao diện học viên**: Form điền thông tin đa bước, hỗ trợ tải lên tài liệu minh chứng, Dark/Light mode
- **Giao diện Admin**: Quản lý danh sách hồ sơ, tìm kiếm/lọc, xem chi tiết, xuất Excel và tải ZIP toàn bộ minh chứng
- **Bảo mật**: Đăng nhập mật khẩu cho trang Admin

## 🛠 Công nghệ

- **Backend**: Python + Flask
- **Database**: SQLite
- **Excel**: Pandas + OpenPyXL
- **Frontend**: HTML5, CSS3, Vanilla JavaScript

## 🚀 Cách chạy

### 1. Cài đặt thư viện
```bash
pip install flask pandas openpyxl
```

### 2. Khởi động server
```bash
python app.py
```

### 3. Truy cập
- **Học viên nộp đơn**: http://localhost:5000
- **Admin quản lý**: http://localhost:5000/admin

## 📁 Cấu trúc thư mục

```
├── app.py                  # Flask server chính
├── config.py               # Cấu hình ứng dụng
├── database.py             # Quản lý SQLite
├── excel_generator.py      # Xuất file Excel
├── uploads/                # Thư mục lưu minh chứng học viên (tự tạo)
└── static/
    ├── css/app.css         # CSS giao diện
    ├── js/app.js           # JS trang học viên
    ├── js/admin.js         # JS trang admin
    ├── index.html          # Giao diện học viên
    └── admin.html          # Giao diện admin
```

---
*© 2026 Phòng Công tác Sinh viên - Trường Đại học Kinh tế - Đại học Đà Nẵng*
