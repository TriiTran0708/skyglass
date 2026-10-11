# SkyGlass — Nostalgic Frutiger Aero × Liquid Glass × Windows Vista Aero

Website nhiều trang bằng HTML5, CSS3 và JavaScript thuần (không framework).

## Cấu trúc

```
skyglass/
├── index.html        Trang khởi động → tự chuyển tới Login hoặc Main
├── login.html        Đăng nhập
├── register.html     Đăng ký
├── main.html         Trang chính (desktop kiểu Vista)
├── style.css         Toàn bộ giao diện
├── script.js         Tiện ích dùng chung: toast, modal, âm thanh, bong bóng, validation
├── auth.js           Lớp xác thực Supabase
├── forms.js          Logic form Login / Register
├── main.js           Logic Main Page
├── config.js         Khóa Supabase (điền vào đây)
└── assets/images/
    ├── logo.svg
    ├── login-bg.png      ← CẦN TẠO (xem phần 3)
    ├── register-bg.png   ← CẦN TẠO
    ├── main-bg.png       ← CẦN TẠO
    └── *-fallback.svg    Cảnh dự phòng (đã có sẵn)
```

Chạy: mở thư mục bằng **VS Code → Live Server** (chuột phải `index.html` → Open with Live Server).
Có thể dùng `npx serve` hoặc `python -m http.server`. Không mở trực tiếp bằng `file://` vì Supabase cần origin http(s).

## 1. Trạng thái chức năng (quan trọng)

| Chức năng | Trạng thái |
|---|---|
| Giao diện, điều hướng, validation, thông báo, modal | Hoạt động đầy đủ |
| Explore (lọc, xem chi tiết, yêu thích), Aero Notes, đồng hồ, taskbar, Start menu, cửa sổ nổi | Hoạt động (dữ liệu lưu trong localStorage) |
| Âm thanh giao diện | Hoạt động, mặc định tắt |
| Đăng nhập / đăng ký / quên mật khẩu / đăng xuất | **Chỉ hoạt động sau khi cấu hình Supabase.** Chưa cấu hình: form vẫn validate, nhưng khi gửi sẽ báo rõ "chưa cấu hình backend". Không có đăng nhập giả. |
| Đăng nhập Google | **Chưa bật.** Cần bật Google provider trong Supabase và đặt `GOOGLE_ENABLED: true` |
| Đăng nhập bằng username | Chưa hỗ trợ: đăng nhập dùng email. Username được lưu trong `user_metadata` khi đăng ký |
| Ảnh nền AI | **Chưa có file ảnh** (xem phần 3). Trong lúc chờ, trang dùng cảnh SVG dự phòng |

## 2. Cấu hình Supabase Auth

1. Tạo project tại https://supabase.com.
2. **Project Settings → API**: sao chép *Project URL* và khóa *anon public* vào `config.js`.
   Không bao giờ dùng khóa `service_role` ở phía trình duyệt.
3. **Authentication → URL Configuration**: thêm vào *Redirect URLs* các địa chỉ bạn dùng, ví dụ
   `http://127.0.0.1:5500/login.html` và `http://127.0.0.1:5500/main.html` (cổng của Live Server).
   Khi triển khai thật, thêm cả domain production.
4. **Authentication → Providers → Email**: bật. Nếu bật *Confirm email*, người dùng phải xác nhận qua email trước khi đăng nhập (giao diện đã xử lý trường hợp này).
5. (Tùy chọn) Google: tạo OAuth client trong Google Cloud, dán Client ID/Secret vào Supabase, rồi đặt `GOOGLE_ENABLED: true`.

Mật khẩu được gửi qua HTTPS tới Supabase và băm phía server; project này không lưu mật khẩu ở bất kỳ đâu.

## 3. Ảnh nền Frutiger Aero (cần tự tạo)

Môi trường này không có công cụ tạo ảnh, nên dưới đây là prompt cho từng trang.
Dùng Midjourney, DALL·E / ChatGPT Images, Imagen, Flux, Stable Diffusion… Tỷ lệ 16:9, tối thiểu 2560×1440.

