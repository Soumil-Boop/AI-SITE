/* ============================================================
   footer.js — one footer, written once, mounted on every page.

   It builds itself: include the script and the page gets the footer,
   with the links pointed correctly whether the page sits at the root
   or inside pages/. The account column follows whoever is signed in —
   a visitor is offered a way in, a student is shown their dashboard,
   an admin the panel — so the footer never advertises a door that is
   not theirs.
   ============================================================ */
(function () {
  var inPages = location.pathname.indexOf('/pages/') !== -1;
  var P    = inPages ? '' : 'pages/';          // where the real pages live
  var HOME = inPages ? '../index.html' : 'index.html';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  /* The same solar mark the header uses. nav.js owns it, but the home page
     builds its own header and never loads nav.js — so the mark is carried
     here too rather than leaving a gap where the planet should be. */
  var MARK = '<svg class="logo-mark" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs><radialGradient id="sfSpace" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#3A241A"/><stop offset="1" stop-color="#17100A"/></radialGradient>' +
    '<radialGradient id="sfEarth" cx="38%" cy="34%" r="70%"><stop offset="0" stop-color="#3E6E88"/><stop offset="1" stop-color="#284B60"/></radialGradient>' +
    '<radialGradient id="sfSun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE08A"/><stop offset="55%" stop-color="#F97316"/><stop offset="100%" stop-color="#EA580C"/></radialGradient></defs>' +
    '<circle cx="32" cy="32" r="31" fill="url(#sfSpace)"/>' +
    '<circle cx="32" cy="32" r="31" fill="none" stroke="#C0562F" stroke-width="1" opacity=".45"/>' +
    '<circle cx="32" cy="32" r="22" fill="none" stroke="#CDB79E" stroke-width="1" opacity=".4"/>' +
    '<circle cx="32" cy="10" r="8" fill="#F97316" opacity=".22"/><circle cx="32" cy="10" r="5" fill="url(#sfSun)"/>' +
    '<circle cx="48" cy="16" r="2.7" fill="#C0562F"/>' +
    '<g transform="rotate(20 54 32)"><ellipse cx="54" cy="32" rx="5.4" ry="1.8" fill="none" stroke="#E0B15A" stroke-width="1.2"/></g>' +
    '<circle cx="54" cy="32" r="3.1" fill="#DDAE52"/><circle cx="48" cy="48" r="2.7" fill="#AC8F62"/>' +
    '<circle cx="32" cy="54" r="3" fill="#E8A579"/><circle cx="16" cy="48" r="3.5" fill="#8C6E7A"/>' +
    '<circle cx="10" cy="32" r="2.5" fill="#7A8C72"/><circle cx="16" cy="16" r="2.3" fill="#C9B79E"/>' +
    '<circle cx="32" cy="32" r="8" fill="url(#sfEarth)"/>' +
    '<path d="M27 29 q3 -1 5 1 q2 2 -1 3 q-3 1 -4 -1 q-1 -2 0 -3 Z" fill="#6E8467"/>' +
    '<ellipse cx="29" cy="29" rx="2.4" ry="1.6" fill="#fff" opacity=".28"/></svg>';
  function mark() { return MARK; }

  /* Every link points at a place that exists. The menu items are all sections
     of the home page, so they are written as hashes on it. */
  var COLUMNS = [
    { title: 'Explore', links: [
      { href: HOME + '#what',    label: 'What is AI?' },
      { href: HOME + '#history', label: 'History of AI' },
      { href: HOME + '#types',   label: 'Types of AI' },
      { href: HOME + '#ethics',  label: 'Ethics' },
      { href: P + 'mission.html', label: 'Our mission' }
    ]},
    { title: 'Learn', links: [
      { href: HOME + '#lab',       label: 'Learning Lab' },
      { href: HOME + '#study',     label: 'Study Tools' },
      { href: HOME + '#finder',    label: 'Find My AI Tool' },
      { href: HOME + '#resources', label: 'Help & Resources' }
    ]}
  ];

  /* A <div role="navigation">, not a <nav>. The home page styles every bare
     <nav> as the dark 64px site bar — a footer column marked up as one comes
     out as a row of links inside a brown slab. The role keeps the meaning
     without inheriting the costume. */
  function columnHTML(col) {
    return '<div class="sf-col" role="navigation" aria-label="' + esc(col.title) + '">' +
      '<h2>' + esc(col.title) + '</h2>' +
      col.links.map(function (l) {
        return '<a href="' + esc(l.href) + '">' + esc(l.label) + '</a>';
      }).join('') +
    '</div>';
  }

  /* Signed out until we hear otherwise — the same order session.js paints in,
     so the footer never flashes a dashboard link at someone who has none. */
  function accountHTML(user, profile) {
    var links;
    if (!user) {
      links = [
        { href: P + 'login.html', label: 'Sign in' },
        { href: P + 'login.html', label: 'Create an account' },
        { href: HOME + '#contact', label: 'Contact us' }
      ];
    } else {
      var role = (profile && profile.role) ||
                 (function(){ try { return localStorage.getItem('sos_role'); } catch(e){ return null; } })();
      var isAdmin = role === 'owner' || role === 'schooladmin' || role === 'admin';
      links = [
        { href: P + (isAdmin ? 'admin.html' : 'dashboard.html'),
          label: isAdmin ? 'Admin Panel' : 'My Dashboard' },
        { href: P + 'account-settings.html', label: 'Account Settings' },
        { href: HOME + '#contact', label: 'Contact us' }
      ];
    }
    return '<div class="sf-col" id="sfAccount" role="navigation" aria-label="Your account">' +
      '<h2>Your account</h2>' +
      links.map(function (l) {
        return '<a href="' + esc(l.href) + '">' + esc(l.label) + '</a>';
      }).join('') +
    '</div>';
  }

  function build(user, profile) {
    return '' +
      '<div class="sf-inner">' +
        '<div class="sf-brand">' +
          '<a class="sf-logo" href="' + HOME + '"><span>Seek-</span>' + mark() + '<span>-Sphere</span></a>' +
          '<p class="sf-blurb">Artificial intelligence explained plainly, for ages 8 to 80. ' +
            'Clear lessons, a Lab that matches your curriculum, and a tool finder that actually ' +
            'points somewhere useful — free for students, always.</p>' +
          '<span class="sf-tag">Explore &middot; Learn &middot; Discover</span>' +
        '</div>' +
        COLUMNS.map(columnHTML).join('') +
        accountHTML(user, profile) +
      '</div>' +
      '<div class="sf-base">' +
        '<p>Made with &#10084;&#65039; for curious learners everywhere. ' +
          'AI is a tool. <em>You</em> are the thinker.</p>' +
        '<p>&copy; ' + new Date().getFullYear() + ' Seek-O-Sphere</p>' +
      '</div>';
  }

  /* How tall the chrome above the content is — the utility bar, the menu, the
     scrolling strip, and on some pages the brand banner. The stylesheet needs
     it to give the content exactly one screenful, which is what holds the
     footer at the same height however much or little a tab contains.

     Measured rather than assumed, because the header differs from page to page
     and the strip only takes its final height once its font has loaded. */
  function measureAbove() {
    var main = document.querySelector('body > main');
    if (!main) return;                       // the home page has no <main>
    var above = 0;
    var kids = document.body.children;
    for (var i = 0; i < kids.length; i++) {
      var el = kids[i];
      if (el === main) break;
      var cs = getComputedStyle(el);
      // An overlay or a gate is painted over the page, not above it.
      if (cs.position === 'fixed' || cs.position === 'absolute' || cs.display === 'none') continue;
      above += el.getBoundingClientRect().height;
    }
    document.documentElement.style.setProperty('--sos-above', Math.round(above) + 'px');
  }

  function watchAbove() {
    measureAbove();
    // The strip and the fonts settle a moment after load; re-measure then, and
    // whenever the window changes shape.
    setTimeout(measureAbove, 300);
    setTimeout(measureAbove, 1200);
    window.addEventListener('load', measureAbove);
    window.addEventListener('resize', measureAbove);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureAbove).catch(function(){});
  }

  /* Tabs that swap one block of content for another — the settings rail, the
     Lab's three tabs — used to change the height of the page as you clicked,
     which dragged the footer up and down with them. Given a floor equal to the
     tallest of the set, every tab occupies the same space and the ending stays
     put. A tab with more in it than the floor still grows; only the jumping
     stops.

     Measured on hidden clones in an off-screen probe of the same width, so
     nothing flickers on screen while the sizes are taken. */
  var applied = {};
  function equalise(selector) {
    var panes = document.querySelectorAll(selector);
    if (panes.length < 2) return;
    var parent = panes[0].parentElement;
    if (!parent) return;

    /* The clones have to be exactly as wide as the real thing, or text wraps
       differently and the measurement comes out short. The parent's clientWidth
       includes its padding, so take the width from a pane that is actually on
       screen, and fall back to the parent's content box. */
    var width = 0;
    for (var w = 0; w < panes.length; w++) {
      if (panes[w].offsetWidth) { width = panes[w].offsetWidth; break; }
    }
    if (!width) {
      var pcs = getComputedStyle(parent);
      width = parent.clientWidth - parseFloat(pcs.paddingLeft || 0) - parseFloat(pcs.paddingRight || 0);
    }
    if (!width) return;

    var probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none;';
    probe.style.width = width + 'px';
    document.body.appendChild(probe);

    var tallest = 0;
    for (var i = 0; i < panes.length; i++) {
      var copy = panes[i].cloneNode(true);
      copy.style.display = 'block';
      copy.style.minHeight = '';
      probe.appendChild(copy);
      if (copy.offsetHeight > tallest) tallest = copy.offsetHeight;
    }
    probe.parentNode.removeChild(probe);

    // Writing the same floor again would be a no-op that still wakes the
    // observer below, so nothing is written unless the answer has changed.
    if (!tallest || applied[selector] === tallest) return;
    applied[selector] = tallest;
    for (var j = 0; j < panes.length; j++) panes[j].style.minHeight = tallest + 'px';
    measureAbove();
  }

  /* Re-measure when the window changes shape, and whenever a tab's own content
     grows or shrinks — the Lab fills its tabs in after the page has loaded, so
     a single measurement at startup would set the floor from an empty one. */
  function equaliseOn(selector) {
    var t = null;
    var run = function () { equalise(selector); };
    var soon = function () { clearTimeout(t); t = setTimeout(run, 160); };

    run();
    setTimeout(run, 400);
    setTimeout(run, 1500);
    window.addEventListener('resize', soon);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(run).catch(function(){});

    if (typeof ResizeObserver === 'function') {
      var ro = new ResizeObserver(soon);
      var panes = document.querySelectorAll(selector);
      for (var i = 0; i < panes.length; i++) ro.observe(panes[i]);
    }
  }

  function mount() {
    if (document.querySelector('.site-footer')) return;   // never twice
    var el = document.createElement('footer');
    el.className = 'site-footer';
    el.innerHTML = build(null, null);
    document.body.appendChild(el);
    // Only now does the page become a column with the footer at the bottom —
    // a page without a footer keeps whatever layout it already had.
    document.body.classList.add('has-site-footer');
    watchAbove();

    /* The two places on this site where clicking swaps content in and out.
       Named here so a page only has to include the script. */
    equaliseOn('.set-pane > .pane');      // the account-settings rail
    equaliseOn('.lab-tab-content');       // the Learning Lab's three tabs

    // Follow the session, if this page has one.
    if (window.SOS && typeof SOS.onSession === 'function') {
      SOS.onSession(function (user, profile) {
        var col = document.getElementById('sfAccount');
        if (!col) return;
        var fresh = document.createElement('div');
        fresh.innerHTML = accountHTML(user, profile);
        col.parentNode.replaceChild(fresh.firstChild, col);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  window.SOSFooter = { mount: mount, remeasure: measureAbove, equalise: equalise, equaliseOn: equaliseOn };
})();
