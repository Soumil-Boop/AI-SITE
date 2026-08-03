/* ============================================================
   marquee.js — Infinite scrolling brand strip
   Shared by index.html and every page that mounts the nav.

   The track scrolls left by exactly half its own width, so the second
   half lands where the first began and the loop is invisible. That only
   holds if half the track is at least as wide as the screen — otherwise
   the strip empties out on wide monitors before it wraps. So: clone the
   word group until it is, then scale the animation duration to the new
   width so the scroll speed stays the same on any display.
   ============================================================ */
(function (global) {

  var WORDS = ['Explore', 'Learn', 'Discover', 'AI Made Simple',
               'For Ages 8 to 80', 'Free for Students', 'Learn by Doing'];
  var PX_PER_SEC = 32;      // constant scroll speed, independent of width

  /* Markup for one strip. Two groups to start; JS adds more if needed. */
  function html() {
    var group = '<div class="marquee-group">' +
      WORDS.map(function (w) { return '<span>' + w + '</span><i>&#10022;</i>'; }).join('') +
      '</div>';
    return '<div class="brand-marquee" aria-hidden="true">' +
             '<div class="marquee-track">' + group + group + '</div>' +
           '</div>';
  }

  /* Measure one strip and clone its group until the loop cannot run dry. */
  function layoutOne(wrap) {
    var track = wrap.querySelector('.marquee-track');
    if (!track || !track.children.length) return;

    // Start from a clean pair so repeated calls (resize, font load) don't stack up.
    while (track.children.length > 2) track.removeChild(track.lastChild);
    if (track.children.length === 1) track.appendChild(track.children[0].cloneNode(true));

    var proto = track.children[0];
    var groupW = proto.getBoundingClientRect().width;
    if (!groupW) return;                       // not laid out yet — a later pass will catch it

    var wrapW = wrap.getBoundingClientRect().width || global.innerWidth || 0;
    var perHalf = Math.max(1, Math.ceil(wrapW / groupW) + 1);
    while (track.children.length < perHalf * 2) track.appendChild(proto.cloneNode(true));

    track.style.setProperty('--marquee-dur', ((groupW * perHalf) / PX_PER_SEC).toFixed(2) + 's');
  }

  function layout() {
    var strips = document.querySelectorAll('.brand-marquee');
    for (var i = 0; i < strips.length; i++) layoutOne(strips[i]);
  }

  var wired = false;
  function init() {
    layout();
    if (wired) return;
    wired = true;
    // Webfonts change the group width, so re-measure once they land.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(layout).catch(function () {});
    }
    var t;
    global.addEventListener('resize', function () {
      clearTimeout(t); t = setTimeout(layout, 180);
    });
  }

  global.SOSMarquee = { html: html, init: init, layout: layout };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})(window);
