/* Contrast on the real pages, not on the mockup.

   The mockup measured four treatments against one made-up section. This
   measures the one that shipped against the sections people will actually
   read — which is a different question, because the live pages put text
   over photographs, over cards, and over the parts of the starfield that
   are brightest.

   Same method as before, and the method is the point: hide THAT LINE ONLY
   with visibility, photograph the pixels it covered, read them back. Not
   its container — measuring a paragraph against the sky behind its card
   rather than against the card flatters some lines and libels others.

   On a varying background the worst single pixel is one star under one
   stroke and means nothing. The fifth percentile and the share of area
   under 4.5 are what decide it. */
const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const B = 'http://localhost:8844';

const lum = (r, g, b) => {
  const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
  return .2126 * f(r) + .7152 * f(g) + .0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05);

const PAGES = [
  ['what',    '/index.html#what'],
  ['types',   '/index.html#types'],
  ['study',   '/index.html#study'],
  ['ethics',  '/index.html#ethics'],
  ['mission', '/pages/mission.html'],
];

/* Every run of text the reader meets, found by walking the document rather
   than by listing selectors — a list of selectors only ever finds the lines
   someone remembered to add to it. */
const COLLECT = `(() => {
  const out = [];
  /* Clear the previous page's tags first.

     The five URLs measured here differ only by fragment, and a goto that
     changes only the fragment does not reload the document — so the marks
     left on the last section were still in the page, still earlier in
     document order, and querySelector kept handing back an element in a
     section that was now hidden. Thirty lines were reported unverified
     across four runs, and every one of them was this. */
  document.querySelectorAll('[data-sos-measure]').forEach(n => {
    delete n.dataset.sosMeasure;
  });
  const skip = /^(SCRIPT|STYLE|NOSCRIPT|SVG|PATH|TITLE)$/;
  document.querySelectorAll('body *').forEach(n => {
    if (skip.test(n.tagName)) return;
    if (n.closest('.sky, .sos-planner, .site-footer')) return;
    /* Only the section that is on screen. The one being left still has
       boxes for a beat while it fades, so it gets collected and is then
       gone by the time it would be measured — which is where the last
       thirty unverified lines came from. */
    const pan = n.closest('.panel');
    if (pan && !pan.classList.contains('active')) return;
    const hasOwnText = [...n.childNodes].some(c =>
      c.nodeType === 3 && c.textContent.trim().length > 12);
    if (!hasOwnText) return;
    const cs = getComputedStyle(n);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < .2) return;
    const r = n.getBoundingClientRect();
    if (r.width < 40 || r.height < 8) return;
    n.dataset.sosMeasure = out.length;
    out.push({ i: out.length, tag: n.tagName.toLowerCase(),
               cls: (n.className || '').toString().trim().split(/\\s+/)[0] || '',
               size: parseFloat(cs.fontSize), weight: cs.fontWeight, color: cs.color,
               text: (n.textContent || '').trim().slice(0, 34) });
  });
  return out;
})()`;

