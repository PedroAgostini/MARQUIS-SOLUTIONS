// Marquis Solutions: page behavior.

// Fill these in before launch.
const CONFIG = {
  WEB3FORMS_KEY: 'YOUR_WEB3FORMS_ACCESS_KEY', // https://web3forms.com, sends to contactmarquissolutions@gmail.com
  GA_ID: '', // e.g. G-XXXXXXXXXX or AW-XXXXXXXXX
  META_PIXEL_ID: '', // e.g. 123456789012345
};

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

/* ---------- Tracking ---------- */
function loadTracking() {
  if (CONFIG.GA_ID) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.GA_ID}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', CONFIG.GA_ID);
  }
  if (CONFIG.META_PIXEL_ID) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', CONFIG.META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }
}
function track(kind, detail = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: `marquis_${kind}`, ...detail });
  if (window.gtag) {
    const name = kind === 'lead' ? 'generate_lead' : kind === 'call' ? 'click_to_call' : 'click_to_text';
    window.gtag('event', name, detail);
  }
  if (window.fbq) window.fbq('track', kind === 'lead' ? 'Lead' : 'Contact', detail);
}
loadTracking();
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-track]');
  if (a) track(a.dataset.track, { location: a.dataset.loc || '' });
});

/* ---------- Smooth scroll ---------- */
let lenis = null;
if (!reduced && window.Lenis) {
  lenis = new window.Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
  if (gsap && ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
}

const toggle = $('[data-menu-toggle]');
const menu = $('#mobile-menu');
function closeMenu() {
  if (!menu || menu.hidden) return;
  menu.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  const target = document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  closeMenu();
  if (lenis) lenis.scrollTo(target, { offset: -90 });
  else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  history.replaceState(null, '', id);
  if (id === '#contact') setTimeout(() => $('#f-name')?.focus({ preventScroll: true }), lenis ? 1200 : 500);
});

/* ---------- Nav ---------- */
const nav = $('[data-nav]');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 30);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

toggle?.addEventListener('click', () => {
  const open = menu.hidden;
  menu.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  if (open) menu.querySelector('a')?.focus();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

const navLinks = $$('.nav__links a');
const sectionObs = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    const href = `#${en.target.id}`;
    if (en.isIntersecting) navLinks.forEach((l) => l.classList.toggle('is-current', l.getAttribute('href') === href));
    else navLinks.forEach((l) => { if (l.getAttribute('href') === href) l.classList.remove('is-current'); });
  });
}, { rootMargin: '-45% 0px -50% 0px' });
['top', 'services', 'projects', 'reviews', 'why', 'faq'].forEach((id) => { const s = document.getElementById(id); if (s) sectionObs.observe(s); });

/* ---------- Reveal ---------- */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('is-in');
    revealObs.unobserve(en.target);
  });
}, { rootMargin: '0px 0px -8% 0px' });
$$('.reveal').forEach((el) => {
  const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
  el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 5) * 0.08}s`);
  revealObs.observe(el);
});

/* ---------- Hero entrance ---------- */
if (gsap && !reduced) {
  gsap.from('.hero__title, .hero__sub, .hero__call', { y: 30, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1, delay: 0.1, clearProps: 'transform,opacity' });
}

/* ---------- Live wire borders ---------- */
const SVGNS = 'http://www.w3.org/2000/svg';
const wires = [];
const isTouch = window.matchMedia('(hover: none)').matches;

function setupWire(card) {
  const svg = $('.live__wire', card);
  if (!svg) return;
  const radius = parseFloat(getComputedStyle(card).borderTopLeftRadius) || 24;
  const mk = (cls) => { const r = document.createElementNS(SVGNS, 'rect'); r.setAttribute('class', cls); svg.appendChild(r); return r; };
  const base = mk('w-base');
  const glow = mk('w-glow');
  const current = mk('w-current');
  const w = { card, svg, base, glow, current, len: 0, t: Math.random() * 1000, visible: false, hot: false, lastSpark: 0 };
  const size = () => {
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    [base, glow, current].forEach((r) => {
      r.setAttribute('x', 1); r.setAttribute('y', 1);
      r.setAttribute('width', Math.max(0, width - 2)); r.setAttribute('height', Math.max(0, height - 2));
      r.setAttribute('rx', radius - 1); r.setAttribute('ry', radius - 1);
    });
    w.len = current.getTotalLength();
  };
  size();
  new ResizeObserver(size).observe(card);
  if (!isTouch) {
    card.addEventListener('pointerenter', () => { w.hot = true; card.classList.add('is-hot'); });
    card.addEventListener('pointerleave', () => { w.hot = false; card.classList.remove('is-hot'); });
  }
  card.addEventListener('focusin', () => { w.hot = true; card.classList.add('is-hot'); });
  card.addEventListener('focusout', (e) => { if (!card.contains(e.relatedTarget)) { w.hot = false; card.classList.remove('is-hot'); } });
  wires.push(w);
}
$$('.live').forEach(setupWire);

const wireObs = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    const w = wires.find((x) => x.card === en.target);
    if (!w) return;
    w.visible = en.isIntersecting;
    w.card.classList.toggle('is-on', en.isIntersecting);
  });
}, { threshold: 0.2 });
wires.forEach((w) => wireObs.observe(w.card));

// On touch screens the service card closest to the middle of the screen goes live.
if (isTouch) {
  const svcCards = wires.filter((w) => w.card.classList.contains('svc'));
  const pickCenter = () => {
    const mid = window.innerHeight / 2;
    let best = null; let dist = Infinity;
    svcCards.forEach((w) => {
      const r = w.card.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < dist && r.bottom > 0 && r.top < window.innerHeight) { dist = d; best = w; }
    });
    svcCards.forEach((w) => { const on = w === best && dist < window.innerHeight * 0.35; w.hot = on; w.card.classList.toggle('is-hot', on); });
  };
  window.addEventListener('scroll', pickCenter, { passive: true });
  pickCenter();
}

function spark(w, x, y) {
  const s = document.createElement('span');
  s.className = 'spark';
  s.style.left = `${x}px`;
  s.style.top = `${y}px`;
  w.card.appendChild(s);
  const a = Math.random() * Math.PI * 2;
  const d = 10 + Math.random() * 22;
  s.animate(
    [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) scale(0.2)`, opacity: 0 }],
    { duration: 380 + Math.random() * 260, easing: 'cubic-bezier(0.16,1,0.3,1)' }
  ).onfinish = () => s.remove();
}