**Prompt chung (negative / loại trừ):** `text, letters, logo, watermark, people, faces, animals, neon, cyberpunk, dark sky, night, harsh shadows, oversaturated`

### `login-bg.png` — thư thái, vùng giữa đơn giản
```
Nostalgic Frutiger Aero landscape wallpaper, Windows Vista Aero era aesthetic, serene turquoise ocean
under a luminous clear blue sky with fluffy white cumulus clouds, soft sunlight glow in the upper right,
calm horizon in the lower third, a few translucent water bubbles and one glossy glass sphere reflecting
the sky placed far at the left and right edges, large open and uncluttered area in the center,
optimistic early-2000s technology mood, high-gloss CGI render, soft depth of field, bright natural light,
harmonious blue cyan white palette, 16:9, 2560x1440, no text, no logo, no watermark
```

### `register-bg.png` — cùng bảng màu, bố cục khác
```
Nostalgic Frutiger Aero landscape wallpaper, Windows Vista Aero style, lush rolling green meadow hills
in the foreground with sparkling dew, a clear stream flowing toward a glittering turquoise sea,
bright blue sky with soft white clouds, sun low on the left casting gentle light streaks,
floating transparent soap bubbles and two glass orbs reflecting the landscape, calm uncluttered center,
fresh optimistic Y2K-era tech aesthetic, glossy CGI render, shallow depth of field,
palette of sky blue, ocean teal, pearl white and fresh green, 16:9, 2560x1440, no text, no logo, no watermark
```

### `main-bg.png` — phong cảnh rộng, nhiều chiều sâu
```
Panoramic Nostalgic Frutiger Aero wallpaper, Windows Vista Aero era, vast bright blue sky with towering
white clouds and soft god rays, crystal-clear turquoise ocean reaching a bright horizon, green grassy
hills in the foreground, large reflective glass spheres and drifting water bubbles at varying depths,
glossy aqua highlights and gentle lens glow, optimistic futuristic 2000s mood, high detail CGI render,
composition leaves the upper-left and center relatively calm for headline text, sky blue ocean cyan pearl white
and fresh green palette, 16:9, 2880x1620, no text, no logo, no watermark
```

### Tích hợp
1. Lưu đúng tên: `assets/images/login-bg.png`, `register-bg.png`, `main-bg.png`.
2. **Tối ưu dung lượng**: thu về chiều rộng 1920–2400px, nén bằng https://squoosh.app. Mục tiêu dưới 300–400 KB mỗi ảnh (WebP/AVIF rất phù hợp).
   Nếu đổi sang `.webp`, sửa đường dẫn trong `style.css` ở các lớp `.scene--login`, `.scene--register`, `.scene--main`.
3. CSS đã sẵn sàng: `background-size: cover`, `background-position: center`, lớp overlay nhẹ `.scene::after`, và **dự phòng 3 tầng**: ảnh AI → cảnh SVG → gradient CSS. Nếu ảnh thiếu hoặc lỗi tải, trang vẫn đẹp.
4. Nếu ảnh chỗ trung tâm quá nhiều chi tiết, tăng độ đậm overlay trong `.scene::after`. Các khung kính đã có nền trắng đục sẵn để chữ luôn dễ đọc.

## 4. Tùy chỉnh nhanh

- Màu: biến CSS ở đầu `style.css` (`--sky-*`, `--green`, `--cyan`…).
- Tên thương hiệu: tìm "SkyGlass" trong các file HTML.
- Bộ sưu tập Explore: mảng `COLLECTIONS` trong `main.js`.

## 5. Khả năng truy cập

- Tôn trọng `prefers-reduced-motion` (tắt bong bóng, hiệu ứng chuyển trang, hover động) và `prefers-reduced-transparency`.
- Form có label, thông báo lỗi gắn `aria-describedby`, vùng trạng thái `aria-live`.
- Modal có khóa focus, đóng bằng Esc, trả focus về nút đã mở.
# skyglass
