/* ============================================================
   planner.js — the day planner

   A tab on the right margin that folds out into a panel: pick a day,
   write what you are going to do and when, tick it off.

   ── Where it appears ────────────────────────────────────────
   Not on the home page, the History section, Contact, the admin panel
   or account settings — and only where there is actually room for it.
   "Room" is measured rather than assumed: the script finds the page's
   own content column and looks at the gutter left beside it. On a wide
   screen the panel sits entirely in that empty margin and covers
   nothing; on a narrower one the tab still shows and the panel lies
   over the edge of the page while it is open; on anything narrower than
   that it does not appear at all, because there is nowhere for it to go
   that is not on top of what someone is reading.

   ── Where the plan lives ────────────────────────────────────
   Both places, and in that order. Every change is written to this
   browser immediately, so the panel never waits for a network round
   trip and a plan survives going offline. The same change is then
   pushed to Firestore under planner/<uid>/days/<date>, which is what
   carries it to another computer.

   It is filed under planner/ rather than progress/ on purpose. The
   existing rules let a school's admin read anything under progress/ —
   which is right for practice figures and wrong for "4pm, dentist".
   A day plan is the student's own, so it goes somewhere only they can
   reach, and the rules block for it is in firestore.rules.

   Until those rules are published Firestore will refuse the write. The
   planner keeps working from this browser and stays quiet about it —
   there is nothing a student could do about it, and nothing is lost.
   ============================================================ */
