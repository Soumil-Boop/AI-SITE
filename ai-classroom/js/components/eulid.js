/* ============================================================
   eulid.js — Eulid, everywhere, and summonable

   Four things, and one of them is subtler than it looks.

     He exists on every page, and he is the same Eulid. Not a copy of
     him: on the home page the element that floats around is literally
     the one from the hero, moved. Everywhere else the markup is fetched
     once from assets/eulid.html. There is never more than one in the
     document, which matters because he is drawn from three gradients
     addressed by id — two copies means two elements with id="euBody",
     and every fill in the second one silently resolves to the first.

     Double-click anywhere and he appears there and drifts a little.

     He has a home. On index.html that is where he already sits, in the
     hero, in the flow of the page — so "going home" means being put
     back into his original parent at his original index, not being
     positioned to look as if he were. On every other page home is a
     clear corner.

     Leave the site and come back and he is home again.

   That last one needs a definition, because "leaving" is not an event a
   browser reports. What is used here: his position lives in
   sessionStorage, which dies with the tab, and it carries a timestamp
   that is refreshed while the page is visible. Move around the site and
   he follows you. Close the tab, or come back after half an hour away,
   and he has gone home. Reopening a page from history mid-visit keeps
   him where you left him, which is the behaviour you would want and is
   the reason this is not just localStorage with a clear-on-unload.
   ============================================================ */
