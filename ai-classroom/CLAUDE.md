# Seek-O-Sphere — working notes for Claude Code

Free AI-literacy + curriculum-practice site for ages 8–80. Plain HTML/CSS/JS, no build
step, Firebase **compat** SDK v10.12.0, deployed on GitHub Pages.
Project root: `C:\Users\Soumil\AI SITE\ai-classroom`

---

## Standing instructions (from the owner — follow these)

- **Ask before adding features.** Don't invent scope. Ask questions when a decision is genuinely forked.
- **Admins may only ever see students from their own school.** Nothing more, at any cost.
- **Do not touch the ~30 ambient/infinite background animations.** They are fine as they are.
- **Answer in text.** Don't generate images/PNGs unless asked.
- **Re-read `index.html` fresh before every edit** — a code formatter on the owner's machine
  sometimes re-saves it independently. Pull, edit, write straight back.
- Keep token use lean; the owner is conscious of limits.

---

## The five traps that will waste your time

**1. The site runs in DARK MODE and `index.html`'s `:root` is a lie.**
Line ~12 of `index.html` does `document.documentElement.setAttribute('data-theme','dark')`.
`css/theme-dark.css` then overrides every token. The inline `:root` in `index.html` is the
*light* ("Sienna Parchment") theme and is **never what users see**. Reading it produces
cream/terracotta designs that look nothing like the real site.

Real palette — **"Observatory"**:
```
--parchment #05080E (page)   --white #0D131D (card)   --cream #121A26
--gray-50 #080D15  --gray-100 #1B2532  --gray-200 #24303F
--text #E6EDF6  --muted #93A3B7  --faint #74839A
--accent #63E6E2 (aqua)  --accent-dark #8BF1EE  --accent-light #0E262B  --on-fill #04222A
--brand #FF8A4C (ember)  --brand-mid #FFA470  --brand-light #23160E
--green #6FDCA6  --purple #C79BFF  --danger #FF8F7A  --good-2 #4FBF8B  --heat-3 #3AA39D
```
Only **5** subject colours get dark values (`--maths #FF9A63`, `--science #6FDCA6`,
`--history #7FB4FF`, `--english #C79BFF`, `--geography #F2C14E`). The other ~25
(`--physics`, `--chemistry`, …) still hold light-theme values on a near-black page —
a real outstanding bug.

**2. `index.html` is CRLF. The Edit tool silently rewrites the whole file as LF.**
Use Python for edits:
```python
io.open(p,'r',encoding='utf-8',newline='').read()      # read
io.open(p,'w',encoding='utf-8',newline='').write(h)    # write
CR = lambda s: s.replace('\r\n','\n').replace('\n','\r\n')   # normalise inserts
```
After ANY edit, assert `h.count('\n') - h.count('\r\n') == 0`.
(`study.html`, `js/*`, `pages/*` are LF — check per file.)

**3. `SOS.onSession(cb)` REGISTERS a callback. It does not fire one.**
Wrapping it (I did, and broke grade-locking) means your code runs when something
*registers*, never when auth resolves. Also: `js/session.js` iterates its callback list
**once**; anything registering after that hears nothing. Poll `SOS.user` as a backstop.

**4. `sos_grade` holds `"Grade 10"`, not `"10"`.**
`pages/account-settings.html` saves the dropdown *label*. Always normalise:
`String(g).replace(/[^0-9]/g,'')` clamped 1–12. Unnormalised it produced
"Grade Grade 10" and an empty topic list.
**Setting a `<select>` to a value it doesn't have silently blanks it** — always check
the option exists first. That was the "No topics for this age yet" bug.

**5. The Lab's dock tools are NOT in `index.html`.**
Periodic table, formula sheet, calculator, map, etc. live in `js/tools/test-tools.js`
(`SOSTestTools`). I once "fixed" the periodic table by building a whole new Reference
tab while the tool the user was actually clicking sat untouched in that file.

---

## File map

| File | What it is |
|---|---|
| `index.html` | ~915KB. The whole marketing site + the Lab. Panels shown one at a time via `showPage(id)`. Honours `#hash` on load. |
| `study.html` | The Lab shell. Opens in its **own tab** (`target="_blank"` from nav). Nav: WorkHub / My Subjects / Notes / Videos / Practice. Embeds `index.html?embed=1` in an iframe for Practice. **Has no Firebase.** |
| `js/tools/test-tools.js` | Dock tools. `SOSTestTools.{meta,forSubject,html,wire}`. Reads `window.PT_ELEMENTS`, `window.LAB_FORMULAS`, `window.SOSToolCtx()` — all exposed by `index.html`. |
| `js/session.js` | Firebase auth + profile → localStorage. Defines `window.SOS`. |
| `pages/admin.html` | Admin panel. Members table, Schools, + syllabus drawer (`sylToggle/sylOpen/sylClose/sylLoad/sylSave`). |
| `pages/account-settings.html` | **The only place** grade + curriculum can be changed. |
| `pages/dashboard.html`, `login.html` | As named. |
| `data/topics.json` | **Generated** from `LAB_TOPICS` + `LAB_ALL_SUBJECTS` in `index.html`. 30 subjects, 1068 grade+topic slots. Regenerate if those change. |
| `data/videos.json` | Curated video library. `{videos:[{grade,subject,topic,provider,ref,title,…}]}`. Currently **empty** — never invent YouTube IDs. |
| `css/theme-dark.css` | The real palette. **Must be present locally or nothing renders correctly.** |
| `firestore.rules` | Includes the `syllabus/{schoolId}` block. **NOT YET DEPLOYED.** |

