/* ============================================================
   backdrop.js — puts the sky on the pages that should have one

   The home page has carried a hand-built starfield for a while: about
   two hundred kilobytes of SVG sitting inline in index.html, drawn once
   and shown only on the home panel.

   Two jobs here.

   On index.html the sky already exists, so this only has to stop hiding
   it on the other sections and turn on the treatment.

   On every other reading page there is no sky at all, and duplicating
   that much markup into each file would be a mistake — one copy to
   maintain becomes two, and the second one silently drifts. So the
   markup is fetched once from assets/backdrop.html, cached by the
   browser like any other asset, and injected.

   Four pages never get it, and the list is here rather than in each
   page so it cannot be half-applied: signing in, account settings, the
   dashboard and the admin panel. Those are places to get something
   done. A starfield behind a form is a distraction with no upside, and
   the admin panel in particular is somewhere people are reading numbers
   about real children.
   ============================================================ */
(function () {
  'use strict';

  var NEVER = ['login.html', 'account-settings.html', 'dashboard.html', 'admin.html'];

  function pageName() {
    var p = location.pathname.split('/').pop();
    return p || 'index.html';
  }
  if (NEVER.indexOf(pageName()) !== -1) return;

  var inPages = location.pathname.indexOf('/pages/') !== -1;
  var ROOT = inPages ? '../' : '';

  function enable() {
    document.body.classList.add('has-backdrop');
  }

  /* index.html: the sky is already in the document and is switched off
     everywhere but the home panel by a rule in that file's own head.
     Rather than edit that rule from here, the wrapper gets a class the
     stylesheet can beat it with. */
  var existing = document.querySelector('.sky');
  if (existing) {
    var wrap = existing.parentNode;
    if (wrap) wrap.classList.add('sky-everywhere');
    enable();
    return;
  }

  /* Everywhere else: fetch the markup and put it behind the page.

     If the fetch fails the page is exactly as it was — no sky, no
     broken layout, no error on screen. A decorative background is not
     worth a visible failure. */
  fetch(ROOT + 'assets/backdrop.html')
    .then(function (r) { if (!r.ok) throw new Error('backdrop ' + r.status); return r.text(); })
    .then(function (html) {
      var host = document.createElement('div');
      host.className = 'sky-wrap sky-standalone';
      host.innerHTML = html;
      var main = document.querySelector('main') || document.body;
      /* Behind the content rather than around it: on these pages the
         markup is not wrapped the way index.html's is, so the sky is
         fixed to the viewport and everything else is lifted above it. */
      document.body.insertBefore(host, document.body.firstChild);
      enable();
      document.body.classList.add('backdrop-fixed');
      void main;
    })
    .catch(function (e) {
      if (window.console && console.warn) console.warn('No backdrop:', e.message);
    });
})();
