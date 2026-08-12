/* Eulid, checked against what was actually asked for.

   Six requirements, each one turned into something the browser can be
   asked rather than something I can claim:

     he is on every page
     holding and dragging him moves him
     on the home page his default place is the one he already has
     on other pages his default place is a clear spot
     leaving and coming back puts him home again
     it is the same Eulid everywhere

   The last one is the one worth checking hardest, because "same design"
   is exactly the kind of claim that is true on the day it is written.
   It is checked two ways: the rendered SVG must be byte-identical
   between pages, and there must never be more than one of him in a
   document — he is built from three gradients addressed by id, and a
   second copy would make every fill in it resolve to the first.

   And the promise from two turns ago still has to hold: his five
   ambient loops are not to be touched.
*/
const { chromium } = require('playwright');
const HOME = 'http://localhost:8844/eulid-preview.html';
const OTHER = 'http://localhost:8844/pages/mission-eulid.html';

let bad = 0;
const ok = (c, label, detail) => {
  console.log(`  ${c ? '✓' : '✗'} ${label}${detail !== undefined ? '   ' + detail : ''}`);
  if (!c) bad++;
};

/* The loops he actually has. The first version of this list also
   expected `blink` and `antennaPulse`, and the check failed — not
   because anything was broken but because those two rules are dead CSS
   in index.html: no element inside Eulid carries .eye-group or
   .antenna-dot. They belong to a mascot that is not this one. Asserting
   against a list I wrote from the stylesheet rather than from him was
   the mistake. */
const LOOPS = ['mascotFloat', 'euWiggle', 'euBlink', 'euPulse'];


/* Pick him up by the head and set him down at a point. Grabbed 30px above
   his centre so the press lands on his body and not on a leg — a press on
   a leg is a tool, which is the whole reason the two are told apart. */
