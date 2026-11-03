# Sổ Tập: bản chạy trên GitHub Pages (iPhone)

Mở app thấy danh sách hồ sơ, chạm hồ sơ của mình để vào (hồ sơ nào có mật khẩu thì hỏi mật khẩu). Mỗi hồ sơ có dữ liệu riêng, lưu trên Firebase nên điện thoại nào cũng thấy cùng dữ liệu. Làm một lần khoảng 15 phút, không cần email, không cần tài khoản đăng nhập.

## Bước 1. Tạo dự án Firebase (miễn phí)

1. Vào https://console.firebase.google.com và đăng nhập bằng tài khoản Google.
2. Bấm **Add project**, đặt tên bất kỳ (ví dụ `so-tap`), tắt Google Analytics, bấm **Create project**.

## Bước 2. Lấy cấu hình và dán vào app

1. Ở trang tổng quan dự án, bấm biểu tượng web `</>`. Đặt tên app, **không** chọn Firebase Hosting, bấm **Register app**.
2. Firebase hiện đoạn `firebaseConfig` gồm `apiKey`, `authDomain`, `projectId`, `appId`.
3. Mở tệp `firebase-config.js` trong thư mục này, thay các giá trị `DAN_...` bằng giá trị tương ứng.

## Bước 3. Tạo cơ sở dữ liệu và dán Rules

1. Vào **Build, Firestore Database**, bấm **Create database**.
2. Chọn vị trí gần bạn (ví dụ `asia-southeast1`), chọn **Production mode**, bấm **Create**.
3. Mở tab **Rules**, xoá nội dung có sẵn, dán toàn bộ nội dung tệp `firestore.rules`, bấm **Publish**.

Rules này cho phép bất kỳ ai mở app đọc và ghi dữ liệu (đúng ý "chỉ chia hồ sơ, không cần riêng tư"). Không cần bật mục Authentication.

## Bước 4. Đưa lên GitHub Pages

1. Đăng nhập https://github.com, tạo repository mới (ví dụ `so-tap`), để **Public**.
2. Bấm **Add file, Upload files**, kéo thả **toàn bộ** nội dung thư mục này (nhớ cả thư mục `vendor`), rồi **Commit changes**.
3. Vào **Settings, Pages**, ở **Source** chọn **Deploy from a branch**, nhánh `main`, thư mục `/ (root)`, bấm **Save**.
4. Đợi 1 đến 2 phút, GitHub hiện địa chỉ dạng `https://TEN-GITHUB.github.io/so-tap/`.

## Bước 5. Cài lên iPhone

1. Mở địa chỉ trên bằng **Safari**.
2. Bấm nút Chia sẻ, chọn **Thêm vào Màn hình chính**, bấm **Thêm**.
3. Từ giờ mở app bằng biểu tượng "Sổ Tập" trên màn hình chính. Làm vậy iOS không tự xoá dữ liệu lưu tạm như khi chỉ mở bằng tab Safari.

Lần đầu bấm **Tạo hồ sơ mới**, đặt tên (mật khẩu có thể để trống). Từ lần sau app nhớ hồ sơ đang dùng. Muốn đổi hồ sơ, bấm nút **Hồ sơ: tên · Đổi** ở đầu màn hình.

## Cần biết

- Mật khẩu hồ sơ chỉ để tránh bấm nhầm, không phải bảo mật thật. Ai biết địa chỉ app đều có thể xem dữ liệu nếu cố tình. Quên mật khẩu thì không lấy lại được (có thể xoá hồ sơ ở màn chọn hồ sơ cần mật khẩu, hoặc xoá trong Firebase console).
- Xoá hồ sơ chỉ ẩn hồ sơ khỏi danh sách, dữ liệu cũ vẫn nằm trong Firebase (xoá tay trong Firestore nếu muốn dọn).
- Dùng nút Sao lưu trong tab Lịch sử để lưu một bản JSON thỉnh thoảng.
- Thông báo có nút bấm trên màn hình khoá không làm được từ trang web trên iPhone. Với giấc ngủ: bấm Đi ngủ trong app, đặt báo thức bằng đồng hồ iPhone, sáng dậy mở app bấm Kết thúc giấc ngủ (quên thì nhập giờ dậy thật).
- Gói miễn phí của Firebase đủ cho vài người dùng cá nhân.
- Muốn cập nhật app sau này: tải `index.html` mới lên repo (ghi đè), mở lại app là có bản mới.
