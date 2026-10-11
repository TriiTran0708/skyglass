/*
  Cấu hình Supabase.
  1. Tạo project tại https://supabase.com
  2. Vào Project Settings → API, sao chép "Project URL" và khóa "anon public".
  3. Dán vào hai dòng bên dưới.

  Khóa anon được thiết kế để công khai ở phía trình duyệt (bảo mật dựa trên Row Level Security).
  KHÔNG BAO GIỜ dán khóa "service_role" vào file này.
*/
window.VISTA_CONFIG = {
  SUPABASE_URL: '',        // ví dụ: 'https://abcdxyz.supabase.co'
  SUPABASE_ANON_KEY: '',   // khóa anon public
  GOOGLE_ENABLED: false,   // đặt true sau khi bật Google provider trong Supabase
};
