// Minimal accessible lightbox. items: [{ src, caption }]
import { esc, icon } from './util.js';

export function openLightbox(items, start = 0) {
  const root = document.getElementById('overlay-root');
  const prevFocus = document.activeElement;
  let i = start;
  const wrap = document.createElement('div');
  wrap.className = 'overlay lightbox';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.setAttribute('aria-label', 'Photo viewer');

  const draw = () => {
    const it = items[i];
    wrap.innerHTML = `
      <figure>
        <img src="${esc(it.src)}" alt="${esc(it.caption || '')}" />
        <figcaption>${esc(it.caption || '')} <span class="lb-count">${i + 1} / ${items.length}</span></figcaption>
      </figure>
      ${items.length > 1 ? `<button type="button" class="btn btn-light lb-btn lb-prev" aria-label="Previous photo">‹</button><button type="button" class="btn btn-light lb-btn lb-next" aria-label="Next photo">›</button>` : ''}
      <button type="button" class="btn btn-light lb-close" aria-label="Close">${icon('close')}</button>`;
    wrap.querySelector('.lb-close').focus();
  };
  const close = () => {
    document.removeEventListener('keydown', onKey);
    wrap.remove();
    document.body.style.overflow = '';
    prevFocus?.focus?.();
  };
  const go = (d) => {
    i = (i + d + items.length) % items.length;
    draw();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'Tab') {
      // keep focus inside the dialog
      const f = [...wrap.querySelectorAll('button')];
      const idx = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(idx + (e.shiftKey ? -1 : 1) + f.length) % f.length]?.focus();
    }
  };
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) close();
    else if (e.target.closest('.lb-prev')) go(-1);
    else if (e.target.closest('.lb-next')) go(1);
    else if (e.target.closest('.lb-close')) close();
  });
  let x0 = null;
  wrap.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
  wrap.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    x0 = null;
  });
  document.addEventListener('keydown', onKey);
  document.body.style.overflow = 'hidden';
  root.append(wrap);
  draw();
  return close;
}
