# HỆ THỐNG WEB LUYỆN TẬP & CHỮA ĐỀ THI UAV (CHUYÊN DỤNG TRÌNH CHIẾU ZOOM)

Hệ thống phần mềm hỗ trợ **huấn luyện, luyện tập và chữa đề sát hạch UAV trực tiếp trên Zoom** dành cho cán bộ, giảng viên và học viên.

Hệ thống được thiết kế theo triết lý **"Zero Learning Curve"** - giao diện tươi sáng, cỡ chữ lớn chuẩn màn hình chia sẻ Zoom, các nút thao tác 1 chạm cực kỳ đơn giản cho cán bộ nhân sự phổ thông.

---

## 1. KHỞI ĐỘNG NHANH (1-CLICK)

Dành cho cán bộ và nhân sự không chuyên:
1. Vào thư mục `web-luyen-tap`.
2. **Click đúp vào file `start.bat`**.
3. Hệ thống sẽ tự động bật máy chủ và mở trình duyệt tại địa chỉ: **`http://localhost:5000`**.

*(Hoặc chạy lệnh qua dòng lệnh terminal: `npm start`)*

---

## 2. TÀI KHOẢN MẶC ĐỊNH HỆ THỐNG

Hệ thống hỗ trợ cả đăng nhập **1-Chạm (Quick Login)**, đăng nhập **SSO** và đăng nhập thông thường:

| Tài khoản | Mật khẩu | Vai trò (Role) | Quyền hạn đặc biệt |
| :--- | :--- | :--- | :--- |
| **`admin`** | **`Ngangiang2026`** | **Quản Trị Viên** | Quản lý người dùng, phân quyền, thêm cán bộ, quản trị ngân hàng câu hỏi |
| **`giaovien`** | **`Ngangiang2026`** | **Giảng Viên** | Trình chiếu Zoom, chữa đề, **chỉnh sửa lời giải thích & căn cứ pháp lý tại chỗ** |
| **`hocvien`** | **`Ngangiang2026`** | **Học Viên** | Tự luyện tập, thi thử theo đề mục, xem đáp án và giải thích |

---

## 3. CÁC TÍNH NĂNG NỔI BẬT

### 3.1. Chế Độ Trình Chiếu Zoom (Zoom Presentation Mode)
- **Nút bấm kích hoạt nổi bật**: Bấm `[TRÌNH CHIẾU ZOOM]` ở thanh tiêu đề hoặc cạnh bất kỳ câu hỏi nào.
- **Tối ưu hiển thị**: Cỡ chữ cực lớn, tương phản cao, chống lóa khi chia sẻ màn hình qua Zoom.
- **Tùy chỉnh cỡ chữ linh hoạt**: Các nút `[A-]`, `[Chuẩn]`, `[A+]` trên thanh công cụ để tăng giảm kích thước chữ tức thì.
- **Toàn màn hình**: Nút phóng to toàn màn hình (Phím `F`) loại bỏ mọi thanh cuộn thừa thãi.
- **Chuyển câu nhanh**: Bấm `[Lưới câu hỏi]` để nhảy đến bất kỳ câu nào từ 1 đến 165.
- **Phím tắt tiện lợi cho giảng viên**:
  * `[Phím cách (Space)]` hoặc `[Mũi tên phải (→)]`: Sang câu tiếp theo.
  * `[Mũi tên trái (←)]`: Quay lại câu trước.
  * `[A] / [B] / [C] / [D]` hoặc `[1] / [2]`: Chọn phương án.
  * `[R]`: Bật/Tắt hiển thị đáp án đúng (viền xanh lá, dấu tích nổi bật).
  * `[E]`: Bật/Tắt khung giải thích căn cứ pháp lý.
  * `[F]`: Bật/Tắt toàn màn hình.

### 3.2. Chỉnh Sửa Giải Thích Trực Tiếp (Dành Cho Giáo Viên & Admin)
- Ngay trên màn hình câu hỏi hoặc trình chiếu Zoom, giáo viên bấm nút **`[✏️ Sửa giải thích]`**.
- Bảng soạn thảo trực tiếp hiện ra, có sẵn các chip gợi ý chèn nhanh văn bản quy phạm:
  * *+ Luật Phòng không nhân dân 49/2024*
  * *+ Nghị định 288/2025/NĐ-CP*
  * *+ Quy chuẩn an toàn thời tiết / gió*
  * *+ Định nghĩa bay VLOS / BVLOS*
