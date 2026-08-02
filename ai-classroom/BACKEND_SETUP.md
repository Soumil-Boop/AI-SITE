# Seek-O-Sphere — Backend Setup Guide

This guide documents the Firebase backend that powers accounts, progress tracking, the student dashboard and the admin panel.

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

---

## IMPORTANT: How Firebase Is Implemented

The site uses the Firebase **COMPAT** SDK loaded via CDN script tags — **not** ES modules:

```html
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
```

Initialized (in `js/session.js` and inline where needed) with:

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

## Firestore Security Rules

These live in `firestore.rules` in the repo. **GitHub Pages does not deploy them** — you must publish them in **Firebase console → Firestore Database → Rules → Publish**.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }

    // True when the signed-in user's own profile has role == 'admin'.
    function isAdmin() {
      return isSignedIn()
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // User profiles: a user reads/edits their own; an admin can read all,
    // change roles, and delete accounts.
    match /users/{uid} {
      allow read:   if isSignedIn() && (request.auth.uid == uid || isAdmin());
      allow create: if isSignedIn() && request.auth.uid == uid;
      allow update: if isSignedIn() && (request.auth.uid == uid || isAdmin());
      allow delete: if isAdmin();
    }

    // Practice progress: each user reads/writes only their own; admins can read all.
    match /progress/{uid}/{document=**} {
      allow read:  if isSignedIn() && (request.auth.uid == uid || isAdmin());
      allow write: if isSignedIn() && request.auth.uid == uid;
    }
  }
}
```

> The admin `read: all users` rule is what makes the Admin Panel's user list populate. If the panel says "Loading users…" forever, these rules almost certainly aren't published.

---

## Login & Routing Flow

1. User visits `pages/login.html`.
2. Signs in with email/password or Google (or continues as a guest).
3. A `SIGNING_IN` flag guards `onAuthStateChanged` so a fresh sign-in is verified **once**, avoiding a flash of the student dashboard for admins.
4. The user's Firestore profile is read and cached (`routeByRole`):
   - `role == 'admin'` → `admin.html`
   - `role == 'student'` → `dashboard.html`
   - guest / anonymous → `index.html`
5. Sign out from any page lands on the home page (`window.location.replace`).

**Optimistic UI.** `js/session.js` paints the account menu instantly from `localStorage` (`sos_name`, `sos_role`, `sos_photo`, …) and then reconciles with the live Firestore profile, so the name/avatar don't lag.

---

## Firestore Data Model (current)

### `users/{uid}`

```js
{
  name:          "Student Name",
  email:         "student@email.com",
  role:          "student",      // or "admin"
  curriculum:    "cbse",         // default curriculum
  ageGroup:      "11-13",        // default age group
  photo:         "<data-url|null>",
  totalQuestions: 0,             // running total answered
  correctTotal:   0,             // running total correct
  bestStreak:     0,
  createdAt:      <timestamp>,
  lastActive:     <timestamp>
}
```

### `progress/{uid}/daily/{YYYY-MM-DD__mode__subject}`

One document per **day × mode × subject**, updated with atomic increments as the learner answers:

```js
{
  date:      "2026-08-02",
  mode:      "curriculum",       // or "exam"
  subject:   "math",
  label:     "Math",             // human-readable subject label
  questions: 12,                 // FieldValue.increment(1) per answer
  correct:   9,                  // FieldValue.increment(1) when correct
  lastTs:    <serverTimestamp>
}
```

**How it's written** (`recordProgress()` in `index.html`): on every answer the code updates the matching `progress/{uid}/daily/{id}` document **and** the `users/{uid}` aggregate (`totalQuestions`, `correctTotal`, `lastActive`, and `bestStreak` when beaten). Because writes use `merge: true` and `FieldValue.increment`, they're safe to call repeatedly and work offline.

> This replaces the older per-session model (`progress/{uid}/lab|quiz|examprep/{sessionId}`). The daily aggregation keeps reads cheap and powers the dashboard charts and the admin per-user viewer directly.

---

## Dashboard (`pages/dashboard.html`)

- Reads the profile from Firestore on load; instant-paints name/photo from cache first.
- If the signed-in user is an admin, it redirects straight to `admin.html`.
- **Headline stats:** Overall Accuracy, Best Streak, Active Days.
- **Progress Report:** a smooth area chart of questions per day with a Last 7 Days / Last Month / Lifetime range switch and hover tooltips.
- **Per-subject breakdown:** accuracy donuts and totals, most-practised first.
- **Activity heatmap** and a **recent-sessions** log.
- **Profile picture:** upload (resized to a 256px JPEG data URL) or remove.

---

## Admin Panel (`pages/admin.html`)

- Optimistic admin gate: shows instantly for a cached admin, confirms role in the background, redirects non-admins away.
- **User table:** Name, Email, Role, Questions, Accuracy, Best Streak, Last Active, Actions.
- **View (👁):** opens a modal that loads that user's `progress/{uid}/daily` documents and renders a summary donut, per-subject rows and a session list (cached per user).
- **Role management** and **account deletion** (backed by the admin rules above).
- If listing fails, a clear "permission denied" message points to publishing the rules.

---

## Making Someone an Admin

1. Firebase console → Firestore → `users` collection.
2. Open the person's document (ID = their `uid`).
3. Set `role` to `admin`.
4. They sign out and back in — they'll route to `admin.html`.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Admin panel stuck on "Loading users…" | Firestore rules not published — publish `firestore.rules`. |
| Dashboard shows zeros | Progress records from the next signed-in Lab session onward; answer a few questions. |
| Emails/users not visible to admin | Same as above — the admin `read: all` rule must be live. |
| Name/avatar lags on load | Expected only on a brand-new device before the cache fills; it self-corrects. |
| Works offline but "doesn't update" | Offline persistence caches data; changes sync when back online. |

---

*Backend for Seek-O-Sphere. Firebase project `ai-classroom-ad779`.*
