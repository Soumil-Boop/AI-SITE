/* The shape of the page, checked against the copy before it was touched.

   This exists because of a bug that no rendering check would have caught
   on the page I was testing: a single extra </div> closed the #home
   panel early, so everything after it stopped being inside a panel. The
   home page still looked right — its own content was all still there —
   and every OTHER page grew a slab of the home page underneath it,
   because content outside a panel is content the "show one panel at a
   time" rule cannot hide.

   So the check is structural and comparative: the same panels, each
   still containing what it contained, and the tags still balanced.
*/
const { chromium } = require('playwright');
const fs = require('fs');

let bad = 0;
const ok = (c, label, detail) => {
  console.log(`  ${c ? '✓' : '✗'} ${label}${detail !== undefined ? '   ' + detail : ''}`);
  if (!c) bad++;
};

const SHAPE = `(() => {
  const panels = [...document.querySelectorAll('.panel')];
  return {
    panels: panels.map(p => p.id),
    /* every panel must be a sibling of the others, not nested in one */
    nested: panels.filter(p => p.parentElement.closest('.panel')).map(p => p.id),
    /* how much of the body sits OUTSIDE any panel and outside the
       furniture — that is the number the bug moved */
    loose: [...document.body.children]
      .filter(n => !n.closest('.panel') && !/SCRIPT|STYLE|LINK/.test(n.tagName))
      .map(n => n.tagName.toLowerCase() + '.' + (n.className||'').toString().trim().split(/\\s+/)[0])
      .filter(Boolean),
    /* and what each panel actually holds */
    counts: Object.fromEntries(panels.map(p => [p.id, p.querySelectorAll('*').length])),
  };
})()`;

(async () => {
  const br = await chromium.launch();

  /* the untouched device copy, served beside the shipped one */
  fs.copyFileSync('/mnt/user-data/uploads/ai-classroom/index.html',
                  '/home/claude/w3/_base-index.html');

  const read = async url => {
    const p = await br.newPage({ viewport: { width: 1440, height: 900 } });
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1200);
    const s = await p.evaluate(SHAPE);
    await p.close();
    return s;
  };

  const before = await read('http://localhost:8844/_base-index.html');
  const after  = await read('http://localhost:8844/index.html');

  console.log('\n══ the page still has the shape it had ══');
  ok(JSON.stringify(before.panels) === JSON.stringify(after.panels),
     'the same panels, in the same order', after.panels.join(', '));
  ok(after.nested.length === 0, 'no panel has ended up inside another',
     after.nested.join(', ') || 'none');
  ok(JSON.stringify(before.loose) === JSON.stringify(after.loose),
     'nothing new has escaped its panel',
     `${after.loose.length} loose element(s): ${after.loose.join(', ')}`);

  /* Eulid adds elements, so the counts move — but only in #home, and
     only upward. Any panel LOSING content means something was reparented. */
  const lost = Object.keys(before.counts)
    .filter(k => (after.counts[k] || 0) < before.counts[k])
    .map(k => `${k}: ${before.counts[k]} → ${after.counts[k]}`);
  ok(lost.length === 0, 'no panel lost any of its contents', lost.join(' | ') || 'none');

  /* and the tags balance, which is the thing that actually broke */
  const src = fs.readFileSync('/home/claude/w3/index.html', 'utf8');
  const opens = (src.match(/<div\b/g) || []).length;
  const closes = (src.match(/<\/div>/g) || []).length;
  ok(opens === closes, 'every <div> is closed exactly once',
     `${opens} open, ${closes} closed`);

  fs.unlinkSync('/home/claude/w3/_base-index.html');
  console.log(bad ? `\n${bad} PROBLEM(S)\n` : '\nThe page is the shape it was\n');
  await br.close();
  process.exit(bad ? 1 : 0);
})();
