/* ============================================================
   test-tools.js — the tools a student may open during a test.

   One registry, so a subject is given its tools rather than the
   test mode knowing about calculators. Each tool is a real working
   thing: the calculator calculates, the map is the real map, the
   rough work is kept per question and shown again in the review.

   Which tools a subject gets is a teaching decision, not a
   technical one, and it is all in TOOLS_FOR below — a calculator
   in a mental-arithmetic test would defeat the point, so maths
   gets one and reasoning does not.
   ============================================================ */
(function () {

  /* ── Which subject may open what ─────────────────────────────
     Keys are the Lab's own subject keys, plus the exam track's. */
  var TOOLS_FOR = {
    // school subjects
    maths:     ['calc', 'formulae', 'rough'],
    science:   ['elements', 'formulae', 'rough'],
    geography: ['map', 'rough'],
    history:   ['order', 'rough'],
    english:   ['grammar', 'rough'],
    // the stream subjects the Lab gained. Every subject that has a real
    // formula sheet behind it gets the sheet; the chemistry-facing ones get
    // the periodic table. Without these entries they fell through to the
    // ['rough'] default and showed no tools at all.
    physics:               ['calc', 'formulae', 'rough'],
    chemistry:             ['elements', 'formulae', 'calc', 'rough'],
    biology:               ['formulae', 'rough'],
    further_maths:         ['calc', 'formulae', 'rough'],
    statistics:            ['calc', 'formulae', 'rough'],
    environmental_science: ['formulae', 'rough'],
    accountancy:           ['calc', 'formulae', 'rough'],
    business_studies:      ['calc', 'formulae', 'rough'],
    economics:             ['calc', 'formulae', 'rough'],
    computer_science:      ['calc', 'rough'],
    political_science:     ['order', 'rough'],
    sociology:             ['rough'],
    psychology:            ['rough'],
    // entrance and government exams
    aptitude:  ['calc', 'formulae', 'rough'],
    gk:        ['map', 'rough'],
    reasoning: ['order', 'rough'],   // no calculator: the point is the reasoning
  };

  /* What the Lab (or Test Mode, or Exam Prep) currently has open. index.html
     owns that state, so it hands it over rather than the tools reaching into
     it. Falls back to nothing, and every tool copes with nothing. */
  function ctx() {
    try {
      if (typeof window.SOSToolCtx === 'function') return window.SOSToolCtx() || {};
    } catch (e) {}
    return {};
  }

  var META = {
    calc:     { label: 'Calculator', short: 'Calc',     icon: '🧮' },
    formulae: { label: 'Formula sheet', short: 'Sheet', icon: '📐' },
    elements: { label: 'Periodic table', short: 'Table', icon: '⚗️' },
    map:      { label: 'Map of India', short: 'Map',    icon: '🗺️' },
    order:    { label: 'Ordering board', short: 'Order', icon: '🔢' },
    grammar:  { label: 'Grammar reminders', short: 'Grammar', icon: '📖' },
    rough:    { label: 'Rough work', short: 'Rough',    icon: '✏️' }
  };

  /* The tools do not know what a test is, so they do not save anything. They
     announce a change and whoever is using them decides what that is worth. */
  function changed() {
    if (typeof window.SOSToolChanged === 'function') {
      try { window.SOSToolChanged(); } catch (e) {}
    }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  }

  /* ── Markup ─────────────────────────────────────────────────── */
  function head(t, note) {
    return '<div class="tt-head"><b>' + esc(META[t].label) + '</b>' +
           (note ? '<span class="tt-sub">' + esc(note) + '</span>' : '') +
           '<button type="button" class="tt-close" data-close="' + t + '" aria-label="Close ' +
           esc(META[t].label) + '">&times;</button></div>';
  }

  var BUILD = {
    calc: function () {
      var keys = [['C','C',''],['(','(','op'],[')',')','op'],['/','÷','op'],
                  ['7','7',''],['8','8',''],['9','9',''],['*','×','op'],
                  ['4','4',''],['5','5',''],['6','6',''],['-','−','op'],
                  ['1','1',''],['2','2',''],['3','3',''],['+','+','op'],
                  ['0','0','wide'],['.','.',''],['=','=','eq']];
      return head('calc', 'allowed in this test') +
        '<div class="tt-body"><div class="tt-calc-out"><small id="ttCalcSum"></small>' +
        '<div id="ttCalcOut">0</div></div><div class="tt-calc-keys" id="ttCalcKeys">' +
        keys.map(function (k) {
          return '<button type="button" data-k="' + esc(k[0]) + '"' +
                 (k[2] ? ' class="' + k[2] + '"' : '') + '>' + k[1] + '</button>';
        }).join('') + '</div></div>';
    },

    /* The sheet a student actually needs: the formulas for the subject and
       grade they are working at, not one generic list for everybody. Falls
       back to the old general list when there is no sheet for that pairing
       (a language, say) so the tool is never empty. */
    formulae: function () {
      var c = ctx();
      var sheets = window.LAB_FORMULAS || {};
      var subject = c.subject, grade = c.grade;
      var forSubject = sheets[subject];
      var topics = forSubject && grade ? forSubject['grade_' + grade] : null;

      if (!topics) {
        var rows = [['Area of a circle','πr²'], ['Circumference','2πr'],
                    ['Pythagoras','a² + b² = c²'], ['Speed','distance ÷ time'],
                    ['Simple interest','(P × R × T) ÷ 100'],
                    ['Volume of a cuboid','l × b × h'],
                    ['Average','sum ÷ how many'], ['Percentage','(part ÷ whole) × 100']];
        return head('formulae', 'general') +
          '<div class="tt-body"><ul class="tt-fs">' + rows.map(function (r) {
            return '<li><b>' + r[0] + '</b><span>' + r[1] + '</span></li>';
          }).join('') + '</ul></div>';
      }

      var label = (window.LAB_SUBJ_LABEL && window.LAB_SUBJ_LABEL[subject]) || subject;
      return head('formulae', label + ' · Grade ' + grade) +
        '<div class="tt-body"><div class="tt-sheet">' + topics.map(function (t) {
          return '<div class="tt-sheet-topic"><h5>' + esc(t.topic) + '</h5>' +
            t.items.map(function (it) {
              return '<div class="tt-sheet-row"><b>' + esc(it.name) + '</b>' +
                '<code>' + esc(it.formula) + '</code>' +
                '<span>' + esc(it.note) + '</span></div>';
            }).join('') + '</div>';
        }).join('') + '</div></div>';
    },

    elements: function () {
      return head('elements', 'all 118 elements — tap one') +
        '<div class="tt-body"><div class="tt-pt" id="ttPT"></div>' +
        '<div class="tt-el-detail" id="ttElDetail" hidden></div></div>';
    },

    map: function () {
      return head('map', 'states & union territories') +
        '<div class="tt-body"><div class="tt-map" id="ttMap">' +
        '<p class="tt-note">Loading the map…</p></div>' +
        '<p class="tt-mapname" id="ttMapName"><span>Point at a state to name it.</span></p>' +
        '<p class="tt-credit">Outlines: @svg-maps/india, CC BY 4.0</p></div>';
    },

    order: function () {
      return head('order', 'put things in order') +
        '<div class="tt-body"><div class="tt-order-add">' +
        '<input type="text" id="ttOrderIn" placeholder="Add an event, then order them" maxlength="60"/>' +
        '<button type="button" id="ttOrderAdd">Add</button></div>' +
        '<ol class="tt-order" id="ttOrderList"></ol>' +
        '<p class="tt-note">Nothing here is checked or marked — it is somewhere to think.</p></div>';
    },

    grammar: function () {
      var rows = [['Noun','a person, place or thing — <i>teacher, Kochi, courage</i>'],
                  ['Verb','what is being done — <i>runs, thought, will write</i>'],
                  ['Adjective','describes a noun — <i>quiet room</i>'],
                  ['Adverb','describes a verb — <i>reads quietly</i>'],
                  ['Its / it’s','<i>its</i> = belonging to it. <i>it’s</i> = it is.'],
                  ['Their / there / they’re','belonging to them / a place / they are'],
                  ['Semicolon','joins two complete sentences that belong together'],
                  ['Comma before "and"','only when joining two complete sentences']];
      return head('grammar', 'reference, not answers') +
        '<div class="tt-body"><ul class="tt-gr">' + rows.map(function (r) {
          return '<li><b>' + r[0] + '</b><span>' + r[1] + '</span></li>';
        }).join('') + '</ul></div>';
    },

    rough: function () {
      return head('rough', 'kept with this question') +
        '<div class="tt-body"><canvas class="tt-pad" id="ttPad" height="190"></canvas>' +
        '<div class="tt-pad-bar"><button type="button" data-pad="undo">Undo</button>' +
        '<button type="button" data-pad="clear">Clear</button>' +
        '<span class="tt-note">You will see this again in your review.</span></div></div>';
    }
  };

  /* ── Wiring ─────────────────────────────────────────────────── */
  function wireCalc() {
    var out = document.getElementById('ttCalcOut'), sum = document.getElementById('ttCalcSum');
    var keys = document.getElementById('ttCalcKeys');
    if (!out || !keys) return;
    var expr = '';
    function show() { out.textContent = expr || '0'; }
    keys.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      var k = b.getAttribute('data-k');
      if (k === 'C') { expr = ''; sum.textContent = ''; return show(); }
      if (k === '=') {
        // Only digits and operators are ever evaluated — nothing is typed here.
        if (!/^[0-9+\-*/(). ]+$/.test(expr)) return;
        var val; try { val = Function('"use strict";return (' + expr + ')')(); }
        catch (e) { val = '—'; }
        if (typeof val === 'number' && !isFinite(val)) val = '—';
        sum.textContent = expr;
        expr = String(typeof val === 'number' ? Math.round(val * 1e10) / 1e10 : val);
        return show();
      }
      expr += k; show();
    });
    show();
  }

  var ELEMENTS = [['H',1,1,1],['He',2,18,1],['Li',3,1,2],['Be',4,2,2],['B',5,13,2],['C',6,14,2],
    ['N',7,15,2],['O',8,16,2],['F',9,17,2],['Ne',10,18,2],['Na',11,1,3],['Mg',12,2,3],['Al',13,13,3],
    ['Si',14,14,3],['P',15,15,3],['S',16,16,3],['Cl',17,17,3],['Ar',18,18,3],['K',19,1,4],['Ca',20,2,4],
    ['Sc',21,3,4],['Ti',22,4,4],['V',23,5,4],['Cr',24,6,4],['Mn',25,7,4],['Fe',26,8,4],['Co',27,9,4],
    ['Ni',28,10,4],['Cu',29,11,4],['Zn',30,12,4],['Ga',31,13,4],['Ge',32,14,4],['As',33,15,4],
    ['Se',34,16,4],['Br',35,17,4],['Kr',36,18,4]];
  /* Category -> class, so the table is coloured the way a printed one is. */
  var PT_SLUG = {
    'Alkali Metal':'alkali','Alkaline Earth Metal':'alkaline','Transition Metal':'transition',
    'Lanthanide':'lanth','Actinide':'actin','Metal':'metal','Metalloid':'metalloid',
    'Nonmetal':'nonmetal','Halogen':'halogen','Noble Gas':'noble'
  };

  function ptCell(e) {
    return '<button type="button" class="tt-el pt-' + (PT_SLUG[e.cat] || 'metal') + '"' +
      ' data-z="' + e.z + '" title="' + esc(e.name) + ' · ' + e.mass + '">' +
      '<b>' + e.sym + '</b><span>' + e.z + '</span></button>';
  }

  function wireElements() {
    var host = document.getElementById('ttPT'); if (!host) return;
    var all = window.PT_ELEMENTS;

    /* The old 36-element fallback, kept only for the case where the full
       table has not loaded — the tool should degrade, not disappear. */
    if (!all || !all.length) {
      var at = {};
      ELEMENTS.forEach(function (e) { at[e[3] + '-' + e[2]] = e; });
      var html = '';
      for (var r = 1; r <= 4; r++) for (var c = 1; c <= 18; c++) {
        var e = at[r + '-' + c];
        html += e ? '<i class="tt-el g' + e[3] + '" title="' + e[0] + ' · ' + e[1] + '"><b>' +
                    e[0] + '</b><span>' + e[1] + '</span></i>' : '<i></i>';
      }
      host.innerHTML = html;
      return;
    }

    var main  = all.filter(function (e) { return e.p !== 'lanth' && e.p !== 'actin'; });
    var lanth = all.filter(function (e) { return e.p === 'lanth'; }).sort(function(a,b){return a.g-b.g;});
    var actin = all.filter(function (e) { return e.p === 'actin'; }).sort(function(a,b){return a.g-b.g;});

    var at = {};
    main.forEach(function (e) { at[e.p + '-' + e.g] = e; });
    var out = '';
    for (var row = 1; row <= 7; row++) {
      for (var col = 1; col <= 18; col++) {
        var e = at[row + '-' + col];
        if (e) { out += ptCell(e); }
        else if (col === 3 && row === 6) { out += '<i class="tt-el tt-el-ph">57-71</i>'; }
        else if (col === 3 && row === 7) { out += '<i class="tt-el tt-el-ph">89-103</i>'; }
        else { out += '<i></i>'; }
      }
    }
    /* The f-block sits under the table, the way every printed one does. */
    out += '<i class="tt-el-gap"></i>';
    out += '<i class="tt-el-sp"></i><i class="tt-el-sp"></i>';
    lanth.forEach(function (e) { out += ptCell(e); });
    out += '<i></i>';
    out += '<i class="tt-el-sp"></i><i class="tt-el-sp"></i>';
    actin.forEach(function (e) { out += ptCell(e); });
    out += '<i></i>';
    host.innerHTML = out;

    var detail = document.getElementById('ttElDetail');
    host.addEventListener('click', function (ev) {
      var btn = ev.target.closest ? ev.target.closest('.tt-el[data-z]') : null;
      if (!btn || !detail) return;
      var z = parseInt(btn.getAttribute('data-z'), 10);
      var el = all.filter(function (x) { return x.z === z; })[0];
      if (!el) return;
      var prev = host.querySelector('.tt-el.on');
      if (prev) prev.classList.remove('on');
      btn.classList.add('on');
      detail.hidden = false;
      detail.innerHTML =
        '<b>' + esc(el.name) + '</b> <span class="tt-el-cat">' + esc(el.cat) + '</span>' +
        '<div class="tt-el-stats">' +
          '<span><i>Number</i>' + el.z + '</span>' +
          '<span><i>Mass</i>' + el.mass + '</span>' +
          '<span><i>Config</i>' + esc(el.econf) + '</span>' +
        '</div>' +
        '<p>' + esc(el.fact) + '</p>';
    });
  }

  /* The map's outlines are 170KB, so they are fetched the first time somebody
     opens the map and never on a page that does not. */
  var mapLoading = null;
  function loadMap() {
    if (window.INDIA_MAP) return Promise.resolve(true);
    if (mapLoading) return mapLoading;
    mapLoading = new Promise(function (done) {
      var s = document.createElement('script');
      s.src = (location.pathname.indexOf('/pages/') !== -1 ? '../' : '') + 'js/tools/india-map.js';
      s.onload = function () { done(!!window.INDIA_MAP); };
      s.onerror = function () { done(false); };
      document.head.appendChild(s);
    });
    return mapLoading;
  }
  function wireMap() {
    var host = document.getElementById('ttMap'), name = document.getElementById('ttMapName');
    if (!host) return;
    loadMap().then(function (okay) {
      if (!host.isConnected) return;
      if (!okay) { host.innerHTML = '<p class="tt-note">The map could not be loaded. Check your connection and open it again.</p>'; return; }
      var svg = '<svg viewBox="' + INDIA_MAP.viewBox + '" role="img" aria-label="Map of India">';
      INDIA_MAP.locations.forEach(function (l) {
        svg += '<path id="tt-' + l.id + '" d="' + l.path + '"><title>' + esc(l.name) + '</title></path>';
      });
      host.innerHTML = svg + '</svg>';
      host.addEventListener('mouseover', function (e) {
        if (e.target.tagName !== 'path') return;
        var l = INDIA_MAP.locations.filter(function (x) { return 'tt-' + x.id === e.target.id; })[0];
        if (l && name) name.textContent = l.name;
      });
      host.addEventListener('click', function (e) {
        if (e.target.tagName !== 'path') return;
        [].forEach.call(host.querySelectorAll('path.on'), function (x) { x.classList.remove('on'); });
        e.target.classList.add('on');
      });
    });
  }

  /* The ordering board is per question, like the rough work. */
  function wireOrder(state) {
    var list = document.getElementById('ttOrderList'), input = document.getElementById('ttOrderIn'),
        add = document.getElementById('ttOrderAdd');
    if (!list) return;
    function draw() {
      list.innerHTML = state.items.map(function (t, i) {
        return '<li><span>' + esc(t) + '</span>' +
          '<button type="button" data-mv="' + i + '" data-dir="-1" aria-label="Move up"' +
          (i === 0 ? ' disabled' : '') + '>&uarr;</button>' +
          '<button type="button" data-mv="' + i + '" data-dir="1" aria-label="Move down"' +
          (i === state.items.length - 1 ? ' disabled' : '') + '>&darr;</button>' +
          '<button type="button" data-rm="' + i + '" aria-label="Remove">&times;</button></li>';
      }).join('');
    }
    function push() {
      var v = (input.value || '').trim();
      if (!v) return;
      state.items.push(v); input.value = ''; draw(); changed();
    }
    add.addEventListener('click', push);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); push(); } });
    list.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-rm')) { state.items.splice(+b.getAttribute('data-rm'), 1); draw(); return changed(); }
      var i = +b.getAttribute('data-mv'), d = +b.getAttribute('data-dir'), j = i + d;
      if (j < 0 || j >= state.items.length) return;
      var t = state.items[i]; state.items[i] = state.items[j]; state.items[j] = t; draw(); changed();
    });
    draw();
  }

  /* Rough work belongs to the question it was done on, so it is handed the
     store for that question and hands it back when the strokes change. */
  function wireRough(store) {
    var cv = document.getElementById('ttPad'); if (!cv) return;
    var ctx = cv.getContext('2d');
    function fit() {
      var w = cv.parentElement.clientWidth;
      if (w && cv.width !== w) { cv.width = w; redraw(); }
    }
    ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#3E2B1E';
    function redraw() {
      ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#3E2B1E';
      ctx.clearRect(0, 0, cv.width, cv.height);
      store.strokes.forEach(function (s) {
        ctx.beginPath();
        s.forEach(function (p, i) { i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
        ctx.stroke();
      });
    }
    fit(); window.addEventListener('resize', fit);
    var drawing = false, cur = null;
    function at(ev) { var r = cv.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; }
    cv.addEventListener('pointerdown', function (e) {
      drawing = true; cur = [at(e)]; store.strokes.push(cur);
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
    });
    cv.addEventListener('pointermove', function (e) { if (drawing) { cur.push(at(e)); redraw(); } });
    cv.addEventListener('pointerup', function () { if (drawing) { drawing = false; changed(); } });
    cv.addEventListener('pointerleave', function () { if (drawing) { drawing = false; changed(); } });
    var bar = cv.parentElement.querySelector('.tt-pad-bar');
    if (bar) bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.getAttribute('data-pad') === 'undo') store.strokes.pop(); else store.strokes.length = 0;
      redraw(); changed();
    });
    redraw();
  }

  var WIRE = { calc: wireCalc, elements: wireElements, map: wireMap,
               order: wireOrder, rough: wireRough, formulae: function(){}, grammar: function(){} };

  window.SOSTestTools = {
    meta: META,
    forSubject: function (subject) { return (TOOLS_FOR[subject] || ['rough']).slice(); },
    html: function (t) { return BUILD[t] ? BUILD[t]() : ''; },
    wire: function (t, store) { if (WIRE[t]) WIRE[t](store); },
    /* Somewhere to keep what a student does with a tool, one per question. */
    newStore: function () { return { strokes: [], items: [] }; },
    isEmpty: function (store) { return !store || (!store.strokes.length && !store.items.length); }
  };
})();
