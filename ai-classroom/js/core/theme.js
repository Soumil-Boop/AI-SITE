/* ============================================================
   theme.js — the site is dark

   This used to be a switch. There were two palettes, a button in the
   utility bar, and a preference remembered per browser.

   There is one palette now. The switch is gone, and with it the whole
   question of which look a page is wearing: every page sets
   data-theme="dark" in its own <head>, before the first stylesheet, and
   nothing anywhere is allowed to change it afterwards.

   What is left here is small and does three things.

   It clears the old preference. Anyone who pressed the button once, a
   month ago, has 'sos_theme: light' sitting in their browser; without
   this they would open a site whose only remaining light rules are the
   token defaults and see something half-finished. Deleting the key means
   the choice cannot come back to haunt anyone.

   It puts the attribute back if it ever goes missing. A page that
   forgot the head snippet, or a stray script setting it to something
   else, would otherwise fall through to the cream token values that
   still sit underneath as the layer the dark palette overrides. That
   would look broken rather than light, so it is watched.

   And it keeps SOSTheme.onChange alive as a promise nothing will break.
   The neural web behind the hero and the dashboard's charts are drawn
   on canvases; they read their colours from CSS and were told when to
   redraw. Nothing calls back any more, but the subscription is still
   there so those files did not have to be edited to remove a listener
   for an event that simply never fires.
   ============================================================ */
(function () {
  var KEY = 'sos_theme';
  var THEME = 'dark';

  var root = document.documentElement;

  function pin() {
    if (root.getAttribute('data-theme') !== THEME) {
      root.setAttribute('data-theme', THEME);
    }
  }
  pin();

  /* The preference outlived the thing it was a preference for. */
  try { localStorage.removeItem(KEY); } catch (e) {}

  /* Cheap insurance against anything else writing the attribute — a
     bookmarklet, an extension, a half-removed line somewhere. It costs
     one callback per attribute change on <html> and nothing otherwise. */
  if (window.MutationObserver) {
    new MutationObserver(pin).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  }

  window.SOSTheme = {
    get: function () { return THEME; },
    /* Kept so a stray call cannot throw. There is nothing to set. */
    set: function () {},
    toggle: function () {},
    onChange: function () {}
  };
})();
