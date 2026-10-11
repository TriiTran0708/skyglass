/* SkyGlass — logic cho trang Login và Register */
(() => {
  'use strict';
  const { $, toast, modal, validators, setFieldError, go } = window.UI;
  const Auth = window.Auth;
  const page = document.body.dataset.page;

  const form = $('#authForm');
  const status = $('#formStatus');
  const submitBtn = $('#submitBtn');

  function setStatus(text, kind = 'info') {
    status.textContent = text;
    status.className = `status status--${kind}`;
  }
  function setLoading(on, label) {
    submitBtn.classList.toggle('is-loading', on);
    submitBtn.disabled = on;
    if (label) $('.btn-label', submitBtn).textContent = label;
  }
  function showNotice() {
    const n = $('#backendNotice');
    if (!Auth.configured && n) {
      n.hidden = false;
      $('span', n).textContent = Auth.problem;
    }
  }
  function focusFirstError() {
    const bad = form.querySelector('[aria-invalid="true"]');
    if (bad) bad.focus();
  }
  function bindLiveValidation(input, validate) {
    input.addEventListener('blur', () => setFieldError(input, validate(input.value.trim())));
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') setFieldError(input, validate(input.value.trim())); });
  }

  async function redirectIfSignedIn() {
    // Không chuyển trang khi người dùng đang mở liên kết đặt lại mật khẩu
    if (/type=recovery/.test(location.hash)) return;
    const user = await Auth.getUser();
    if (user) go('main.html');
  }

  /* ----------------------------------------------------------- LOGIN */
  function initLogin() {
    const email = $('#email');
    const password = $('#password');
    bindLiveValidation(email, validators.email);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus('');
      const errs = [
        [email, validators.email(email.value.trim())],
        [password, validators.required(password.value, 'mật khẩu')],
      ];
      errs.forEach(([input, msg]) => setFieldError(input, msg));
      if (errs.some(([, msg]) => msg)) { setStatus('Vui lòng kiểm tra lại các trường được đánh dấu.', 'error'); focusFirstError(); return; }

      setLoading(true, 'Signing in…');
      setStatus('Đang đăng nhập…', 'info');
      const res = await Auth.signIn(email.value.trim(), password.value, $('#remember').checked);
      if (!res.ok) {
        setLoading(false, 'Login');
        setStatus(res.message, 'error');
        toast(res.message, { type: res.code === 'not_configured' ? 'warn' : 'error', title: res.code === 'not_configured' ? 'Chưa cấu hình backend' : 'Đăng nhập thất bại' });
        return;
      }
      setStatus(`Chào mừng ${res.user.username}! Đang chuyển trang…`, 'ok');
      toast(`Chào mừng trở lại, ${res.user.username}.`, { type: 'success', title: 'Đăng nhập thành công' });
      setTimeout(() => go('main.html'), 700);
    });

    $('#googleBtn').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.classList.add('is-loading');
      const res = await Auth.signInWithGoogle();
      btn.classList.remove('is-loading');
      if (!res.ok) toast(res.message, { type: res.code === 'google_disabled' || res.code === 'not_configured' ? 'warn' : 'error', title: 'Đăng nhập Google' });
    });

    $('#forgotBtn').addEventListener('click', openForgot);

    // Khi người dùng quay lại từ email "đặt lại mật khẩu"
    Auth.onEvent((event) => { if (event === 'PASSWORD_RECOVERY') openNewPassword(); });
  }

  function openForgot() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <p>Nhập email của bạn, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.</p>
      <div class="field"><label for="fp-email">Email</label>
        <input class="input" id="fp-email" type="email" autocomplete="email" inputmode="email" aria-describedby="fp-email-error">
        <p class="field-error" id="fp-email-error"></p></div>`;
    const input = $('#fp-email', wrap);
    const prefill = $('#email').value.trim();
    if (prefill) input.value = prefill;
    modal({
      title: 'Forgot password',
      content: wrap,
      actions: [
        { label: 'Cancel', variant: 'ghost' },
        {
          label: 'Send reset link',
          async onClick() {
            const msg = validators.email(input.value.trim());
            setFieldError(input, msg);
            if (msg) { input.focus(); return false; }
            const res = await Auth.resetPassword(input.value.trim());
            if (!res.ok) { toast(res.message, { type: res.code === 'not_configured' ? 'warn' : 'error' }); return res.code === 'not_configured'; }
            toast('Nếu email tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu.', { type: 'success', title: 'Đã gửi yêu cầu' });
            return true;
          },
        },
      ],
    });
  }

  function openNewPassword() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <p>Hãy đặt mật khẩu mới cho tài khoản của bạn.</p>
      <div class="field"><label for="np-pass">Mật khẩu mới</label>
        <input class="input" id="np-pass" type="password" autocomplete="new-password" aria-describedby="np-pass-error">
        <p class="field-error" id="np-pass-error"></p></div>`;
    const input = $('#np-pass', wrap);
    modal({
      title: 'Đặt mật khẩu mới',
      content: wrap,
      actions: [{
        label: 'Update password',
        async onClick() {
          const msg = validators.newPassword(input.value);
          setFieldError(input, msg);
          if (msg) { input.focus(); return false; }
          const res = await Auth.updatePassword(input.value);
          if (!res.ok) { toast(res.message, { type: 'error' }); return false; }
          toast('Mật khẩu đã được cập nhật.', { type: 'success' });
          setTimeout(() => go('main.html'), 800);
          return true;
        },
      }],
    });
  }

  /* -------------------------------------------------------- REGISTER */
  function initRegister() {
    const username = $('#username');
    const email = $('#email');
    const password = $('#password');
    const confirm = $('#confirm');
    const terms = $('#terms');
    const matchMsg = () => (!confirm.value ? 'Vui lòng nhập lại mật khẩu.' : confirm.value !== password.value ? 'Mật khẩu xác nhận không khớp.' : '');

    bindLiveValidation(username, validators.username);
    bindLiveValidation(email, validators.email);
    password.addEventListener('blur', () => setFieldError(password, validators.newPassword(password.value)));
    password.addEventListener('input', () => {
      if (password.getAttribute('aria-invalid') === 'true') setFieldError(password, validators.newPassword(password.value));
      if (confirm.value) setFieldError(confirm, matchMsg());
    });
    confirm.addEventListener('input', () => setFieldError(confirm, matchMsg()));
    confirm.addEventListener('blur', () => setFieldError(confirm, matchMsg()));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      setStatus('');
      const errs = [
        [username, validators.username(username.value.trim())],
        [email, validators.email(email.value.trim())],
        [password, validators.newPassword(password.value)],
        [confirm, matchMsg()],
      ];
      errs.forEach(([input, msg]) => setFieldError(input, msg));
      const termsErr = $('#terms-error');
      termsErr.textContent = terms.checked ? '' : 'Bạn cần đồng ý với điều khoản để tiếp tục.';
      if (errs.some(([, msg]) => msg) || !terms.checked) {
        setStatus('Vui lòng kiểm tra lại các trường được đánh dấu.', 'error');
        if (!terms.checked && !form.querySelector('[aria-invalid="true"]')) terms.focus(); else focusFirstError();
        return;
      }

      setLoading(true, 'Creating…');
      setStatus('Đang tạo tài khoản…', 'info');
      const res = await Auth.signUp({ username: username.value.trim(), email: email.value.trim(), password: password.value });
      if (!res.ok) {
        setLoading(false, 'Create Account');
        setStatus(res.message, 'error');
        toast(res.message, { type: res.code === 'not_configured' ? 'warn' : 'error', title: res.code === 'not_configured' ? 'Chưa cấu hình backend' : 'Đăng ký thất bại' });
        return;
      }
      if (res.needsConfirmation) {
        setLoading(false, 'Create Account');
        setStatus('Tài khoản đã được tạo. Hãy xác nhận email để đăng nhập.', 'ok');
        form.reset();
        modal({
          title: 'Kiểm tra hộp thư của bạn',
          content: `<p>Chúng tôi đã gửi email xác nhận tới <strong></strong>. Bấm vào liên kết trong email để kích hoạt tài khoản, sau đó quay lại đăng nhập.</p>`,
          actions: [{ label: 'Go to Login', variant: 'green', onClick: () => go('login.html') }],
        }).body.querySelector('strong').textContent = res.user.email;
        return;
      }
      setStatus('Đăng ký thành công! Đang chuyển trang…', 'ok');
      toast(`Chào mừng ${res.user.username}!`, { type: 'success', title: 'Đăng ký thành công' });
      setTimeout(() => go('main.html'), 800);
    });
  }

  /* ------------------------------------------------------------ boot */
  showNotice();
  if (Auth.configured) redirectIfSignedIn();
  if (page === 'login') initLogin(); else initRegister();
})();
