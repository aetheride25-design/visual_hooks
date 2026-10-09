(() => {
  const STORE_KEY = 'vh-lang';
  const I18N = window.I18N;
  const EFFECTS = window.EFFECTS;
  let lang = 'en';

  const t = (key) => I18N[lang][key] ?? I18N.en[key] ?? key;

  const pickLang = () => {
    const url = new URLSearchParams(location.search).get('lang');
    if (url === 'en' || url === 'es') return url;
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved === 'en' || saved === 'es') return saved;
    } catch {}
    return (navigator.language || '').toLowerCase().startsWith('es') ? 'es' : 'en';
  };

  // ---------- Effects gallery ----------
  const grid = document.getElementById('effect-grid');
  const groupLabel = { hook: 'effects.hooks', support: 'effects.support', piece: 'effects.pieces' };

  const renderGrid = () => {
    grid.innerHTML = '';
    for (const fx of EFFECTS) {
      const card = document.createElement('figure');
      card.className = 'fx';
      card.dataset.group = fx.group;
      card.innerHTML = `
        <div class="fx-media">
          <video muted loop playsinline preload="none" poster="media/effects/${fx.id}.jpg">
            <source src="media/effects/${fx.id}.mp4" type="video/mp4">
          </video>
          <span class="fx-group">${t(groupLabel[fx.group])}</span>
        </div>
        <figcaption>
          <strong>${lang === 'es' ? fx.es : fx.en}</strong>
          <span>${lang === 'es' ? fx.des : fx.den}</span>
          <code>${fx.id}</code>
        </figcaption>`;
      grid.append(card);
    }
    applyFilter(currentFilter);
    watchVideos();
  };

  let currentFilter = 'all';
  const applyFilter = (filter) => {
    currentFilter = filter;
    for (const card of grid.children) card.hidden = filter !== 'all' && card.dataset.group !== filter;
    for (const b of document.querySelectorAll('.tabs button')) {
      const on = b.dataset.filter === filter;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
    }
  };
  for (const b of document.querySelectorAll('.tabs button')) b.addEventListener('click', () => applyFilter(b.dataset.filter));

  // Effect clips play while they're on screen (phones have no hover), and restart on hover.
  let observer;
  const watchVideos = () => {
    observer?.disconnect();
    const videos = grid.querySelectorAll('video');
    if (!('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target;
          if (e.isIntersecting) {
            if (v.preload === 'none') v.preload = 'auto';
            v.play().catch(() => {});
          } else v.pause();
        }
      },
      { rootMargin: '120px 0px', threshold: 0.35 },
    );
    for (const v of videos) {
      observer.observe(v);
      v.closest('.fx').addEventListener('mouseenter', () => {
        v.currentTime = 0;
        v.play().catch(() => {});
      });
    }
  };

  // ---------- Language ----------
  const heroVideo = document.querySelector('.hero video');
  const setLang = (next) => {
    lang = next;
    document.documentElement.lang = lang;
    document.title = t('title');
    for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
    for (const el of document.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
    for (const el of document.querySelectorAll('[data-i18n-placeholder]')) el.placeholder = t(el.dataset.i18nPlaceholder);
    for (const b of document.querySelectorAll('.lang button')) b.setAttribute('aria-pressed', String(b.dataset.lang === lang));

    const src = heroVideo.dataset[`src${lang === 'es' ? 'Es' : 'En'}`];
    if (heroVideo.currentSrc && !heroVideo.currentSrc.endsWith(src)) {
      heroVideo.poster = heroVideo.dataset[`poster${lang === 'es' ? 'Es' : 'En'}`];
      heroVideo.src = src;
      heroVideo.play().catch(() => {});
    } else if (!heroVideo.currentSrc && lang === 'es') {
      heroVideo.poster = heroVideo.dataset.posterEs;
      heroVideo.src = src;
    }
    renderGrid();
    try {
      localStorage.setItem(STORE_KEY, lang);
    } catch {}
  };
  for (const b of document.querySelectorAll('.lang button')) b.addEventListener('click', () => setLang(b.dataset.lang));

  // ---------- Copy buttons ----------
  for (const b of document.querySelectorAll('[data-copy]')) {
    b.addEventListener('click', async () => {
      const text = document.getElementById(b.dataset.copy).textContent;
      try {
        await navigator.clipboard.writeText(text);
        b.textContent = t('copied');
        setTimeout(() => (b.textContent = t('copy')), 1600);
      } catch {}
    });
  }

  // ---------- Cloud waitlist ----------
  const form = document.getElementById('cloud-form');
  const msg = document.getElementById('cloud-msg');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = form.elements.email;
    const say = (key, ok) => {
      msg.textContent = t(key);
      msg.dataset.state = ok ? 'ok' : 'warn';
    };
    if (!input.checkValidity()) return say('cloud.invalid', false);
    const endpoint = window.SITE_CONFIG?.waitlistEndpoint;
    if (!endpoint) return say('cloud.closed', false);
    say('cloud.sending', true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: input.value, lang }),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      say('cloud.ok', true);
    } catch {
      say('cloud.error', false);
    }
  });

  // ---------- Counters + reveal ----------
  for (const el of document.querySelectorAll('[data-count-effects]')) el.textContent = String(EFFECTS.length);
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
      },
      { threshold: 0.12 },
    );
    for (const el of document.querySelectorAll('.section-head, .card, .steps li, .terminal, .oss, details, .split > *')) {
      el.classList.add('reveal');
      io.observe(el);
    }
  }

  setLang(pickLang());
})();
