/* ============================================================
   StyleHomes — redesign interaction layer (TypeScript).
   Ports the design-system app.js UI (header scroll, mobile nav,
   reveal, media placeholders, carousel, lightbox, FAQ) AND grafts
   in the REAL consultation-form backend submit preserved from the
   legacy form.ts: JSON -> /api/consultations, DTO field mapping,
   honeypot, formRenderedAt anti-spam, HEIC->JPEG, base64 photos,
   and the Google Ads conversion event on success.
   Side-effect module: importing it wires everything up.
   ============================================================ */
import {
  createIcons,
  X, Phone, ArrowRight, ArrowUpRight, ChevronDown, ChevronRight, ChevronLeft,
  Check, ChefHat, BadgeCheck, ImagePlus, CircleCheck, Ruler, Utensils, Bath,
  House, LayoutGrid, Star, MessageSquareQuote, Quote, Mail, ShieldCheck,
} from 'lucide';

/* ---------- tiny inline svg helpers (for JS-built UI) ---------- */
function inlineIcon(name: 'image' | 'x'): string {
  const g: Record<string, string> = {
    image: '<path d="M3 3h18v18H3z" fill="none"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
  };
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (g[name] || '') + '</svg>';
}
function navIcon(name: 'x' | 'chevron-left' | 'chevron-right'): string {
  const p: Record<string, string> = {
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  };
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (p[name] || '') + '</svg>';
}

/* ---------- Page loader ---------- */
window.addEventListener('load', () => {
  const l = document.querySelector<HTMLElement>('.loader');
  if (l) { l.classList.add('is-hidden'); setTimeout(() => l.remove(), 600); }
});
setTimeout(() => {
  const l = document.querySelector<HTMLElement>('.loader');
  if (l) l.classList.add('is-hidden');
}, 4000);

/* ============ Photo upload contract (preserved from form.ts) ============ */
const PHOTO_LIMITS = {
  maxPhotos: 10,
  maxSizePerPhoto: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'],
};

function isHeicFile(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return type === 'image/heic' || type === 'image/heif' || name.endsWith('.heic') || name.endsWith('.heif');
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import('heic2any')).default;
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
  const resultBlob = Array.isArray(blob) ? blob[0] : blob;
  const newName = file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');
  return new File([resultBlob], newName, { type: 'image/jpeg' });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** POST the consultation to the backend — payload matches ConsultationRequest DTO. */
async function submitConsultation(form: HTMLFormElement, photos: File[], formRenderedAt: number): Promise<void> {
  const data = new FormData(form);
  const get = (k: string): string => (data.get(k) as string) || '';
  const backendUrl = window.BACKEND_URL ?? '';
  const endpoint = `${backendUrl}/api/consultations`;

  const payload: Record<string, unknown> = {
    firstName: get('firstName'),
    lastName: get('lastName'),
    email: get('email'),
    phone: get('phone'),
    projectType: get('projectType'),
    projectLocation: get('location'),
    estimatedBudget: get('budget'),
    preferredTimeline: get('timeline'),
    projectDetails: get('details'),
    companyName: get('companyName'), // honeypot — should be empty
    formRenderedAt,
  };

  if (photos.length > 0) {
    const encoded: Array<Record<string, unknown>> = [];
    for (const photo of photos) {
      try {
        encoded.push({ filename: photo.name, contentType: photo.type, data: await fileToBase64(photo), size: photo.size });
      } catch (err) {
        console.error(`Failed to encode ${photo.name}:`, err);
      }
    }
    payload.photos = encoded;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    let message = 'Form submission failed';
    try { message = (JSON.parse(text).message as string) || message; } catch { message = text || message; }
    throw new Error(message);
  }
}

/* ============ DOM-ready wiring ============ */
function ready(fn: () => void): void {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
  else fn();
}

