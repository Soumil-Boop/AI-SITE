# Seek-O-Sphere — Handoff

*Written so a fresh conversation can pick this project up without re-deriving anything. Read this first; `README.md` has the feature and architecture detail, `BACKEND_SETUP.md` has Firebase.*

Last updated: 16 August 2026.

---

## 1. What this is, and where it lives

Seek-O-Sphere is a free static site that teaches AI to ages 8–80. Plain HTML/CSS/JS, Firebase compat SDK v10.12.0, hosted on GitHub Pages.

The working copy is on the developer's machine at:

```
C:\Users\Soumil\AI SITE\ai-classroom
```

**The editing rule, which matters more than it looks:**

> Always pull the latest copy of a file from that folder before editing it, edit that copy, then write it straight back to the same folder. A code formatter on the machine sometimes re-saves `index.html` on its own, so re-read it fresh each time.

Do not work from a copy you pulled earlier in the conversation. Files have been externally reverted mid-session before (see §7).

---

## 2. Standing instructions

These have been given explicitly and remain in force.

- **Do not add things to the site without permission. Ask questions.** Build what was asked for; propose anything beyond it rather than shipping it.
- **Admins can only see students from their own school and nothing more at all.** They cannot see other schools' information or any appointed admins, at any cost. This is enforced in `firestore.rules`, not merely in the UI — see §4.
- **The ambient looping animations are off-limits.** The starfield, the mascot's idle float and blink, and the rest of the ~30 infinite animations are final. "Do nothing to them. DO NOT TOUCH THEM. They are fine as is."
- **Answer questions with text.** Do not produce generated images, mockups or screenshots in reply to a question unless they are asked for.
- Motion across the site should read as a serious learning site, not a slide deck: calm, uniform, no bouncing overshoots.

---

## 3. The single most important architectural fact

**`index.html` is not one page. It is eleven sections in one document.**

```js
const ALL_PAGES = ['home','what','history','types','study','ethics',
                   'lab','finder','resources','help','contact'];
```

`showPage(id)` adds `.active` to one panel and removes it from the rest. Everything else under `pages/` is either an authenticated page (`login`, `dashboard`, `admin`, `account-settings`), a real content page (`mission`), or a thin shell that just mounts the shared nav and footer.

Two consequences that have each already caused a bug:

1. **Anything scoped "per page" must be scoped per *section*.** Turning a feature off "for this file" turns it off for ten sections in order to affect one.
2. **A check that only opens the home page will pass while the site is broken.** Content that escapes a panel is invisible on home — where it belongs — and appears underneath *every other* section, because "show one panel at a time" cannot hide what is outside all of them.

---

## 4. How the school boundary actually works

Firestore cannot filter a list for you. It can only refuse a query whose results it cannot guarantee are all permitted. So every user document carries a **derived** `bucket` field:

```
'school:<schoolId>'   a student in that school
'online'              a student who joined without a code
'staff'               any admin or the owner
```

A school admin's panel queries `where('bucket','==','school:<their id>')`. Every document that query can return is by definition one of their own students, so the rule is satisfiable and the query is allowed. Ask for anything wider and Firestore refuses the whole query, not just the extra rows.

`bucket` is recomputed by the write rules from `role` and `schoolId` and rejected if it disagrees, so nobody can edit their own profile to appear in — or vanish from — a school's list. A single equality filter also means Firestore's automatic single-field index covers it; there is no composite index to create.

Roles are `owner`, `schooladmin`, `student`.

---

## 5. Conventions

- **Firebase compat SDK only, loaded from CDN script tags. Never ES modules.** The modular SDK caused silent failures. `js/firebase-config.js` holds an ES-module version kept purely for reference; nothing loads it.
- **Tokens, not literals.** The site paints through `--white`, `--text`, `--muted`, `--border` and friends, which is what let `css/theme-dark.css` convert roughly a thousand declarations by restating twenty-odd values. Write new CSS through tokens so it converts too.
- **The site is dark only.** `js/core/theme.js` pins `data-theme="dark"` and clears the old `sos_theme` preference; the light Sienna tokens survive only as the layer the dark palette overrides.
- **Type has fixed roles.** Space Grotesk for display, Inter for reading, Nunito for the marquee only, JetBrains Mono for small uppercase labels. The quote scroller — Space Grotesk 400 in `#E6EDF6` — is the site's existing "someone is speaking" treatment; anything that speaks should join it. A mascot speech box: Space Grotesk 500, 1rem, line-height 1.5, letter-spacing -.01em, `#E6EDF6`, capped near 19rem.
- **Performance rules that have been measured here.** Never put `filter: blur()` on an ancestor of something that animates — it re-blurs every frame and measured 6fps against 34. Never paint the same large gradient twice per frame. Split scroll offset and animation onto two nested elements.

---

## 6. Verification

`structure.js` (in the project root) is a comparative check that exists because of a real bug. It renders a pristine baseline and the edited page side by side and asserts: the same panels in the same order, no panel nested inside another, nothing newly escaped its panel, no panel silently lost content, and `<div>` tags balanced.

```bash
# serve the folder, then:
node structure.js
EXPECT_LOSS="home:-69" node structure.js    # declare an intended removal
```

