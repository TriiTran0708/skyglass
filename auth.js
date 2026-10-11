/*
  SkyGlass — lớp xác thực (Supabase Auth).
  Không giả lập đăng nhập: nếu chưa cấu hình, mọi thao tác xác thực đều trả về lỗi rõ ràng.
  Mật khẩu được gửi trực tiếp tới Supabase qua HTTPS và được băm phía server; trang này không lưu mật khẩu.
*/
(() => {
  'use strict';

  const cfg = window.VISTA_CONFIG || {};
  const REMEMBER_KEY = 'skyglass.remember';

  let problem = '';
  if (!/^https:\/\/.+/.test(cfg.SUPABASE_URL || '') || !cfg.SUPABASE_ANON_KEY) {
    problem = 'Backend chưa được cấu hình. Hãy điền SUPABASE_URL và SUPABASE_ANON_KEY trong config.js.';
  } else if (!(window.supabase && window.supabase.createClient)) {
    problem = 'Không tải được thư viện Supabase (kiểm tra kết nối mạng).';
  }

  /* Lưu phiên vào localStorage (Remember me) hoặc sessionStorage (đóng tab là thoát). */
  const storage = {
    getItem: (k) => { try { return localStorage.getItem(k) ?? sessionStorage.getItem(k); } catch { return null; } },
    setItem: (k, v) => {
      try {
        const remember = localStorage.getItem(REMEMBER_KEY) === '1';
        (remember ? localStorage : sessionStorage).setItem(k, v);
        (remember ? sessionStorage : localStorage).removeItem(k);
      } catch { /* storage unavailable */ }
    },
    removeItem: (k) => { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch { /* ignore */ } },
  };

  let client = null;
  if (!problem) {
    try {
      client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
    } catch (err) {
      console.error('Supabase init failed:', err);
      problem = 'Khởi tạo Supabase thất bại. Kiểm tra lại URL và khóa trong config.js.';
    }
  }
  const configured = !!client;

  function translateError(err) {
    const msg = ((err && err.message) || '').toLowerCase();
    if (msg.includes('invalid login credentials')) return 'Email hoặc mật khẩu không đúng.';
    if (msg.includes('email not confirmed')) return 'Email chưa được xác nhận. Hãy kiểm tra hộp thư và bấm vào liên kết xác nhận.';
    if (msg.includes('already registered') || msg.includes('already been registered')) return 'Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.';
    if (msg.includes('password should be at least')) return 'Mật khẩu quá ngắn theo cấu hình của hệ thống.';
    if (msg.includes('same password') || msg.includes('different from the old')) return 'Mật khẩu mới phải khác mật khẩu cũ.';
    if (msg.includes('rate limit') || (err && err.status === 429)) return 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.';
    if (msg.includes('failed to fetch') || msg.includes('network')) return 'Không thể kết nối tới máy chủ. Kiểm tra mạng rồi thử lại.';
    if (msg.includes('provider is not enabled') || msg.includes('unsupported provider')) return 'Đăng nhập Google chưa được bật trong Supabase.';
    return `Đã xảy ra lỗi: ${(err && err.message) || 'không xác định'}`;
  }

  const notConfigured = () => ({ ok: false, code: 'not_configured', message: problem });
  const fail = (err) => ({ ok: false, code: err && err.code, message: translateError(err) });

  function userView(user) {
    if (!user) return null;
    const meta = user.user_metadata || {};
    return {
      id: user.id,
      email: user.email || '',
      username: meta.username || meta.full_name || meta.name || (user.email ? user.email.split('@')[0] : 'user'),
      createdAt: user.created_at,
    };
  }

  const page = (name) => new URL(name, location.href).href;

  const Auth = {
    configured,
    problem,

    async getUser() {
      if (!configured) return null;
      try {
        const { data } = await client.auth.getSession();
        return userView(data.session && data.session.user);
      } catch { return null; }
    },

    async signIn(email, password, remember) {
      if (!configured) return notConfigured();
      try { localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0'); } catch { /* ignore */ }
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      return error ? fail(error) : { ok: true, user: userView(data.user) };
    },

    async signUp({ username, email, password }) {
      if (!configured) return notConfigured();
      try { localStorage.setItem(REMEMBER_KEY, '1'); } catch { /* ignore */ }
      const { data, error } = await client.auth.signUp({
        email, password,
        options: { data: { username }, emailRedirectTo: page('login.html') },
      });
      if (error) return fail(error);
      // Supabase trả về identities rỗng khi email đã tồn tại (để tránh lộ thông tin)
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return { ok: false, code: 'user_exists', message: translateError({ message: 'User already registered' }) };
      }
      return { ok: true, needsConfirmation: !data.session, user: userView(data.user) };
    },

    async signInWithGoogle() {
      if (!configured) return notConfigured();
      if (!cfg.GOOGLE_ENABLED) return { ok: false, code: 'google_disabled', message: 'Đăng nhập Google chưa được bật. Đặt GOOGLE_ENABLED: true trong config.js sau khi bật Google provider trong Supabase.' };
      try { localStorage.setItem(REMEMBER_KEY, '1'); } catch { /* ignore */ }
      const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: page('main.html') } });
      return error ? fail(error) : { ok: true };
    },

    async resetPassword(email) {
      if (!configured) return notConfigured();
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: page('login.html') });
      return error ? fail(error) : { ok: true };
    },

    async updatePassword(password) {
      if (!configured) return notConfigured();
      const { error } = await client.auth.updateUser({ password });
      return error ? fail(error) : { ok: true };
    },

    async signOut() {
      if (!configured) return notConfigured();
      const { error } = await client.auth.signOut();
      return error ? fail(error) : { ok: true };
    },

    onEvent(callback) {
      if (!configured) return () => {};
      const { data } = client.auth.onAuthStateChange((event, session) => callback(event, userView(session && session.user)));
      return () => data.subscription.unsubscribe();
    },
  };

  window.Auth = Auth;
})();
