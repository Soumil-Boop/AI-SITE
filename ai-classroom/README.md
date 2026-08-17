# Seek-O-Sphere 🌐

A free, interactive educational website that teaches **Artificial Intelligence to everyone, ages 8 to 80**. Built with plain HTML, CSS and JavaScript — no frameworks, no build tools, no dependencies.

> AI is a tool. **You** are the thinker. Eulid agrees. 🤖

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 — one single-page app (`index.html`) holding eleven sections, plus standalone auth/dashboard pages |
| Styling | Vanilla CSS. Light "Sienna" tokens define the base; `css/theme-dark.css` overrides them into the dark "Observatory" look the site actually wears |
| Scripting | Vanilla JavaScript (ES5-compatible in the shared components), no framework |
| Fonts | Google Fonts — Space Grotesk (display), Inter (body), Nunito (marquee), JetBrains Mono (labels) |
| Questions | Local engine: algorithmic maths + a JSON bank, with an optional Claude API mode |
| Auth | Firebase Authentication (compat SDK v10.12.0) |
| Database | Cloud Firestore (compat SDK v10.12.0, offline persistence on) |
| Hosting | GitHub Pages |
| Dev server | VS Code Live Server |

---

## What the Site Includes

- **Home** — hero, the alien mascot **Eulid**, an animated starfield with planets, and a seamless infinite brand marquee.
- **Learn chapters** — What is AI?, History, Types, Study Tools, Using AI Responsibly (Ethics).
- **History (interactive)** — a 1950→2026 year scrubber, a five-era ribbon, a focus card with "Then / Now" for landmark years, quick-jump chips and a "Guess the Year" mini-quiz.
- **Visual Learning Lab** — two modes:
  - *Curriculum Lab*: questions matched to CBSE, ICSE, UK, US or IB, by age group, across Maths, Science, English, History and Geography.
  - *Exam Prep*: competitive-exam questions for CUET, Railways, Bank PO, SSC and UPSC, with difficulty levels and an optional session timer.
  - Both feature the Eulid tutor, hints, explanations, streaks, and save progress to Firestore.
- **Find My AI Tool** — a recommender that scores 20+ AI tools by keywords, subject and "free" filters.
- **Help Centre** — a searchable FAQ with a calm topic-card landing pattern.
- **Resources & Contact** — curated free resources and a contact form.
- **Study planner** — a persistent side panel (`js/core/planner.js`) with day / week / month views.
- **Accounts** — sign up / sign in with email or Google, plus guest browsing.
- **Student Dashboard** — profile-picture upload, headline stats (Overall Accuracy, Best Streak, Active Days), a Progress Report chart (Last 7 Days / Last Month / Lifetime), per-subject breakdown, an activity heatmap and a recent-sessions log.
- **Admin Panel** — a user list with each learner's questions, accuracy, best streak and last-active, a per-user progress viewer, role management and account deletion. **School admins see only their own school** — see *Access levels* below.

---

## Eulid, the mascot

Eulid is more than decoration; he is a small feature in his own right. He lives in `js/components/eulid.js` (~37 KB), `css/components/eulid.css` and the shared markup in `assets/eulid.html`.

- **One of him, ever.** On `index.html` the element that floats around is literally the one from the hero, moved. On every other page the markup is fetched once from `assets/eulid.html`. This matters: he is drawn from three gradients addressed by `id`, so two copies in a document means two elements with `id="euBody"` and every fill in the second silently resolves to the first.
- **Which page is "his" is decided by markup, not by filename** — the script asks whether the page ships its own `.mascot-wrap`, so it does not break when a file is renamed or served from a bare `/`.
- **Hold and drag** him anywhere. Press and drag are separated by a 4px threshold, so a click on a leg is never read as a drag.
- **His five legs are tools**, left to right: `lens` (magnifier cursor), `mark` (multi-colour highlighter, with an eraser and a clear-all), `read` (select text and he reads it aloud), `dashboard` (shortcut to your dashboard), `home` (sends **Eulid** back to his usual place — you stay on the page you are reading). Esc or a second press turns any of the modes off.
- **He follows you and then goes home.** His position lives in `sessionStorage` with a timestamp refreshed while the page is visible, so he follows you around the site, and after half an hour away — or when the tab closes — he returns to his default place.

---

## Project Structure