let lastT = performance.now();
function wireLoop(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  wires.forEach((w) => {
    if (!w.visible || !w.len) return;
    const speed = w.hot ? 520 : 70;
    w.t += dt * speed;
    const dash = w.hot ? Math.min(160, w.len * 0.16) : Math.min(110, w.len * 0.1);
    const gap = w.len - dash;
    const off = -(w.t % w.len);
    w.current.style.strokeDasharray = `${dash} ${gap}`;
    w.current.style.strokeDashoffset = off;
    w.glow.style.strokeDasharray = `${dash} ${gap}`;
    w.glow.style.strokeDashoffset = off;
    if (w.hot && now - w.lastSpark > 45) {
      w.lastSpark = now;
      const p = w.current.getPointAtLength((w.t + dash) % w.len);
      spark(w, p.x + 1, p.y + 1);
    }
  });
  requestAnimationFrame(wireLoop);
}
if (reduced) {
  wires.forEach((w) => { w.current.style.strokeDasharray = 'none'; });
} else {
  requestAnimationFrame(wireLoop);
}

/* ---------- Hero 3D symbol ---------- */
const heroCanvas = $('[data-hero-canvas]');
function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
function heroFallback() {
  const img = document.createElement('img');
  img.src = $('link[rel="icon"]').href;
  img.alt = '';
  img.className = 'hero__canvas';
  img.style.objectFit = 'contain';
  img.style.padding = '70px';
  heroCanvas.replaceWith(img);
}
if (heroCanvas) {
  if (webglOK() && gsap) {
    import('./hero-symbol.js')
      .then((m) => m.initHeroSymbol(heroCanvas, { gsap, reduced }))
      .catch((err) => { console.warn('[hero 3D]', err); heroFallback(); });
  } else heroFallback();
}

/* ---------- Why Choose Us: exploded panel ---------- */
const why = $('[data-why]');
const panelCanvas = $('[data-panel-canvas]');
const layers = $$('[data-layers] .layer');
const meter = $('[data-meter]');
let panel = null;
let panelProgress = 0;

function setLayer(i) {
  layers.forEach((l, k) => l.classList.toggle('is-active', k === i));
}
if (why && panelCanvas) {
  const boot = () => {
    if (!webglOK()) return;
    import('./panel-scene.js')
      .then((m) => { panel = m.initPanelScene(panelCanvas, { reduced }); panel.setProgress(panelProgress); })
      .catch((err) => console.warn('[panel 3D]', err));
  };
  const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) { boot(); near.disconnect(); } }, { rootMargin: '600px 0px' });
  near.observe(why);

  // Progress is read straight from layout every frame, so late font or image loads never leave it stale.
  const layersEl = $('[data-layers]');
  if (!reduced) {
    let lastP = -1;
    const measure = () => {
      const r = layersEl.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.65 - r.top) / (r.height + vh * 0.1)));
      if (Math.abs(p - lastP) > 0.0005) {
        lastP = panelProgress = p;
        panel?.setProgress(p);
        if (meter) meter.style.transform = `scaleY(${p})`;
        setLayer(Math.min(layers.length - 1, Math.floor(p * layers.length)));
      }
      requestAnimationFrame(measure);
    };
    requestAnimationFrame(measure);
  } else {
    layers.forEach((l) => l.classList.add('is-active'));
    if (meter) meter.style.transform = 'scaleY(1)';
  }
}

