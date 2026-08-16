# Seek-O-Sphere — Backend Setup Guide

This guide documents the Firebase backend that powers accounts, progress tracking, the study planner, the student dashboard and the admin panel.

---

## Current Status

Firebase is fully set up and working:

- **Firebase project:** `ai-classroom-ad779`
- **Authentication:** Email/Password, Google, Anonymous (guest) — all enabled
- **Firestore:** created, region `asia-south2`
- **Firestore rules:** must be published in the Firebase console (see below)
- **Offline persistence:** enabled for local-first reads/writes
- `login.html`, `dashboard.html`, `admin.html`, `index.html` and `js/session.js` all use the Firebase **compat** SDK
- **Progress tracking:** live — every answered Lab/Exam question is written to Firestore
- **Three access levels** with a school boundary enforced in the rules themselves

---

## IMPORTANT: How Firebase Is Implemented

The site uses the Firebase **COMPAT** SDK loaded via CDN script tags — **not** ES modules:

```html
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
```

Initialised (in `js/session.js` and inline where needed) with:

```js
firebase.initializeApp({ /* config below */ });
var auth = firebase.auth();
var db   = firebase.firestore();

// Local-first: serve reads from cache, commit writes locally first, sync in the background.
db.enablePersistence({ synchronizeTabs: true }).catch(function(){});
```

> **Do not switch these to ES-module imports.** The modular SDK caused silent failures; the compat SDK works reliably. (`js/firebase-config.js` contains an ES-module version kept only for reference — it is not what the live pages load.)

**Light vs. full pages.** Content pages load `firebase-app` + `firebase-auth` only, so the account menu renders from a cached name and pages stay fast. Pages that need profile/progress data (`index.html`, `login`, `dashboard`, `admin`, `account-settings`) also load `firebase-firestore`.

---

## Firebase Credentials

Public web config (safe to ship in client code; access is controlled by Firestore rules):

```js
firebase.initializeApp({
  apiKey: "AIzaSyDX2tV-DbdeubspGyTqd4ARkRwDV9XQREQ",
  authDomain: "ai-classroom-ad779.firebaseapp.com",
  projectId: "ai-classroom-ad779",
  storageBucket: "ai-classroom-ad779.firebasestorage.app",
  messagingSenderId: "433385304033",
  appId: "1:433385304033:web:ab53d599b22b8bd4766ca0"
});
```

---

## Three Levels of Access

| Role | Sees |
|---|---|
| `owner` | Every member, every school, every admin. The only role that can create schools, appoint admins, or read across school boundaries. |
| `schooladmin` | **Only** that school's students. No other school, no online students, and no admin accounts — not even their own row. |
| `student` | Only themselves. |

`js/core/role.js` treats `owner`, `admin` and `schooladmin` as admin-ish for routing purposes (`admin` is a legacy value), and remembers the role per tab in `sessionStorage` (`sos_tab_role`) as well as per device (`sos_uid`, `sos_role`), so a shared machine does not leak a role between tabs.

---

## How the School Boundary Is Enforced

This is the part worth understanding before changing anything.

Firestore cannot filter a list for you. It can only refuse a query whose results it cannot guarantee are all allowed. So every user document carries a **derived** `bucket` field that says, in one value, which list it belongs to:

```
'school:<schoolId>'   a student in that school
'online'              a student who joined without a code
'staff'               any admin or the owner
```

A school admin's panel queries `where('bucket','==','school:<their id>')`. Every document that query can return is, by definition, one of their own students — so the rule is satisfiable and the query is allowed. Ask for anything wider and Firestore refuses the whole query, not just the extra rows.

`bucket` is **derived, never free-form**: the write rules recompute it from `role` and `schoolId` and reject any document whose stored bucket disagrees. That stops someone editing their own profile to appear in — or vanish from — a school's list. One equality filter also means Firestore's automatic single-field index covers it, so there is no composite index to create.

```
function bucketFor(d) {
  return d.role != 'student'
    ? 'staff'
    : (!('schoolId' in d) || d.schoolId == null || d.schoolId == ''
        ? 'online'
        : 'school:' + d.schoolId);
}
```

---

## Firestore Security Rules

The rules live in `firestore.rules` in the repo. **GitHub Pages does not deploy them** — publish them in **Firebase console → Firestore Database → Rules → Publish**.

What they grant, collection by collection:

**`schools/{schoolId}`** — only the owner creates, edits or lists schools. A school admin may `get` their own school so the panel can show its name. Nobody else can read the list at all.

**`joinCodes/{code}`** — the document ID *is* the code, so a code can only be looked up by someone who already knows it. `list` is owner-only, which means the collection cannot be enumerated to harvest codes.

**`users/{uid}`**
- `get` — yourself, the owner, or a school admin reading one of their own students.
- `list` — the owner freely; a school admin only when the query is narrowed to their own bucket.
- `create` — your own profile at sign-up. You always start as a `student`, the bucket must match what you claim, and any school you name must exist.
- `update` — your own profile (you cannot promote yourself, and any school you move into must exist and be reflected in the bucket); the owner may change anything including roles; a school admin may edit their own students but cannot grant a role and cannot move a student out of their own sight.
- `delete` — the owner, or a school admin deleting one of their own students.

**`planner/{uid}/**`** — the student's own days, plus the owner, plus the admin of the school that student belongs to, so an admin can set work.