```
ai-classroom/                     <- Live Server root
├── index.html                    <- The app: eleven sections shown via showPage()
├── README.md · BACKEND_SETUP.md · HANDOFF.md
├── firestore.rules               <- Security rules (publish in the Firebase console)
├── structure.js                  <- Page-shape regression check (see HANDOFF.md)
├── favicon.svg
├── docs/                         <- Generated PDFs: README, Technical, Report, User Manual
├── pages/
│   ├── login.html · dashboard.html · admin.html · account-settings.html
│   ├── mission.html              <- Standalone content page
│   └── (thin nav shells: what-is-ai, history, types, study-tools, more-study,
│        ethics, finder, resources, contact, lab, quiz, profile, index)
├── css/
│   ├── theme-dark.css            <- The Observatory palette; the live look
│   ├── dashboard.css             <- login / dashboard / admin
│   ├── base/         variables.css · reset.css · typography.css
│   ├── components/   nav · buttons · cards · forms · footer · marquee ·
│   │                 planner · backdrop · eulid
│   ├── layout/       grid.css · sections.css
│   └── pages/        hero · lab · finder · study · quiz
├── js/
│   ├── session.js                <- Shared auth session + account menu (compat)
│   ├── questions-engine.js       <- Local + optional Claude-API question engine
│   ├── firebase-config.js        <- ES-module config, kept for reference only
│   ├── geo-data.js
│   ├── core/         nav.js · footer.js · planner.js · role.js · theme.js · utils.js
│   ├── components/   eulid.js · lab.js · finder.js · marquee.js · backdrop.js ·
│   │                 contact.js · quiz.js
│   ├── auth/         auth.js
│   ├── db/           users.js · progress.js · badges.js
│   ├── pages/        hero.js
│   └── tools/        india-map.js · test-tools.js
├── data/             question-bank.json · tools-data.js
└── assets/
    ├── eulid.html                <- The one shared copy of the mascot
    ├── backdrop.html
    ├── images/
    └── video/                    <- (currently empty)
```

> **Note on the two "faces" of the app.** `index.html` is the canonical, self-contained experience: home, what, history, types, study, ethics, lab, finder, resources, help and contact all live inside it and are swapped by `showPage()`. Most files under `pages/` are thin shells that mount the shared nav and footer; the substantial ones are `login`, `dashboard`, `admin`, `account-settings` and `mission`. The modules under `js/db/` are supporting/legacy — the live progress-saving logic runs inline in `index.html`.

---

## Design System

The site ships **two** token sets. The light "Sienna" values are the defaults in `:root`; `css/theme-dark.css` restates the same names under `html[data-theme="dark"]`, which is what every page actually sets. Because the site paints almost everything through tokens, restating twenty-odd values converts roughly a thousand declarations at once.

**Observatory (the live palette)**

| Token | Value | Role |
|---|---|---|
| `--obs-void` | `#05080E` | The ground everything sits on |
| `--obs-void-2` | `#080D16` | A second ground, for banded sections |
| `--obs-panel` | `#0C121C` | Raised surfaces: cards, bars |
| `--obs-edge` | `rgba(150,185,225,.14)` | Hairline edges |
| `--obs-ink` | `#E6EDF6` | Body text |
| `--obs-dim` | `#8496AB` | Secondary text — 6.6:1 on the void |
| `--obs-aqua` | `#63E6E2` | The one signal colour |
| `--obs-ember` | `#FF8A4C` | Held back for what matters most |

`js/core/theme.js` no longer switches anything — it pins `data-theme="dark"`, clears any stale `sos_theme` preference, and keeps the `SOSTheme.onChange` subscription alive so the canvas-drawn hero and dashboard charts did not have to be edited.

**Type — each face has one job**

| Face | Where it is used |
|---|---|
| Space Grotesk | Every display role: hero title (700, ~65px), section titles (700, 40px), card headings (700, ~18px), stat numbers, the wordmark, and the quote scroller (400, ~37px) |
| Inter | Everything meant for reading: hero sub-line (400, ~17px), card body, nav links, buttons, badges, stat labels, eyebrows |
| Nunito | The scrolling brand marquee only (800, uppercase, wide tracking) |
| JetBrains Mono | Small uppercase labels — the quote author |

The quote scroller is the site's existing "a person is speaking" treatment: Space Grotesk 400 in `#E6EDF6`, distinct from both headings and body copy. Anything that speaks — a mascot line, a callout — should join that pattern rather than invent a new one.

**Wordmark:** "Seek-**O**-Sphere", where the **O** is a hand-built solar-system SVG mark.