- Bấm **`[Lưu lời giải thích]`**: Dữ liệu lưu ngay vào SQLite và hiển thị tức thì trên màn hình Zoom mà không cần tải lại trang.

### 3.3. Quản Lý Học Phần & Đề Mục Khoa Học
- Tự động nạp sẵn **649 câu hỏi** từ 5 file Word giáo trình lý thuyết chuẩn (đã tinh gọn loại bỏ các học phần thực hành):
  * **Chương trình Hạng A (VLOS)**: HP1 (Cơ sở pháp lý, khí tượng và quản lý vùng trời - 187 câu), HP2 (Kiến thức cơ bản về UAV - 215 câu), HP3 (Quy trình vận hành UAV và xử trí bất trắc - 147 câu).
  * **Chương trình Hạng B (BVLOS)**: HP1 (Kiến thức UAV trong BVLOS - 50 câu), HP2 (Quy trình vận hành UAV trong BVLOS - 50 câu).
- Cây thư mục bên trái phân cấp khoa học theo từng Học phần và Chuyên đề/Mục cụ thể, hiển thị trực quan số lượng câu hỏi thực tế.

### 3.4. Quản Lý Người Dùng & Tích Hợp SSO (Admin)
- Thêm người dùng mới, gán vai trò (`admin`, `teacher`, `student`).
- Khóa / Kích hoạt tài khoản cán bộ.
- Đặt lại mật khẩu.
- Tích hợp cổng đăng nhập một lần (Single Sign-On - SSO).

---

## 4. TỔ CHỨC MÃ NGUỒN (MODULAR ARCHITECTURE)

```
web-luyen-tap/
├── server/                             # Backend Node.js (Express + SQLite)
│   ├── data/
│   │   └── uav_practice.db             # Cơ sở dữ liệu SQLite độc lập
│   ├── src/
│   │   ├── config/                     # Kết nối DB & Cấu hình
│   │   ├── middleware/                 # JWT Authentication & RBAC Check
│   │   ├── modules/
│   │   │   ├── auth/                   # SSO & Local Login
│   │   │   ├── users/                  # Quản lý User (Admin)
│   │   │   ├── curriculum/             # Quản lý Chương trình, Học phần, Đề mục
│   │   │   ├── questions/              # Ngân hàng câu hỏi & Sửa giải thích
│   │   │   └── practice/               # Phiên luyện tập, nộp bài, thống kê
│   │   ├── scripts/
│   │   │   └── import_docx.py          # Script bóc tách tự động 5 file docx chuẩn hóa lý thuyết
│   │   ├── app.js                      # Cấu hình Express app
│   │   └── server.js                   # Khởi chạy HTTP server
│   └── package.json
├── client/                             # Frontend React (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/layout/          # Navbar, CurriculumSidebar
│   │   ├── context/AuthContext.jsx     # Phiên đăng nhập & Quyền hạn
│   │   ├── modules/
│   │   │   ├── presentation/           # ZoomPresentationView (Trình chiếu)
│   │   │   ├── practice/               # PracticeView (Luyện tập)
│   │   │   ├── questions/              # QuestionBankView & ExplanationModal
│   │   │   ├── admin/                  # UserManagementView (Quản trị cán bộ)
│   │   │   └── auth/                   # LoginModal & 1-Click SSO
│   │   ├── services/api.js             # API Client
│   │   ├── App.jsx                     # Layout chính
│   │   └── index.css                   # Thiết kế Aero Lucid Sky
│   └── package.json
├── start.bat                           # File khởi động 1-click trên Windows
└── package.json                        # Root package.json
```

---

## 5. LỆNH BẢO TRÌ & NÂNG CẤP

- **Chạy lại script import đề từ Word**:
  ```bash
  npm run import
  ```
- **Build lại giao diện Frontend**:
  ```bash
  npm run build:client
  ```
- **Chạy môi trường phát triển (Hot reload)**:
  * Backend: `npm run dev:server` (Port 5000)
  * Frontend: `npm run dev:client` (Port 3000)
