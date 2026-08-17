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

  /* Send Eulid back to his usual place. Signing out ends the session, and
     where he is standing belongs to that session — so he should not still
     be parked wherever the last person dragged him when the next one
     arrives. He owns the remembered position, so the call goes through
     him; clearing the key here is only for the case where his script has
     not loaded on this page, in which case there is no Eulid to move but
     the key would still be sitting there for the page we redirect to. */
  function eulidHome() {
    try { if (window.SOSEulid && SOSEulid.home) { SOSEulid.home(); return; } } catch(e){}
    try { sessionStorage.removeItem('sos_eulid_spot'); } catch(e){}
  }

  if (typeof firebase === 'undefined') {
    window.SOS = { onSession: function(){},
                   signOut: function(){ eulidHome(); window.location.replace(HOME); } };
    return;
  }
  if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(CONFIG);

  var auth = firebase.auth();
  var db   = (typeof firebase.firestore === 'function') ? firebase.firestore() : null;  // may be absent on light pages

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
    /* All three admin roles, not just the oldest one.
       This read `role === 'admin'` only, so an account whose role is
       'owner' — which is what the panel writes today — was shown "My
       Dashboard" in its own menu and sent to the student page by its own
       header. SOSRole is asked first because it knows about the confirmed
       admin flag; the plain reads are the fallback if role.js is absent. */
    var _role = (profile && profile.role)
             || (window.SOSRole && SOSRole.known(user.uid))
             || read('sos_role');
    var isAdmin = (_role === 'owner' || _role === 'admin' || _role === 'schooladmin');
    var dashHref  = P + (isAdmin ? 'admin.html' : 'dashboard.html');
    var dashLabel = isAdmin ? 'Admin Panel' : 'My Dashboard';
    el.innerHTML =
      '<div class="acct-wrap">' +
        '<button class="acct-trigger" type="button">Hi, ' + esc(firstName(profile, user)) + ' ' + userIcon() + '</button>' +
        '<div class="acct-drop">' +
          '<a href="' + dashHref + '">' + dashLabel + '</a>' +
          '<a href="' + P + 'account-settings.html">Account Settings</a>' +
          '<a href="#" class="acct-logout" onclick="SOS.signOut();return false;">Log Out</a>' +
        '</div>' +
      '</div>';
  }

  var callbacks = [];

  window.SOS = {
    auth: auth, db: db, P: P, HOME: HOME, user: null, profile: null,
    onSession: function(cb){ callbacks.push(cb); },
    signOut: function(){
      store('sos_name', null); store('sos_role', null); store('sos_uid', null);
      // The confirmed-admin flag goes with the session that earned it.
      if (window.SOSRole) SOSRole.forget();
      // And so does where the mascot was standing. Done before the sign-out
      // call rather than after it, so the position is already cleared
      // whichever way the promise lands.
      eulidHome();
      auth.signOut().then(function(){ window.location.replace(HOME); })
                    .catch(function(){ window.location.replace(HOME); });
    }
  };

  // Optimistic paint: show the cached name the instant the page loads, before
  // auth/Firestore resolve. A cached name only exists while signed in (sign-out
  // clears it), so this reconciles cleanly once auth confirms.
  if (read('sos_name')) render({ displayName: read('sos_name') }, { name: read('sos_name') });

  /* Whether anyone was signed in during this page's life. It is the
     difference between a sign-out and a visitor who simply never signed
     in — both arrive here as a null user, but only the first should move
     the mascot. A guest who drags him somewhere is entitled to keep him
     there. */
  var hadUser = false;

  auth.onAuthStateChanged(function(user){
    SOS.user = user;
    if (!user) {
      SOS.profile = null; store('sos_name', null); store('sos_photo', null);
      store('sos_role', null); store('sos_uid', null);
      /* Catches the ways out that do not go through SOS.signOut(): the
         dashboard's own button, a session that expires, a sign-out in
         another tab. */
      if (hadUser) eulidHome();
      hadUser = false;
      if (window.SOSRole) SOSRole.forget();
      render(null, null);
      callbacks.forEach(function(cb){ try { cb(null, null); } catch(e){} });
      return;
    }
    hadUser = true;
    // Paint from cache immediately so the name doesn't wait on the network read.
    render(user, { name: read('sos_name') });
    if (db) {
      db.collection('users').doc(user.uid).get().then(function(snap){
        var profile = (snap && snap.exists) ? snap.data() : null;
        SOS.profile = profile;
        if (profile) {
          if (profile.name)       store('sos_name', profile.name);
          if (profile.curriculum) store('sos_curriculum', profile.curriculum);
          if (profile.grade)      store('sos_grade', profile.grade);
          if (profile.ageGroup)   store('sos_age', profile.ageGroup);
          store('sos_photo', profile.photo || null);
          /* Only a role the account actually states. This wrote
             'student' whenever the field was missing, which is how a
             perfectly good admin got demoted by a half-read profile. */
          if (profile.role) {
            store('sos_role', profile.role);
            store('sos_uid', user.uid);
            if (window.SOSRole) SOSRole.remember(user.uid, profile.role);
          }
        }
        render(user, profile);
        callbacks.forEach(function(cb){ try { cb(user, profile); } catch(e){} });
      }).catch(function(){
        render(user, null);
        callbacks.forEach(function(cb){ try { cb(user, null); } catch(e){} });
      });
    } else {
      // Light page (no firestore): render from cached name, no profile fetch.
      render(user, null);
      callbacks.forEach(function(cb){ try { cb(user, null); } catch(e){} });
    }
  });
})();