> **A documented limitation, not a guarantee.** Rules are all-or-nothing per document, and a planner day is one document, so an admin who may add an item is technically able to read the whole day. The panel therefore shows an admin only the items an admin set; a student's own private notes are round-tripped untouched and never displayed. That is a decision in the application code, not a promise from the rules, and it is written down so nobody later mistakes it for one.

**`progress/{uid}/**`** — readable by the student, the owner, and the admin of the school that student belongs to (the rule does a `get()` on the user document to tie a progress record back to its owner's school). Writable only by the student.

> If the Admin Panel says "Loading users…" forever, these rules almost certainly aren't published.

---

## Login & Routing Flow

1. User visits `pages/login.html`.
2. Signs in with email/password or Google (or continues as a guest).
3. A `SIGNING_IN` flag guards `onAuthStateChanged` so a fresh sign-in is verified **once**, avoiding a flash of the student dashboard for admins.
4. The user's Firestore profile is read and cached:
   - `owner`, `schooladmin` (or legacy `admin`) → `pages/admin.html`
   - `student` → `pages/dashboard.html`
   - guest / anonymous → `index.html`
5. Sign out from any page lands on the home page (`window.location.replace`).

**Optimistic UI.** `js/session.js` paints the account menu instantly from `localStorage` (`sos_name`, `sos_role`, `sos_photo`, …) and then reconciles with the live Firestore profile, so the name and avatar don't lag.

---

## Firestore Data Model (current)

### `users/{uid}`

```js
{
  name:          "Student Name",
  email:         "student@email.com",
  role:          "student",          // 'student' | 'schooladmin' | 'owner'
  schoolId:      "abc123" | null,    // null/'' for an online learner
  bucket:        "school:abc123",    // derived: 'school:<id>' | 'online' | 'staff'
  curriculum:    "cbse",
  ageGroup:      "11-13",
  photo:         "<data-url|null>",
  totalQuestions: 0,
  correctTotal:   0,
  bestStreak:     0,
  createdAt:      <timestamp>,
  lastActive:     <timestamp>
}
```

### `schools/{schoolId}`

```js
{ name: "…", joinCode: "…", createdAt: <timestamp> }   // owner-writable only
```

### `joinCodes/{code}`

The document ID is the code itself; the body maps it to a school.

### `progress/{uid}/daily/{YYYY-MM-DD__mode__subject}`

One document per **day × mode × subject**, updated with atomic increments as the learner answers:

```js
{
  date:      "2026-08-16",
  mode:      "curriculum",       // or "exam"
  subject:   "math",
  label:     "Math",
  questions: 12,                 // FieldValue.increment(1) per answer
  correct:   9,                  // FieldValue.increment(1) when correct
  lastTs:    <serverTimestamp>
}
```

**How it's written** (`recordProgress()` in `index.html`): on every answer the code updates the matching `progress/{uid}/daily/{id}` document **and** the `users/{uid}` aggregate (`totalQuestions`, `correctTotal`, `lastActive`, and `bestStreak` when beaten). Because writes use `merge: true` and `FieldValue.increment`, they are safe to call repeatedly and work offline.

### `planner/{uid}/…`

Per-user, per-date study-planner documents, written by `js/core/planner.js`. A school admin may add items for their own students; see the limitation noted above.

---

## Dashboard (`pages/dashboard.html`)

- Reads the profile from Firestore on load; instant-paints name and photo from cache first.
- If the signed-in user is an admin, it redirects straight to `admin.html`.
- **Headline stats:** Overall Accuracy, Best Streak, Active Days.
- **Progress Report:** a smooth area chart of questions per day with a Last 7 Days / Last Month / Lifetime range switch and hover tooltips.
- **Per-subject breakdown:** accuracy donuts and totals, most-practised first.
- **Activity heatmap** and a **recent-sessions** log.
- **Profile picture:** upload (resized to a 256px JPEG data URL) or remove.

---

## Admin Panel (`pages/admin.html`)

- Optimistic admin gate: shows instantly for a cached admin, confirms the role in the background, redirects non-admins away.
- **User table:** Name, Email, Role, Questions, Accuracy, Best Streak, Last Active, Actions — scoped to the signed-in admin's own school unless they are the owner.
- **View (👁):** a modal that loads that user's `progress/{uid}/daily` documents and renders a summary donut, per-subject rows and a session list (cached per user).
- **Role management** and **account deletion**, both bounded by the rules above — a school admin cannot grant a role and cannot act outside their school.
- If listing fails, a clear "permission denied" message points to publishing the rules.

---

## Making Someone an Admin

Roles are handed out by the owner, either from the Admin Panel or directly:

1. Firebase console → Firestore → `users` collection.
2. Open the person's document (ID = their `uid`).
3. Set `role` to `schooladmin` (or `owner`), and set `schoolId` to the school they run.
4. Set `bucket` to `staff` — it must agree with `bucketFor()` or writes will be rejected.
5. They sign out and back in — they'll route to `admin.html`.

> Because `bucket` is derived, changing `role` or `schoolId` without updating `bucket` to match will fail the write rules. Change all three together.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Admin panel stuck on "Loading users…" | Firestore rules not published — publish `firestore.rules`. |
| A school admin sees an empty user list | Their `schoolId` is unset, or their students' `bucket` values don't read `school:<that id>`. |
| A write is rejected for no obvious reason | `bucket` disagrees with `bucketFor(role, schoolId)`. Update all three fields together. |
| Dashboard shows zeros | Progress records from the next signed-in Lab session onward; answer a few questions. |
| Name/avatar lags on load | Expected only on a brand-new device before the cache fills; it self-corrects. |
