(() => {
  const body = document.body;
  const drawer = document.getElementById('tocDrawer');
  const toggle = document.getElementById('tocToggle');
  const heroToggle = document.getElementById('heroToc');
  const closeButton = document.getElementById('tocClose');
  const backdrop = document.getElementById('drawerBackdrop');
  const search = document.getElementById('tocSearch');
  const links = [...document.querySelectorAll('.toc-link')];
  const headings = links.map(link => document.getElementById(link.dataset.target)).filter(Boolean);
  const progress = document.getElementById('readingProgress');
  const backTop = document.getElementById('backTop');
  let lastFocus = null;

  function openDrawer() {
    lastFocus = document.activeElement;
    backdrop.hidden = false;
    drawer.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    body.classList.add('drawer-open');
    search.focus();
  }
  function closeDrawer(restoreFocus = true) {
    body.classList.remove('drawer-open');
    drawer.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    backdrop.hidden = true;
    if (restoreFocus && lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
  }
  toggle.addEventListener('click', () => body.classList.contains('drawer-open') ? closeDrawer() : openDrawer());
  heroToggle.addEventListener('click', openDrawer);
  closeButton.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && body.classList.contains('drawer-open')) closeDrawer();
  });
  links.forEach(link => link.addEventListener('click', () => {
    closeDrawer(false);
    const target = document.getElementById(link.dataset.target);
    if (target) target.focus({ preventScroll: true });
  }));
  search.addEventListener('input', () => {
    const query = search.value.trim().toLocaleLowerCase('zh-CN');
    let visible = 0;
    links.forEach(link => {
      const match = link.textContent.toLocaleLowerCase('zh-CN').includes(query);
      link.hidden = !match;
      if (match) visible++;
    });
    document.getElementById('tocEmpty').hidden = visible > 0;
  });
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  let scheduled = false;
  function updateReadingState() {
    scheduled = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${max > 0 ? Math.min(100, Math.max(0, window.scrollY / max * 100)) : 0}%`;
    backTop.classList.toggle('visible', window.scrollY > 700);
    let current = headings[0];
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top > 140) break;
      current = heading;
    }
    links.forEach(link => link.classList.toggle('active', current?.id === link.dataset.target));
  }
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateReadingState); }
  }, { passive: true });
  window.addEventListener('resize', updateReadingState);
  updateReadingState();
})();
