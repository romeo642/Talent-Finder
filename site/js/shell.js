/* Talent Finder app shell.
   Adds screens (Find, My ID, About) and a bottom nav on top of the existing page.
   It never removes elements or changes ids, so js/main.js keeps working. */
(function () {
  const $ = (s) => document.querySelector(s);
  const tag = (el, v) => { if (el) el.dataset.v = v; };
  const main = $('main');
  if (!main) return;

  // 1. Put each existing section on a screen
  const searchSec = $('#search-form') && $('#search-form').closest('section');
  const noticeSec = $('#sql') && $('#sql').closest('section');
  tag(searchSec, 'find');
  ['report-box', 'message-box'].forEach((id) => tag($('#' + id), 'find'));
  ['auth-card', 'profile-form', 'review-box', 'admin-box'].forEach((id) => tag($('#' + id), 'account'));
  ['about-finder', 'faq', 'privacy'].forEach((id) => tag($('#' + id), 'about'));
  tag(noticeSec, 'about');

  // 2. Move the share buttons from the hidden ad into the About screen
  const share = $('.ad .share');
  if (share) {
    const s = document.createElement('section');
    s.dataset.v = 'about';
    s.innerHTML = '<h2>Share Talent Finder</h2>';
    s.appendChild(share);
    main.appendChild(s);
  }

  // 3. Tuck the setup tools away at the bottom of About
  const dev = document.createElement('details');
  dev.className = 'dev';
  dev.dataset.v = 'about';
  dev.innerHTML = '<summary class="muted">Developer setup</summary>';
  const conn = $('#connect');
  const sqlBox = $('#sql') && $('#sql').closest('details');
  if (conn) dev.appendChild(conn);
  if (sqlBox) dev.appendChild(sqlBox);
  main.appendChild(dev);
    // Keep the message line (errors, "check your email") visible on every screen
  const status = $('#status');
  if (status) {
    main.prepend(status);
    new MutationObserver(() => {
      if (!status.hidden) status.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }).observe(status, { attributes: true, attributeFilter: ['hidden'], childList: true, characterData: true, subtree: true });
  }

  // 4. Quick start: tap a trade to search it
  const form = $('#search-form');
  const q = $('#q');
  if (form && q && searchSec) {
    const skills = ['Plumber', 'Electrician', 'Carpenter', 'Welder', 'Painter', 'Gardener', 'Tailor', 'Cleaner', 'Cook', 'Home tutor'];
    const quick = document.createElement('section');
    quick.id = 'quick';
    quick.dataset.v = 'find'; quick.innerHTML = '<h2>Find a skilled hand near you</h2><p class="muted">10 popular trades. Tap one, or choose Other skills to type your own.</p><div class="chips"></div>';
    const box = quick.querySelector('.chips');
    skills.forEach((name) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = name;
      b.addEventListener('click', () => {
        q.value = name;
        form.requestSubmit();
        setTimeout(() => { const r = $('#results'); if (r) r.scrollIntoView({ behavior: 'smooth' }); }, 400);
      });
      box.appendChild(b);
    });
      const other = document.createElement('button');
    other.type = 'button';
    other.className = 'other';
    other.textContent = 'Other skills';
    other.addEventListener('click', () => {
      q.value = '';
      q.placeholder = 'Type any skill, e.g. mason, hairdresser, driver';
      q.scrollIntoView({ behavior: 'smooth', block: 'center' });
      q.focus();
    });
    box.appendChild(other);

     searchSec.before(quick);
  }

  // 5. Link from the sign-up checkbox to the privacy notice
  const po = $('#privacy-ok') && $('#privacy-ok').closest('label');
  if (po) {
    const a = document.createElement('button');
    a.type = 'button';
    a.className = 'secondary';
    a.style.marginTop = '8px';
    a.textContent = 'Read the privacy notice';
    a.addEventListener('click', () => { show('about'); const p = $('#privacy'); if (p) p.scrollIntoView(); });
    po.after(a);
  }

  // 6. Bottom navigation and screen switching
  const views = [['find', 'Find', '🔍'], ['account', 'My ID', '👤'], ['about', 'About', 'ℹ️']];
  const bar = document.createElement('nav');
  bar.id = 'tabbar';
  bar.setAttribute('aria-label', 'Main');
  views.forEach(([id, label, icon]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.go = id;
    b.innerHTML = '<span aria-hidden="true">' + icon + '</span>' + label;
    b.addEventListener('click', () => show(id));
    bar.appendChild(b);
  });
  document.body.appendChild(bar);

  function show(v) {
    if (!views.some((x) => x[0] === v)) v = 'find';
    document.body.dataset.view = v;
    bar.querySelectorAll('button').forEach((b) => {
      if (b.dataset.go === v) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    if (location.hash.slice(1) !== v) history.replaceState(null, '', '#' + v);
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));
  show(location.hash.slice(1) || 'find');

  // 7. After the person signs in, take them to their own screen
  const authForm = $('#auth-form');
  const signOut = $('#sign-out');
  let acted = false;
  if (authForm) authForm.addEventListener('submit', () => { acted = true; });
  if (signOut) {
    new MutationObserver(() => { if (acted && !signOut.hidden) { acted = false; show('account'); } })
      .observe(signOut, { attributes: true, attributeFilter: ['hidden'] });
  }

  // 8. Install button and offline support
  const hdr = $('header');
  let deferred = null;
  if (hdr) {
    const inst = document.createElement('button');
    inst.type = 'button';
    inst.className = 'secondary';
    inst.textContent = 'Install app';
    inst.hidden = true;
    hdr.appendChild(inst);
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; inst.hidden = false; });
    inst.addEventListener('click', async () => { if (deferred) { deferred.prompt(); await deferred.userChoice; deferred = null; inst.hidden = true; } });
  }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
