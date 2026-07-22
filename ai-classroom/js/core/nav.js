/* ============================================================
   nav.js — Shared Navigation Bar
   Used by all pages inside the pages/ folder.
   All hrefs are relative to the pages/ folder.
   ============================================================ */

const NAV_LINKS = [
  { href: '../index.html',             label: 'Home' },
  { href: 'what-is-ai.html',          label: 'What is AI?' },
  { href: 'history.html',             label: 'History' },
  { href: 'types.html',               label: 'Types' },
  { href: 'study-tools.html',         label: 'Study Tools' },
  { href: 'ethics.html',              label: 'Ethics' },
  { href: 'quiz.html',                label: 'Quiz' },
  { href: 'lab.html',                 label: '🧪 Visual Learning Lab' },
  { href: 'finder.html',              label: 'Find My AI Tool' },
  { href: 'more-study.html',          label: 'More Study Material' },
  { href: 'resources.html',           label: 'Help & Resources' },
  { href: 'contact.html',             label: 'Contact Us' },
];

/**
 * Mount the shared nav bar into #nav-mount.
 * @param {string} activePage - current filename e.g. 'quiz.html'
 */
function mountNav(activePage) {
  const mount = document.getElementById('nav-mount');
  if (!mount) return;

  const links = NAV_LINKS.map(link => {
    const isActive = link.href === activePage || link.href.endsWith('/' + activePage);
    return `<a href="${link.href}" class="${isActive ? 'active' : ''}">${link.label}</a>`;
  }).join('');

  mount.innerHTML = `
    <nav>
      <a class="nav-logo" href="../index.html">
        <span>Seek</span><svg class="logo-mark" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><radialGradient id="navSosSpace" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#3A241A"/><stop offset="1" stop-color="#17100A"/></radialGradient><radialGradient id="navSosEarth" cx="38%" cy="34%" r="70%"><stop offset="0" stop-color="#3E6E88"/><stop offset="1" stop-color="#284B60"/></radialGradient><radialGradient id="navSosSun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE08A"/><stop offset="55%" stop-color="#F97316"/><stop offset="100%" stop-color="#EA580C"/></radialGradient></defs><circle cx="32" cy="32" r="31" fill="url(#navSosSpace)"/><circle cx="32" cy="32" r="31" fill="none" stroke="#C0562F" stroke-width="1" opacity=".45"/><circle cx="32" cy="32" r="22" fill="none" stroke="#CDB79E" stroke-width="1" opacity=".4"/><circle cx="32" cy="10" r="8" fill="#F97316" opacity=".22"/><circle cx="32" cy="10" r="5" fill="url(#navSosSun)"/><circle cx="48" cy="16" r="2.7" fill="#C0562F"/><g transform="rotate(20 54 32)"><ellipse cx="54" cy="32" rx="5.4" ry="1.8" fill="none" stroke="#E0B15A" stroke-width="1.2"/></g><circle cx="54" cy="32" r="3.1" fill="#DDAE52"/><circle cx="48" cy="48" r="2.7" fill="#AC8F62"/><circle cx="32" cy="54" r="3" fill="#E8A579"/><circle cx="16" cy="48" r="3.5" fill="#8C6E7A"/><circle cx="10" cy="32" r="2.5" fill="#7A8C72"/><circle cx="16" cy="16" r="2.3" fill="#C9B79E"/><circle cx="32" cy="32" r="8" fill="url(#navSosEarth)"/><path d="M27 29 q3 -1 5 1 q2 2 -1 3 q-3 1 -4 -1 q-1 -2 0 -3 Z" fill="#6E8467"/><ellipse cx="29" cy="29" rx="2.4" ry="1.6" fill="#fff" opacity=".28"/></svg>Sphere
      </a>
      <div class="nav-links" id="navLinks">
        ${links}
        <a href="login.html"     id="navSignIn"     class="nav-auth-btn">Sign In</a>
        <a href="dashboard.html" id="navDashboard"  class="nav-auth-btn nav-dashboard-btn" style="display:none;">My Dashboard</a>
      </div>
      <button class="hamburger" onclick="toggleMobileNav()" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
    </nav>`;

  // Wire up auth state — show/hide Sign In vs Dashboard
  _initNavAuth();
}

function toggleMobileNav() {
  document.getElementById('navLinks').classList.toggle('open');
}

/* ── AUTH STATE: show Sign In or Dashboard depending on login status ── */
function _initNavAuth() {
  try {
    // Dynamically import so nav works even before Firebase is set up
    import('../js/auth/auth.js').then(({ onAuthChange }) => {
      onAuthChange(user => {
        const signInEl   = document.getElementById('navSignIn');
        const dashEl     = document.getElementById('navDashboard');
        if (!signInEl || !dashEl) return;
        signInEl.style.display = user ? 'none'   : 'inline-flex';
        dashEl.style.display   = user ? 'inline-flex' : 'none';
      });
    }).catch(() => {
      // Firebase not set up yet — Sign In link stays visible, no error thrown
    });
  } catch(e) {
    // Silently ignore if module imports aren't supported
  }
}