(function () {
  'use strict';

  var DOCK_ID = 'eulidDock';
  var KEY = 'sos_eulid_spot';
  var GONE_FOR = 30 * 60 * 1000;   /* away this long and he goes home */

  /* Which page has a place for him is decided by the page, not by its
     filename. The first version tested for "index.html" and got it
     wrong the moment the file was called anything else — it would also
     have failed on a bare "/", on index.htm, and on any copy made to
     try something out. The property that actually matters is whether
     this page ships with an Eulid of its own in its markup; if it does,
     that is his home and he is put back into it. */
  var HAS_OWN = false;
  var ROOT = location.pathname.indexOf('/pages/') !== -1 ? '../' : '';

  var dock, drift, homeParent, homeIndex, saysEl;

  /* ── where he stands when nothing has been asked of him ────────
     On the home page this is not a coordinate at all — it is a place in
     the document, and he is returned to it rather than parked over it.
     Everywhere else it is a clear corner, expressed as a fraction of the
     viewport so it survives a resize and a phone. Kept above the
     planner's corner and inside the page's own gutter. */
  function homeSpot() {
    return { fx: 0.86, fy: 0.72 };
  }

  /* ── remembering ───────────────────────────────────────────── */
  function remember(fx, fy) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ fx: fx, fy: fy, t: Date.now() }));
    } catch (e) { /* private mode: he simply will not follow you */ }
  }
  function recall() {
    try {
      var raw = sessionStorage.getItem(KEY);
      if (!raw) return null;
      var v = JSON.parse(raw);
      if (!v || typeof v.fx !== 'number') return null;
      if (Date.now() - (v.t || 0) > GONE_FOR) { forget(); return null; }
      return v;
    } catch (e) { return null; }
  }
  function forget() {
    try { sessionStorage.removeItem(KEY); } catch (e) {}
  }
  /* Touched while the page is on screen, so the half hour counts time
     AWAY rather than time since he was last moved. Without this he would
     go home in the middle of a long read. */
  function touch() {
    var v = recall();
    if (v) remember(v.fx, v.fy);
  }

  /* ── the dock ──────────────────────────────────────────────── */
  function makeDock() {
    dock = document.createElement('div');
    dock.className = 'eulid-dock';
    dock.id = DOCK_ID;
    drift = document.createElement('div');
    drift.className = 'eulid-drift';
    dock.appendChild(drift);
    document.body.appendChild(dock);
  }

  function place(fx, fy, animate) {
    dock.style.left = (fx * 100).toFixed(2) + '%';
    dock.style.top = (fy * 100).toFixed(2) + '%';
    if (animate) {
      dock.classList.remove('arriving');
      /* Reading offsetWidth restarts the animation. Without it, moving
         him twice in a row plays the arrival once. */
      void dock.offsetWidth;
      dock.classList.add('arriving');
    }
  }

  /* ── summoning and sending home ───────────────────────────── */

  /* On the home page he is IN the layout, so lifting him out of it makes
     everything below jump up by his height — about two hundred pixels of
     the hero collapsing the instant you double-click. A gap of exactly
     his size takes his place while he is away, so summoning him moves
     him and nothing else. Measured rather than hardcoded, because he is
     210px on a desktop and 170 on a phone. */
  var gapEl = null;
  function leaveGap(wrap) {
    if (!HAS_OWN || gapEl || !wrap) return;
    var r = wrap.getBoundingClientRect();
    gapEl = document.createElement('div');
    gapEl.className = 'eulid-gap';
    gapEl.setAttribute('aria-hidden', 'true');
    gapEl.style.width = r.width + 'px';
    gapEl.style.height = r.height + 'px';
    gapEl.style.margin = getComputedStyle(wrap).margin;
    wrap.parentNode.insertBefore(gapEl, wrap);
  }
  function closeGap() {
    if (gapEl && gapEl.parentNode) gapEl.parentNode.removeChild(gapEl);
    gapEl = null;
  }

  function summon(fx, fy) {
    var wrap = document.querySelector('.mascot-wrap');
    if (wrap && wrap.parentNode !== drift) { leaveGap(wrap); drift.appendChild(wrap); }
    dock.style.display = '';
    place(fx, fy, true);
    remember(fx, fy);
    if (saysEl) saysEl.style.display = 'none';
    aim();
  }

  function goHome() {
    forget();
    var wrap = document.querySelector('.mascot-wrap');
    if (HAS_OWN) {
      /* Back into the document, at the index he came from — so the hero
         lays out exactly as it did before he was ever moved. */
      if (wrap && homeParent) {
        if (gapEl && gapEl.parentNode === homeParent) homeParent.insertBefore(wrap, gapEl);
        else {
          var kids = homeParent.children;
          if (homeIndex >= kids.length) homeParent.appendChild(wrap);
          else homeParent.insertBefore(wrap, kids[homeIndex]);
        }
      }
      closeGap();
      dock.style.display = 'none';
      if (saysEl) saysEl.style.display = '';
    } else {
      if (wrap && wrap.parentNode !== drift) drift.appendChild(wrap);
      dock.style.display = '';
      var h = homeSpot();
      place(h.fx, h.fy, true);
    }
    aim();
  }

  /* ── the pupils ────────────────────────────────────────────────
     index.html has its own copy of this, bound to the mascot that was
     in the hero at load. Once he can move — and once he exists on pages
     that never had him — it has to be rebound, and it has to read his
     box fresh, because a fixed element's position changes without a
     scroll or a resize event to announce it. */
  var aimState = { rect: null, raf: false, mx: 0, my: 0 };
  function aim() {
    aimState.rect = null;
  }
  function pupilLoop() {
    var svg = document.querySelector('.mascot-svg');
    var pupils = document.querySelectorAll('.eulid-pupil');
    if (!svg || !pupils.length) return;
    if (!aimState.rect) aimState.rect = svg.getBoundingClientRect();
    var r = aimState.rect;
    var cx = r.left + r.width * 0.5, cy = r.top + r.height * 0.40;
    var a = Math.atan2(aimState.my - cy, aimState.mx - cx);
    var d = Math.min(Math.hypot(aimState.mx - cx, aimState.my - cy) / 45, 6);
    var tx = (Math.cos(a) * d).toFixed(1), ty = (Math.sin(a) * d).toFixed(1);
    for (var i = 0; i < pupils.length; i++)
      pupils[i].setAttribute('transform', 'translate(' + tx + ',' + ty + ')');
  }

  /* ── picking him up ────────────────────────────────────────────
     He is dragged now rather than double-clicked. Two things make that
     harder than it looks.

     A press on a leg and a press on his body start identically, so the
     two are told apart by distance rather than by target: move more
     than four pixels before letting go and it was a drag, otherwise it
     was a press on whatever is under the pointer. Deciding up front —
     "legs never drag" — would mean a child who grabs him by a leg
     finds he cannot be moved, which is not how anything real behaves.

     And the drag has to be in pointer events with a capture, not mouse
     events: without setPointerCapture, moving faster than the browser
     delivers moves drops him the moment the pointer leaves his box. */
  var DRAG_SLOP = 4;
  var drag = null;

  function onDown(e) {
    if (e.button != null && e.button !== 0) return;
    var wrap = e.target.closest && e.target.closest('.mascot-wrap');
    if (!wrap) return;
    var r = dockBox();
    drag = {
      id: e.pointerId, sx: e.clientX, sy: e.clientY,
      /* the offset from his centre, so he does not jump under the
         pointer the instant you press him */
      ox: r.cx - e.clientX, oy: r.cy - e.clientY,
      moved: false, leg: e.target.closest('.eu-leg'),
    };
    try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
  }

  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved &&
        Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < DRAG_SLOP) return;
    if (!drag.moved) {
      drag.moved = true;
      var wrap = document.querySelector('.mascot-wrap');
      if (wrap && wrap.parentNode !== drift) { leaveGap(wrap); drift.appendChild(wrap); }
      dock.style.display = '';
      dock.classList.add('dragging');
      if (saysEl) saysEl.style.display = 'none';
    }
    e.preventDefault();
    var fx = (e.clientX + drag.ox) / window.innerWidth;
    var fy = (e.clientY + drag.oy) / window.innerHeight;
    fx = Math.min(Math.max(fx, 0.06), 0.94);
    fy = Math.min(Math.max(fy, 0.08), 0.92);
    place(fx, fy, false);
    drag.fx = fx; drag.fy = fy;
    aim();
  }

  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null;
    dock.classList.remove('dragging');
    if (d.moved) { remember(d.fx, d.fy); return; }
    /* it was a press, not a drag */
    if (d.leg) { Tools.toggle(d.leg.dataset.leg, d.leg); }
  }

  function dockBox() {
    var svg = document.querySelector('.mascot-svg');
    if (!svg) return { cx: window.innerWidth / 2, cy: window.innerHeight / 2 };
    var r = svg.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  }


  /* ============================================================
     The legs

     Five of them, left to right: a lens, a highlighter, read-aloud, a
     way to the dashboard, and one you set yourself.

     Three of the five are MODES — they change what the pointer does
     until you turn them off — and a mode with nothing on screen saying
     it is on is the oldest interface bug there is. So every one of them
     lights its own leg and raises one pill that names it and says how
     to stop. Escape stops whatever is running, always, and pressing the
     same leg again does the same thing.
     ============================================================ */
  var Tools = (function () {
    var active = null;      /* 'lens' | 'mark' | 'read' | null */
    var activeLeg = null;
    var modeEl = null;
    var HL_KEY = 'sos_eulid_hl_colour';
    var CUSTOM_KEY = 'sos_eulid_custom';

    function label(name) {
      return { lens: 'Magnifier', mark: 'Highlighter', read: 'Read aloud' }[name] || name;
    }

    /* ── the pill ─────────────────────────────────────────────── */
    function showMode(name, extra) {
      hideMode();
      modeEl = document.createElement('div');
      modeEl.className = 'eu-mode';
      modeEl.setAttribute('role', 'status');
      var b = document.createElement('b');
      b.textContent = label(name) + ' on';
      modeEl.appendChild(b);
      if (extra) modeEl.appendChild(extra);
      var k = document.createElement('span');
      k.className = 'k'; k.textContent = 'Esc';
      modeEl.appendChild(k);
      var stop = document.createElement('button');
      stop.type = 'button'; stop.textContent = 'Stop';
      stop.addEventListener('click', function () { off(); });
      modeEl.appendChild(stop);
      document.body.appendChild(modeEl);
    }
    function hideMode() {
      if (modeEl && modeEl.parentNode) modeEl.parentNode.removeChild(modeEl);
      modeEl = null;
    }

    /* ── 1 · the lens ───────────────────────────────────────────
       What is in the circle is a clone of the single element under the
       pointer, scaled. Not a picture of the screen: a page cannot ask
       the browser for a bitmap of itself, and cloning the whole
       document on every move would mean copying six hundred kilobytes
       of markup sixty times a second. One element is cheap, and because
       it is still text rather than pixels it stays sharp at any zoom.

       The element is chosen by walking up from whatever is under the
       pointer until something with its own text or an image is found,
       and stopping before anything enormous — cloning a whole section
       would be both slow and useless, since a magnifier is supposed to
       show you a small thing bigger. */
    var lens = null, lensInner = null, lensSrc = null, lensRaf = false;
    var ZOOM = 2;

    function lensTarget(el) {
      for (var n = el; n && n !== document.body; n = n.parentElement) {
        if (n.closest('.eulid-dock, .eu-lens, .eu-mode')) return null;
        var r = n.getBoundingClientRect();
        if (r.height > 520 || r.width > 1000) break;
        if (n.tagName === 'IMG' || n.tagName === 'SVG') return n;
        var own = false;
        for (var i = 0; i < n.childNodes.length; i++)
          if (n.childNodes[i].nodeType === 3 && n.childNodes[i].textContent.trim()) own = true;
        if (own && r.height > 6) return n;
      }
      return null;
    }

    function lensDraw(x, y) {
      var under = document.elementFromPoint(x, y);
      if (!under) return;
      var t = lensTarget(under);
      lens.style.left = x + 'px';
      lens.style.top = y + 'px';
      if (!t) { lensInner.innerHTML = ''; lensSrc = null; return; }
      if (t !== lensSrc) {
        lensSrc = t;
        var c = t.cloneNode(true);
        c.style.margin = '0';
        /* the clone must not answer to anything */
        c.removeAttribute('id');
        var ids = c.querySelectorAll ? c.querySelectorAll('[id]') : [];
        for (var i = 0; i < ids.length; i++) ids[i].removeAttribute('id');
        lensInner.innerHTML = '';
        lensInner.appendChild(c);
        var r = t.getBoundingClientRect();
        lensInner.style.width = r.width + 'px';
        lensInner.dataset.w = r.width; lensInner.dataset.h = r.height;
        lensInner.dataset.x = r.left; lensInner.dataset.y = r.top;
        /* the clone inherits nothing from its old parent, so the font
           and colour are copied across explicitly — otherwise a
           paragraph magnifies into unstyled Times */
        var cs = getComputedStyle(t);
        ['fontFamily','fontSize','fontWeight','lineHeight','color','letterSpacing','textAlign']
          .forEach(function (k) { lensInner.style[k] = cs[k]; });
        lensInner.style.background = 'transparent';
      }
      /* place the clone so the point under the pointer lands in the
         middle of the circle */
      var ox = +lensInner.dataset.x, oy = +lensInner.dataset.y;
      var lx = (x - ox), ly = (y - oy);
      lensInner.style.transform =
        'translate(' + (110 - lx * ZOOM) + 'px,' + (110 - ly * ZOOM) + 'px) scale(' + ZOOM + ')';
    }

    function lensMove(e) {
      if (lensRaf) return;
      lensRaf = true;
      var x = e.clientX, y = e.clientY;
      requestAnimationFrame(function () { lensRaf = false; if (lens) lensDraw(x, y); });
    }

    function lensOn() {
      lens = document.createElement('div');
      lens.className = 'eu-lens';
      lensInner = document.createElement('div');
      lensInner.className = 'eu-lens-inner';
      lens.appendChild(lensInner);
      document.body.appendChild(lens);
      document.body.classList.add('eu-lens-on');
      document.addEventListener('mousemove', lensMove, { passive: true });
      showMode('lens');
    }
    function lensOff() {
      document.removeEventListener('mousemove', lensMove);
      document.body.classList.remove('eu-lens-on');
      if (lens && lens.parentNode) lens.parentNode.removeChild(lens);
      lens = lensInner = lensSrc = null;
    }

    /* ── 2 · the highlighter ────────────────────────────────────
       A selection almost never lines up with element boundaries, so
       surroundContents() throws on most real ones — "partially selected
       non-Text node". The way that works is to collect the text nodes
       the range touches and wrap each of them, splitting the first and
       last where the selection starts and ends. */
    var colour = 0;

    function textNodesIn(range) {
      var out = [];
      var walker = document.createTreeWalker(
        range.commonAncestorContainer, NodeFilter.SHOW_TEXT, {
          acceptNode: function (n) {
            if (!n.textContent.trim()) return NodeFilter.FILTER_REJECT;
            if (n.parentElement && n.parentElement.closest('.eulid-dock, .eu-mode, .eu-lens, script, style'))
              return NodeFilter.FILTER_REJECT;
            return range.intersectsNode(n) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
        });
      var n;
      while ((n = walker.nextNode())) out.push(n);
      if (!out.length && range.startContainer.nodeType === 3) out.push(range.startContainer);
      return out;
    }

    var erasing = false;

    function paint() {
      if (erasing) { eraseSelection(); return; }
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;
      var range = sel.getRangeAt(0);
      var nodes = textNodesIn(range);
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var from = (n === range.startContainer) ? range.startOffset : 0;
        var to = (n === range.endContainer) ? range.endOffset : n.textContent.length;
        if (to <= from) continue;
        var mid = n;
        if (from > 0) mid = mid.splitText(from);
        if (to - from < mid.textContent.length) mid.splitText(to - from);
        var mark = document.createElement('mark');
        mark.className = 'eu-hl';
        mark.dataset.c = colour;
        mid.parentNode.insertBefore(mark, mid);
        mark.appendChild(mid);
      }
      sel.removeAllRanges();
    }

    /* ── taking a highlight off again ───────────────────────────
       A highlighter you cannot undo is a one-way door, and on a page a
       child is reading it is worse than that: one wrong drag and the
       sentence is stuck looking wrong until they reload and lose the
       lot.

       Three ways out, because different people reach for different
       ones: click a highlight to remove it, switch to the eraser and
       sweep across several, or clear the page. All three go through
       unwrap(), and unwrap() ends with normalize() on the parent — a
       mark that is removed leaves the text split into three nodes where
       it used to be one, and without merging them back a second pass
       over the same sentence highlights only a fragment of it. */
    function unwrap(mark) {
      var parent = mark.parentNode;
      if (!parent) return;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parent.normalize();
    }

    function eraseAt(el) {
      var mark = el && el.closest && el.closest('mark.eu-hl');
      if (!mark) return false;
      unwrap(mark);
      return true;
    }

    /* Everything the current selection touches. Used by the eraser so a
       sweep takes off every highlight it crosses rather than only the
       one under the pointer when the mouse came up. */
    function eraseSelection() {
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return 0;
      var range = sel.getRangeAt(0);
      var all = document.querySelectorAll('mark.eu-hl');
      var hit = [];
      for (var i = 0; i < all.length; i++)
        if (range.intersectsNode(all[i])) hit.push(all[i]);
      for (var k = 0; k < hit.length; k++) unwrap(hit[k]);
      sel.removeAllRanges();
      return hit.length;
    }

    function clearAll() {
      var all = document.querySelectorAll('mark.eu-hl');
      for (var i = 0; i < all.length; i++) unwrap(all[i]);
      return all.length;
    }

    function markOn() {
      try { colour = +(localStorage.getItem(HL_KEY) || 0) || 0; } catch (e) { colour = 0; }
      document.body.classList.add('eu-mark-on');
      document.addEventListener('mouseup', paint);
      document.addEventListener('click', onMarkClick, true);
      var box = document.createElement('span');
      box.className = 'eu-swatches';
      for (var i = 0; i < 5; i++) {
        (function (c) {
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'eu-sw'; b.dataset.c = c;
          b.setAttribute('aria-label', 'Highlighter colour ' + (c + 1));
          b.setAttribute('aria-pressed', c === colour ? 'true' : 'false');
          b.addEventListener('click', function () {
            colour = c;
            try { localStorage.setItem(HL_KEY, c); } catch (e) {}
            box.querySelectorAll('.eu-sw').forEach(function (x) {
              x.setAttribute('aria-pressed', +x.dataset.c === c ? 'true' : 'false');
            });
          });
          box.appendChild(b);
        })(i);
      }
      /* the eraser, in the same row as the colours because it is the
         same decision: what does a drag do next */
      var er = document.createElement('button');
      er.type = 'button'; er.className = 'eu-sw eu-sw-erase';
      er.setAttribute('aria-label', 'Eraser — sweep across highlights to remove them');
      er.setAttribute('aria-pressed', 'false');
      er.addEventListener('click', function () {
        erasing = !erasing;
        er.setAttribute('aria-pressed', erasing ? 'true' : 'false');
        document.body.classList.toggle('eu-erase-on', erasing);
      });
      box.appendChild(er);

      var clear = document.createElement('button');
      clear.type = 'button'; clear.className = 'eu-clear';
      clear.textContent = 'Clear all';
      clear.addEventListener('click', function () { clearAll(); });
      box.appendChild(clear);

      showMode('mark', box);
    }
    function markOff() {
      document.body.classList.remove('eu-mark-on', 'eu-erase-on');
      document.removeEventListener('mouseup', paint);
      document.removeEventListener('click', onMarkClick, true);
      erasing = false;
    }

    /* Click one to remove it. Captured rather than bubbled, and only
       while the highlighter is on, so it never eats a click on a link
       that happens to sit inside something highlighted. */
    function onMarkClick(e) {
      var sel = window.getSelection();
      if (sel && !sel.isCollapsed) return;      /* that was a drag, not a click */
      if (eraseAt(e.target)) { e.preventDefault(); e.stopPropagation(); }
    }

    /* ── 3 · read aloud ─────────────────────────────────────────
       speechSynthesis. Two things it gets wrong if you let it: it keeps
       speaking after the page is gone, and on some builds it stalls
       after about fifteen seconds unless it is nudged. Both are handled
       rather than hoped about. */
    var speakTimer = null;

    function speakSelection() {
      var sel = window.getSelection();
      var text = sel ? String(sel).trim() : '';
      if (!text) return;
      /* Both halves have to exist. Some browsers expose speechSynthesis
         with no voices and no utterance constructor, and reaching for
         the constructor there throws inside a mouseup handler — which
         silently kills the highlighter and the drag along with it,
         because they share the document. */
      if (!('speechSynthesis' in window) || typeof window.SpeechSynthesisUtterance !== 'function') return;
      window.speechSynthesis.cancel();
      var u = new window.SpeechSynthesisUtterance(text.slice(0, 4000));
      u.rate = 0.95;
      u.onend = function () { clearInterval(speakTimer); };
      window.speechSynthesis.speak(u);
      clearInterval(speakTimer);
      /* the nudge: some builds stop at ~15s without it */
      speakTimer = setInterval(function () {
        if (!window.speechSynthesis.speaking) { clearInterval(speakTimer); return; }
        window.speechSynthesis.pause(); window.speechSynthesis.resume();
      }, 9000);
    }

    function readOn() {
      document.body.classList.add('eu-read-on');
      document.addEventListener('mouseup', speakSelection);
      var hint = document.createElement('span');
      hint.style.cssText = 'font-size:.74rem;color:rgba(230,237,246,.65)';
      hint.textContent = ('speechSynthesis' in window)
        ? 'select any text' : 'this browser cannot speak';
      showMode('read', hint);
    }
    function readOff() {
      document.body.classList.remove('eu-read-on');
      document.removeEventListener('mouseup', speakSelection);
      clearInterval(speakTimer);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }

    /* ── 4 · the dashboard ─────────────────────────────────────── */
    function toDashboard() { location.href = ROOT + 'pages/dashboard.html'; }

    /* ── 5 · yours ─────────────────────────────────────────────
       Set once and kept in localStorage, so it survives the visit that
       sessionStorage does not — a shortcut you have to re-enter every
       time is not a shortcut. Until it is set, pressing it opens the
       sheet; after that it goes where you sent it, and a long press or
       the sheet's own button changes it. */
    var QUICK = [
      ['Learning Lab', 'index.html#lab'],
      ['Find My AI Tool', 'index.html#finder'],
      ['Study Tools', 'index.html#study'],
      ['Help & Resources', 'index.html#resources'],
      ['My planner', 'pages/dashboard.html#planner'],
    ];
    function customGet() {
      try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || 'null'); }
      catch (e) { return null; }
    }
    function customSet(v) {
      try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(v)); } catch (e) {}
      applyCustomLabel();
    }
    function applyCustomLabel() {
      var leg = document.querySelector('.eu-leg[data-leg="custom"]');
      if (!leg) return;
      var v = customGet();
      leg.setAttribute('aria-label', v && v.label
        ? v.label + ' — your own shortcut'
        : 'Your own shortcut — press to choose what it does');
    }

    function customSheet() {
      var scrim = document.createElement('div');
      scrim.className = 'eu-scrim';
      var sheet = document.createElement('div');
      sheet.className = 'eu-sheet';
      sheet.setAttribute('role', 'dialog');
      sheet.setAttribute('aria-modal', 'true');
      var cur = customGet() || { label: '', url: '' };
      sheet.innerHTML =
        '<h3>Eulid’s fifth leg</h3>' +
        '<p>Pick where this one takes you. It is yours — it stays set on this ' +
        'device until you change it.</p>' +
        '<label for="euCL">What to call it</label>' +
        '<input id="euCL" type="text" maxlength="28" placeholder="My revision notes">' +
        '<label for="euCU">Where it goes</label>' +
        '<input id="euCU" type="text" placeholder="index.html#lab or https://…">' +
        '<div class="eu-quick"></div>' +
        '<div class="eu-sheet-row">' +
          '<button type="button" data-x="cancel">Cancel</button>' +
          '<button type="button" class="go" data-x="save">Save</button>' +
        '</div>';
      document.body.appendChild(scrim);
      document.body.appendChild(sheet);
      var L = sheet.querySelector('#euCL'), U = sheet.querySelector('#euCU');
      L.value = cur.label || ''; U.value = cur.url || '';
      var q = sheet.querySelector('.eu-quick');
      QUICK.forEach(function (item) {
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = item[0];
        b.addEventListener('click', function () { L.value = item[0]; U.value = item[1]; });
        q.appendChild(b);
      });
      function close() {
        if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
        if (scrim.parentNode) scrim.parentNode.removeChild(scrim);
      }
      sheet.addEventListener('click', function (e) {
        var x = e.target.dataset && e.target.dataset.x;
        if (x === 'cancel') close();
        if (x === 'save') {
          var url = U.value.trim();
          /* Only http(s) and same-site paths. A shortcut is a link the
             page will follow without asking, so javascript: and data:
             have no business in it. */
          if (/^(javascript|data|vbscript):/i.test(url)) url = '';
          customSet({ label: L.value.trim() || 'My shortcut', url: url });
          close();
        }
      });
      scrim.addEventListener('click', close);
      L.focus();
      return close;
    }
    var closeSheet = null;

    function custom() {
      var v = customGet();
      if (v && v.url) { location.href = /^https?:/i.test(v.url) ? v.url : ROOT + v.url; return; }
      closeSheet = customSheet();
    }

    /* ── the switchboard ─────────────────────────────────────── */
    var MODES = {
      lens: [lensOn, lensOff],
      mark: [markOn, markOff],
      read: [readOn, readOff],
    };

    function off() {
      if (active && MODES[active]) MODES[active][1]();
      if (activeLeg) activeLeg.classList.remove('on');
      active = null; activeLeg = null;
      hideMode();
    }

    function toggle(name, leg) {
      if (name === 'dashboard') { off(); toDashboard(); return; }
      if (name === 'custom') { off(); custom(); return; }
      if (!MODES[name]) return;
      if (active === name) { off(); return; }
      off();
      active = name; activeLeg = leg;
      if (leg) leg.classList.add('on');
      MODES[name][0]();
    }

    function init() {
      applyCustomLabel();
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (closeSheet) { closeSheet(); closeSheet = null; }
        if (active) off();
      });
      /* Nothing keeps talking after you have gone. */
      window.addEventListener('pagehide', function () {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      });
      /* the name of the leg under the pointer */
      var tip = null;
      document.addEventListener('pointerover', function (e) {
        var leg = e.target.closest && e.target.closest('.eu-leg');
        if (!leg) { if (tip) { tip.remove(); tip = null; } return; }
        if (!tip) { tip = document.createElement('div'); tip.className = 'eu-tipname';
                    document.body.appendChild(tip); }
        tip.textContent = (leg.getAttribute('aria-label') || '').split(' — ')[0];
        var r = leg.getBoundingClientRect();
        tip.style.left = (r.left + r.width / 2) + 'px';
        tip.style.top = r.top + 'px';
      });
      document.addEventListener('pointerout', function (e) {
        if (e.target.closest && e.target.closest('.eu-leg')) return;
        if (tip) { tip.remove(); tip = null; }
      });
    }

    return { toggle: toggle, off: off, init: init, active: function () { return active; } };
  })();

  /* ── the speech bubble, home only ─────────────────────────── */
  function addBubble(wrap) {
    if (!HAS_OWN || !wrap) return;
    wrap.classList.add('eulid-wrap-rel');
    saysEl = document.createElement('div');
    saysEl.className = 'eulid-says';
    saysEl.setAttribute('role', 'note');
    saysEl.textContent = 'Hold me and drag me anywhere \u2014 and my legs are tools!';
    wrap.appendChild(saysEl);
  }

  /* ── start ────────────────────────────────────────────────── */
  function start(wrap) {
    if (HAS_OWN && wrap) {
      homeParent = wrap.parentNode;
      homeIndex = Array.prototype.indexOf.call(homeParent.children, wrap);
      addBubble(wrap);
    }
    makeDock();

    var spot = recall();
    if (spot) summon(spot.fx, spot.fy);
    else goHome();

    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    /* the legs from a keyboard, since they are buttons */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var leg = e.target.closest && e.target.closest('.eu-leg');
      if (!leg) return;
      e.preventDefault();
      Tools.toggle(leg.dataset.leg, leg);
    });
    Tools.init();
    document.addEventListener('mousemove', function (e) {
      aimState.mx = e.clientX; aimState.my = e.clientY;
      if (aimState.raf || document.hidden) return;
      aimState.raf = true;
      requestAnimationFrame(function () { aimState.raf = false; pupilLoop(); });
    }, { passive: true });
    window.addEventListener('resize', aim, { passive: true });
    window.addEventListener('scroll', aim, { passive: true });

    /* Keep the clock honest about time away rather than time idle. */
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) {
        if (!recall()) goHome();
        else touch();
      }
    });
    setInterval(function () { if (!document.hidden) touch(); }, 60000);
  }

  function begin() {
    var wrap = document.querySelector('.mascot-wrap');
    HAS_OWN = !!wrap;
    if (wrap) { start(wrap); return; }
    /* No Eulid on this page yet — fetch the one copy of him.
       If it fails the page is exactly as it was; a mascot is not worth
       a visible error. */
    fetch(ROOT + 'assets/eulid.html')
      .then(function (r) { if (!r.ok) throw new Error('eulid ' + r.status); return r.text(); })
      .then(function (html) {
        var host = document.createElement('div');
        host.innerHTML = html;
        var el = host.firstElementChild;
        document.body.appendChild(el);
        start(el);
      })
      .catch(function (e) {
        if (window.console && console.warn) console.warn('No Eulid:', e.message);
      });
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', begin);
  else begin();
})();