(function () {
  'use strict';

  /* ── where it may appear ─────────────────────────────────── */
  /* Sections of the single-page home that do not get it. */
  var NOT_ON_SECTIONS = ['home', 'history', 'contact'];
  /* Pages that do not get it at all, matched against the file name. */
  var NOT_ON_PAGES = ['admin.html', 'account-settings.html'];

  var PANEL_W = 320;      // the panel
  var TAB_W   = 40;       // the folded tab
  var GAP     = 16;       // breathing room between the panel and the page

  function pageName() {
    var p = location.pathname.split('/').pop();
    return p || 'index.html';
  }
  if (NOT_ON_PAGES.indexOf(pageName()) !== -1) return;

  /* ── the day, and the days either side of it ─────────────── */
  function iso(d) {
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }
  function dayShift(base, n) {
    var d = new Date(base + 'T12:00:00');   // midday, so daylight saving cannot slip a day
    d.setDate(d.getDate() + n);
    return iso(d);
  }
  var DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  function weekdayOf(date) { return DOW[new Date(date + 'T12:00:00').getDay()]; }
  function dayNumOf(date)  { return new Date(date + 'T12:00:00').getDate(); }

  var TODAY = iso(new Date());
  var showing = TODAY;

  /* ── this browser's copy ─────────────────────────────────── */
  function uid() {
    try { return localStorage.getItem('sos_uid') || ''; } catch (e) { return ''; }
  }
  function localKey() { return 'sos_plan_' + (uid() || 'anon'); }
  function readLocal() {
    try { return JSON.parse(localStorage.getItem(localKey()) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function writeLocal(all) {
    try { localStorage.setItem(localKey(), JSON.stringify(all)); } catch (e) {}
  }
  /* Kept in time order, with the untimed ones after the timed ones — the
     order somebody would write a day out in. */
  function byTime(items) {
    return items.slice().sort(function (a, b) {
      if (!a.at && !b.at) return 0;
      if (!a.at) return 1;
      if (!b.at) return -1;
      return a.at < b.at ? -1 : (a.at > b.at ? 1 : 0);
    });
  }
  function itemsFor(date) {
    var all = readLocal();
    return Array.isArray(all[date]) ? all[date] : [];
  }
  function setItems(date, items) {
    var all = readLocal();
    if (items.length) all[date] = items; else delete all[date];
    writeLocal(all);
    pushToAccount(date, items);
  }

  /* ── the account's copy ──────────────────────────────────── */
  var denied = false;                 // the rules have not been published yet
  var pending = {};                   // date → timer
  function docFor(date) {
    if (!window.SOS || !SOS.db || !SOS.user || SOS.user.isAnonymous) return null;
    return SOS.db.collection('planner').doc(SOS.user.uid).collection('days').doc(date);
  }
  /* A day is one document, and two people can write to it: the student here,
     and their school's admin from the panel. A plain write would mean
     whoever saved last erased the other — a task set at four o'clock gone
     because a chapter was ticked off at five.

     So a write reads the day back first and reconciles by who owns what.
     The student owns everything they wrote themselves and owns whether a
     thing is ticked. The admin owns which set tasks exist: one that is no
     longer in the account has been withdrawn and does not come back, and
     one that has just arrived is picked up here rather than waiting for
     the next time the panel is opened. If the read fails there is nothing
     to reconcile against, so the write goes ahead as it is. */
  function idOf(i) { return (i.at || '') + '|' + i.text + '|' + (i.by || ''); }
  function reconcile(mine, remote) {
    if (!Array.isArray(remote)) return mine;
    var ticked = {};
    mine.forEach(function (i) { if (i && i.by) ticked[idOf(i)] = !!i.done; });
    var out = mine.filter(function (i) { return i && !i.by; });
    remote.forEach(function (i) {
      if (!i || !i.by) return;
      var was = ticked[idOf(i)];
      out.push(was === undefined ? i
                                 : { at: i.at, text: i.text, by: i.by, done: was });
    });
    return byTime(out);
  }
  /* Debounced: typing three things in a row is one write, not three. */
  function pushToAccount(date, items) {
    var ref = docFor(date);
    if (!ref) return;
    clearTimeout(pending[date]);
    pending[date] = setTimeout(function () {
      ref.get().then(null, function () { return null; }).then(function (snap) {
        var remote = (snap && snap.exists && (snap.data() || {}).items) || null;
        var out = remote ? reconcile(items, remote) : items;
        if (remote && JSON.stringify(out) !== JSON.stringify(items)) {
          var all = readLocal();
          if (out.length) all[date] = out; else delete all[date];
          writeLocal(all);
          if (date === showing) paint();
        }
        return ref.set({ items: out, updatedAt: Date.now() });
      })
         .then(function () { denied = false; })
         .catch(function (e) {
           /* A refusal means the rules for planner/ are not published. Keep
              the plan, say so once, and stop pretending it is syncing. */
           /* Refused, which means the rules for planner/ are not published.
              The plan is already safe in this browser; there is nothing for
              the reader to do about it, so nothing is said. */
           if (e && /permission|insufficient/i.test(e.message || '')) denied = true;
         });
    }, 700);
  }
  /* Read one day back from the account and take it if it is the newer of
     the two — which is what makes a plan written on one machine show up
     on another. */
  function pullFromAccount(date) {
    var ref = docFor(date);
    if (!ref) return;
    ref.get().then(function (snap) {
      if (!snap || !snap.exists) return;
      var remote = snap.data() || {};
      if (!Array.isArray(remote.items)) return;
      var all = readLocal();
      var localStamp = (all.__at && all.__at[date]) || 0;
      var mine = Array.isArray(all[date]) ? all[date] : [];
      /* Newer in the account, so it is the day: it came from another
         computer. Older, and this copy stands — except for the tasks
         somebody else set, which are not this copy's to be out of date
         about, so those are taken either way. */
      var next = (remote.updatedAt || 0) >= localStamp ? remote.items
                                                       : reconcile(mine, remote.items);
      if (JSON.stringify(next) !== JSON.stringify(mine)) {
        if (next.length) all[date] = next; else delete all[date];
        writeLocal(all);
        /* Repainted whichever day this was. A day that is not the one on
           screen still has a dot on the week strip, and that dot is the
           only thing that will send anybody to look at it. */
        paint();
      }
    }).catch(function (e) {
      if (e && /permission|insufficient/i.test(e.message || '')) denied = true;
    });
  }
  /* The week, not just the day being looked at.

     This was the hole. A day was only ever fetched when it was the day on
     screen — on opening the panel, or on tapping a date. Work set by a
     teacher for Thursday therefore did not exist as far as this browser was
     concerned until Thursday was tapped, and nothing invited anyone to tap
     it: the dots on the week strip are drawn from this browser's copy, and
     this browser's copy had never heard of it. So a task that had saved
     perfectly well was invisible, which from the far side of the screen is
     indistinguishable from a task that did not save.

     The strip shows yesterday through five days ahead, so those are the
     days that get read. Seven small documents, once, when the account
     arrives — not a subscription, because the point is only that the week
     is honest when it is drawn. */
  function pullWeek() {
    if (!docFor(TODAY)) return;
    for (var n = -1; n <= 5; n++) pullFromAccount(dayShift(TODAY, n));
  }

  function stamp(date) {
    var all = readLocal();
    all.__at = all.__at || {};
    all.__at[date] = Date.now();
    writeLocal(all);
  }

  /* ── the markup ──────────────────────────────────────────── */
  var CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
            'stroke-linecap="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/>' +
            '<path d="M3.5 9.5h17M8 3v4M16 3v4"/></svg>';
  var SHUT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
             'stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  var root = null;

  function build() {
    root = document.createElement('aside');
    root.className = 'sos-planner';
    root.setAttribute('aria-label', 'Day planner');
    root.innerHTML =
      '<button class="pl-tab" type="button" aria-expanded="false" aria-label="Open the day planner">' +
        CAL +
        '<b class="pl-day"></b>' +
        '<span class="pl-count" hidden></span>' +
        '<span class="pl-word">Plan</span>' +
      '</button>' +
      '<div class="pl-panel" role="region" aria-label="Day planner">' +
        '<div class="pl-head">' +
          '<h2>Plan</h2><span class="pl-sub"></span>' +
          '<button class="pl-fold" type="button" aria-label="Fold the planner away">' + SHUT + '</button>' +
        '</div>' +
        '<div class="pl-days"></div>' +
        '<div class="pl-list" aria-live="polite"></div>' +
        '<form class="pl-add" autocomplete="off">' +
          '<input class="pl-time" type="text" inputmode="numeric" maxlength="5" placeholder="4pm" aria-label="Time, optional"/>' +
          '<input class="pl-text" type="text" maxlength="120" placeholder="What will you do?" aria-label="What will you do?"/>' +
          '<button type="submit" aria-label="Add to the plan">+</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(root);

    root.querySelector('.pl-tab').addEventListener('click', function () { openPanel(true); });
    root.querySelector('.pl-fold').addEventListener('click', function () { openPanel(false); });
    root.querySelector('.pl-add').addEventListener('submit', onAdd);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('open')) openPanel(false);
    });
  }

  function openPanel(on) {
    root.classList.toggle('open', !!on);
    root.querySelector('.pl-tab').setAttribute('aria-expanded', on ? 'true' : 'false');
    try { localStorage.setItem('sos_plan_open', on ? '1' : '0'); } catch (e) {}
    if (on) {
      pullWeek();
      var t = root.querySelector('.pl-text');
      if (t) t.focus();
    }
    place();
  }

  /* ── how much room there is ──────────────────────────────── */
  /* How wide the page's own content column is, found rather than listed.

     A named list of container classes was the first attempt and it was
     wrong within one page: the mission page's columns are not called what
     the home page's are, so it fell through to <main>, which is the full
     width of the window, and concluded there was no room anywhere.

     What every content column on this site actually has in common is a
     max-width in pixels or rems — that is what "a column" means here. So
     the widest element that has one, and whose cap is narrower than the
     window, is the content column, whatever it happens to be called. The
     answer only changes when the window does, so it is worked out once
     per width. */
  var contentCache = { at: 0, w: 0 };
  function contentWidth() {
    if (contentCache.at === window.innerWidth && contentCache.w) return contentCache.w;
    var widest = 0;
    var all = document.querySelectorAll('div, section, main, article, header, footer, form');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (root && root.contains(el)) continue;             // not our own panel
      var cs = getComputedStyle(el);
      var mw = cs.maxWidth;
      if (!mw || mw === 'none' || mw.indexOf('%') !== -1) continue;
      var px = parseFloat(mw);
      if (!px || px >= window.innerWidth) continue;
      var w = el.getBoundingClientRect().width;
      if (w > widest) widest = w;
    }
    contentCache = { at: window.innerWidth, w: widest || Math.min(1100, window.innerWidth) };
    return contentCache.w;
  }

  function place() {
    if (!root) return;
    var gutter = (window.innerWidth - contentWidth()) / 2;
    var open = root.classList.contains('open');
    var need = open ? PANEL_W + GAP : TAB_W + 4;
    /* The tab needs almost nothing; the panel needs a lot. Below the point
       where even the tab would sit on top of the text, it does not appear. */
    var fits = gutter >= TAB_W + 4 && window.innerWidth >= 1024;
    root.classList.toggle('fits', fits && allowedHere());
    /* When the gutter is wide enough the panel sits inside it and covers
       nothing. When it is not, it lies over the edge of the page — which is
       what a drawer is for, and better than hiding the feature on a laptop. */
    root.style.right = (open && gutter >= need) ? Math.round(gutter - PANEL_W - GAP) + 'px' : '0px';
  }

  /* ── which section of the home page is open ──────────────── */
  function allowedHere() {
    if (pageName() !== 'index.html') return true;
    var active = document.querySelector('.panel.active');
    if (!active) return false;
    return NOT_ON_SECTIONS.indexOf(active.id) === -1;
  }

  /* ── painting ────────────────────────────────────────────── */
  function signedIn() { return !!(window.SOS && SOS.user && !SOS.user.isAnonymous); }

  function paint() {
    if (!root) return;
    var items = itemsFor(showing);
    var left = items.filter(function (i) { return !i.done; }).length;

    var tabDay = root.querySelector('.pl-day');
    var tabCount = root.querySelector('.pl-count');
    tabDay.textContent = dayNumOf(TODAY);
    var todayLeft = itemsFor(TODAY).filter(function (i) { return !i.done; }).length;
    tabCount.textContent = todayLeft;
    tabCount.hidden = !todayLeft || !signedIn();

    root.querySelector('.pl-sub').textContent =
      showing === TODAY ? 'Today' : weekdayOf(showing) + ' ' + dayNumOf(showing);

    /* the week strip */
    var strip = root.querySelector('.pl-days');
    strip.innerHTML = [-1,0,1,2,3,4,5].map(function (n) {
      var d = dayShift(TODAY, n);
      var has = itemsFor(d).some(function (i) { return !i.done; });
      return '<button type="button" data-date="' + d + '" aria-current="' + (d === showing) + '" ' +
             'aria-label="' + weekdayOf(d) + ' ' + dayNumOf(d) + '">' +
             '<span>' + weekdayOf(d) + '</span><b>' + dayNumOf(d) + '</b>' +
             '<i ' + (has ? '' : 'hidden') + '></i></button>';
    }).join('');
    [].forEach.call(strip.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () {
        showing = b.getAttribute('data-date');
        pullFromAccount(showing);
        paint();
      });
    });

    var list = root.querySelector('.pl-list');
    var form = root.querySelector('.pl-add');

    if (!signedIn()) {
      /* Visible, and honest about why it is not usable yet. */
      list.innerHTML =
        '<div class="pl-note"><p>Sign in and this becomes your day planner — ' +
        'what you are going to study, and when.</p>' +
        '<a href="' + (pageName() === 'index.html' ? 'pages/' : '') + 'login.html">Sign in</a></div>';
      form.style.display = 'none';
      return;
    }
    form.style.display = '';

    if (!items.length) {
      list.innerHTML = '<p class="pl-empty">Nothing planned for ' +
        (showing === TODAY ? 'today' : 'this day') + ' yet.<br/>Add the first thing below.</p>';
    } else {
      list.innerHTML = items.map(function (it, i) {
        /* Something a teacher put here is marked as theirs and cannot be
           deleted from this side — it can be ticked off, which is the point
           of it. Otherwise a set task could be made to disappear. */
        var set = it.by ? String(it.by) : '';
        return '<div class="pl-item' + (it.done ? ' done' : '') + (set ? ' set' : '') + '">' +
          '<input type="checkbox" ' + (it.done ? 'checked' : '') + ' data-i="' + i + '" ' +
            'aria-label="' + esc(it.text) + '"/>' +
          (it.at ? '<span class="pl-when">' + esc(it.at) + '</span>' : '') +
          '<span class="pl-what">' + esc(it.text) +
            (set ? '<em class="pl-by">Set by ' + esc(set) + '</em>' : '') +
          '</span>' +
          (set ? '' :
            '<button class="pl-drop" type="button" data-i="' + i + '" aria-label="Remove ' +
            esc(it.text) + '">&times;</button>') +
        '</div>';
      }).join('');
      [].forEach.call(list.querySelectorAll('input[type="checkbox"]'), function (c) {
        c.addEventListener('change', function () { toggle(+c.getAttribute('data-i')); });
      });
      [].forEach.call(list.querySelectorAll('.pl-drop'), function (b) {
        b.addEventListener('click', function () { drop(+b.getAttribute('data-i')); });
      });
    }
    place();
  }

  /* ── changing it ─────────────────────────────────────────── */
  /* "4pm", "16:00", "930" and "9.30" all mean something; anything else is
     left out rather than guessed at, and the task still goes in. */
  function tidyTime(raw) {
    var s = String(raw || '').trim().toLowerCase().replace(/\s+/g, '');
    if (!s) return '';
    var m = s.match(/^(\d{1,2})[:.]?(\d{2})?(am|pm)?$/);
    if (!m) return '';
    var h = parseInt(m[1], 10), min = m[2] ? parseInt(m[2], 10) : 0, ap = m[3];
    if (isNaN(h) || h > 24 || min > 59) return '';
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    if (h > 23) h = h % 24;
    return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
  }

  function onAdd(e) {
    e.preventDefault();
    var timeEl = root.querySelector('.pl-time');
    var textEl = root.querySelector('.pl-text');
    var text = textEl.value.trim();
    if (!text) { textEl.focus(); return; }
    var items = itemsFor(showing).slice();
    items.push({ at: tidyTime(timeEl.value), text: text, done: false });
    items = byTime(items);
    stamp(showing); setItems(showing, items);
    timeEl.value = ''; textEl.value = ''; textEl.focus();
    paint();
  }
  function toggle(i) {
    var items = itemsFor(showing).slice();
    if (!items[i]) return;
    items[i].done = !items[i].done;
    stamp(showing); setItems(showing, items);
    paint();
  }
  function drop(i) {
    var items = itemsFor(showing).slice();
    if (!items[i] || items[i].by) return;      // a set task is not the student's to remove
    items.splice(i, 1);
    stamp(showing); setItems(showing, items);
    paint();
  }

  /* ── wiring ──────────────────────────────────────────────── */
  function start() {
    if (document.querySelector('.sos-planner')) return;
    build();
    var wasOpen = false;
    try { wasOpen = localStorage.getItem('sos_plan_open') === '1'; } catch (e) {}
    if (wasOpen) root.classList.add('open');
    paint();
    place();

    var refit = null;
    window.addEventListener('resize', function () {
      contentCache = { at: 0, w: 0 };
      clearTimeout(refit);
      refit = setTimeout(place, 120);
      place();                       // move it now, measure again once it settles
    }, { passive: true });

    /* The home page swaps sections in and out without navigating, so which
       section is open has to be watched rather than read once. */
    if (pageName() === 'index.html') {
      window.addEventListener('hashchange', function () { setTimeout(place, 0); });
      if (window.MutationObserver) {
        var mo = new MutationObserver(function () { place(); });
        [].forEach.call(document.querySelectorAll('.panel'), function (p) {
          mo.observe(p, { attributes: true, attributeFilter: ['class'] });
        });
      }
    }

    /* The account arrives after the page does. */
    if (window.SOS && typeof SOS.onSession === 'function') {
      SOS.onSession(function () { paint(); pullWeek(); });
    }

    window.SOSPlanner = {
      open: function () { openPanel(true); },
      close: function () { openPanel(false); },
      show: function (date) { showing = date; paint(); },
      items: itemsFor,
      today: function () { return TODAY; },
      refit: place
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
