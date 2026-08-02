# Seek-O-Sphere 🌐

A free, interactive educational website that teaches **Artificial Intelligence to everyone, ages 8 to 80**. Built with plain HTML, CSS, and JavaScript — no frameworks, no build tools, no dependencies.

> AI is a tool. **You** are the thinker. Eulid agrees. 🤖

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 — a single-page app (`index.html`) plus standalone auth/dashboard pages |
| Styling | Vanilla CSS with a custom "Sienna" design system (inline in `index.html`, modular files under `css/`) |
| Scripting | Vanilla JavaScript (ES6+), no framework |
| Fonts | Google Fonts — Nunito (headings) + Inter (body) |
| Questions | Local engine: algorithmic math + JSON bank, with an optional Claude API mode |
| Auth | Firebase Authentication (compat SDK v10.12.0) |
| Database | Cloud Firestore (compat SDK v10.12.0, offline persistence on) |
| Hosting | GitHub Pages |
| Dev server | VS Code Live Server |

---

## What the Site Includes

- **Home** — hero, the friendly alien mascot **Eulid** (whose eyes follow the cursor), an animated neural-network canvas, and a seamless infinite brand marquee.
- **Learn chapters** — What is AI?, History, Types, Study Tools, Using AI Responsibly (Ethics).
- **History (interactive)** — a 1950→2026 year scrubber, a five-era ribbon, a focus card with "Then / Now" for landmark years, quick-jump landmark chips, and a "Guess the Year" mini-quiz.
- **Visual Learning Lab** — two modes:
  - *Curriculum Lab*: questions matched to CBSE, ICSE, UK, US, or IB, by age group, across Math, Science, English, History and Geography.
  - *Exam Prep*: competitive-exam questions for CUET, Railways, Bank PO, SSC and UPSC, with difficulty levels and an optional session timer.
  - Both feature the Eulid tutor, hints, explanations, streaks, and save progress to Firestore.
- **Find My AI Tool** — a recommender that scores 20+ AI tools by keywords, subject and "free" filters.
- **Help Centre** — a searchable FAQ with a calm topic-card landing pattern.
- **Resources & Contact** — curated free resources and a contact form.
- **Accounts** — sign up / sign in with email or Google (plus guest browsing).
- **Student Dashboard** — profile-picture upload, headline stats (Overall Accuracy, Best Streak, Active Days), a Progress Report chart (Last 7 Days / Last Month / Lifetime), per-subject breakdown, an activity heatmap and a recent-sessions log.
- **Admin Panel** — a full user list with each learner's questions, accuracy, best streak and last-active, a per-user progress viewer, role management and account deletion.

---

## Project Structure

```
ai-classroom/                     <- Live Server root
├── index.html                    <- Main single-page app (all learning sections)
├── README.md
├── BACKEND_SETUP.md
├── firestore.rules               <- Firestore security rules (publish in Firebase console)
├── favicon.svg
├── pages/
│   ├── login.html                <- Firebase compat auth (email + Google + guest)
│   ├── dashboard.html            <- Student dashboard
│   ├── admin.html                <- Admin panel (admin role only)
│   ├── account-settings.html
│   └── (standalone content pages: what-is-ai, history, types, study-tools,
│        more-study, ethics, finder, resources, contact, lab, profile)
├── css/
│   ├── base/         variables.css · reset.css · typography.css
│   ├── components/   nav.css · buttons.css · cards.css · forms.css
│   ├── layout/       grid.css · sections.css
│   ├── pages/        hero.css · lab.css · finder.css · study.css
│   └── dashboard.css                 <- login / dashboard / admin styles
├── js/
│   ├── session.js                <- Shared auth session + account menu (compat)
│   ├── questions-engine.js       <- Local + optional Claude-API question engine
│   ├── firebase-config.js        <- ES-module config (reference)
│   ├── geo-data.js
│   ├── core/         nav.js (mountNav, sosMark logo) · utils.js
│   ├── components/   lab.js · finder.js · contact.js
│   ├── auth/         auth.js
│   └── db/           users.js · progress.js · badges.js
├── data/
│   ├── question-bank.json        <- Local question bank
│   └── tools-data.js             <- AI-tool catalogue for "Find My AI Tool"
└── assets/
    └── images/                   <- Page illustrations
```

> **Note on the two "faces" of the app.** `index.html` is the canonical, self-contained experience (all learning sections live inside it and are shown via `showPage()`). The files under `pages/` provide the authenticated flows (login, dashboard, admin, settings) plus a set of standalone content pages that share `js/core/nav.js`. The modular files under `js/db/` and `js/components/` are supporting/legacy modules; the live progress-saving logic runs inline in `index.html`.

---

## Design System (Sienna)

| Token | Value | Role |
|---|---|---|
| `--brand` | `#8B3620` | Primary sienna |
| `--brand-dark` | `#46200F` | Nav, dark backgrounds |
| `--brand-light` | `#F1DACF` | Light tints |
| `--accent` | `#C0562F` | Terracotta CTAs |
| `--accent-dark` | `#9A3F1E` | Dark accent text |
| `--green` | `#5F7355` | Success / correct answers |
| `--purple` | `#6E5460` | Secondary accents |
| `--text` | `#3E2B1E` | Body text |
| `--muted` | `#8B6E5A` | Secondary text |

- **Headings:** Nunito 700–900 · **Body:** Inter 400–600
- **Mascot:** Eulid, a friendly alien whose pupils track the cursor.
- **Wordmark:** "Seek-**O**-Sphere", where the **O** is a hand-built solar-system SVG mark.

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
- **SDK:** Firebase **compat** v10.12.0 via CDN script tags (not ES modules)
- **Offline persistence:** enabled (`enablePersistence({ synchronizeTabs: true })`) for instant, local-first reads/writes

**Firestore data model (current):**

```
users/{uid}
  name, email, role ('student' | 'admin'),
  curriculum, ageGroup, photo,
  totalQuestions, correctTotal, bestStreak,
  createdAt, lastActive

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

- **`json`** — algorithmic math plus a curated JSON bank (`data/question-bank.json`). Free, offline, no API cost.
- **`api`** — live questions from Claude (`claude-sonnet-4-6`) through a Cloudflare Worker proxy. The JSON bank is the automatic fallback if the API path fails.

Both paths return the same object shape the Lab and Exam Prep renderers expect.

---

## Roles — Making Yourself an Admin

1. Sign up on the site.
2. Firebase console → Firestore → `users` collection.
3. Open your document (its ID is your `uid`).
4. Change `role` from `student` to `admin`.
5. Sign out and back in — you'll land straight on the Admin Panel.

Role changes are done in the Firebase console (or by an existing admin from the Admin Panel).

---

## Notable Recent Changes

- Rebranded to **Seek-O-Sphere** with the Sienna palette and the Eulid mascot.
- Lab and Exam Prep now **save progress to Firestore** (per-day, per-subject) and power the dashboard and admin views.
- **Admin Panel** lists every user with scores and a per-user progress viewer.
- **History** rebuilt into an interactive scrubber + focus card + "Guess the Year".
- Added a searchable **Help Centre**.
- The standalone **Quiz** page was retired.
- Infinite brand marquee reworked to loop seamlessly on any screen width.

---

*Made with ❤️ for curious learners everywhere. AI is a tool. You are the thinker. Eulid agrees.*
