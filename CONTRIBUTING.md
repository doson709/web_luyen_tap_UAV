# Hướng Dẫn Đóng Góp Mã Nguồn (Contribution Guide)

Chào mừng bạn đến với dự án **web_luyen_tap_UAV**! Dưới đây là quy trình chi tiết từng bước để bạn có thể clone dự án, phát triển tính năng và gửi yêu cầu đóng góp (Pull Request).

---

## 📌 Tóm Tắt Quy Trình Chuẩn (Fork & Pull Request)

```text
[Fork Repo] ➔ [Clone về máy] ➔ [Tạo Branch mới] ➔ [Sửa code & Test] ➔ [Commit & Push] ➔ [Tạo Pull Request]
```

---

## 🛠 Hướng Dẫn Chi Tiết Từng Bước

### Bước 1: Fork Repository
1. Truy cập repo chính: **[https://github.com/doson709/web_luyen_tap_UAV](https://github.com/doson709/web_luyen_tap_UAV)**
2. Nhấn nút **Fork** ở góc trên bên phải màn hình để tạo một bản sao dự án về tài khoản GitHub cá nhân của bạn.

---

### Bước 2: Clone Repo Về Máy Tính
Mở Terminal / PowerShell / Git Bash trên máy tính và chạy lệnh sau (thay `<tai-khoan-cua-ban>` bằng username GitHub của bạn):

```bash
git clone https://github.com/<tai-khoan-cua-ban>/web_luyen_tap_UAV.git
cd web_luyen_tap_UAV
```

Thiết lập remote trỏ về repo gốc (upstream) để tiện đồng bộ cập nhật mới nhất:
```bash
git remote add upstream https://github.com/doson709/web_luyen_tap_UAV.git
```

---

### Bước 3: Cài Đặt Môi Trường & Chạy Thử

Dự án gồm **Client** (Frontend) và **Server** (Backend Node.js/Python):

1. **Cài đặt dependencies**:
   ```bash
   # Cài đặt server
   cd server
   npm install

   # Cài đặt client
   cd ../client
   npm install
   ```

2. **Chạy ứng dụng ở chế độ dev**:
   - Chạy Server: `cd server && node src/server.js`
   - Chạy Client: `cd client && npm run dev`
   *(Hoặc tại thư mục gốc chạy file `start.bat` trên Windows)*.

---

### Bước 4: Tạo Nhánh Mới (Branch) Để Làm Việc
> ⚠️ **Quy tắc quan trọng**: Tuyệt đối **không code trực tiếp trên nhánh `main`**. Luôn tạo một nhánh mới đại diện cho tính năng hoặc bản sửa lỗi của bạn.

```bash
# Đảm bảo nhánh main được cập nhật mới nhất
git checkout main
git pull upstream main

# Tạo và chuyển sang nhánh mới (ví dụ: feature/giao-dien-thi hoặc fix/loi-am-thanh)
git checkout -b feature/ten-tinh-nang-moi
```

---

### Bước 5: Chỉnh Sửa Code & Kiểm Tra
- Thực hiện các thay đổi code cần thiết.
- Kiểm tra kĩ lưỡng để đảm bảo code chạy ổn định, không phát sinh lỗi hoặc xung đột.
- Đảm bảo tuân thủ cấu trúc thư mục hiện có.

---

### Bước 6: Commit Và Push Lên GitHub Của Bạn

1. Kiểm tra các file đã thay đổi:
   ```bash
   git status
   ```

2. Thêm file và viết commit message rõ ràng:
   ```bash
   git add .
   git commit -m "feat: bổ sung tính năng xem lại câu hỏi sai"
   ```
   *(Gợi ý tiền tố commit: `feat:` cho tính năng mới, `fix:` sửa lỗi, `docs:` sửa tài liệu, `style:` định dạng CSS).*

3. Đẩy nhánh lên repository của bạn:
   ```bash
   git push origin feature/ten-tinh-nang-moi
   ```

---

### Bước 7: Mở Pull Request (PR)

1. Truy cập vào repo của bạn trên GitHub (hoặc trang repo gốc: `https://github.com/doson709/web_luyen_tap_UAV`).
2. Bạn sẽ thấy một thanh thông báo màu vàng hiện ra với nút **Compare & pull request** ➔ Hãy nhấn vào đó.
3. Điền các thông tin:
   - **Tiêu đề PR**: Tóm tắt ngắn gọn thay đổi (ví dụ: *Thêm bộ lọc câu hỏi theo chuyên đề*).
   - **Mô tả (Description)**:
     - Bạn đã thay đổi những gì?
     - Đã kiểm tra (test) như thế nào?
     - Hình ảnh minh họa (nếu có thay đổi giao diện).
4. Nhấn **Create pull request**.

---

## 🔍 Sau Khi Gửi Pull Request

- Quản trị viên (Admin) sẽ nhận được thông báo, review code và phản hồi/yêu cầu điều chỉnh nếu cần.
- Khi mọi thứ đạt yêu cầu, admin sẽ nhấn **Approve & Merge** để chính thức đưa code của bạn vào nhánh `main` của dự án.
- Cảm ơn sự đóng góp quý báu của bạn! 🚀