### `index.html` embed mode
`?embed=1` adds `html.sos-embed`, which hides `.topbar, nav, .marquee, .brand-marquee,
footer.site-footer, aside.sos-planner, .eulid-dock, section.cta-band, .lab-hero, .page-hero`
so the Lab reads as part of `study.html`.

### localStorage keys
```
sos_curriculum, sos_grade, sos_school_id, sos_name, sos_uid   (profile, written by session.js)
sos_lab_session      live Lab state (signed-in only)
sos_notes_local      student notes  [{id,grade,subject,topic,title,reminder,source,text,pages[],transcript,transcriptStatus,createdAt,uploadedAt}]
sos_videos_local     locally-added videos
sos_videos_watched   ["youtube:<id>"]
sos_syllabus_school  {"10_science":[...]}  cached from Firestore by index.html
sos_syllabus_own     {"10_science":[...]}  the student's own additions
sos_open_subject     one-shot handover from study.html → Lab
```
Note attachments (photos/PDFs) live in **IndexedDB** `sos-notes` / store `files`, keyed
`<noteId>_p<N>`. localStorage would blow its ~5MB quota on the second upload.

---

## How to test (do not skip)

The sandbox needs the real CSS or you'll design against the wrong theme:
```bash
# copy the project into a working dir, then:
python3 -m http.server 8844      # serve the PROJECT ROOT
```
Confirm `css/theme-dark.css` returns 200. If it 404s, everything renders in the light
fallback and every visual judgement you make will be wrong. (This happened.)

Verify with Playwright against **computed DOM**, not markup. After every edit:
1. bare-LF count == 0 (for CRLF files)
2. `<div>` open/close balance
3. every inline `<script>` passes `node --check`
4. re-run the existing suites

Suites written this session (in `/tmp`, recreate as needed): sealed-tab, notes/videos
split, subject rail, grade lock, marquee, logo parity, syllabus, admin drawer.

**Patch-script warning:** if a Python edit script `sys.exit`s partway, earlier edits it
already reported "ok" are **not written** — the file write happens at the end. Re-run
everything, don't assume.

---

## What exists right now

**The Lab (`study.html`)** — sealed-ish study tab. WorkHub view with "continue where you
left off" + session stats bound to real `sos_lab_session` data (no invented numbers).
Notes and Videos are **separate** sections, each with its own subject rail (30 subjects
with per-subject counts) and numbered topic list. Marquee on every view. "← Back to site"
on WorkHub only. Logo lifted byte-for-byte from `index.html`.

**Notes** — typed or uploaded. Images + PDFs, drag-drop, 25MB cap, stored in IndexedDB.
Each note has a title, a free-text **reminder**, chosen subject+topic, and a full
date+time stamp. Reader renders images inline and PDFs in a viewer, each downloadable.
Deleting a note deletes its blobs.

**Videos** — YouTube only, embedded via `youtube-nocookie.com`. Add by pasting any URL
form. `data/videos.json` is empty by design.

**Grade + curriculum are account-only.** Every control that could change them is
*removed* (not disabled) from the Lab, Test Mode, Notes and Videos. Source of truth is
`sosProfile()` in `index.html`; the account always beats a stale saved session.

**Reference tab + dock tools** — periodic table with all 118 elements (accurate masses,
electron configs generated by aufbau + known exceptions, kid-friendly facts) and formula
sheets: 10 subjects, 30 grade-sheets, 209 topics, 886 entries. Styled "Spectrum" —
category hue at 26% with a coloured top edge, filling solid on select.

**Syllabus (just built, UNVERIFIED against real Firestore).**
Three sources in order: school's published list → student's own additions → built-in
`topics.json`. School list *replaces* the built-in when set; students may add but never
remove school topics. Admin drawer in `pages/admin.html`; student editor is "✎ My
syllabus" on Notes. Data model:
```
syllabus/{schoolId}/subjects/{grade}_{subject} → { topics:[], updatedAt, updatedBy }
```

---

## Next steps, roughly in order

1. **Deploy the rules** — `firebase deploy --only firestore:rules`. Until then every
   syllabus read/write fails with "Missing or insufficient permissions". Then verify one
   admin save and one student read. **I could not test any Firestore path.**
2. **Mobile.** Tested at iPhone 13 width: no horizontal overflow anywhere, but —
   periodic-table cells render **12×30px with clipped symbols** (unusable); `study.html`'s
   nav **overlaps content** on phones (no mobile breakpoint); several tap targets under
   44px (Help 28×20, Sign In 42×14, tool close 15×18). Indian students are phone-first
   and photographing notes is inherently a phone action — this matters.
3. **Move notes + student syllabus to Firestore/Storage.** Currently per-device. Owner-only
   rules recommended (do NOT copy the planner rule that lets school admins read).
4. **Then the AI phases** — OCR at upload writing into the existing `transcript` field,
   then question generation from stored text. Budgeted at ~$0.42/active student/month
   (Haiku 4.5 batched + OCR). Keep the existing hand-written question generator as the
   day-one fallback.
5. **Fix the ~25 subject colours** with no dark-theme value.
6. **Normalise `sos_grade`** at the source in `account-settings.html` (+ migration).

## Design direction (decided, not yet built)
The owner wants to move away from the current cosmic homepage toward a **Fxology-style**
look: near-black, one accent glow from the top, ghosted background glyphs (use real
**maths** — `√2+12`, `∑`, `π`, `∫`), tight Space Grotesk display type with a soft bloom,
floating pill nav, split CTA (filled pill + circular arrow, plus a dark pill).
Mockups were approved in principle; nothing is built.
