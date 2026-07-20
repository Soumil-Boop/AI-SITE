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
        <svg class="logo-mark" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="20" cy="8"  r="3.2" class="logo-node logo-node-1"/>
          <circle cx="8"  cy="22" r="3.2" class="logo-node logo-node-2"/>
          <circle cx="32" cy="22" r="3.2" class="logo-node logo-node-3"/>
          <circle cx="20" cy="33" r="3.2" class="logo-node logo-node-4"/>
          <line x1="20" y1="8"  x2="8"  y2="22" class="logo-edge"/>
          <line x1="20" y1="8"  x2="32" y2="22" class="logo-edge"/>
          <line x1="8"  y1="22" x2="20" y2="33" class="logo-edge"/>
          <line x1="32" y1="22" x2="20" y2="33" class="logo-edge"/>
          <line x1="8"  y1="22" x2="32" y2="22" class="logo-edge logo-edge-center"/>
        </svg>
        The <span>AI</span> Classroom
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