/* SkyGlass — shared UI helpers: toast, modal, sound, bubbles, transitions, validation */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const store = {
    get(key, fallback = null) {
      try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch { return fallback; }
    },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* storage unavailable */ } },
  };

  /* ---------------------------------- Sound (optional, off by default) */
  const Sound = {
    enabled: store.get('skyglass.sound') === '1',
    ctx: null,
    toggle() {
      this.enabled = !this.enabled;
      store.set('skyglass.sound', this.enabled ? '1' : '0');
      this.syncButtons();
      if (this.enabled) this.play('success');
      return this.enabled;
    },
    syncButtons() {
      $$('[data-sound-toggle]').forEach((btn) => {
        btn.setAttribute('aria-pressed', String(this.enabled));
        btn.setAttribute('aria-label', this.enabled ? 'Tắt âm thanh giao diện' : 'Bật âm thanh giao diện');
        btn.title = btn.getAttribute('aria-label');
      });
    },
    play(type = 'click') {
      if (!this.enabled) return;
      try {
        this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
        const notes = { click: [880], success: [660, 990], error: [220, 180], info: [740] }[type] || [880];
        notes.forEach((freq, i) => {
          const t0 = this.ctx.currentTime + i * 0.09;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, t0);
          gain.gain.exponentialRampToValueAtTime(0.05, t0 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
          osc.connect(gain).connect(this.ctx.destination);
          osc.start(t0);
          osc.stop(t0 + 0.18);
        });
      } catch { /* audio not available */ }
    },
  };

  /* ---------------------------------- Toast */
  const TOAST_ICONS = { info: 'i', success: '✓', error: '!', warn: '!' };
  function toast(message, { type = 'info', title = '', duration = 5200 } = {}) {
    let host = $('#toasts');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toasts';
      host.className = 'toasts';
      host.setAttribute('aria-live', 'polite');
      document.body.append(host);
    }
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = '<span class="toast-icon" aria-hidden="true"></span><div class="toast-body"><strong></strong><p></p></div><button type="button" class="toast-close" aria-label="Đóng thông báo">×</button>';
    $('.toast-icon', el).textContent = TOAST_ICONS[type] || 'i';
    const defaultTitles = { info: 'Thông tin', success: 'Thành công', error: 'Có lỗi xảy ra', warn: 'Lưu ý' };
    $('strong', el).textContent = title || defaultTitles[type];
    $('p', el).textContent = message;
    const dismiss = () => {
      el.classList.add('is-out');
      setTimeout(() => el.remove(), reduceMotion ? 0 : 220);
    };
    $('.toast-close', el).addEventListener('click', dismiss);
    host.append(el);
    Sound.play(type === 'error' ? 'error' : type === 'success' ? 'success' : 'info');
    if (duration > 0) setTimeout(dismiss, duration);
    return dismiss;
  }

  /* ---------------------------------- Modal (Vista-style window) */
  let modalCount = 0;
  function modal({ title = '', content = '', actions = [], size = 'md', onClose } = {}) {
    const previouslyFocused = document.activeElement;
    const id = `modal-title-${++modalCount}`;
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    const win = document.createElement('div');
    win.className = `vista-window modal${size === 'lg' ? ' modal--lg' : ''}`;
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-modal', 'true');
    win.setAttribute('aria-labelledby', id);
    win.innerHTML = `<div class="titlebar"><img class="tb-icon" src="assets/images/logo.svg" alt="" width="18" height="18"><span class="tb-title" id="${id}"></span><div class="win-btns"><button type="button" class="win-btn close" aria-label="Đóng cửa sổ">✕</button></div></div>`;
    $('.tb-title', win).textContent = title;
    const body = document.createElement('div');
    body.className = 'win-body win-body--solid';
    if (typeof content === 'string') body.innerHTML = content; else body.append(content);
    win.append(body);

    let closed = false;
    function close() {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey);
      backdrop.classList.remove('is-open');
      setTimeout(() => backdrop.remove(), reduceMotion ? 0 : 200);
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
      if (onClose) onClose();
    }

    if (actions.length) {
      const bar = document.createElement('div');
      bar.className = 'modal-actions';
      actions.forEach((a) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn btn--sm${a.variant === 'ghost' ? ' btn--glass' : a.variant === 'green' ? ' btn--green' : ''}`;
        btn.innerHTML = '<span class="btn-label"></span>';
        $('.btn-label', btn).textContent = a.label;
        btn.addEventListener('click', async () => {
          const result = a.onClick ? await a.onClick(close, btn) : undefined;
          if (result !== false && !a.keepOpen) close();
        });
        bar.append(btn);
      });
      win.append(bar);
    }

    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
      if (e.key === 'Tab') {
        const focusable = $$('button:not([disabled]), [href], input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])', win).filter((n) => n.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKey);
    $('.win-btn.close', win).addEventListener('click', close);
    backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(); });
    backdrop.append(win);
    document.body.append(backdrop);
    requestAnimationFrame(() => backdrop.classList.add('is-open'));
    const firstField = $('input, textarea, select', body) || $('.modal-actions .btn', win) || $('.win-btn.close', win);
    setTimeout(() => firstField && firstField.focus(), 60);
    return { close, el: win, body };
  }

  /* ---------------------------------- Validation helpers */
  const validators = {
    email: (v) => (!v ? 'Vui lòng nhập email.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? 'Email không hợp lệ (ví dụ: ban@example.com).' : ''),
    username: (v) => (!v ? 'Vui lòng nhập username.' : !/^[A-Za-z0-9_]{3,20}$/.test(v) ? 'Username dài 3–20 ký tự, chỉ gồm chữ, số và dấu gạch dưới.' : ''),
    required: (v, label = 'trường này') => (v ? '' : `Vui lòng nhập ${label}.`),
    newPassword: (v) => {
      if (!v) return 'Vui lòng nhập mật khẩu.';
      if (v.length < 8) return 'Mật khẩu cần ít nhất 8 ký tự.';
      if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Mật khẩu cần có cả chữ và số.';
      return '';
    },
  };

  function setFieldError(input, message) {
    const field = input.closest('.field');
    if (!field) return;
    field.classList.toggle('field--error', !!message);
    const err = $('.field-error', field);
    if (err) err.textContent = message || '';
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  const STRENGTH_LABELS = ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'];
  function scorePassword(pw) {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (pw.length < 8) return 1;
    return s <= 2 ? 2 : s === 3 ? 3 : 4;
  }

  /* ---------------------------------- Page behaviours */
  function initBubbles() {
    if (reduceMotion) return;
    let host = $('.bubbles');
    if (!host) { host = document.createElement('div'); host.className = 'bubbles'; host.setAttribute('aria-hidden', 'true'); document.body.prepend(host); }
    const count = window.innerWidth < 700 ? 8 : 15;
    for (let i = 0; i < count; i++) {
      const b = document.createElement('span');
      const size = 14 + Math.random() * 56;
      b.className = 'bubble';
      b.style.cssText = `width:${size}px;height:${size}px;left:${Math.random() * 100}%;--drift:${(Math.random() - 0.5) * 120}px;animation-duration:${14 + Math.random() * 16}s;animation-delay:${-Math.random() * 22}s`;
      host.append(b);
    }
  }

  function initTransitions() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== '_self') return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/\.html?$/.test(url.pathname) || (url.pathname === location.pathname && url.hash)) return;
      e.preventDefault();
      go(url.href);
    });
  }
  function go(href) {
    if (reduceMotion) { location.href = href; return; }
    document.body.classList.add('is-leaving');
    setTimeout(() => { location.href = href; }, 200);
  }

  function initPasswordToggles() {
    $$('[data-toggle-password]').forEach((btn) => {
      const input = document.getElementById(btn.dataset.togglePassword);
      if (!input) return;
      btn.addEventListener('click', () => {
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.setAttribute('aria-pressed', String(show));
        btn.setAttribute('aria-label', show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
      });
    });
  }

  function initSoundButtons() {
    if (!$('[data-sound-toggle]')) {
      const fab = document.createElement('button');
      fab.type = 'button';
      fab.className = 'icon-btn sound-fab';
      fab.setAttribute('data-sound-toggle', '');
      fab.innerHTML = soundIcon();
      document.body.append(fab);
    }
    $$('[data-sound-toggle]').forEach((btn) => {
      if (!btn.firstElementChild) btn.innerHTML = soundIcon();
      btn.addEventListener('click', () => Sound.toggle());
    });
    Sound.syncButtons();
    document.addEventListener('click', (e) => { if (e.target.closest('.btn, .chip, .task-btn')) Sound.play('click'); }, true);
  }
  function soundIcon() {
    return '<svg class="snd-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/></svg><svg class="snd-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  }

  function init() {
    initBubbles();
    initTransitions();
    initPasswordToggles();
    initSoundButtons();
    $$('[data-year]').forEach((n) => { n.textContent = new Date().getFullYear(); });
    $$('[data-meter-for]').forEach((meter) => {
      const input = document.getElementById(meter.dataset.meterFor);
      const label = meter.nextElementSibling;
      const update = () => {
        const score = scorePassword(input.value);
        meter.dataset.score = String(score);
        if (label) label.textContent = score ? `Độ mạnh mật khẩu: ${STRENGTH_LABELS[score]}` : '';
      };
      input.addEventListener('input', update);
      update();
    });
  }

  window.UI = { $, $$, store, toast, modal, Sound, validators, setFieldError, scorePassword, go, reduceMotion, soundIcon };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