---

## Local Development

The site is fully static — open it with any static server (VS Code Live Server is used here).

- Home: `http://127.0.0.1:5501/ai-classroom/index.html`
- Login: `http://127.0.0.1:5501/ai-classroom/pages/login.html`
- Dashboard: `http://127.0.0.1:5501/ai-classroom/pages/dashboard.html`
- Admin: `http://127.0.0.1:5501/ai-classroom/pages/admin.html`

No build step, no `npm install` — just edit and refresh.

---

## Deployment

Hosted on **GitHub Pages** from the `main` branch; day-to-day work happens on `dev`.

```bash
# work on dev
git checkout dev
git add .
git commit -m "message"
git push origin dev

# deploy
git checkout main
git merge dev
git push origin main
git checkout dev
```

> GitHub Pages serves static files only — it does **not** apply `firestore.rules`. Publish those in the Firebase console (see `BACKEND_SETUP.md`).

---

## Backend at a Glance

- **Firebase project:** `ai-classroom-ad779` (Firestore region `asia-south2`)
- **Auth:** Email/Password, Google, Anonymous (guest) — all enabled
- **SDK:** Firebase **compat** v10.12.0 via CDN script tags, never ES modules
- **Offline persistence:** enabled (`enablePersistence({ synchronizeTabs: true })`)

### Access levels

Three roles, and the boundary between them is enforced in the rules, not just in the UI:

| Role | Sees |
|---|---|
| `owner` | Every member, every school, every admin |
| `schooladmin` | **Only** their own school's students — no other school, no online students, and no admin accounts, not even their own row |
| `student` | Only themselves |

Firestore cannot filter a list for you; it can only refuse a query whose results it cannot guarantee are all allowed. So every user document carries a derived `bucket` field — `school:<schoolId>`, `online`, or `staff` — and a school admin's panel queries `where('bucket','==','school:<their id>')`. Every document that query can return is by definition one of their own students, so the query is satisfiable. `bucket` is recomputed by the write rules from `role` and `schoolId` and rejected if it disagrees, which stops anyone editing their own profile to appear in — or vanish from — a school's list. One equality filter also means Firestore's automatic single-field index covers it, so there is no composite index to create.

### Data model

```
users/{uid}
  name, email, role ('student' | 'schooladmin' | 'owner'),
  schoolId, bucket ('school:<id>' | 'online' | 'staff'),
  curriculum, ageGroup, photo,
  totalQuestions, correctTotal, bestStreak,
  createdAt, lastActive

schools/{schoolId}
  name, joinCode, createdAt          <- only the owner may create or edit

progress/{uid}/daily/{YYYY-MM-DD__mode__subject}
  date, mode ('curriculum' | 'exam'), subject, label,
  questions (running count), correct (running count), lastTs
```

Every answered Lab/Exam question increments the matching daily document and the user aggregate. Full setup, rules and role instructions are in **`BACKEND_SETUP.md`**.

---

## Question Engine

`js/questions-engine.js` exposes a single switch:

```js
const QUESTION_SOURCE = 'json';  // 'json' = free local questions · 'api' = live Claude questions
```

- **`json`** — algorithmic maths plus a curated JSON bank (`data/question-bank.json`). Free, offline, no API cost.
- **`api`** — live questions from Claude through a Cloudflare Worker proxy. The JSON bank is the automatic fallback if the API path fails.

Both paths return the same object shape the Lab and Exam Prep renderers expect.

---

## Notable Recent Changes

- The site is **dark only**. The Observatory palette in `css/theme-dark.css` replaced the cream-and-terracotta look; the theme switch was removed and `theme.js` now only pins the attribute.
- **Three access levels** with school scoping enforced by a derived `bucket` field in `firestore.rules`.
- **Eulid became interactive** — hold and drag, five tool legs (magnifier, highlighter, read-aloud, dashboard shortcut, send-him-home), highlight removal by eraser, per-mark click and clear-all, and one shared copy fetched from `assets/eulid.html` on every page. Signing out returns him to his usual place and closes any open tool.
- A **study planner** side panel with day / week / month views.
- **History** rebuilt into an interactive scrubber + focus card + "Guess the Year".
- Added a searchable **Help Centre**; the standalone Quiz page was retired.
- Infinite brand marquee reworked to loop seamlessly at any width.

---

*Made with ❤️ for curious learners everywhere. AI is a tool. You are the thinker. Eulid agrees.*
