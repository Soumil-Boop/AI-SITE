/* ============================================================
   theme.js — the light/dark switch

   Two jobs. It remembers which look a person chose, and it puts the
   control that changes it into the utility bar at the top of every page.

   The choice itself is applied by a three-line script in each page's
   <head>, not here, because it has to happen before the first paint —
   a stylesheet that arrives after the page has drawn produces a flash
   of the wrong theme, and on a dark theme that flash is a white one.
   By the time this file runs the attribute is already set; all this
   does is let it be changed.

   Stored under 'sos_theme', deliberately outside SOSCache: which look
   you prefer belongs to the browser, not to the account, so signing out
   or switching user does not throw it away.
   ============================================================ */
(function () {
  var KEY = 'sos_theme';
  var DEFAULT = 'dark';

  function read()  { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v){ try { localStorage.setItem(KEY, v); } catch (e) {} }

  function current() {
    var a = document.documentElement.getAttribute('data-theme');
    return a === 'light' ? 'light' : (a === 'dark' ? 'dark' : (read() === 'light' ? 'light' : DEFAULT));
  }

  var listeners = [];

  function apply(theme, remember) {
    theme = (theme === 'light') ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    if (remember !== false) write(theme);
    paintToggle(theme);
    // The neural web behind the hero is drawn on a canvas, so it cannot
    // pick up a CSS change on its own — it has to be told.
    if (typeof window.SOSNeuralRefresh === 'function') {
      try { window.SOSNeuralRefresh(); } catch (e) {}
    }
    listeners.forEach(function (fn) { try { fn(theme); } catch (e) {} });
  }

  var SUN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/>' +
    '<path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4' +
    'M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/></svg>';
  var MOON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M20 14.4A8.2 8.2 0 1 1 9.6 4a6.6 6.6 0 0 0 10.4 10.4z"/></svg>';

  /* The button says where it takes you, not where you are. "Light" on a dark
     page is the thing that will happen if you press it, which is the only
     reading of a switch that never leaves anyone guessing. */
  function paintToggle(theme) {
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    var goingTo = (theme === 'dark') ? 'light' : 'dark';
    btn.innerHTML = (goingTo === 'light' ? SUN : MOON) +
                    '<span class="tt-label">' + goingTo + '</span>';
    btn.setAttribute('aria-label', 'Switch to the ' + goingTo + ' theme');
    btn.setAttribute('title', 'Switch to the ' + goingTo + ' theme');
  }

  /* The utility bar is static markup on the home page but is injected by
     nav.js on every page inside pages/, so the control cannot simply be
     placed once at load. Try now, and keep trying briefly if the bar has
     not been built yet. */
  var tries = 0;
  function mount() {
    var bar = document.querySelector('.topbar');
    if (!bar) { if (tries++ < 40) setTimeout(mount, 120); return; }
    if (bar.querySelector('.theme-toggle')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
    btn.addEventListener('click', function () {
      apply(current() === 'dark' ? 'light' : 'dark');
    });
    // First in the bar: it sits hard left because .theme-toggle carries
    // margin-right:auto, which pushes Help and the account menu right.
    bar.insertBefore(btn, bar.firstChild);
    paintToggle(current());
  }

  window.SOSTheme = {
    get: current,
    set: function (t) { apply(t); },
    toggle: function () { apply(current() === 'dark' ? 'light' : 'dark'); },
    onChange: function (fn) { if (typeof fn === 'function') listeners.push(fn); }
  };

  // Make sure the attribute is present even if a page forgot the head
  // snippet — a missing attribute would otherwise silently mean "light".
  if (!document.documentElement.getAttribute('data-theme')) {
    apply(read() === 'light' ? 'light' : DEFAULT, false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