(async () => {
  const br = await chromium.launch();
  const p = await br.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));

  let worst = [], checked = 0, failed = 0;
  /* A line that could not be measured is not a line that passed. The first
     run of this reported "0 below the bar" while quietly skipping half the
     page, which is the same mistake the question-bank checker was built to
     avoid: unverified is its own answer, and it gets its own number. */
  const skipped = {};
  const skip = (why, L) => {
    (skipped[why] = skipped[why] || []).push(L.tag + (L.cls ? '.' + L.cls : ''));
  };

  for (const [name, path] of PAGES) {
    await p.goto(B + path, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1200);

    /* Put the section on screen directly rather than waiting for the site
       to do it.

       index.html shows one section at a time and swaps them on the hash.
       During the swap both panels carry .active for a beat, so waiting for
       "the active panel is the one I asked for" kept returning true while
       the old section was still the first .active in the document — and
       every line collected from it went 0x0 a moment later and could not
       be measured. Thirty lines were reported as unverified for two runs
       because of it. Setting the classes here is not a workaround: it is
       the state the reader ends up in, reached without a race. */
    const want = (path.split('#')[1] || '').trim();
    if (want) {
      const shown = await p.evaluate(id => {
        const target = document.getElementById(id);
        if (!target) return null;
        document.querySelectorAll('.panel').forEach(n => n.classList.toggle('active', n === target));
        return [...document.querySelectorAll('.panel.active')].map(n => n.id).join(',');
      }, want);
      if (shown !== want) { console.log(`  ! wanted "${want}", showing "${shown}"`); }
      await p.waitForTimeout(700);
    }

    /* Freeze everything that moves. The brand marquee slides text under the
       measurement, so the same line came back 3.54:1, 3.61:1 and 4.41:1 on
       three runs of the same page — a number that changes when nothing
       changed is not a measurement. */
    await p.evaluate(() => {
      document.getAnimations().forEach(a => { try { a.pause(); } catch (e) {} });
      const st = document.createElement('style');
      st.textContent = '*,*::before,*::after{animation-play-state:paused !important;transition:none !important;}';
      document.head.appendChild(st);
    });
    await p.waitForTimeout(200);
    /* The reveal animations start lines at opacity 0. Measuring then would
       report a line that is not there yet. */
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(400);

    /* Open everything that opens, first.

       Thirty-one lines came back unmeasurable at 0x0 while claiming to be
       visible, which is what an element inside a collapsed card looks like.
       Text a reader can open is text a reader reads, so it gets measured
       like anything else — and the collapsed card is also the case most
       likely to fail, because a card body sits on a different surface from
       the page around it. */
    const opened = await p.evaluate(() => {
      let n = 0;
      /* Not by clicking. The site's expandable headings call toggleHeading,
         which is not defined anywhere in the project — so a click throws
         and opens nothing. The class is added directly instead, and the
         missing handler is reported separately rather than worked around
         quietly. */
      document.querySelectorAll('.expandable:not(.open)').forEach(e => { e.classList.add('open'); n++; });
      document.querySelectorAll('details:not([open])').forEach(d => { d.open = true; n++; });
      return n;
    });
    if (opened) console.log(`  (opened ${opened} collapsed cards so their text could be measured)`);
    await p.waitForTimeout(600);

    let lines = await p.evaluate(COLLECT);
    /* A page has hundreds of paragraphs and most of them are the same
       paragraph repeated. Three of each distinct kind is enough to find a
       treatment that fails, and it is the difference between a check that
       runs and a check that times out. */
    const seenKind = {};
    lines = lines.filter(L => {
      const k = L.tag + '.' + L.cls;
      seenKind[k] = (seenKind[k] || 0) + 1;
      return seenKind[k] <= 3;
    });
    console.log(`\n══ ${name} — ${lines.length} distinct lines ══`);
    let pageBad = 0;

    for (const L of lines) {
      const el = await p.$(`[data-sos-measure="${L.i}"]`);
      if (!el) { skip('element gone by the time it was measured', L); continue; }

      /* Hold the section open.

         index.html switches sections as you scroll, and the sweep scrolls
         to every line it measures — so partway down, the page quietly
         swapped to another section and the rest of the lines went 0x0.
         They were then reported as unverified, which was at least honest,
         but the cause was the measurement moving the page rather than
         anything about the page. Re-asserted per line rather than once,
         because once is what failed. */
      if (want) await p.evaluate(id => {
        const t = document.getElementById(id);
        if (t && !t.classList.contains('active'))
          document.querySelectorAll('.panel').forEach(n => n.classList.toggle('active', n === t));
      }, want);

      /* scrollIntoViewIfNeeded is the obvious call and it was wrong here. It
         cannot reach a <text> node inside an SVG, and it times out against
         the brand marquee, which is translating under it — so half the page
         went unmeasured and the first run happily called that a pass.
         Scrolling the window to the element's own document position works
         for both, because it asks nothing of the element. */
      await p.evaluate(i => {
        const n = document.querySelector('[data-sos-measure="' + i + '"]');
        if (!n) return;
        const r = n.getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + r.top - 260, behavior: 'instant' });
      }, L.i);
      await p.waitForTimeout(90);
      const box = await el.boundingBox();
      if (!box || box.width < 40 || box.height < 8) {
        /* Record what the element actually looked like at the moment it
           could not be measured, rather than filing it under a guess. */
        const st = await el.evaluate(n => {
          const cs = getComputedStyle(n), r = n.getBoundingClientRect();
          /* Walk up to whichever ancestor actually collapsed. An element
             that is 0x0 while calling itself visible is always something
             above it, and the point of a skip line is to name the cause,
             not to restate the symptom. */
          let cause = 'none found';
          for (let q = n.parentElement; q; q = q.parentElement) {
            const qs = getComputedStyle(q), qr = q.getBoundingClientRect();
            if (qs.display === 'none' || qr.width === 0 || qr.height === 0) {
              cause = (q.tagName.toLowerCase()
                       + (q.className ? '.' + q.className.toString().trim().split(/\s+/).join('.') : ''))
                      .slice(0, 40) + ' is ' + qs.display + ' ' + Math.round(qr.width) + 'x' + Math.round(qr.height);
              break;
            }
          }
          return cs.visibility + '/' + Math.round(r.width) + 'x' + Math.round(r.height)
                 + (n.closest('svg') ? '/in-svg' : '') + ' <- ' + cause;
        });
        const where = await el.evaluate(n => {
          const pan = n.closest('.panel');
          return (pan ? pan.id + (pan.classList.contains('active') ? ' ACTIVE' : ' HIDDEN') : 'no panel')
                 + ' @scrollY=' + Math.round(window.scrollY);
        });
        skip('no box  [' + st + ']  in ' + where, L);
        if (Object.values(skipped).reduce((a,b)=>a+b.length,0) <= 3)
          console.log('     · unmeasured: ' + L.tag + '.' + L.cls + ' "' + L.text + '"  ' + st + '  ' + where);
        continue;
      }

      await el.evaluate(n => { n.dataset.wasVis = n.style.visibility; n.style.visibility = 'hidden'; });
      await p.waitForTimeout(45);
      let shot;
      try {
        shot = await p.screenshot({ clip: {
          x: Math.max(0, box.x), y: Math.max(0, box.y),
          width: Math.min(box.width, 1430), height: Math.min(box.height, 890) } });
      } catch (e) {
        await el.evaluate(n => { n.style.visibility = n.dataset.wasVis || ''; });
        skip('screenshot refused the clip', L); continue;
      }
      await el.evaluate(n => { n.style.visibility = n.dataset.wasVis || ''; });

      const read = buf => {
        const png = PNG.sync.read(buf);
        const f = L.color.match(/[\d.]+/g).map(Number);
        const L1 = lum(f[0], f[1], f[2]);
        const rs = [];
        for (let i = 0; i < png.data.length; i += 4)
          rs.push(ratio(L1, lum(png.data[i], png.data[i + 1], png.data[i + 2])));
        rs.sort((a, b) => a - b);
        return { p5: rs[Math.floor(rs.length * .05)], under: rs.filter(r => r < 4.5).length / rs.length };
      };
      const { p5, under } = read(shot);

      /* Large text is held to 3:1, as the standard has it — 24px, or 18.66px
         at 700 and above. Everything else to 4.5. */
      const big = L.size >= 24 || (L.size >= 18.66 && +L.weight >= 700);
      const need = big ? 3 : 4.5;

      checked++;
      if (p5 < need) {
        failed++; pageBad++;
        /* Measure it again with the backdrop switched off. has-backdrop is
           the whole feature — if the number does not move, the line was
           already like that and the sky is not what broke it. Worth the
           second screenshot: the first failure this found was a white
           caption on a bright photograph, which would otherwise have been
           filed against a change that had nothing to do with it. */
        await p.evaluate(() => document.body.classList.remove('has-backdrop'));
        await p.waitForTimeout(160);
        await el.evaluate(n => { n.style.visibility = 'hidden'; });
        await p.waitForTimeout(45);
        let before = null;
        try {
          before = read(await p.screenshot({ clip: {
            x: Math.max(0, box.x), y: Math.max(0, box.y),
            width: Math.min(box.width, 1430), height: Math.min(box.height, 890) } })).p5;
        } catch (e) {}
        await el.evaluate(n => { n.style.visibility = n.dataset.wasVis || ''; });
        await p.evaluate(() => document.body.classList.add('has-backdrop'));
        await p.waitForTimeout(120);

        const blame = before === null ? 'could not re-measure without the backdrop'
          : (Math.abs(before - p5) < .15
              ? `the same without the backdrop (${before.toFixed(2)}:1) — this one predates it`
              : `was ${before.toFixed(2)}:1 without the backdrop — THE BACKDROP DID THIS`);
        worst.push({ page: name, sel: L.tag + (L.cls ? '.' + L.cls : ''),
                     p5: p5.toFixed(2), need, under: (under * 100).toFixed(1),
                     px: L.size, text: L.text, blame });
        console.log(`  ✗ ${(L.tag + (L.cls ? '.' + L.cls : '')).padEnd(24)} ${p5.toFixed(2)}:1 (needs ${need})  ${(under*100).toFixed(1)}% under  "${L.text}"`);
        console.log(`      ${blame}`);
      }
    }
    if (!pageBad) console.log('  ✓ every line clears');
  }

  console.log('\n══ and it still moves ══');
  await p.goto(B + '/index.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const fps = await p.evaluate(() => new Promise(res => {
    let n = 0; const t0 = performance.now();
    (function tick() { n++; performance.now() - t0 < 1000 ? requestAnimationFrame(tick) : res(n); })();
  }));
  console.log(`  ${fps >= 20 ? '✓' : '✗'} home: ${fps} fps`);

  const blurred = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('.sky *').forEach(el => {
      if (!el.getAnimations || !el.getAnimations({ subtree: true }).length) return;
      for (let n = el.parentElement; n; n = n.parentElement) {
        const fl = getComputedStyle(n).filter;
        if (fl && fl !== 'none' && /blur/.test(fl)) { out.push(el.className); break; }
      }
    });
    return out;
  });
  console.log(`  ${blurred.length === 0 ? '✓' : '✗'} nothing animated sits under a blur filter ${blurred.slice(0,2).join(',')}`);

  const ctx = await br.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const q = await ctx.newPage();
  await q.goto(B + '/pages/mission.html', { waitUntil: 'networkidle' });
  await q.waitForTimeout(1200);
  const running = await q.evaluate(() => {
    const s = document.querySelector('.sky');
    return s ? s.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length : -1;
  });
  console.log(`  ${running === 0 ? '✓' : '✗'} reduced motion: ${running} animations still running on the injected sky`);
  await ctx.close();

  console.log(`\n  ${errs.length === 0 ? '✓' : '✗'} page errors: ${errs.length}` + (errs.length ? ' — ' + errs.slice(0,3).join(' | ') : ''));
  const nSkip = Object.values(skipped).reduce((a, b) => a + b.length, 0);
  const caused = worst.filter(w => /THE BACKDROP DID THIS/.test(w.blame));
  console.log(`\n${checked} lines measured, ${failed} below the bar, ${caused.length} of them caused by the backdrop`);
  if (nSkip) {
    console.log(`${nSkip} NOT measured — these are unverified, not passes:`);
    Object.keys(skipped).forEach(k =>
      console.log(`   ${String(skipped[k].length).padStart(3)}  ${k}   e.g. ${[...new Set(skipped[k])].slice(0, 4).join(', ')}`));
  }
  console.log('');
  await br.close();
  process.exit(failed ? 1 : 0);
})();
