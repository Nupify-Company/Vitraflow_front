/* Storefront interactions and demonstrative purchase controls. */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scrollBehavior = () => reducedMotion.matches ? 'instant' : 'smooth';
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  const progressFill = document.createElement('span');
  progress.append(progressFill);
  document.body.prepend(progress);

  let progressFramePending = false;
  function updateScrollProgress() {
    const root = document.scrollingElement || document.documentElement;
    const scrollable = root.scrollHeight - document.documentElement.clientHeight;
    const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    progressFill.style.transform = `scaleX(${ratio})`;
    progressFramePending = false;
  }
  function scheduleProgressUpdate() {
    if (progressFramePending) return;
    progressFramePending = true;
    requestAnimationFrame(updateScrollProgress);
  }
  window.addEventListener('scroll', scheduleProgressUpdate, { passive: true });
  window.addEventListener('resize', scheduleProgressUpdate);
  window.addEventListener('pageshow', scheduleProgressUpdate);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleProgressUpdate).observe(document.body);
  updateScrollProgress();

  const note = document.getElementById('demo-note');
  let noteTimer;

  function showNote(message) {
    note.textContent = message;
    note.classList.add('show');
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => note.classList.remove('show'), 3600);
  }

  document.querySelectorAll('[data-note]').forEach(button => {
    button.addEventListener('click', () => showNote(button.dataset.note));
  });

  document.querySelectorAll('[data-size-demo]').forEach(button => {
    button.addEventListener('click', () => showNote('Numerações ilustrativas. Esta composição usa o tamanho BR 40.'));
  });

  // Visual browsing of the static photography references.
  const mainPhoto = document.querySelector('#main-visual .sneaker-photo');
  document.querySelectorAll('[data-gallery]').forEach(button => {
    button.addEventListener('click', () => {
      mainPhoto.className = `sneaker-photo photo-${button.dataset.gallery}`;
      document.querySelectorAll('[data-gallery]').forEach(thumb => {
        thumb.classList.toggle('selected', thumb === button);
        thumb.setAttribute('aria-pressed', String(thumb === button));
      });
      mainPhoto.querySelector('img').alt = button.getAttribute('aria-label');
    });
  });

  // Native dialog provides focus containment, Escape and background inertness.
  const dialog = document.getElementById('interest-dialog');
  if (dialog) {
    let opener;
    document.querySelectorAll('[data-open-interest]').forEach(button => {
      button.addEventListener('click', () => {
        opener = button;
        document.getElementById('modal-feedback').textContent = '';
        document.body.classList.add('modal-open');
        dialog.showModal();
      });
    });
    dialog.querySelectorAll('[data-close]').forEach(button => {
      button.addEventListener('click', () => dialog.close());
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      opener?.focus({ preventScroll: true });
    });
    dialog.querySelector('[data-demo-continue]').addEventListener('click', () => {
      document.getElementById('modal-feedback').textContent = 'Esta é uma demonstração visual. Nenhuma mensagem será enviada.';
    });
  }

  function updateRailControls(rail) {
    const section = rail.closest('section');
    const end = rail.scrollWidth - rail.clientWidth;
    section.querySelector('[data-direction="-1"]').disabled = rail.scrollLeft < 2;
    section.querySelector('[data-direction="1"]').disabled = rail.scrollLeft >= end - 2;
  }

  const railObserver = new ResizeObserver(entries => {
    entries.forEach(({ target }) => updateRailControls(target));
  });
  function observeRails() {
    railObserver.disconnect();
    document.querySelectorAll('.product-rail').forEach(rail => {
      railObserver.observe(rail);
      updateRailControls(rail);
    });
    scheduleProgressUpdate();
  }
  document.addEventListener('scroll', event => {
    if (event.target instanceof Element && event.target.matches('.product-rail')) updateRailControls(event.target);
  }, { capture: true, passive: true });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-scroll]');
    if (!button) return;
    const rail = document.getElementById(button.dataset.scroll);
    const card = rail?.querySelector('.product-card');
    if (!card) return;
    const step = card.getBoundingClientRect().width + 16;
    rail.scrollBy({ left: Number(button.dataset.direction) * step, behavior: scrollBehavior() });
  });
  document.addEventListener('vitraflow:preview-rendered', observeRails);
  document.addEventListener('vitraflow:products-filtered', observeRails);
  observeRails();
})();
