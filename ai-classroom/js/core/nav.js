/* ============================================================
   nav.js — the header for the pages under pages/.

   It used to carry a copy of the site menu. It does not any more: the
   site is the shell at study.html, and its rail is the one place every
   destination lives. A second menu here — different shape, different
   place, same links — was only somewhere for the two to disagree.

   What is left is what a page away from the rail actually needs: a way
   back to the site, and the account menu that owns sign-out.
   ============================================================ */

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

  /* activePage is still accepted so the five callers need no edit, but there
     is no menu left to mark a page active in. */
  mount.innerHTML = `
    <div class="topbar">
      <div id="acctMenu"><a href="login.html" class="topbar-auth">Sign In</a></div>
    </div>
    <nav>
      <a class="nav-logo" href="../study.html"><span>Seek-</span>${sosMark('navSos')}-Sphere</a>
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

