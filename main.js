/* 一閃 ISSEN — Landing Page script
   - スクロールで「色を解放」していく演出 (ゲームのレベル解放と同じ8色)
   - セクションのフェードイン
   - ナビの Lv / 進捗バー
   - デイリー更新までのカウントダウン
   - クリックした場所に斬撃エフェクト */
(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ゲーム本体と同じ解放レベルと色
  const COLORS = [
    { lv: 1, c: null }, { lv: 2, c: '#E5484D' }, { lv: 4, c: '#F76B15' }, { lv: 6, c: '#30A46C' },
    { lv: 9, c: '#12A594' }, { lv: 12, c: '#0090FF' }, { lv: 16, c: '#9E6CD9' }, { lv: 20, c: '#E93D82' },
  ];
  const colorOf = i => COLORS[i].c || 'var(--ink)';

  let unlocked = 0;
  let selected = 0;

  // ---------- swatches ----------
  const swWrap = document.getElementById('swatches');
  const swatches = COLORS.map((col, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sw';
    b.style.setProperty('--c', colorOf(i));
    b.innerHTML = '<small>Lv' + col.lv + '</small>';
    b.addEventListener('click', () => {
      if (i <= unlocked) select(i);
      else toast('Lv ' + col.lv + ' で解放 ・ 先へスクロール', false);
    });
    swWrap && swWrap.appendChild(b);
    return b;
  });

  function paintSwatches(popIndex) {
    swatches.forEach((b, i) => {
      const open = i <= unlocked;
      b.classList.toggle('open', open);
      b.classList.toggle('sel', i === selected);
      b.setAttribute('aria-label', open ? 'Lv' + COLORS[i].lv + ' の色を使う' : 'Lv' + COLORS[i].lv + ' で解放');
      b.setAttribute('aria-pressed', String(i === selected));
      if (i === popIndex && !RM) {
        b.classList.remove('popin'); void b.offsetWidth; b.classList.add('popin');
      }
    });
  }

  function select(i) {
    selected = i;
    root.style.setProperty('--accent', colorOf(i));
    paintSwatches();
  }

  // ---------- HUD ----------
  const hudLv = document.getElementById('hudLv');
  const hudBar = document.getElementById('hudBar');
  function paintHud() { if (hudLv) hudLv.textContent = COLORS[unlocked].lv; }

  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const k = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    if (hudBar) hudBar.style.width = (k * 100).toFixed(1) + '%';
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // ---------- toast ----------
  const toastEl = document.getElementById('toast');
  let toastTimer = 0;
  function toast(text, dot = true) {
    if (!toastEl) return;
    toastEl.innerHTML = (dot ? '<i></i>' : '') + '<span></span>';
    toastEl.querySelector('span').textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  // ---------- unlock on scroll ----------
  function unlock(n) {
    if (n <= unlocked) return;
    unlocked = Math.min(n, COLORS.length - 1);
    select(unlocked);                 // ゲームと同じく、新しく解放した色に切り替える
    paintSwatches(unlocked);
    paintHud();
    toast('Lv ' + COLORS[unlocked].lv + '  新しい色を解放');
  }

  const unlockIO = new IntersectionObserver(entries => {
    for (const en of entries) {
      if (en.isIntersecting) unlock(Number(en.target.dataset.unlock) || 0);
    }
  }, { rootMargin: '0px 0px -45% 0px', threshold: 0 });
  document.querySelectorAll('[data-unlock]').forEach(el => unlockIO.observe(el));

  // ---------- reveal ----------
  const revealIO = new IntersectionObserver(entries => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const el = en.target;
      // 同じ親の中で順番に少しずつ遅らせる
      const sibs = Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal'));
      el.style.transitionDelay = (RM ? 0 : Math.max(0, sibs.indexOf(el)) * 80) + 'ms';
      el.classList.add('in');
      revealIO.unobserve(el);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  document.querySelectorAll('.reveal').forEach(el => revealIO.observe(el));

  // ---------- daily countdown (ローカル時刻の0時まで) ----------
  const leftEl = document.getElementById('left');
  const pad = n => String(n).padStart(2, '0');
  function tick() {
    if (!leftEl) return;
    const now = new Date();
    const mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const s = Math.max(0, Math.floor((mid - now) / 1000));
    leftEl.textContent = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60);
  }
  tick();
  setInterval(tick, 1000);

  // ---------- click slash ----------
  if (!RM) {
    document.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('a, button')) return;
      const s = document.createElement('span');
      s.className = 'slash';
      s.style.left = e.clientX + 'px';
      s.style.top = e.clientY + 'px';
      s.style.setProperty('--a', (Math.random() * 70 - 35 + (Math.random() < 0.5 ? 0 : 180)) + 'deg');
      document.body.appendChild(s);
      s.addEventListener('animationend', () => s.remove());
    });
  }

  // ---------- init ----------
  paintSwatches();
  paintHud();
})();
