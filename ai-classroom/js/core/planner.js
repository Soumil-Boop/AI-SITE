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
  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  function weekdayOf(date) { return DOW[new Date(date + 'T12:00:00').getDay()]; }
  function dayNumOf(date)  { return new Date(date + 'T12:00:00').getDate(); }
  function monthOf(date)   { return new Date(date + 'T12:00:00').getMonth(); }
  function yearOf(date)    { return new Date(date + 'T12:00:00').getFullYear(); }

  /* Weeks run Monday to Sunday, so that the week view and the month grid
     agree with each other and with everybody else's idea of a week. */
  function weekStart(date) {
    var d = new Date(date + 'T12:00:00');
    var back = (d.getDay() + 6) % 7;              // Mon 0 … Sun 6
    d.setDate(d.getDate() - back);
    return iso(d);
  }
  function weekDays(date) {
    var s = weekStart(date), out = [];
    for (var i = 0; i < 7; i++) out.push(dayShift(s, i));
    return out;
  }
  /* Every cell of the month grid: whole weeks, so the first row starts on a
     Monday and the trailing days of the neighbouring months are shown greyed
     rather than left as holes. Five or six rows, whichever the month needs. */
  function monthGrid(date) {
    var d = new Date(date + 'T12:00:00');
    var first = iso(new Date(d.getFullYear(), d.getMonth(), 1, 12));
    var last  = iso(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12));
    var start = weekStart(first), out = [];
    for (var i = 0; i < 42; i++) {
      var day = dayShift(start, i);
      out.push(day);
      if (i % 7 === 6 && day >= last) break;
    }
    return out;
  }
  function monthShift(date, n) {
    var d = new Date(date + 'T12:00:00');
    var want = d.getMonth() + n;
    var probe = new Date(d.getFullYear(), want, 1, 12);
    // Keep the day of the month where it exists, and clamp where it does not
    // — stepping back a month from the 31st must not skip one.
    var lastDay = new Date(probe.getFullYear(), probe.getMonth() + 1, 0).getDate();
    return iso(new Date(probe.getFullYear(), probe.getMonth(),
                        Math.min(d.getDate(), lastDay), 12));
  }

  var TODAY = iso(new Date());
  var showing = TODAY;

  /* ── which of the three views is open ────────────────────── */
  /* 'day' is what the planner has always been. 'week' reads the seven days
     as one agenda, and 'month' is a grid you tap into. The choice is
     remembered, because someone who thinks in months on Monday still thinks
     in months on Tuesday. */
  var VIEWS = ['day', 'week', 'month'];
  var view = 'day';
  try {
    var savedView = localStorage.getItem('sos_plan_view');
    if (VIEWS.indexOf(savedView) !== -1) view = savedView;
  } catch (e) {}
  function setView(next) {
    if (VIEWS.indexOf(next) === -1 || next === view) return;
    view = next;
    try { localStorage.setItem('sos_plan_view', view); } catch (e) {}
    pullVisible();
    paint();
  }

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

  /* Whatever the open view is showing, fetched.

     The month grid is up to forty-two days, and forty-two document reads to
     draw six rows of dots is not a reasonable thing to do every time
     somebody pages through the year. The days of one plan sit in one
     collection with the date as the document ID, so a single ordered range
     query over the IDs fetches the lot. If that query is refused — an older
     SDK, a rules file that has not been published — it falls back to reading
     the days one at a time, which is slower and always works. */
  function pullRange(from, to) {
    if (!docFor(from)) return;                 // signed out: nothing to fetch
    var ref = rangeRef();
    /* No FieldPath means an SDK that cannot do the range query. Reading the
       days one at a time is slower and gets the same answer, which is much
       better than the silent nothing this used to do. */
    if (!ref) { pullEachDay(from, to); return; }
    var q;
    try {
      q = ref.orderBy(firebase.firestore.FieldPath.documentId()).startAt(from).endAt(to).get();
    } catch (e) { q = null; }
    if (!q) { pullEachDay(from, to); return; }
    q.then(function (snap) {
      var seen = {};
      snap.forEach(function (doc) { seen[doc.id] = doc.data() || {}; });
      var all = readLocal(), changed = false;
      eachDay(from, to, function (date) {
        var remote = seen[date];
        var mine = Array.isArray(all[date]) ? all[date] : [];
        var next;
        if (!remote || !Array.isArray(remote.items)) {
          /* A day the account has never heard of. Anything held here that
             was set by somebody else has been withdrawn; anything the
             student wrote is theirs and stays. */
          next = mine.filter(function (i) { return i && !i.by; });
        } else {
          var localStamp = (all.__at && all.__at[date]) || 0;
          next = (remote.updatedAt || 0) >= localStamp ? remote.items
                                                       : reconcile(mine, remote.items);
        }
        if (JSON.stringify(next) !== JSON.stringify(mine)) {
          if (next.length) all[date] = next; else delete all[date];
          changed = true;
        }
      });
      if (changed) { writeLocal(all); paint(); }
    }).catch(function (e) {
      if (e && /permission|insufficient/i.test(e.message || '')) { denied = true; return; }
      pullEachDay(from, to);
    });
  }
  function pullEachDay(from, to) {
    eachDay(from, to, function (date) { pullFromAccount(date); });
  }
  function eachDay(from, to, fn) {
    for (var d = from, guard = 0; d <= to && guard < 60; d = dayShift(d, 1), guard++) fn(d);
  }
  function rangeRef() {
    if (!window.SOS || !SOS.db || !SOS.user || SOS.user.isAnonymous) return null;
    if (!window.firebase || !firebase.firestore || !firebase.firestore.FieldPath) return null;
    return SOS.db.collection('planner').doc(SOS.user.uid).collection('days');
  }

  function pullVisible() {
    if (!docFor(TODAY)) return;
    if (view === 'month') {
      var g = monthGrid(showing);
      pullRange(g[0], g[g.length - 1]);
    } else if (view === 'week') {
      var w = weekDays(showing);
      pullRange(w[0], w[6]);
    } else {
      pullWeek();
      pullFromAccount(showing);
    }
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
  var PREV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
             'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';
  var NEXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
             'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

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
        '<div class="pl-views" role="tablist" aria-label="How much to show">' +
          VIEWS.map(function (v) {
            return '<button type="button" role="tab" data-view="' + v + '" ' +
                   'aria-selected="false">' + v.charAt(0).toUpperCase() + v.slice(1) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="pl-nav">' +
          '<button class="pl-step" type="button" data-step="-1" aria-label="Back">' + PREV + '</button>' +
          '<b class="pl-range"></b>' +
          '<button class="pl-today" type="button">Today</button>' +
          '<button class="pl-step" type="button" data-step="1" aria-label="Forward">' + NEXT + '</button>' +
        '</div>' +
        '<div class="pl-days"></div>' +
        '<div class="pl-grid" hidden></div>' +
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

    [].forEach.call(root.querySelectorAll('.pl-views button'), function (b) {
      b.addEventListener('click', function () { setView(b.getAttribute('data-view')); });
    });
    [].forEach.call(root.querySelectorAll('.pl-step'), function (b) {
      b.addEventListener('click', function () { step(+b.getAttribute('data-step')); });
    });
    root.querySelector('.pl-today').addEventListener('click', function () {
      showing = TODAY; pullVisible(); paint();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('open')) openPanel(false);
    });
  }

  function openPanel(on) {
    root.classList.toggle('open', !!on);
    root.querySelector('.pl-tab').setAttribute('aria-expanded', on ? 'true' : 'false');
    try { localStorage.setItem('sos_plan_open', on ? '1' : '0'); } catch (e) {}
    if (on) {
      pullVisible();
      var t = root.querySelector('.pl-text');
      if (t) t.focus();
    }
    place();
  }

  /* One press of ‹ or › means a different amount in each view: a day, a
     week, a month. */
  function step(n) {
    if (view === 'month')      showing = monthShift(showing, n);
    else if (view === 'week')  showing = dayShift(showing, 7 * n);
    else                       showing = dayShift(showing, n);
    pullVisible();
    paint();
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

  /* One task's row. Written once because the day list and the week agenda
     draw the same thing, and two copies of it would drift apart the first
     time either was touched. `date` travels with the row, so a tick in the
     week agenda knows which day it belongs to. */
  function itemRow(it, i, date) {
    /* Something a teacher put here is marked as theirs and cannot be
       deleted from this side — it can be ticked off, which is the point
       of it. Otherwise a set task could be made to disappear. */
    var set = it.by ? String(it.by) : '';
    return '<div class="pl-item' + (it.done ? ' done' : '') + (set ? ' set' : '') + '">' +
      '<input type="checkbox" ' + (it.done ? 'checked' : '') + ' data-i="' + i + '" ' +
        'data-date="' + date + '" aria-label="' + esc(it.text) + '"/>' +
      (it.at ? '<span class="pl-when">' + esc(it.at) + '</span>' : '') +
      '<span class="pl-what">' + esc(it.text) +
        (set ? '<em class="pl-by">Set by ' + esc(set) + '</em>' : '') +
      '</span>' +
      (set ? '' :
        '<button class="pl-drop" type="button" data-i="' + i + '" data-date="' + date + '" ' +
        'aria-label="Remove ' + esc(it.text) + '">&times;</button>') +
    '</div>';
  }
  function wireRows(list) {
    [].forEach.call(list.querySelectorAll('input[type="checkbox"]'), function (c) {
      c.addEventListener('change', function () {
        toggle(+c.getAttribute('data-i'), c.getAttribute('data-date'));
      });
    });
    [].forEach.call(list.querySelectorAll('.pl-drop'), function (b) {
      b.addEventListener('click', function () {
        drop(+b.getAttribute('data-i'), b.getAttribute('data-date'));
      });
    });
  }

  function shortDay(date) {
    return weekdayOf(date) + ' ' + dayNumOf(date) +
           (monthOf(date) === monthOf(TODAY) && yearOf(date) === yearOf(TODAY)
              ? '' : ' ' + MONTHS[monthOf(date)].slice(0, 3));
  }

  /* What the ‹ › row says it is showing. */
  function rangeLabel() {
    if (view === 'month') return MONTHS[monthOf(showing)] + ' ' + yearOf(showing);
    if (view === 'week') {
      var w = weekDays(showing), a = w[0], b = w[6];
      var am = MONTHS[monthOf(a)].slice(0, 3), bm = MONTHS[monthOf(b)].slice(0, 3);
      return dayNumOf(a) + (am === bm ? '' : ' ' + am) + ' – ' + dayNumOf(b) + ' ' + bm;
    }
    return showing === TODAY ? 'Today' : shortDay(showing);
  }

  function paint() {
    if (!root) return;

    var tabDay = root.querySelector('.pl-day');
    var tabCount = root.querySelector('.pl-count');
    tabDay.textContent = dayNumOf(TODAY);
    var todayLeft = itemsFor(TODAY).filter(function (i) { return !i.done; }).length;
    tabCount.textContent = todayLeft;
    tabCount.hidden = !todayLeft || !signedIn();

    /* In the day view the row below already says which day this is, and
       saying it twice reads as a mistake. In the other two the row says
       "August 2026" and this is the only place the chosen day appears. */
    root.querySelector('.pl-sub').textContent =
      view === 'day' ? '' : (showing === TODAY ? 'Today' : shortDay(showing));

    [].forEach.call(root.querySelectorAll('.pl-views button'), function (b) {
      b.setAttribute('aria-selected', b.getAttribute('data-view') === view ? 'true' : 'false');
    });
    root.querySelector('.pl-range').textContent = rangeLabel();
    /* Hidden rather than disabled when it would do nothing — there is
       nowhere for "today" to take you when you are already on it. */
    root.querySelector('.pl-today').hidden = onToday();

    var strip = root.querySelector('.pl-days');
    var grid  = root.querySelector('.pl-grid');
    var list  = root.querySelector('.pl-list');
    var form  = root.querySelector('.pl-add');

    if (!signedIn()) {
      strip.innerHTML = ''; strip.hidden = true;
      grid.innerHTML = '';  grid.hidden = true;
      /* Visible, and honest about why it is not usable yet. */
      list.innerHTML =
        '<div class="pl-note"><p>Sign in and this becomes your day planner — ' +
        'what you are going to study, and when.</p>' +
        '<a href="' + (pageName() === 'index.html' ? 'pages/' : '') + 'login.html">Sign in</a></div>';
      form.style.display = 'none';
      place();
      return;
    }
    form.style.display = '';

    strip.hidden = (view === 'month');
    grid.hidden  = (view !== 'month');
    if (!strip.hidden) paintStrip(strip);
    if (!grid.hidden)  paintGrid(grid);

    if (view === 'week') paintAgenda(list);
    else                 paintDay(list);

    /* The box says which day it is about to write to, because in the week
       and month views the answer is no longer obviously "today". */
    var text = root.querySelector('.pl-text');
    if (text) {
      var where = showing === TODAY ? '' : ' on ' + shortDay(showing);
      text.placeholder = 'What will you do' + where + '?';
      text.setAttribute('aria-label', text.placeholder);
    }
    place();
  }

  function onToday() {
    if (view === 'month') return monthOf(showing) === monthOf(TODAY) && yearOf(showing) === yearOf(TODAY);
    if (view === 'week')  return weekStart(showing) === weekStart(TODAY);
    return showing === TODAY;
  }

  /* The seven days of the week `showing` falls in — a real Monday-to-Sunday
     week now, rather than a rolling six days from today, so that it lines up
     with the month grid underneath it. */
  function paintStrip(strip) {
    strip.innerHTML = weekDays(showing).map(function (d) {
      var has = itemsFor(d).some(function (i) { return !i.done; });
      return '<button type="button" data-date="' + d + '" aria-current="' + (d === showing) + '" ' +
             'class="' + (d === TODAY ? 'now' : '') + '" ' +
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
  }

  /* The month, as whole weeks. Days from the months either side are shown
     rather than left blank, greyed, so the grid is always a rectangle and
     the first row always starts on a Monday. */
  function paintGrid(grid) {
    var cells = monthGrid(showing);
    var mth = monthOf(showing);
    grid.innerHTML =
      '<div class="pl-dow">' +
        ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
          .map(function (d) { return '<span>' + d.charAt(0) + '</span>'; }).join('') +
      '</div>' +
      '<div class="pl-cells">' +
        cells.map(function (d) {
          var items = itemsFor(d);
          var left  = items.filter(function (i) { return !i.done; }).length;
          var cls = [];
          if (monthOf(d) !== mth) cls.push('out');
          if (d === TODAY)        cls.push('now');
          if (d === showing)      cls.push('on');
          if (left)               cls.push('has');
          else if (items.length)  cls.push('clear');
          return '<button type="button" data-date="' + d + '" class="' + cls.join(' ') + '" ' +
                 'aria-label="' + weekdayOf(d) + ' ' + dayNumOf(d) + ' ' + MONTHS[monthOf(d)] +
                 (left ? ', ' + left + ' to do' : '') + '">' +
                 dayNumOf(d) + '<i></i></button>';
        }).join('') +
      '</div>';
    [].forEach.call(grid.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () {
        showing = b.getAttribute('data-date');
        pullFromAccount(showing);
        paint();                       // stay in the month; the list below follows
      });
    });
  }

  function paintDay(list) {
    var items = itemsFor(showing);
    if (!items.length) {
      list.innerHTML = '<p class="pl-empty">Nothing planned for ' +
        (showing === TODAY ? 'today' : 'this day') + ' yet.<br/>Add the first thing below.</p>';
      return;
    }
    list.innerHTML = items.map(function (it, i) { return itemRow(it, i, showing); }).join('');
    wireRows(list);
  }

  /* The whole week in one scroll. Empty days are still named — a week with
     three blanks in it is a fact about the week, and hiding them makes it
     look busier than it is. */
  function paintAgenda(list) {
    var days = weekDays(showing);
    var total = 0;
    var html = days.map(function (d) {
      var items = itemsFor(d);
      total += items.length;
      return '<div class="pl-dayblock' + (d === TODAY ? ' now' : '') +
               (d === showing ? ' on' : '') + '">' +
        '<button class="pl-dayhead" type="button" data-date="' + d + '">' +
          '<b>' + weekdayOf(d) + ' ' + dayNumOf(d) + '</b>' +
          (d === TODAY ? '<em>Today</em>' : '') +
        '</button>' +
        (items.length
          ? items.map(function (it, i) { return itemRow(it, i, d); }).join('')
          : '<p class="pl-none">Nothing planned</p>') +
      '</div>';
    }).join('');
    list.innerHTML = total ? html
      : '<p class="pl-empty">Nothing planned this week yet.<br/>Add the first thing below.</p>';
    if (!total) return;
    wireRows(list);
    [].forEach.call(list.querySelectorAll('.pl-dayhead'), function (b) {
      b.addEventListener('click', function () {
        showing = b.getAttribute('data-date');
        paint();
      });
    });
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
  /* Both take the day the row came from rather than assuming the selected
     one — in the week agenda a tick can belong to any of seven days, and
     defaulting to `showing` would tick the wrong one. */
  function toggle(i, date) {
    date = date || showing;
    var items = itemsFor(date).slice();
    if (!items[i]) return;
    items[i].done = !items[i].done;
    stamp(date); setItems(date, items);
    paint();
  }
  function drop(i, date) {
    date = date || showing;
    var items = itemsFor(date).slice();
    if (!items[i] || items[i].by) return;      // a set task is not the student's to remove
    items.splice(i, 1);
    stamp(date); setItems(date, items);
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
      SOS.onSession(function () { paint(); pullVisible(); });
    }

    window.SOSPlanner = {
      open: function () { openPanel(true); },
      close: function () { openPanel(false); },
      show: function (date) { showing = date; paint(); },
      view: function (v) { if (v) setView(v); return view; },
      items: itemsFor,
      today: function () { return TODAY; },
      refit: place
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
