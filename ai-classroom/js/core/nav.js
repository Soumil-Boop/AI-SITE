/* ============================================================
   nav.js — Shared Navigation (3-row header)
   Row 1: utility bar (Help + Sign In / Dashboard)
   Row 2: menu links + small logo on the left
   Row 3: brand banner (logo + tagline)
   Used by all pages inside the pages/ folder.
   ============================================================ */

const NAV_LINKS = [
  { href: '../index.html',            label: 'Home' },
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

/* Home-page section links — used by pages that should send the user back to the
   single-page home experience (e.g. the dashboard) instead of the older
   standalone pages. Each opens ../index.html#<section>. */
const HOME_NAV_LINKS = [
  { hash: 'home',      label: 'Home' },
  { hash: 'what',      label: 'What is AI?' },
  { hash: 'history',   label: 'History' },
  { hash: 'types',     label: 'Types' },
  { hash: 'study',     label: 'Study Tools' },
  { hash: 'ethics',    label: 'Ethics' },
  { hash: 'quiz',      label: 'Quiz' },
  { hash: 'lab',       label: '🧪 Lab' },
  { hash: 'finder',    label: 'Find My AI Tool' },
  { hash: 'resources', label: 'Resources' },
  { hash: 'contact',   label: 'Contact' },
];

/* Seek-O-Sphere solar mark. Pass a unique id prefix so gradient ids don't clash. */
function sosMark(pfx) {
  return `<svg class="logo-mark" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><radialGradient id="${pfx}Space" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#3A241A"/><stop offset="1" stop-color="#17100A"/></radialGradient><radialGradient id="${pfx}Earth" cx="38%" cy="34%" r="70%"><stop offset="0" stop-color="#3E6E88"/><stop offset="1" stop-color="#284B60"/></radialGradient><radialGradient id="${pfx}Sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE08A"/><stop offset="55%" stop-color="#F97316"/><stop offset="100%" stop-color="#EA580C"/></radialGradient></defs><circle cx="32" cy="32" r="31" fill="url(#${pfx}Space)"/><circle cx="32" cy="32" r="31" fill="none" stroke="#C0562F" stroke-width="1" opacity=".45"/><circle cx="32" cy="32" r="22" fill="none" stroke="#CDB79E" stroke-width="1" opacity=".4"/><circle cx="32" cy="10" r="8" fill="#F97316" opacity=".22"/><circle cx="32" cy="10" r="5" fill="url(#${pfx}Sun)"/><circle cx="48" cy="16" r="2.7" fill="#C0562F"/><g transform="rotate(20 54 32)"><ellipse cx="54" cy="32" rx="5.4" ry="1.8" fill="none" stroke="#E0B15A" stroke-width="1.2"/></g><circle cx="54" cy="32" r="3.1" fill="#DDAE52"/><circle cx="48" cy="48" r="2.7" fill="#AC8F62"/><circle cx="32" cy="54" r="3" fill="#E8A579"/><circle cx="16" cy="48" r="3.5" fill="#8C6E7A"/><circle cx="10" cy="32" r="2.5" fill="#7A8C72"/><circle cx="16" cy="16" r="2.3" fill="#C9B79E"/><circle cx="32" cy="32" r="8" fill="url(#${pfx}Earth)"/><path d="M27 29 q3 -1 5 1 q2 2 -1 3 q-3 1 -4 -1 q-1 -2 0 -3 Z" fill="#6E8467"/><ellipse cx="29" cy="29" rx="2.4" ry="1.6" fill="#fff" opacity=".28"/></svg>`;
}

/**
 * Mount the shared 3-row header into #nav-mount.
 * @param {string} activePage - current filename e.g. 'quiz.html'
 */
function mountNav(activePage, opts) {
  opts = opts || {};
  const mount = document.getElementById('nav-mount');
  if (!mount) return;

  let links;
  if (opts.homeLinks) {
    // Point every menu item at the home page's single-page sections.
    links = HOME_NAV_LINKS.map(link =>
      `<a href="../index.html#${link.hash}">${link.label}</a>`
    ).join('');
  } else {
    links = NAV_LINKS.map(link => {
      const isActive = link.href === activePage || link.href.endsWith('/' + activePage);
      return `<a href="${link.href}" class="${isActive ? 'active' : ''}">${link.label}</a>`;
    }).join('');
  }

  const helpHref = opts.homeLinks ? '../index.html#resources' : 'resources.html';

  mount.innerHTML = `
    <div class="topbar">
      <a href="${helpHref}">Help</a>
      <div id="acctMenu"><a href="login.html" class="topbar-auth">Sign In</a></div>
    </div>
    <nav>
      <a class="nav-logo" href="../index.html"><span>Seek-</span>${sosMark('navSos')}-Sphere</a>
      <div class="nav-links" id="navLinks">${links}</div>
      <button class="hamburger" onclick="toggleMobileNav()" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>
    </nav>
    <div class="brand-banner">
      <div class="brand-banner-inner">
        <span class="bb-word"><span>Seek-</span>${sosMark('navBan')}-Sphere</span>
        <span class="bb-tag">Explore &middot; Learn &middot; Discover</span>
      </div>
    </div>`;
  // The account menu (#acctMenu) is populated by session.js once Firebase auth state resolves.
}

function toggleMobileNav() {
  document.getElementById('navLinks').classList.toggle('open');
}