/* ---------- Process line ---------- */
const stepsCurrent = $('[data-steps-current]');
const steps = $$('.step');
if (stepsCurrent && ScrollTrigger && !reduced) {
  ScrollTrigger.create({
    trigger: '[data-steps]',
    start: 'top 75%',
    end: 'bottom 55%',
    onUpdate: (self) => {
      const p = self.progress;
      stepsCurrent.style.strokeDashoffset = String(1 - p);
      steps.forEach((s, i) => s.classList.toggle('is-lit', p >= i / (steps.length - 1) - 0.02));
    },
  });
} else if (stepsCurrent) {
  stepsCurrent.style.strokeDashoffset = '0';
  steps.forEach((s) => s.classList.add('is-lit'));
}

/* ---------- Service links preselect the form ---------- */
$$('[data-pick-service]').forEach((a) => {
  a.addEventListener('click', () => {
    const svc = a.closest('[data-service]')?.dataset.service;
    const sel = $('#f-service');
    if (svc && sel) sel.value = svc;
  });
});

/* ---------- Forms ---------- */
function formatPhone(v) {
  const d = v.replace(/\D/g, '').replace(/^1/, '').slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
$$('input[type="tel"]').forEach((i) => i.addEventListener('input', () => { i.value = formatPhone(i.value); }));

function fieldError(input, msg) {
  const field = input.closest('.field');
  let err = field.querySelector('.field__error');
  if (!msg) { input.removeAttribute('aria-invalid'); err?.remove(); input.removeAttribute('aria-describedby'); return; }
  input.setAttribute('aria-invalid', 'true');
  if (!err) {
    err = document.createElement('span');
    err.className = 'field__error';
    err.id = `${input.id}-err`;
    field.appendChild(err);
    input.setAttribute('aria-describedby', err.id);
  }
  err.textContent = msg;
}
function validate(form) {
  let first = null;
  const check = (input, msg) => { fieldError(input, msg); if (msg && !first) first = input; };
  const { name, phone, email, service } = form.elements;
  check(name, name.value.trim().length < 2 ? 'Please enter your name.' : '');
  check(phone, phone.value.replace(/\D/g, '').length !== 10 ? 'Enter a 10-digit US phone number so we can call you back.' : '');
  if (email) check(email, email.value && !/^\S+@\S+\.\S+$/.test(email.value) ? 'That email looks incomplete. Fix it or leave it blank.' : '');
  check(service, !service.value ? 'Choose a service, or pick "Not sure yet".' : '');
  return first;
}

$$('[data-lead-form]').forEach((form) => {
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid')) fieldError(e.target, ''); });
  form.addEventListener('change', (e) => { if (e.target.getAttribute('aria-invalid')) fieldError(e.target, ''); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = $('.form-status', form);
    const btn = $('button[type="submit"]', form);
    status.className = 'form-status';
    status.textContent = '';
    const bad = validate(form);
    if (bad) { bad.focus(); return; }
    if (form.elements.botcheck?.checked) return;

    const data = Object.fromEntries(new FormData(form).entries());
    delete data.botcheck;
    const payload = {
      access_key: CONFIG.WEB3FORMS_KEY,
      subject: `New estimate request: ${data.service || 'Electrical'} (${data.name})`,
      from_name: 'Marquis Solutions website',
      source: form.dataset.formName,
      ...data,
    };

    btn.setAttribute('aria-busy', 'true');
    const demo = !CONFIG.WEB3FORMS_KEY || CONFIG.WEB3FORMS_KEY.startsWith('YOUR_');
    try {
      if (demo) {
        console.warn('[form] Web3Forms key missing: demo mode, nothing was sent.', payload);
        await new Promise((r) => setTimeout(r, 700));
      } else {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === false) throw new Error(json.message || `HTTP ${res.status}`);
      }
      track('lead', { form: form.dataset.formName, service: data.service || '' });
      const first = (data.name || '').trim().split(' ')[0].replace(/[<>&"']/g, '');
      const wire = form.querySelector('.live__wire');
      form.innerHTML = `
        <div class="form-done" role="status" tabindex="-1">
          <svg class="ic"><use href="#i-check"/></svg>
          <h3>Thanks${first ? `, ${first}` : ''}. Your request is in.</h3>
          <p>We will call you at the number you gave us with upfront pricing within 24 hours. Need us sooner? Call <a href="tel:+15512473197" data-track="call" data-loc="form-success">(551) 247-3197</a>.</p>
          ${demo ? '<p><small>Demo mode: this form is not connected yet.</small></p>' : ''}
        </div>`;
      if (wire) form.prepend(wire);
      form.querySelector('.form-done').focus();
      ScrollTrigger?.refresh();
    } catch (err) {
      console.error('[form]', err);
      btn.removeAttribute('aria-busy');
      status.classList.add('is-error');
      status.innerHTML = 'We could not send your request. Please call or text <a href="tel:+15512473197">(551) 247-3197</a> and we will help right away.';
    }
  });
});

/* ---------- Misc ---------- */
$$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
window.addEventListener('load', () => ScrollTrigger?.refresh());