Two design points worth keeping:

- The baseline must be a copy taken **before** the session's edits, not the file currently on disk. Once an edit ships, the device copy *is* the edited page, and comparing it with itself passes for the wrong reason.
- A panel losing content must be **declared** via `EXPECT_LOSS`, not tolerated. A check that quietly forgives the one number an edit was meant to move forgives every other movement of that number too.

When adding a check of your own: verify by **rendering and reading pixels**, not by reading tokens or markup. And if a check passes on the version you know is broken, suspect the check.

---

## 7. Traps already hit — do not rediscover these

- **The bleed bug.** Removing a block by searching for the next `</div>` after its opening tag finds the `</div>` that closes a *nested* element, so one closing tag too few is removed, `#home` closes early, and everything after it spills outside every panel and shows on every other section. Locate the end of a nested element with a **depth-counting walker**, never with `indexOf('</div>')`.
- **Only testing the home page.** See §3.
- **`visibility: hidden` hides an element's own background.** When measuring what is behind text, use `color: transparent` for anything that paints its own fill, or you measure the button instead of the page.
- **The mascot's markup exists twice.** `assets/eulid.html` is the copy fetched by every page
  that does not ship its own; `index.html` carries an inline copy in the hero. Changing a leg,
  a glyph or a label means changing both, or the button is one thing on the home page and
  another everywhere else.
- **Duplicate SVG gradient ids.** Two copies of Eulid in one document means two `id="euBody"`, and every fill in the second silently resolves to the first. There must only ever be one of him.
- **`Range.surroundContents()` throws** on most real selections. Walk and split text nodes instead. Removing a `<mark>` afterwards needs `parent.normalize()` or the text stays fragmented.
- **`speechSynthesis` is a read-only accessor** on `window`; stub it with `Object.defineProperty` if you need to.
- **Press versus drag** needs a distance threshold (4px here) and pointer capture, or every click on a leg is read as a drag.
- **`!important` does not settle specificity.** `!important` on `.panel.active .hero-content` outranks `!important` on `*`, which is how a reduced-motion block that looked global left 2,324 animations running.
- **Navigating between URLs that differ only by fragment is a same-document navigation.** Stale DOM attributes persist, so a measurement pass that tags elements must clear its own tags before collecting.
- **Splitting CSS values on commas shatters `cubic-bezier(...)`.** A check that did this reported "nothing overshoots" on a site full of overshoots.

---

## 8. Open threads

**The home-page greeting film — currently rolled back.** A ten-second transparent film of Eulid waving was built, shipped, and then reverted on the machine: `index.html` is back to the inline mascot, the `data-eulid-away` support is gone from `js/components/eulid.js` and `css/components/eulid.css`, and `assets/video/` is empty. Nothing is broken; the site is simply as it was before.

If it is picked up again, the blocker is the source frames. Two exports exist, both flattened to an opaque backdrop, and **neither can be keyed correctly**:

- Over the near-black backdrop, the speech bubble's dark outline sits 19 levels away and comes out 61% opaque — the page shows through it.
- Over the near-white backdrop, his pale helmet (42% opaque) and cream eye (48%) go instead; 22.3% of his silhouette interior falls below 200/255.

This is not a bad export either time. With any single flattened backdrop, whatever is closest to it in colour dissolves, and no threshold can separate "pale artwork" from "pale backdrop". **The fix is one setting: export over a colour the artwork never uses — magenta `#FF00FF` or green `#00FF00` — or export with a real alpha channel (PNG frames, or WebM with alpha).** Then every element is 150+ levels from the backdrop and the key is exact, including the helmet's genuine translucency.

Two related decisions already taken: the greeting sentence goes on the page as **real HTML text** beside him, not baked into the video (the bubble text is clipped by the right edge of the canvas in all 270 frames of the latest export), and the film should **play once and rest** rather than loop.

**Transparency in delivered PNGs.** Eulid's vector helmet is pure white at 4–26% opacity, so any viewer that drops the alpha channel — Google Flow does — renders it as a solid white disc. For anything leaving the browser, ship a version with the compositing baked into the colour channel rather than relying on alpha.

---

## 9. Useful facts in one place

| Thing | Value |
|---|---|
| Firebase project | `ai-classroom-ad779`, Firestore region `asia-south2` |
| Firebase SDK | compat v10.12.0, CDN script tags |
| Branches | work on `dev`, deploy by merging into `main` |
| `index.html` size | ~620 KB, 454 `<div>` open/close pairs |
| Panels | home, what, history, types, study, ethics, lab, finder, resources, help, contact |
| Live palette | Observatory — void `#05080E`, panel `#0C121C`, ink `#E6EDF6`, dim `#8496AB`, aqua `#63E6E2`, ember `#FF8A4C` |
| Mascot files | `js/components/eulid.js`, `css/components/eulid.css`, `assets/eulid.html` |
| Eulid's legs | lens, mark, read, dashboard, home (left to right). `home` resets HIS position; it does not navigate. |
| Question source switch | `QUESTION_SOURCE` in `js/questions-engine.js` — `'json'` or `'api'` |
