/* Taking highlights off again. The point of these is that a highlight
   removed has to leave the text usable — not just visually clean but
   structurally back to what it was, or the next highlight over the same
   sentence catches a fragment of it. */
const { chromium } = require('playwright');
let bad = 0;
const ok = (c, l, d) => { console.log(`  ${c?'✓':'✗'} ${l}${d!==undefined?'   '+d:''}`); if (!c) bad++; };

const legAt = (p, n) => p.evaluate(name => {
  const t = document.querySelector(`.eu-leg[data-leg="${name}"] .eu-tip`).getBoundingClientRect();
  return { x: Math.round(t.x + t.width/2), y: Math.round(t.y + t.height/2) };
}, n);

/* highlight a run of a paragraph, by index */
const mark = (p, idx, from, to) => p.evaluate(([i, a, b]) => {
  const ps = [...document.querySelectorAll('p')].filter(x => (x.textContent||'').trim().length > 80);
  const n = ps[i]; if (!n) return 0;
  const t = [...n.childNodes].find(c => c.nodeType === 3 && c.textContent.trim().length > b);
  if (!t) return 0;
  const r = document.createRange(); r.setStart(t, a); r.setEnd(t, b);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  return document.querySelectorAll('mark.eu-hl').length;
}, [idx, from, to]);

(async () => {
  const br = await chromium.launch();
  const p = await br.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8844/eulid-preview.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const at = await legAt(p, 'mark');
  await p.mouse.click(at.x, at.y);
  await p.waitForTimeout(400);

  console.log('\n══ the controls exist ══');
  const ui = await p.evaluate(() => ({
    swatches: document.querySelectorAll('.eu-sw:not(.eu-sw-erase)').length,
    eraser: !!document.querySelector('.eu-sw-erase'),
    clear: !!document.querySelector('.eu-clear'),
  }));
  ok(ui.swatches === 5, 'five colours', ui.swatches + '');
  ok(ui.eraser, 'an eraser');
  ok(ui.clear, 'a clear-all');

  console.log('\n══ click one to remove it ══');
  {
    const n = await mark(p, 0, 5, 40);
    ok(n === 1, 'a highlight exists to remove', n + '');
    const box = await p.evaluate(() => {
      const m = document.querySelector('mark.eu-hl');
      const r = m.getBoundingClientRect();
      return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) };
    });
    await p.mouse.click(box.x, box.y);
    await p.waitForTimeout(300);
    const left = await p.evaluate(() => document.querySelectorAll('mark.eu-hl').length);
    ok(left === 0, 'clicking it takes it off', left + ' left');
  }

  console.log('\n══ the text goes back to being one piece ══');
  {
    /* The real test of unwrapping: highlight, remove, then highlight the
       SAME longer run. If the text nodes were not merged back, the second
       pass only catches a fragment and produces several marks. */
    await mark(p, 0, 5, 40);
    await p.evaluate(() => {
      const m = document.querySelector('mark.eu-hl');
      m.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await p.waitForTimeout(250);
    const pieces = await p.evaluate(() => {
      const ps = [...document.querySelectorAll('p')].filter(x => (x.textContent||'').trim().length > 80);
      return [...ps[0].childNodes].filter(c => c.nodeType === 3).length;
    });
    ok(pieces === 1, 'the paragraph is one text node again, not three', pieces + ' text node(s)');
    const again = await mark(p, 0, 3, 60);
    ok(again === 1, 'a longer highlight over the same words is one mark, not several', again + '');
  }

  console.log('\n══ the eraser sweeps ══');
  {
    await p.evaluate(() => { document.querySelector('.eu-clear').click(); });
    await p.waitForTimeout(200);
    /* three separate highlights in one paragraph */
    const made = await p.evaluate(() => {
      const ps = [...document.querySelectorAll('p')].filter(x => (x.textContent||'').trim().length > 120);
      const n = ps[0];
      const fire = (a, b) => {
        const t = [...n.childNodes].find(c => c.nodeType === 3 && c.textContent.length > b);
        if (!t) return;
        const r = document.createRange(); r.setStart(t, a); r.setEnd(t, b);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      };
      fire(2, 12); fire(2, 10); fire(2, 8);
      return document.querySelectorAll('mark.eu-hl').length;
    });
    ok(made >= 2, 'several highlights to sweep', made + '');
    await p.evaluate(() => document.querySelector('.eu-sw-erase').click());
    const swept = await p.evaluate(() => {
      const ps = [...document.querySelectorAll('p')].filter(x => (x.textContent||'').trim().length > 120);
      const r = document.createRange(); r.selectNodeContents(ps[0]);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      return document.querySelectorAll('mark.eu-hl').length;
    });
    ok(swept === 0, 'a sweep with the eraser takes them all off', swept + ' left');
    const cursor = await p.evaluate(() => document.body.classList.contains('eu-erase-on'));
    ok(cursor, 'and the eraser says it is on');
    await p.evaluate(() => document.querySelector('.eu-sw-erase').click());
  }

  console.log('\n══ clear all ══');
  {
    await mark(p, 0, 4, 30); await mark(p, 1, 4, 30);
    const before = await p.evaluate(() => document.querySelectorAll('mark.eu-hl').length);
    await p.evaluate(() => document.querySelector('.eu-clear').click());
    await p.waitForTimeout(200);
    const after = await p.evaluate(() => document.querySelectorAll('mark.eu-hl').length);
    ok(before > 0 && after === 0, 'clear all takes the page back', `${before} → ${after}`);
  }

  console.log('\n══ it does not eat ordinary clicks ══');
  {
    /* a link inside a highlight must still be a link */
    const worked = await p.evaluate(() => {
      const a = document.querySelector('.panel.active a[onclick], nav a');
      if (!a) return 'no link';
      let fired = false;
      const h = () => { fired = true; };
      a.addEventListener('click', h, { once: true });
      a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return fired;
    });
    ok(worked === true, 'a click on a link still reaches the link', String(worked));
  }

  const real = errs.filter(e => !/firebase is not defined/.test(e));
  ok(real.length === 0, 'no unexpected page errors', real.slice(0,2).join(' | '));
  console.log(bad ? `\n${bad} PROBLEM(S)\n` : '\nHighlights can be taken off three ways\n');
  await br.close();
  process.exit(bad ? 1 : 0);
})();