ready(() => {
  /* ---------- Lucide icons ---------- */
  createIcons({
    icons: {
      X, Phone, ArrowRight, ArrowUpRight, ChevronDown, ChevronRight, ChevronLeft,
      Check, ChefHat, BadgeCheck, ImagePlus, CircleCheck, Ruler, Utensils, Bath,
      House, LayoutGrid, Star, MessageSquareQuote, Quote, Mail, ShieldCheck,
    },
  });

  /* ---------- Header: transparent → solid on scroll ---------- */
  const header = document.querySelector<HTMLElement>('.site-header');
  const onScroll = () => { if (header) header.classList.toggle('is-scrolled', window.scrollY > 40); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile nav ---------- */
  const nav = document.querySelector<HTMLElement>('.site-header__nav');
  const burger = document.querySelector<HTMLButtonElement>('.site-header__burger');
  const closeBtn = document.querySelector<HTMLButtonElement>('.site-header__nav-close');
  const setNav = (open: boolean) => {
    if (!nav) return;
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  if (burger && nav) burger.addEventListener('click', () => setNav(!nav.classList.contains('is-open')));
  if (closeBtn) closeBtn.addEventListener('click', () => setNav(false));
  if (nav) nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setNav(false)));

  /* ---------- Active nav link on scroll ---------- */
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".site-header__link[href*='#']"));
  const sections = links.map((a) => {
    const id = (a.getAttribute('href') || '').split('#')[1];
    return id ? document.getElementById(id) : null;
  });
  if ('IntersectionObserver' in window) {
    const navObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) links.forEach((a, i) => a.classList.toggle('is-active', sections[i] === e.target));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => { if (s) navObs.observe(s); });
  }

  /* ---------- Media placeholders (caption from alt; hide broken imgs) ---------- */
  document.querySelectorAll<HTMLElement>('.media').forEach((m) => {
    if (!m.querySelector('.media__label')) {
      const el = m.querySelector<HTMLImageElement | HTMLVideoElement>('img, video');
      const txt = (el && (el.getAttribute('alt') || el.getAttribute('data-ph'))) || 'image';
      const label = document.createElement('div');
      label.className = 'media__label';
      label.innerHTML = inlineIcon('image') + '<span><b>' + txt + '</b></span>';
      m.insertBefore(label, m.firstChild);
    }
  });
  document.querySelectorAll<HTMLImageElement>('img').forEach((im) => {
    im.addEventListener('error', () => im.setAttribute('data-broken', ''));
    if (im.complete && im.naturalWidth === 0 && im.getAttribute('src')) im.setAttribute('data-broken', '');
  });

  /* ---------- Fill rating stars ---------- */
  document.querySelectorAll<SVGElement>('.reviews__stars svg, .pill--gold svg').forEach((s) => {
    s.setAttribute('fill', 'currentColor'); s.setAttribute('stroke-width', '1');
  });

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if ('IntersectionObserver' in window && reveals.length) {
    const revObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const d = (e.target as HTMLElement).getAttribute('data-reveal-delay');
          if (d) (e.target as HTMLElement).style.transitionDelay = d + 'ms';
          e.target.classList.add('is-in');
          revObs.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((r) => revObs.observe(r));
  } else {
    reveals.forEach((r) => r.classList.add('is-in'));
  }

  /* ---------- Lightbox ---------- */
  let lb: HTMLElement | null = null;
  let lbImg: HTMLImageElement | null = null;
  let lbCount: HTMLElement | null = null;
  let lbList: HTMLImageElement[] = [];
  let lbIndex = 0;
  const showLb = (n: number) => {
    if (!lbImg || !lbCount) return;
    lbIndex = (n + lbList.length) % lbList.length;
    lbImg.src = lbList[lbIndex].currentSrc || lbList[lbIndex].src;
    lbImg.alt = lbList[lbIndex].alt || '';
    lbCount.textContent = `${lbIndex + 1} / ${lbList.length}`;
  };
  const closeLightbox = () => { if (lb) lb.classList.remove('is-open'); document.body.classList.remove('nav-open'); };
  const ensureLightbox = () => {
    if (lb) return;
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML =
      '<button class="lightbox__btn lightbox__close" aria-label="Close">' + navIcon('x') + '</button>' +
      '<button class="lightbox__btn lightbox__nav lightbox__nav--prev" aria-label="Previous">' + navIcon('chevron-left') + '</button>' +
      '<img class="lightbox__img" alt="">' +
      '<button class="lightbox__btn lightbox__nav lightbox__nav--next" aria-label="Next">' + navIcon('chevron-right') + '</button>' +
      '<div class="lightbox__count"></div>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector('.lightbox__img');
    lbCount = lb.querySelector('.lightbox__count');
    lb.querySelector('.lightbox__close')!.addEventListener('click', closeLightbox);
    lb.querySelector('.lightbox__nav--prev')!.addEventListener('click', () => showLb(lbIndex - 1));
    lb.querySelector('.lightbox__nav--next')!.addEventListener('click', () => showLb(lbIndex + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
      if (!lb || !lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
      if (e.key === 'ArrowRight') showLb(lbIndex + 1);
    });
  };
  const openLightbox = (list: HTMLImageElement[], idx: number) => {
    if (list[idx] && list[idx].hasAttribute('data-broken')) return;
    ensureLightbox();
    lbList = list; showLb(idx);
    lb!.classList.add('is-open'); document.body.classList.add('nav-open');
  };

  /* ---------- Carousels ---------- */
  document.querySelectorAll<HTMLElement>('.carousel').forEach((car) => {
    const track = car.querySelector<HTMLElement>('.carousel__track');
    const slides = Array.from(car.querySelectorAll<HTMLElement>('.carousel__slide'));
    const count = car.querySelector<HTMLElement>('.carousel__count');
    if (!track) return;
    let i = 0;
    const go = (n: number) => {
      i = (n + slides.length) % slides.length;
      track.style.transform = `translateX(${-i * 100}%)`;
      if (count) count.textContent = `${i + 1} / ${slides.length}`;
    };
    const prev = car.querySelector<HTMLButtonElement>('.carousel__btn--prev');
    const next = car.querySelector<HTMLButtonElement>('.carousel__btn--next');
    if (prev) prev.addEventListener('click', () => go(i - 1));
    if (next) next.addEventListener('click', () => go(i + 1));
    if (slides.length <= 1) { if (prev) prev.style.display = 'none'; if (next) next.style.display = 'none'; }
    const imgs = slides.map((s) => s.querySelector('img')).filter((x): x is HTMLImageElement => !!x);
    imgs.forEach((im) => im.addEventListener('click', () => openLightbox(imgs, imgs.indexOf(im))));
    go(0);
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll<HTMLElement>('.accordion').forEach((acc) => {
    const items = Array.from(acc.querySelectorAll<HTMLElement>('.accordion__item'));
    items.forEach((item) => {
      const q = item.querySelector<HTMLButtonElement>('.accordion__q');
      const panel = item.querySelector<HTMLElement>('.accordion__panel');
      if (!q || !panel) return;
      if (item.classList.contains('is-open')) panel.style.height = panel.scrollHeight + 'px';
      q.setAttribute('aria-expanded', item.classList.contains('is-open') ? 'true' : 'false');
      q.addEventListener('click', () => {
        const open = item.classList.contains('is-open');
        if (!acc.hasAttribute('data-multi')) {
          items.forEach((o) => {
            if (o !== item) {
              o.classList.remove('is-open');
              const op = o.querySelector<HTMLElement>('.accordion__panel');
              if (op) op.style.height = '0px';
              const oq = o.querySelector('.accordion__q');
              if (oq) oq.setAttribute('aria-expanded', 'false');
            }
          });
        }
        item.classList.toggle('is-open', !open);
        q.setAttribute('aria-expanded', !open ? 'true' : 'false');
        panel.style.height = open ? '0px' : panel.scrollHeight + 'px';
      });
    });
    window.addEventListener('resize', () => {
      items.forEach((item) => {
        if (item.classList.contains('is-open')) {
          const panel = item.querySelector<HTMLElement>('.accordion__panel');
          if (panel) panel.style.height = panel.scrollHeight + 'px';
        }
      });
    });
  });

  /* ---------- Consultation form: validation + preview + REAL submit ---------- */
  document.querySelectorAll<HTMLFormElement>('.form').forEach((form) => {
    let formRenderedAt = Date.now();
    const fileInput = form.querySelector<HTMLInputElement>('input[type="file"]');
    const previews = form.querySelector<HTMLElement>('.form__previews');
    const fileZone = form.querySelector<HTMLElement>('.form__file');
    const store: File[] = [];

    const renderPreviews = () => {
      if (!previews) return;
      previews.innerHTML = '';
      store.forEach((file, idx) => {
        const url = URL.createObjectURL(file);
        const d = document.createElement('div');
        d.className = 'form__preview';
        d.innerHTML = `<img src="${url}" alt="${file.name}"><button type="button" aria-label="Remove">${inlineIcon('x')}</button>`;
        d.querySelector('button')!.addEventListener('click', () => { store.splice(idx, 1); renderPreviews(); });
        previews.appendChild(d);
      });
    };

    const addFiles = async (files: FileList | File[]) => {
      for (const original of Array.from(files)) {
        let file = original;
        if (store.length >= PHOTO_LIMITS.maxPhotos) { alert(`Maximum ${PHOTO_LIMITS.maxPhotos} photos allowed.`); break; }
        const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
        const validType = PHOTO_LIMITS.allowedTypes.includes(file.type.toLowerCase()) || PHOTO_LIMITS.allowedExtensions.includes(ext);
        if (!validType) { alert(`File ${file.name} is not supported. Use JPG, PNG, WEBP, GIF, or HEIC.`); continue; }
        if (isHeicFile(file)) {
          try { file = await convertHeicToJpeg(file); }
          catch { alert(`Could not convert ${file.name}. Please try a different image.`); continue; }
        }
        if (file.size > PHOTO_LIMITS.maxSizePerPhoto) { alert(`File ${file.name} is too large. Max 10 MB each.`); continue; }
        store.push(file);
      }
      renderPreviews();
    };

    if (fileInput) fileInput.addEventListener('change', () => { if (fileInput.files) { void addFiles(fileInput.files); fileInput.value = ''; } });
    if (fileZone) {
      ['dragenter', 'dragover'].forEach((ev) => fileZone.addEventListener(ev, (e) => { e.preventDefault(); fileZone.classList.add('is-drag'); }));
      ['dragleave', 'drop'].forEach((ev) => fileZone.addEventListener(ev, (e) => { e.preventDefault(); fileZone.classList.remove('is-drag'); }));
      fileZone.addEventListener('drop', (e) => { const dt = (e as DragEvent).dataTransfer; if (dt) void addFiles(dt.files); });
    }

    const validate = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean => {
      const group = field.closest('.form__group');
      const ok = field.checkValidity() && !(field.hasAttribute('required') && !field.value.trim());
      if (group) group.classList.toggle('has-error', !ok);
      field.classList.toggle('is-error', !ok);
      return ok;
    };
    const required = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[required]'));
    required.forEach((f) => {
      f.addEventListener('blur', () => validate(f));
      f.addEventListener('input', () => { if (f.classList.contains('is-error')) validate(f); });
    });

    const showFail = (msg: string) => {
      let el = form.querySelector<HTMLElement>('.form__fail');
      if (!el) {
        el = document.createElement('p');
        el.className = 'form__fail';
        el.style.cssText = 'color:var(--error);font-size:var(--text-sm);font-weight:500;margin-top:0.5rem';
        form.appendChild(el);
      }
      el.textContent = msg;
      setTimeout(() => { el && el.remove(); }, 6000);
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const honey = form.querySelector<HTMLInputElement>('.form__honeypot input');
      if (honey && honey.value) return; // bot
      let valid = true;
      required.forEach((f) => { if (!validate(f)) valid = false; });
      if (!valid) { const bad = form.querySelector<HTMLElement>('.is-error'); if (bad) bad.focus(); return; }

      const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const original = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      try {
        await submitConsultation(form, store, formRenderedAt);
        form.classList.add('is-sent');
        if (window.gtag) window.gtag('event', 'conversion', { send_to: 'AW-17691818553/ads_conversion_1' });
        form.reset();
        store.length = 0;
        renderPreviews();
        formRenderedAt = Date.now();
      } catch (err) {
        console.error('Form submission error:', err);
        showFail('Something went wrong sending your request. Please try again or call us directly.');
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = original; }
      }
    });
  });
});
