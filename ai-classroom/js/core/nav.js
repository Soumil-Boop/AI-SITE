/* ============================================================
   nav.js — Shared Navigation (3-row header)
   Row 1: utility bar (Help + Sign In / Dashboard)
   Row 2: menu links + small logo on the left
   Row 3: brand banner (logo + tagline)
   Used by all pages inside the pages/ folder.
   ============================================================ */

/* The one and only menu. Every item opens a section of the single-page home
   experience at ../index.html#<section>.

   There used to be a second list here pointing at standalone copies of these
   pages (lab.html, what-is-ai.html, history.html and so on). Those copies were
   an older build of the site that stopped being updated, and any page that
   mounted the menu without { homeLinks: true } quietly sent people into it —
   which is how account settings became a doorway back to the old Lab. There is
   now nothing to get wrong: one list, current content, no way to reach the old
   pages from the menu. */
const NAV_LINKS = [
  { hash: 'home',      label: 'Home' },
  { hash: 'what',      label: 'What is AI?' },
  { hash: 'history',   label: 'History' },
  { hash: 'types',     label: 'Types' },
  { hash: 'study',     label: 'Study Tools' },
  { hash: 'ethics',    label: 'Ethics' },
  { hash: 'lab',       label: '\u{1F9EA} Learning Lab' },
  { hash: 'finder',    label: 'Find My AI Tool' },
  { hash: 'resources', label: 'Help & Resources' },
  { hash: 'contact',   label: 'Contact Us' },
];

/* Kept so older calls still work; the standalone pages they named are gone. */
const HOME_NAV_LINKS = NAV_LINKS;

/* Which legacy filename corresponds to which home section, so a page that still
   passes its own name to mountNav highlights the right menu item. */
const PAGE_TO_HASH = {
  'index.html': 'home', 'what-is-ai.html': 'what', 'history.html': 'history',
  'types.html': 'types', 'study-tools.html': 'study', 'ethics.html': 'ethics',
  'lab.html': 'lab', 'finder.html': 'finder', 'resources.html': 'resources',
  'more-study.html': 'resources', 'contact.html': 'contact'
};

/* Seek-O-Sphere solar mark. Pass a unique id prefix so gradient ids don't clash. */
function sosMark(pfx) {
  return `<svg class="logo-mark" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><radialGradient id="${pfx}Space" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#3A241A"/><stop offset="1" stop-color="#17100A"/></radialGradient><radialGradient id="${pfx}Earth" cx="38%" cy="34%" r="70%"><stop offset="0" stop-color="#3E6E88"/><stop offset="1" stop-color="#284B60"/></radialGradient><radialGradient id="${pfx}Sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE08A"/><stop offset="55%" stop-color="#F97316"/><stop offset="100%" stop-color="#EA580C"/></radialGradient></defs><circle cx="32" cy="32" r="31" fill="url(#${pfx}Space)"/><circle cx="32" cy="32" r="31" fill="none" stroke="#C0562F" stroke-width="1" opacity=".45"/><circle cx="32" cy="32" r="22" fill="none" stroke="#CDB79E" stroke-width="1" opacity=".4"/><circle cx="32" cy="10" r="8" fill="#F97316" opacity=".22"/><circle cx="32" cy="10" r="5" fill="url(#${pfx}Sun)"/><circle cx="48" cy="16" r="2.7" fill="#C0562F"/><g transform="rotate(20 54 32)"><ellipse cx="54" cy="32" rx="5.4" ry="1.8" fill="none" stroke="#E0B15A" stroke-width="1.2"/></g><circle cx="54" cy="32" r="3.1" fill="#DDAE52"/><circle cx="48" cy="48" r="2.7" fill="#AC8F62"/><circle cx="32" cy="54" r="3" fill="#E8A579"/><circle cx="16" cy="48" r="3.5" fill="#8C6E7A"/><circle cx="10" cy="32" r="2.5" fill="#7A8C72"/><circle cx="16" cy="16" r="2.3" fill="#C9B79E"/><circle cx="32" cy="32" r="8" fill="url(#${pfx}Earth)"/><path d="M27 29 q3 -1 5 1 q2 2 -1 3 q-3 1 -4 -1 q-1 -2 0 -3 Z" fill="#6E8467"/><ellipse cx="29" cy="29" rx="2.4" ry="1.6" fill="#fff" opacity=".28"/></svg>`;
}

/**
 * Mount the shared header into #nav-mount.
 * @param {string} activePage - current filename e.g. 'lab.html'
 * @param {object} [opts]
 * @param {boolean} [opts.homeLinks] - point menu items at the home page's sections
 * @param {boolean} [opts.noBanner]  - skip the big brand banner row, keeping the
 *   utility bar, menu and scrolling strip. Used by the dashboard and admin panel,
 *   which have their own hero heading straight below.
 */
function mountNav(activePage, opts) {
  opts = opts || {};
  const mount = document.getElementById('nav-mount');
  if (!mount) return;

  // opts.homeLinks is accepted for compatibility but no longer changes anything:
  // the menu always points at the current home page.
  const activeHash = PAGE_TO_HASH[activePage] || '';
  const links = NAV_LINKS.map(link => {
    const isActive = link.hash === activeHash;
    return `<a href="../index.html#${link.hash}" class="${isActive ? 'active' : ''}">${link.label}</a>`;
  }).join('');

  const helpHref = '../index.html#resources';

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
    ${opts.noBanner ? '' : `<div class="brand-banner">
      <div class="brand-banner-inner">
        <span class="bb-word"><span>Seek-</span>${sosMark('navBan')}-Sphere</span>
        <span class="bb-tag">Explore &middot; Learn &middot; Discover</span>
      </div>
    </div>`}
    ${window.SOSMarquee ? SOSMarquee.html() : ''}`;
  // The strip is only measurable once it is in the document.
  if (window.SOSMarquee) SOSMarquee.init();
  // The account menu (#acctMenu) is populated by session.js once Firebase auth state resolves.
}

function toggleMobileNav() {
  document.getElementById('navLinks').classList.toggle('open');
}
