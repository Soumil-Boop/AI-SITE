/* ============================================================
   session.js — Shared auth session + account menu (Firebase compat)
   Loaded on every page (after the firebase compat CDN scripts).
   Performance note: content pages only load firebase-app + firebase-auth
   (NOT firestore), so the account menu works from a cached name and the
   pages stay light. Pages that actually need profile data (dashboard,
   profile, account-settings, login, index) load firestore too.
   ============================================================ */
(function () {
  var CONFIG = {
    apiKey: "AIzaSyDX2tV-DbdeubspGyTqd4ARkRwDV9XQREQ",
    authDomain: "ai-classroom-ad779.firebaseapp.com",
    projectId: "ai-classroom-ad779",
    storageBucket: "ai-classroom-ad779.firebasestorage.app",
    messagingSenderId: "433385304033",
    appId: "1:433385304033:web:ab53d599b22b8bd4766ca0"
  };

  var inPages = location.pathname.indexOf('/pages/') !== -1;
  var P    = inPages ? '' : 'pages/';
  var HOME = inPages ? '../index.html' : 'index.html';

  function store(k, v){ try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch(e){} }
  function read(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }

  /* Everything we mirror out of the profile so pages can paint before the
     network answers. It is all tied to ONE person, so it travels with
     sos_uid and is thrown away the moment a different account signs in —
     otherwise the previous member's name, photo and role bleed into the
     new session, and a stale 'admin' role even misroutes them. */
  var CACHE_KEYS = ['sos_name','sos_role','sos_photo','sos_curriculum','sos_grade',
                    'sos_age','sos_type','sos_enjoys','sos_hard','sos_school'];
  function forgetCache(){
    CACHE_KEYS.forEach(function(k){ store(k, null); });
    store('sos_uid', null);
    tabStore('sos_tab', null);
  }
  window.SOSCache = { keys: CACHE_KEYS, forget: forgetCache, uid: function(){ return read('sos_uid'); } };

  if (typeof firebase === 'undefined') {
    window.SOS = { onSession: function(){}, signOut: function(){ window.location.replace(HOME); } };
    return;
  }
  if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(CONFIG);

  var auth = firebase.auth();
  var db   = (typeof firebase.firestore === 'function') ? firebase.firestore() : null;  // may be absent on light pages

  /* ---- One tab, one session -------------------------------------------
     Firebase signs people in for good by default: it keeps the session in
     localStorage, which outlives the tab, the browser and the computer being
     switched off. On a shared or school machine that means the next person to
     open the site is still signed in as the last one.

     SESSION persistence keeps the session in the tab instead. Moving between
     pages and reloading are unaffected — it is the same tab — but closing the
     tab ends the session, and opening the site again asks for a sign-in.

     If sessionStorage is unavailable (some private-browsing and locked-down
     setups block it) the fall-back is NONE, which holds the session in memory
     only. That is stricter than asked for — a reload signs them out too — but
     it fails towards signing people out rather than leaving them signed in,
     which is the right way round for a fall-back nobody will notice. */
  function tabRead(k){ try { return sessionStorage.getItem(k); } catch(e){ return null; } }
  function tabStore(k, v){
    try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch(e){}
  }
  (function scopeSignInToTab(){
    var P = firebase.auth && firebase.auth.Auth && firebase.auth.Auth.Persistence;
    if (!P) return;
    function fallback(){ try { auth.setPersistence(P.NONE).catch(function(){}); } catch(e){} }
    try { auth.setPersistence(P.SESSION).catch(fallback); } catch (e) { fallback(); }
  })();

  // Offline persistence: serve reads from a local cache and commit writes
  // locally first (they sync in the background). This removes the network
  // round-trip that made the dashboard / account settings feel laggy.
  if (db && db.enablePersistence) {
    try { db.enablePersistence({ synchronizeTabs: true }).catch(function(){}); } catch (e) {}
  }

  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  function userIcon(){
    return '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.4"/><path d="M4.5 20c.7-3.6 3.9-5.5 7.5-5.5s6.8 1.9 7.5 5.5"/></svg>';
  }

  /* The title shown beside the name. It is the same wording the admin panel
     uses in its member list, so a person is described the same way wherever
     they appear: a school's admin is named after their school, the site owner
     after the site. Returns '' when the role is not known yet — a bare name
     for a moment beats telling an admin they are a student. */
  function roleTitle(profile, user){
    var role   = (profile && profile.role)       || read('sos_role');
    var school = (profile && profile.schoolName) || read('sos_school');
    if (user && user.isAnonymous) return 'Guest';
    if (!role) return '';
    if (role === 'owner' || role === 'admin') return 'Seek-O-Sphere admin';
    if (role === 'schooladmin')               return (school || 'School') + ' admin';
    return 'Student';
  }

  /* Their picture if they have set one, the outline if not. Only the resized
     data URLs this site writes are ever painted — a remote address, or
     anything odd that reached the profile, falls back to the outline rather
     than being placed straight into a style attribute. */
  function userFace(profile){
    var photo = (profile && profile.photo) || read('sos_photo') || '';
    if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(photo)) {
      return '<span class="acct-face" style="background-image:url(' + photo + ')" aria-hidden="true"></span>';
    }
    return userIcon();
  }

  function firstName(profile, user){
    var n = (profile && profile.name) || (user && user.displayName) || read('sos_name') || '';
    if (!n && user && user.email) n = user.email.split('@')[0];
    n = String(n).trim();
    if (n.indexOf('@') !== -1) n = n.split('@')[0];          // if the stored name is an email
    n = n.replace(/[._]+/g, ' ').trim().split(/\s+/)[0];     // first token, drop dots/underscores
    return n ? (n.charAt(0).toUpperCase() + n.slice(1)) : 'there';
  }

  function render(user, profile){
    var el = document.getElementById('acctMenu');
    if (!el) return;
    if (!user) { el.innerHTML = '<a href="' + P + 'login.html" class="topbar-auth">Sign In</a>'; return; }
    // Both admin levels belong on the panel; only students see the dashboard.
    var role = (profile && profile.role) || read('sos_role');
    var isAdmin = role === 'owner' || role === 'schooladmin' || role === 'admin';
    var dashHref  = P + (isAdmin ? 'admin.html' : 'dashboard.html');
    var dashLabel = isAdmin ? 'Admin Panel' : 'My Dashboard';
    var title = roleTitle(profile, user);
    el.innerHTML =
      '<div class="acct-wrap">' +
        '<button class="acct-trigger" type="button">' +
          '<span class="acct-hi">Hi, ' + esc(firstName(profile, user)) + '</span>' +
          (title ? '<span class="acct-role" title="' + esc(title) + '">' + esc(title) + '</span>' : '') +
          userFace(profile) +
        '</button>' +
        '<div class="acct-drop">' +
          '<a href="' + dashHref + '">' + dashLabel + '</a>' +
          '<a href="' + P + 'account-settings.html">Account Settings</a>' +
          '<a href="#" class="acct-logout" onclick="SOS.signOut();return false;">Log Out</a>' +
        '</div>' +
      '</div>';
  }

  /* Everyone who wants to know when the session resolves, and the answer
     once it has. Keeping the answer matters: subscribers arrive at different
     moments — footer.js registers on DOMContentLoaded, the home page's resume
     strip later still — and auth can easily resolve before they get there. A
     list-only version silently never calls them, which showed up as a footer
     stuck on "Sign in" for a signed-in person on any slow load. A late
     subscriber now gets the answer immediately instead of waiting for a
     second sign-in that never comes. */
  var callbacks = [];
  var settled = false, lastUser = null, lastProfile = null;
  function fire(user, profile){
    settled = true; lastUser = user; lastProfile = profile;
    callbacks.forEach(function(cb){ try { cb(user, profile); } catch(e){} });
  }

  /* One profile read per page load, shared by everyone who wants it. The
     dashboard and the admin panel used to each fire their own copy of this
     exact query alongside session.js's, so every visit paid for the same
     document twice. */
  var profileRead = null;

  window.SOS = {
    auth: auth, db: db, P: P, HOME: HOME, user: null, profile: null,
    onSession: function(cb){
      callbacks.push(cb);
      if (settled) { try { cb(lastUser, lastProfile); } catch(e){} }
    },
    profileOnce: function(uid){
      if (!db) return Promise.reject(new Error('firestore not loaded on this page'));
      if (!profileRead) profileRead = db.collection('users').doc(uid).get();
      return profileRead;
    },
    // Call after writing the profile, so the next reader does not serve a stale copy.
    forgetProfileRead: function(){ profileRead = null; },
    signOut: function(){
      forgetCache();
      auth.signOut().then(function(){ window.location.replace(HOME); })
                    .catch(function(){ window.location.replace(HOME); });
    }
  };

  /* The mirrored profile lives in localStorage, which the closing tab does not
     take with it, so a name, a photo and a role can outlive the session they
     belong to. A tab that carries no marker of its own has nobody signed in to
     it, and whatever is in that cache belongs to a tab that has since been
     closed: drop it before a line of it is painted. On a shared computer that
     is the difference between the next person seeing a sign-in prompt and
     seeing the last person's name and face. */
  if (tabRead('sos_tab') !== read('sos_uid')) forgetCache();

  // Optimistic paint: show the cached name the instant the page loads, before
  // auth/Firestore resolve. Only when the cache is stamped with the uid it came
  // from — an unstamped cache is from an older build and cannot be trusted to
  // belong to whoever is about to sign in.
  if (read('sos_uid') && read('sos_name')) render({ displayName: read('sos_name') }, { name: read('sos_name') });

  auth.onAuthStateChanged(function(user){
    SOS.user = user;
    if (!user) {
      SOS.profile = null; forgetCache();
      render(null, null);
      fire(null, null);
      return;
    }
    // A different person than the cache belongs to: drop it all before anything
    // is painted, so no part of the last account shows up in this one.
    if (read('sos_uid') !== user.uid) forgetCache();
    store('sos_uid', user.uid);
    // This tab's own record that somebody is signed in here. It goes when the
    // tab does, which is what lets the next tab tell a live session from the
    // leftovers of a closed one.
    tabStore('sos_tab', user.uid);
    // Paint from cache immediately so the name doesn't wait on the network read.
    render(user, { name: read('sos_name') });
    if (db) {
      SOS.profileOnce(user.uid).then(function(snap){
        var profile = (snap && snap.exists) ? snap.data() : null;
        SOS.profile = profile;
        if (profile) {
          if (profile.name)       store('sos_name', profile.name);
          if (profile.curriculum) store('sos_curriculum', profile.curriculum);
          if (profile.grade)      store('sos_grade', profile.grade);
          if (profile.ageGroup)   store('sos_age', profile.ageGroup);
          store('sos_photo', profile.photo || null);
          store('sos_role', profile.role || 'student');
          store('sos_school', profile.schoolName || null);
        }
        render(user, profile);
        fire(user, profile);
      }).catch(function(){
        render(user, null);
        fire(user, null);
      });
    } else {
      // Light page (no firestore): render from cached name, no profile fetch.
      render(user, null);
      fire(user, null);
    }
  });
})();
