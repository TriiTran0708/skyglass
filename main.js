/* SkyGlass — logic cho Main Page */
(() => {
  'use strict';
  const { $, $$, store, toast, modal, Sound, go, reduceMotion } = window.UI;
  const Auth = window.Auth;

  /* ------------------------------------------------------------ helpers */
  function el(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  const initial = (name) => (name || '?').trim().charAt(0) || '?';

  /* ------------------------------------------------------------ data */
  const ICONS = {
    cloud: '<path d="M7 18a4 4 0 0 1-.5-7.97A6 6 0 0 1 18 9.5 4.25 4.25 0 0 1 17.5 18z"/>',
    wave: '<path d="M2 9c2.5-3 5-3 7.5 0S14.5 12 17 9s3.500-3 5 0M2 15c2.500-3 5-3 7.500 0s5 3 7.500 0 3.500-3 5 0"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.480 19 2c1 2 2 4.180 2 8 0 5.500-4.780 10-10 10z"/><path d="M2 21c0-3 1.850-5.360 5.080-6C9.500 14.520 12 13 13 12"/>',
    orb: '<circle cx="12" cy="12" r="9"/><path d="M7.500 9a5.500 5.500 0 0 1 4-3.500"/>',
    bubble: '<circle cx="9" cy="14" r="6"/><circle cx="17.500" cy="7" r="3"/><path d="M6.500 12a3 3 0 0 1 2-1.500"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.900 4.900l1.400 1.400M17.700 17.700l1.400 1.400M2 12h2M20 12h2M4.900 19.100l1.400-1.400M17.700 6.300l1.400-1.400"/>',
  };
  const iconSvg = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  const COLLECTIONS = [
    { id: 'morning-sky', title: 'Morning Sky', cat: 'sky', icon: 'cloud', from: '#1d78c9', to: '#bfeaff', desc: 'Bầu trời xanh thẳm với những đám mây bồng bềnh, ánh sáng buổi sớm trong trẻo.', mood: 'Thư thái · Tươi mới', palette: 'Xanh da trời, trắng ngọc trai' },
    { id: 'crystal-lagoon', title: 'Crystal Lagoon', cat: 'water', icon: 'wave', from: '#2eaedb', to: '#8be8f0', desc: 'Mặt nước xanh ngọc trong veo, sóng lăn tăn và ánh nắng nhảy múa trên mặt biển.', mood: 'Mát lành · Yên bình', palette: 'Xanh đại dương, cyan nhạt' },
    { id: 'green-meadow', title: 'Green Meadow', cat: 'nature', icon: 'leaf', from: '#2f9a3f', to: '#9be86c', desc: 'Đồng cỏ xanh mướt trải dài dưới trời nắng, điểm vài giọt sương lấp lánh.', mood: 'Sống động · Hy vọng', palette: 'Xanh lá, vàng nắng' },
    { id: 'glass-orbs', title: 'Glass Orbs', cat: 'glass', icon: 'orb', from: '#0b5fb0', to: '#6cc4f2', desc: 'Những quả cầu thủy tinh phản chiếu bầu trời, viền sáng và vệt highlight như kính thật.', mood: 'Bóng bẩy · Tương lai', palette: 'Xanh dương, trắng, cyan' },
    { id: 'bubble-drift', title: 'Bubble Drift', cat: 'water', icon: 'bubble', from: '#59c3f0', to: '#e3f8ff', desc: 'Bong bóng nước trôi nhẹ, trong suốt, ánh cầu vồng mỏng trên bề mặt.', mood: 'Vui tươi · Nhẹ nhàng', palette: 'Trắng ngọc trai, xanh nhạt' },
    { id: 'golden-horizon', title: 'Golden Horizon', cat: 'sky', icon: 'sun', from: '#4fb0ea', to: '#ffe9a8', desc: 'Đường chân trời rạng rỡ nơi biển gặp trời, những dải sáng xuyên qua mây.', mood: 'Lạc quan · Rộng mở', palette: 'Xanh trời, vàng kem' },
  ];

  /* ------------------------------------------------------------ state */
  let currentUser = null;
  let activeFilter = 'all';
  const FAV_KEY = 'skyglass.favs';
  let favs = new Set();
  try { favs = new Set(JSON.parse(store.get(FAV_KEY, '[]'))); } catch { favs = new Set(); }
  const saveFavs = () => store.set(FAV_KEY, JSON.stringify([...favs]));

  /* ------------------------------------------------------------ user UI */
  function renderUser() {
    const box = $('#userBox');
    box.replaceChildren();
    const startAuth = $('#startAuth');
    startAuth.replaceChildren();

    if (currentUser) {
      const av = el('span', 'avatar', initial(currentUser.username));
      av.setAttribute('aria-hidden', 'true');
      const name = el('span', 'user-name', currentUser.username);
      name.title = currentUser.email;
      const out = el('button', 'btn btn--glass btn--sm');
      out.type = 'button';
      out.innerHTML = '<span class="btn-label">Logout</span>';
      out.addEventListener('click', confirmLogout);
      box.append(av, name, out);

      const li = el('li');
      const b = el('button', 'menu-item', 'Logout');
      b.type = 'button';
      b.setAttribute('role', 'menuitem');
      b.addEventListener('click', () => { closeStart(); confirmLogout(); });
      li.append(b);
      startAuth.append(li);
    } else {
      const login = el('a', 'btn btn--glass btn--sm');
      login.href = 'login.html';
      login.innerHTML = '<span class="btn-label">Login</span>';
      const reg = el('a', 'btn btn--sm');
      reg.href = 'register.html';
      reg.innerHTML = '<span class="btn-label">Register</span>';
      box.append(login, reg);

      [['Login', 'login.html'], ['Register', 'register.html']].forEach(([label, href]) => {
        const li = el('li');
        const a = el('a', '', label);
        a.href = href;
        a.setAttribute('role', 'menuitem');
        li.append(a);
        startAuth.append(li);
      });
    }

    $('#heroEyebrow').textContent = currentUser ? `Chào mừng trở lại, ${currentUser.username}` : 'Chào mừng đến với SkyGlass';
    const gs = $('#getStarted');
    gs.href = currentUser ? '#explore' : 'register.html';
    $('#clockGreet').textContent = greeting();
  }

  function confirmLogout() {
    modal({
      title: 'Logout',
      content: '<p>Bạn có chắc muốn đăng xuất khỏi SkyGlass?</p>',
      actions: [
        { label: 'Cancel', variant: 'ghost' },
        {
          label: 'Logout',
          async onClick() {
            const res = await Auth.signOut();
            if (!res.ok) { toast(res.message, { type: 'error', title: 'Đăng xuất thất bại' }); return false; }
            toast('Bạn đã đăng xuất.', { type: 'success', title: 'Hẹn gặp lại' });
            setTimeout(() => go('login.html'), 700);
            return true;
          },
        },
      ],
    });
  }

  function openProfile() {
    closeStart();
    closeNav();
    if (!currentUser) {
      modal({
        title: 'Profile',
        content: '<p>Bạn chưa đăng nhập. Hãy đăng nhập hoặc tạo tài khoản để xem hồ sơ.</p>' +
          (Auth.configured ? '' : `<div class="notice" role="note">${Auth.problem}</div>`),
        actions: [
          { label: 'Register', variant: 'ghost', onClick: () => go('register.html') },
          { label: 'Login', onClick: () => go('login.html') },
        ],
      });
      return;
    }
    const wrap = el('div');
    const head = el('div', 'profile-head');
    const av = el('span', 'avatar avatar--lg', initial(currentUser.username));
    av.setAttribute('aria-hidden', 'true');
    const info = el('div');
    info.append(el('h3', '', currentUser.username), el('p', '', currentUser.email));
    head.append(av, info);
    const kv = el('dl', 'kv');
    const joined = currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
    [['Username', currentUser.username], ['Email', currentUser.email], ['Tham gia', joined], ['Yêu thích', `${favs.size} bộ sưu tập`]].forEach(([k, v]) => {
      kv.append(el('dt', '', k), el('dd', '', v));
    });
    wrap.append(head, kv);
    modal({
      title: 'Profile',
      content: wrap,
      actions: [{ label: 'Close', variant: 'ghost' }, { label: 'Logout', onClick: () => { setTimeout(confirmLogout, 220); } }],
    });
  }

  /* ------------------------------------------------------------ Explore */
  function renderCollections() {
    const grid = $('#collectionGrid');
    grid.replaceChildren();
    const items = COLLECTIONS.filter((c) => (activeFilter === 'all' ? true : activeFilter === 'favs' ? favs.has(c.id) : c.cat === activeFilter));
    $('#emptyMsg').hidden = items.length > 0;
    $('#favCount').textContent = String(favs.size);

    items.forEach((c) => {
      const card = el('article', 'card');
      const thumb = el('div', 'thumb');
      thumb.style.background = `linear-gradient(160deg, ${c.from}, ${c.to})`;
      thumb.innerHTML = iconSvg(c.icon);
      thumb.setAttribute('aria-hidden', 'true');

      const top = el('div', 'card-top');
      top.append(el('span', 'tag', c.cat.charAt(0).toUpperCase() + c.cat.slice(1)));
      const heart = heartButton(c);
      top.append(heart);

      const actions = el('div', 'card-actions');
      const view = el('button', 'btn btn--sm');
      view.type = 'button';
      view.innerHTML = '<span class="btn-label">Preview</span>';
      view.addEventListener('click', () => openPreview(c));
      actions.append(view);

      card.append(thumb, top, el('h3', '', c.title), el('p', '', c.desc), actions);
      grid.append(card);
    });
  }

  function heartButton(c) {
    const btn = el('button', 'heart');
    btn.type = 'button';
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.800 4.600a5.500 5.500 0 0 0-7.800 0L12 5.700l-1-1.100a5.500 5.500 0 0 0-7.800 7.800l1 1.100L12 21.200l7.800-7.700 1-1.100a5.500 5.500 0 0 0 0-7.800z"/></svg>';
    const sync = () => {
      const on = favs.has(c.id);
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', on ? `Bỏ yêu thích ${c.title}` : `Thêm ${c.title} vào yêu thích`);
    };
    sync();
    btn.addEventListener('click', () => {
      toggleFav(c);
      sync();
    });
    return btn;
  }

  function toggleFav(c) {
    if (favs.has(c.id)) { favs.delete(c.id); toast(`Đã bỏ "${c.title}" khỏi yêu thích.`, { type: 'info', duration: 2500 }); }
    else { favs.add(c.id); toast(`Đã thêm "${c.title}" vào yêu thích.`, { type: 'success', duration: 2500 }); }
    saveFavs();
    $('#favCount').textContent = String(favs.size);
    if (activeFilter === 'favs') renderCollections();
  }

  function openPreview(c) {
    const wrap = el('div');
    const art = el('div', 'preview-art');
    art.style.background = `linear-gradient(160deg, ${c.from}, ${c.to})`;
    art.innerHTML = iconSvg(c.icon);
    art.setAttribute('aria-hidden', 'true');
    const kv = el('dl', 'kv');
    [['Chủ đề', c.cat], ['Cảm giác', c.mood], ['Bảng màu', c.palette]].forEach(([k, v]) => kv.append(el('dt', '', k), el('dd', '', v)));
    wrap.append(art, el('p', '', c.desc), kv);
    modal({
      title: c.title,
      content: wrap,
      size: 'lg',
      actions: [
        { label: favs.has(c.id) ? 'Bỏ yêu thích' : 'Thêm yêu thích', variant: 'green', onClick: () => { toggleFav(c); renderCollections(); } },
        { label: 'Close', variant: 'ghost' },
      ],
    });
  }

  function initFilters() {
    $$('#filters .chip').forEach((chip) => chip.addEventListener('click', () => {
      activeFilter = chip.dataset.filter;
      $$('#filters .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      renderCollections();
    }));
  }

  /* ------------------------------------------------------------ Clock */
  function greeting() {
    const h = new Date().getHours();
    const part = h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
    return currentUser ? `${part}, ${currentUser.username}!` : `${part}!`;
  }
  function tick() {
    const now = new Date();
    const hm = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    $('#clockTime').textContent = hm;
    $('#trayClock').textContent = hm;
    $('#clockDate').textContent = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  /* ------------------------------------------------------------ Notes */
  function initNotes() {
    const area = $('#notesArea');
    const hint = $('#notesHint');
    area.value = store.get('skyglass.notes', '');
    let timer;
    area.addEventListener('input', () => {
      hint.textContent = 'Đang lưu…';
      clearTimeout(timer);
      timer = setTimeout(() => { store.set('skyglass.notes', area.value); hint.textContent = 'Đã lưu trong trình duyệt này.'; }, 400);
    });
  }

  /* ------------------------------------------------------------ Windows & taskbar */
  let zTop = 20;
  const desktopQuery = window.matchMedia('(min-width: 981px)');

  function winOf(name) { return $(`.float-window[data-win="${name}"]`); }
  function syncTask(name) {
    const win = winOf(name);
    const btn = $(`.task-btn[data-task="${name}"]`);
    btn.setAttribute('aria-pressed', String(!win.hidden && !win.classList.contains('is-min')));
  }
  function focusWin(win) { win.style.zIndex = String(++zTop); }

  function initWindows() {
    $$('.float-window').forEach((win) => {
      const name = win.dataset.win;
      win.addEventListener('pointerdown', () => { if (!win.classList.contains('is-max')) focusWin(win); });

      $$('[data-win-action]', win).forEach((btn) => btn.addEventListener('click', () => {
        const action = btn.dataset.winAction;
        if (action === 'close') { win.hidden = true; }
        if (action === 'min') { win.classList.toggle('is-min'); }
        if (action === 'max') {
          const on = win.classList.toggle('is-max');
          win.classList.remove('is-min');
          win.style.left = win.style.top = '';
          btn.setAttribute('aria-label', `${on ? 'Khôi phục' : 'Phóng to'} ${$('.tb-title', win).textContent}`);
          if (on) focusWin(win);
        }
        syncTask(name);
      }));

      // Drag by titlebar (desktop only)
      const bar = $('.titlebar', win);
      bar.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button') || !desktopQuery.matches || win.classList.contains('is-max')) return;
        const parent = win.parentElement.getBoundingClientRect();
        const rect = win.getBoundingClientRect();
        const dx = e.clientX - rect.left;
        const dy = e.clientY - rect.top;
        win.classList.add('is-dragging');
        bar.setPointerCapture(e.pointerId);
        const move = (ev) => {
          const x = Math.min(Math.max(ev.clientX - dx - parent.left, -40), parent.width - 80);
          const y = Math.min(Math.max(ev.clientY - dy - parent.top, -20), parent.height - 40);
          win.style.left = `${x}px`;
          win.style.top = `${y}px`;
          win.style.right = 'auto';
          win.style.bottom = 'auto';
        };
        const up = () => {
          win.classList.remove('is-dragging');
          bar.removeEventListener('pointermove', move);
          bar.removeEventListener('pointerup', up);
          bar.removeEventListener('pointercancel', up);
        };
        bar.addEventListener('pointermove', move);
        bar.addEventListener('pointerup', up);
        bar.addEventListener('pointercancel', up);
      });
    });

    $$('.task-btn').forEach((btn) => btn.addEventListener('click', () => {
      const win = winOf(btn.dataset.task);
      if (win.hidden) { win.hidden = false; win.classList.remove('is-min'); focusWin(win); }
      else { win.classList.toggle('is-min'); if (!win.classList.contains('is-min')) focusWin(win); }
      syncTask(btn.dataset.task);
    }));
  }

  /* ------------------------------------------------------------ Start menu & nav */
  const startBtn = $('#startBtn');
  const startMenu = $('#startMenu');
  function closeStart() { startMenu.hidden = true; startBtn.setAttribute('aria-expanded', 'false'); }
  function toggleStart() {
    const open = startMenu.hidden;
    startMenu.hidden = !open;
    startBtn.setAttribute('aria-expanded', String(open));
  }
  const navToggle = $('.nav-toggle');
  const navMenu = $('#navMenu');
  function closeNav() { navMenu.classList.remove('is-open'); navToggle.setAttribute('aria-expanded', 'false'); navToggle.setAttribute('aria-label', 'Mở menu'); }

  function initNav() {
    startBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleStart(); });
    document.addEventListener('click', (e) => { if (!startMenu.hidden && !e.target.closest('#startMenu')) closeStart(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeStart(); closeNav(); } });
    startMenu.addEventListener('click', (e) => { if (e.target.closest('a')) closeStart(); });

    navToggle.addEventListener('click', () => {
      const open = navMenu.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    });
    navMenu.addEventListener('click', (e) => { if (e.target.closest('a[href^="#"]')) closeNav(); });

    $$('[data-open-profile]').forEach((n) => n.addEventListener('click', (e) => { e.preventDefault(); openProfile(); }));

    // Scrollspy
    const links = $$('.nav-links a[data-section]');
    const sections = links.map((a) => document.getElementById(a.dataset.section)).filter(Boolean);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) links.forEach((a) => a.classList.toggle('is-active', a.dataset.section === en.target.id));
        });
      }, { rootMargin: '-35% 0px -55% 0px' });
      sections.forEach((s) => io.observe(s));
    }
  }

  /* ------------------------------------------------------------ Card spotlight */
  function initSpotlight() {
    if (reduceMotion) return;
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest && e.target.closest('.card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }

  /* ------------------------------------------------------------ boot */
  async function boot() {
    initNav();
    initFilters();
    initNotes();
    initWindows();
    initSpotlight();
    renderCollections();
    tick();
    setInterval(tick, 15000);
    renderUser();

    currentUser = await Auth.getUser();
    renderUser();

    // Cập nhật khi phiên thay đổi (đăng nhập OAuth, đăng xuất ở tab khác…)
    Auth.onEvent((event, user) => {
      if (event === 'SIGNED_OUT') { currentUser = null; renderUser(); }
      if (event === 'SIGNED_IN' && user && (!currentUser || currentUser.id !== user.id)) { currentUser = user; renderUser(); }
    });

    if (!Auth.configured && !sessionStorage.getItem('skyglass.noticeShown')) {
      sessionStorage.setItem('skyglass.noticeShown', '1');
      toast('Bạn đang xem ở chế độ khách vì chưa cấu hình Supabase. Đăng nhập chưa hoạt động thực tế (xem README).', { type: 'warn', title: 'Chưa cấu hình backend', duration: 8000 });
    }
  }
  boot();
})();
