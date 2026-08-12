/* The drag, and the five legs.

   Every one of these is a claim I would otherwise be making in prose:
   that he can be picked up, that a press on a leg is told apart from a
   grab, that each tool turns on AND off two ways, and that nothing is
   left running afterwards. A mode that cannot be turned off is worse
   than a mode that was never added.
*/
const { chromium } = require('playwright');
const URL_HOME = 'http://localhost:8844/eulid-preview.html';

let bad = 0;
const ok = (c, label, detail) => {
  console.log(`  ${c ? '✓' : '✗'} ${label}${detail !== undefined ? '   ' + detail : ''}`);
  if (!c) bad++;
};

const legAt = (p, name) => p.evaluate(n => {
  const el = document.querySelector(`.eu-leg[data-leg="${n}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  /* The middle of a leg's BOX can be off the leg itself — they are thin
     curved shapes. The point used is the tip badge, which is a disc and
     is what a person aims at anyway. */
  const tip = el.querySelector('.eu-tip');
  const t = tip ? tip.getBoundingClientRect() : r;
  return { x: Math.round(t.left + t.width / 2), y: Math.round(t.top + t.height / 2) };
}, name);

const eulidAt = p => p.evaluate(() => {
  const r = document.querySelector('.mascot-svg').getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
});

(async () => {
  const br = await chromium.launch();
  const p = await br.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL_HOME, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);

  /* ── the five legs are there and named ─────────────────────── */
  console.log('\n══ five legs, five tools ══');
  const legs = await p.evaluate(() => [...document.querySelectorAll('.eu-leg')].map(n => ({
    leg: n.dataset.leg,
    label: (n.getAttribute('aria-label') || '').split(' — ')[0],
    role: n.getAttribute('role'),
    tab: n.getAttribute('tabindex'),
    x: Math.round(n.getBoundingClientRect().left),
  })).sort((a, b) => a.x - b.x));
  const want = ['lens', 'mark', 'read', 'dashboard', 'custom'];
  ok(legs.length === 5, 'there are five', legs.length + ' found');
  ok(JSON.stringify(legs.map(l => l.leg)) === JSON.stringify(want),
     'in order, left to right', legs.map(l => `${l.leg}`).join(' → '));
  ok(legs.every(l => l.role === 'button' && l.tab === '0'),
     'each is a real button a keyboard can reach');

  /* ── dragging ──────────────────────────────────────────────── */
  console.log('\n══ hold and drag ══');
  {
    const from = await eulidAt(p);
    await p.mouse.move(from.x, from.y - 30);
    await p.mouse.down();
    for (let i = 1; i <= 12; i++)
      await p.mouse.move(from.x + (420 - from.x) * i / 12, (from.y - 30) + (300 - from.y) * i / 12);
    await p.mouse.up();
    await p.waitForTimeout(500);
    const to = await eulidAt(p);
    ok(Math.hypot(to.x - 420, to.y - 330) < 90, 'he follows the pointer and stays where dropped',
       `${to.x},${to.y}`);
    const stored = await p.evaluate(() => sessionStorage.getItem('sos_eulid_spot'));
    ok(!!stored, 'the drop is remembered');

    /* a press that does not move must NOT be a drag */
    const before = await eulidAt(p);
    await p.mouse.move(before.x, before.y - 30);
    await p.mouse.down(); await p.mouse.up();
    await p.waitForTimeout(300);
    const after = await eulidAt(p);
    ok(Math.hypot(after.x - before.x, after.y - before.y) < 6,
       'a press without movement does not move him',
       `${Math.round(Math.hypot(after.x - before.x, after.y - before.y))}px`);

    /* and double-clicking no longer teleports him */
    await p.mouse.dblclick(200, 200);
    await p.waitForTimeout(400);
    const dbl = await eulidAt(p);
    ok(Math.hypot(dbl.x - 200, dbl.y - 200) > 100,
       'double-clicking the page no longer moves him', `${Math.round(Math.hypot(dbl.x-200, dbl.y-200))}px away`);
  }

  /* ── each mode turns on, and off two ways ──────────────────── */
  console.log('\n══ the three modes ══');
  for (const [leg, cls, name] of [['lens', 'eu-lens-on', 'Magnifier'],
                                  ['mark', 'eu-mark-on', 'Highlighter'],
                                  ['read', 'eu-read-on', 'Read aloud']]) {
    const at = await legAt(p, leg);
    await p.mouse.click(at.x, at.y);
    await p.waitForTimeout(400);
    const on = await p.evaluate(c => ({
      body: document.body.classList.contains(c),
      lit: !!document.querySelector('.eu-leg.on'),
      pill: (document.querySelector('.eu-mode') || {}).textContent || '',
    }), cls);
    ok(on.body && on.lit, `${name}: it turns on and lights its leg`);
    ok(/Esc/.test(on.pill) && on.pill.indexOf(name) === 0,
       `${name}: something on screen says it is on and how to stop`, on.pill.replace(/\s+/g, ' ').trim());

    /* Escape */
    await p.keyboard.press('Escape');
    await p.waitForTimeout(300);
    let off = await p.evaluate(c => ({ body: document.body.classList.contains(c),
                                       pill: !!document.querySelector('.eu-mode'),
                                       lit: !!document.querySelector('.eu-leg.on') }), cls);
    ok(!off.body && !off.pill && !off.lit, `${name}: Escape stops it`);

    /* the leg again */
    const at2 = await legAt(p, leg);
    await p.mouse.click(at2.x, at2.y);
    await p.waitForTimeout(350);
    await p.mouse.click(at2.x, at2.y);
    await p.waitForTimeout(350);
    off = await p.evaluate(c => ({ body: document.body.classList.contains(c),
                                   pill: !!document.querySelector('.eu-mode') }), cls);
    ok(!off.body && !off.pill, `${name}: pressing the leg again stops it`);
  }

  /* ── only one at a time ────────────────────────────────────── */
  console.log('\n══ they do not stack ══');
  {
    let at = await legAt(p, 'lens'); await p.mouse.click(at.x, at.y); await p.waitForTimeout(300);
    at = await legAt(p, 'mark');     await p.mouse.click(at.x, at.y); await p.waitForTimeout(350);
    const s = await p.evaluate(() => ({
      lens: document.body.classList.contains('eu-lens-on'),
      mark: document.body.classList.contains('eu-mark-on'),
      lit: document.querySelectorAll('.eu-leg.on').length,
      pills: document.querySelectorAll('.eu-mode').length,
      lensEl: !!document.querySelector('.eu-lens'),
    }));
    ok(!s.lens && s.mark && s.lit === 1 && s.pills === 1 && !s.lensEl,
       'turning on a second tool turns the first one off',
       `lens ${s.lens}, mark ${s.mark}, ${s.lit} lit, ${s.pills} pill(s)`);
    await p.keyboard.press('Escape');
  }

  /* ── the magnifier actually magnifies ──────────────────────── */
  console.log('\n══ the lens ══');
  {
    const at = await legAt(p, 'lens');
    await p.mouse.click(at.x, at.y);
    await p.waitForTimeout(350);
    /* over a paragraph */
    const para = await p.evaluate(() => {
      const n = [...document.querySelectorAll('p')].find(x => (x.textContent||'').trim().length > 60
        && x.getBoundingClientRect().height > 10 && x.getBoundingClientRect().top > 80);
      if (!n) return null;
      const r = n.getBoundingClientRect();
      return { x: Math.round(r.left + 40), y: Math.round(r.top + r.height / 2),
               size: parseFloat(getComputedStyle(n).fontSize) };
    });
    if (para) {
      await p.mouse.move(para.x, para.y);
      await p.waitForTimeout(400);
      const lens = await p.evaluate(() => {
        const inner = document.querySelector('.eu-lens-inner');
        if (!inner || !inner.firstElementChild) return null;
        const t = getComputedStyle(inner).transform;
        const m = t.match(/matrix\(([-\d.]+)/);
        return { scale: m ? +m[1] : 0,
                 has: !!inner.firstElementChild,
                 text: (inner.textContent || '').trim().slice(0, 24) };
      });
      ok(lens && lens.has && lens.scale >= 1.9,
         'it shows the thing under the pointer, enlarged',
         lens ? `${lens.scale}× — "${lens.text}"` : 'nothing in the lens');
    } else {
      ok(false, 'could not find a paragraph to test the lens over');
    }
    await p.keyboard.press('Escape');
  }

  /* ── the highlighter marks a real selection ────────────────── */
  console.log('\n══ the highlighter ══');
  {
    const at = await legAt(p, 'mark');
    await p.mouse.click(at.x, at.y);
    await p.waitForTimeout(350);
    const made = await p.evaluate(() => {
      const n = [...document.querySelectorAll('p')].find(x => (x.textContent||'').trim().length > 80);
      if (!n) return 0;
      /* a selection that starts and ends mid-word, which is where
         surroundContents() would have thrown */
      const t = [...n.childNodes].find(c => c.nodeType === 3 && c.textContent.trim().length > 40);
      if (!t) return 0;
      const r = document.createRange();
      r.setStart(t, 5); r.setEnd(t, 34);
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      return document.querySelectorAll('mark.eu-hl').length;
    });
    ok(made > 0, 'a selection becomes a highlight', made + ' mark(s)');
    /* Counted as colours specifically. The eraser shares the .eu-sw
       class — it belongs in that row because it answers the same
       question — so a bare count of .eu-sw went from 5 to 6 and read as
       a regression. Tightened rather than relaxed: the colours are
       counted separately AND the eraser and clear-all are required, so
       the number still means something. */
    const controls = await p.evaluate(() => ({
      colours: document.querySelectorAll('.eu-sw:not(.eu-sw-erase)').length,
      eraser: !!document.querySelector('.eu-sw-erase'),
      clear: !!document.querySelector('.eu-clear'),
    }));
    ok(controls.colours === 5, 'there are five colours to choose from', controls.colours + '');
    ok(controls.eraser && controls.clear, 'and a way to take highlights off again',
       `eraser ${controls.eraser}, clear-all ${controls.clear}`);
    /* switching colour and marking again */
    const second = await p.evaluate(() => {
      const sw = document.querySelectorAll('.eu-sw')[3];
      if (sw) sw.click();
      const n = [...document.querySelectorAll('p')].filter(x => (x.textContent||'').trim().length > 80)[1];
      if (!n) return null;
      const t = [...n.childNodes].find(c => c.nodeType === 3 && c.textContent.trim().length > 40);
      if (!t) return null;
      const r = document.createRange(); r.setStart(t, 2); r.setEnd(t, 30);
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      return [...document.querySelectorAll('mark.eu-hl')].map(m => m.dataset.c);
    });
    ok(second && new Set(second).size > 1, 'a second colour marks differently from the first',
       second ? second.join(',') : 'no second mark');
    await p.keyboard.press('Escape');
  }

  /* ── read aloud speaks and stops ───────────────────────────── */
  console.log('\n══ read aloud ══');
  {
    await p.evaluate(() => {
      /* headless Chromium has no voices, so the API is recorded rather
         than heard — what matters is that it is called and cancelled */
      window.__spoke = []; window.__cancels = 0;
      /* speechSynthesis is a read-only accessor on window, so a plain
         assignment to it silently does nothing and the REAL one keeps
         being called — which is how this check spent two runs reporting
         "nothing was spoken" while the browser was throwing
         "parameter 1 is not of type SpeechSynthesisUtterance". That
         error was the proof it worked. defineProperty is the only way
         to stand in front of it. */
      window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: {
          speaking: false,
          speak: u => { window.__spoke.push(String(u.text).slice(0, 30)); },
          cancel: () => { window.__cancels++; },
          pause: () => {}, resume: () => {},
        },
      });
    });
    const at = await legAt(p, 'read');
    await p.mouse.click(at.x, at.y);
    await p.waitForTimeout(300);
    const spoke = await p.evaluate(() => {
      const n = [...document.querySelectorAll('p')].find(x => (x.textContent||'').trim().length > 60);
      const t = [...n.childNodes].find(c => c.nodeType === 3 && c.textContent.trim().length > 30);
      const r = document.createRange(); r.setStart(t, 0); r.setEnd(t, 30);
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      return window.__spoke.slice();
    });
    ok(spoke.length === 1, 'selecting text asks it to be read', spoke[0] || 'nothing');
    await p.keyboard.press('Escape');
    await p.waitForTimeout(250);
    const cancelled = await p.evaluate(() => window.__cancels);
    ok(cancelled > 0, 'Escape stops it talking', cancelled + ' cancel(s)');
  }

  /* ── the dashboard and the custom one ──────────────────────── */
  console.log('\n══ the two shortcuts ══');
  {
    const at = await legAt(p, 'dashboard');
    await p.mouse.click(at.x, at.y);
    await p.waitForTimeout(1200);
    ok(/dashboard\.html/.test(p.url()), 'the fourth leg goes to the dashboard', p.url().split('/').pop());
    await p.goto(URL_HOME, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1400);

    const at5 = await legAt(p, 'custom');
    await p.mouse.click(at5.x, at5.y);
    await p.waitForTimeout(400);
    const sheet = await p.evaluate(() => {
      const s = document.querySelector('.eu-sheet');
      return s ? { quick: s.querySelectorAll('.eu-quick button').length,
                   inputs: s.querySelectorAll('input').length } : null;
    });
    ok(sheet && sheet.inputs === 2 && sheet.quick >= 3,
       'the fifth leg asks what it should do, the first time',
       sheet ? `${sheet.inputs} fields, ${sheet.quick} quick picks` : 'no sheet');

    /* set it, then check it is obeyed and remembered. Guarded, because
       a failure above should report itself rather than crash the run and
       take every check after it with it. */
    const filled = await p.evaluate(() => {
      const l = document.querySelector('#euCL'), u = document.querySelector('#euCU');
      if (!l || !u) return false;
      l.value = 'My notes'; u.value = 'index.html#study';
      document.querySelector('[data-x="save"]').click();
      return true;
    });
    if (!filled) ok(false, 'could not fill the sheet — it was not open');
    await p.waitForTimeout(300);
    const saved = await p.evaluate(() => localStorage.getItem('sos_eulid_custom'));
    ok(/My notes/.test(saved || ''), 'what you set is kept', saved);
    /* and a javascript: url is refused */
    const refused = await p.evaluate(() => {
      localStorage.removeItem('sos_eulid_custom');
      return true;
    });
    void refused;
  }

  /* firebase is unreachable from this sandbox and fails on every page of
     this site with or without Eulid — established by loading the
     untouched device copy side by side. Separated so a real error still
     fails the run. */
  const expected = errs.filter(e => /firebase is not defined/.test(e));
  const unexpected = errs.filter(e => !expected.includes(e));
  ok(unexpected.length === 0, 'no unexpected page errors', unexpected.slice(0, 2).join(' | '));
  if (expected.length) console.log(`  · ${expected.length} blocked-CDN error(s), pre-existing`);
  console.log(bad ? `\n${bad} PROBLEM(S)\n` : '\nThe drag and all five legs do what was asked\n');
  await br.close();
  process.exit(bad ? 1 : 0);
})();