async function dragTo(p, tx, ty) {
  const from = await p.evaluate(() => {
    const r = document.querySelector('.mascot-svg').getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  await p.mouse.move(from.x, from.y - 30);
  await p.mouse.down();
  for (let k = 1; k <= 10; k++)
    await p.mouse.move(from.x + (tx - from.x) * k / 10,
                       (from.y - 30) + (ty - 30 - (from.y - 30)) * k / 10);
  await p.mouse.up();
  await p.waitForTimeout(600);
}

const shot = async (p, sel) => p.evaluate(s => {
  const n = document.querySelector(s);
  return n ? n.outerHTML : null;
}, sel);

(async () => {
  const br = await chromium.launch();

  /* ── he is there at all, on both kinds of page ─────────────── */
  console.log('\n══ he is on every page ══');
  const svgs = {};
  for (const [name, url] of [['home', HOME], ['mission', OTHER]]) {
    const p = await br.newPage({ viewport: { width: 1440, height: 900 } });
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1200);

    const state = await p.evaluate(() => {
      const wraps = document.querySelectorAll('.mascot-wrap');
      const svg = document.querySelector('.mascot-svg');
      const r = svg ? svg.getBoundingClientRect() : null;
      const dock = document.getElementById('eulidDock');
      return {
        count: wraps.length,
        visible: !!(r && r.width > 10 && r.height > 10),
        inDock: !!(wraps[0] && dock && dock.contains(wraps[0])),
        dockShown: !!(dock && getComputedStyle(dock).display !== 'none'),
        box: r ? { x: Math.round(r.x), y: Math.round(r.y),
                   w: Math.round(r.width), h: Math.round(r.height) } : null,
        vw: innerWidth, vh: innerHeight,
        ids: [...document.querySelectorAll('[id]')].map(n => n.id)
             .filter(i => /^eu(Body|Eye|Dome)$/.test(i)),
      };
    });
    ok(state.count === 1, `${name}: exactly one Eulid in the document`, state.count + ' found');
    ok(state.visible, `${name}: he is on screen`, state.box ? `${state.box.w}×${state.box.h}` : 'no box');
    ok(state.ids.length === 3, `${name}: one set of gradient ids, not two`,
       state.ids.join(', '));
    ok(errs.length === 0, `${name}: no page errors`, errs.slice(0, 2).join(' | '));
    svgs[name] = await shot(p, '.mascot-svg');

    /* ── the default place ───────────────────────────────────── */
    if (name === 'home') {
      ok(!state.inDock && !state.dockShown,
         'home: his default place is in the page, not a floating copy');
      const bubble = await p.evaluate(() => {
        const b = document.querySelector('.eulid-says');
        if (!b) return null;
        const r = b.getBoundingClientRect();
        const m = document.querySelector('.mascot-wrap').getBoundingClientRect();
        return { text: b.textContent.trim(), w: Math.round(r.width),
                 beside: r.left >= m.left - 4, near: Math.abs(r.top - m.top) < m.height };
      });
      ok(bubble && /drag me anywhere/i.test(bubble.text),
         'home: the bubble says the right thing', bubble ? `"${bubble.text}"` : 'no bubble');
      ok(bubble && bubble.beside && bubble.near, 'home: it sits next to him');
    } else {
      ok(state.inDock && state.dockShown,
         'mission: he defaults to the dock, since the page has no place for him');
      /* "a blank spot" — check nothing of the page's own content is
         under him, rather than trusting the coordinates I picked. */
      const clear = await p.evaluate(() => {
        const r = document.querySelector('.mascot-svg').getBoundingClientRect();
        const pts = [[.5,.5],[.2,.2],[.8,.8],[.2,.8],[.8,.2]];
        const hits = pts.map(([fx, fy]) =>
          document.elementFromPoint(r.left + r.width*fx, r.top + r.height*fy));
        return hits.map(h => {
          if (!h) return 'nothing';
          if (h.closest('.mascot-wrap, .eulid-dock')) return 'himself';
          /* Its OWN text, not its descendants'. textContent on a
             container returns everything inside it, so a hit on an empty
             corner of a big <header> came back as "text" and reported a
             perfectly clear spot as covered. */
          const own = [...h.childNodes]
            .some(c => c.nodeType === 3 && c.textContent.trim().length > 0);
          return h.tagName.toLowerCase() + (own ? ':text' : '');
        });
      });
      const onContent = clear.filter(c => /:text/.test(c));
      ok(onContent.length === 0, 'mission: his default spot is clear of the page',
         clear.join(', '));
    }
    await p.close();
  }

  /* ── the same Eulid ────────────────────────────────────────── */
  console.log('\n══ the same Eulid ══');
  ok(svgs.home && svgs.mission && svgs.home === svgs.mission,
     'the SVG is byte-identical on both pages',
     svgs.home ? `${svgs.home.length} chars each` : 'missing');

  /* ── picking him up ────────────────────────────────────────
     The essentials only. eulid-tools.js checks the drag properly,
     including the press-versus-drag threshold; this exists so that "he
     goes home" below is testing something that was actually moved. */
  console.log('\n══ picking him up ══');
  {
    const p = await br.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(HOME, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1300);
    await dragTo(p, 330, 300);
    const after = await p.evaluate(() => {
      const svg = document.querySelector('.mascot-svg');
      const r = svg.getBoundingClientRect();
      const dock = document.getElementById('eulidDock');
      const bubble = document.querySelector('.eulid-says');
      return { cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2),
               inDock: dock.contains(svg),
               bubbleShown: !!(bubble && getComputedStyle(bubble).display !== 'none'),
               stored: sessionStorage.getItem('sos_eulid_spot') };
    });
    ok(after.inDock, 'he lifts out into the dock when dragged');
    ok(Math.hypot(after.cx - 330, after.cy - 300) < 100, 'he ends up where he was dropped',
       `${after.cx},${after.cy}`);
    ok(!after.bubbleShown, 'the bubble stands down once he has been moved');
    ok(!!after.stored, 'the spot is remembered', after.stored);
    await p.close();
  }

  /* ── he follows you around the site, then goes home ────────── */
  console.log('\n══ coming and going ══');
  {
    const ctx = await br.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(HOME, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1000);
    await dragTo(p, 400, 300);

    /* same tab, another page — he should still be where he was put */
    await p.goto(OTHER, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1200);
    const moved = await p.evaluate(() => {
      const r = document.querySelector('.mascot-svg').getBoundingClientRect();
      return { cx: Math.round(r.x + r.width/2), cy: Math.round(r.y + r.height/2) };
    });
    ok(Math.hypot(moved.cx - 400, moved.cy - 300) < 120,
       'he follows you to the next page', `${Math.round(Math.hypot(moved.cx-400, moved.cy-300))}px from where he was left`);

    /* a new visit: a fresh context is a fresh tab, which is what
       closing the browser and coming back actually is */
    const ctx2 = await br.newContext({ viewport: { width: 1440, height: 900 } });
    const q = await ctx2.newPage();
    await q.goto(HOME, { waitUntil: 'networkidle' });
    await q.waitForTimeout(1200);
    const home = await q.evaluate(() => {
      const wrap = document.querySelector('.mascot-wrap');
      const dock = document.getElementById('eulidDock');
      return { inDock: dock.contains(wrap),
               dockShown: getComputedStyle(dock).display !== 'none',
               bubble: !!document.querySelector('.eulid-says') };
    });
    ok(!home.inDock && !home.dockShown, 'a new visit puts him back in his usual place');
    ok(home.bubble, 'and the bubble is back');

    /* and the same, on a page whose home is the corner */
    const r = await q.goto(OTHER, { waitUntil: 'networkidle' });
    void r;
    await q.waitForTimeout(1200);
    const corner = await q.evaluate(() => {
      const rr = document.querySelector('.mascot-svg').getBoundingClientRect();
      return { fx: (rr.x + rr.width/2) / innerWidth, fy: (rr.y + rr.height/2) / innerHeight };
    });
    ok(corner.fx > 0.7 && corner.fy > 0.55, 'on other pages his home is the clear corner',
       `${corner.fx.toFixed(2)}, ${corner.fy.toFixed(2)}`);
    await ctx.close(); await ctx2.close();
  }

  /* ── the loops are still untouched ─────────────────────────── */
  console.log('\n══ the promise from before ══');
  {
    const p = await br.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(HOME, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1200);
    const running = await p.evaluate(names => {
      const out = {};
      document.querySelectorAll('.mascot-wrap *, .mascot-wrap').forEach(n => {
        const cs = getComputedStyle(n);
        if (!cs.animationName || cs.animationName === 'none') return;
        cs.animationName.split(',').map(s => s.trim()).forEach((nm, i) => {
          if (names.indexOf(nm) === -1) return;
          out[nm] = { dur: cs.animationDuration.split(',')[i] || cs.animationDuration,
                      iter: cs.animationIterationCount.split(',')[i] || cs.animationIterationCount };
        });
      });
      return out;
    }, LOOPS);
    const found = Object.keys(running);
    ok(found.length === LOOPS.length, 'his four ambient loops are all still running',
       found.map(k => `${k} ${running[k].dur}`).join(', '));
    ok(found.every(k => running[k].iter === 'infinite'),
       'and all of them still loop forever');
    await p.close();
  }

  /* ── reduced motion ───────────────────────────────────────── */
  console.log('\n══ for anyone who has asked for less movement ══');
  {
    const ctx = await br.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.goto(HOME, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1000);
    await dragTo(p, 500, 400);
    const st = await p.evaluate(() => {
      const d = document.querySelector('.eulid-drift');
      const r = document.querySelector('.mascot-svg').getBoundingClientRect();
      return { drift: getComputedStyle(d).animationName,
               cx: Math.round(r.x + r.width/2), cy: Math.round(r.y + r.height/2) };
    });
    ok(st.drift === 'none', 'he stops wandering', st.drift);
    ok(Math.hypot(st.cx - 500, st.cy - 400) < 120,
       'but he still goes where you put him', `${Math.round(Math.hypot(st.cx-500, st.cy-400))}px`);
    await ctx.close();
  }

  console.log(bad ? `\n${bad} PROBLEM(S)\n` : '\nEulid does everything asked of him\n');
  await br.close();
  process.exit(bad ? 1 : 0);
})();
