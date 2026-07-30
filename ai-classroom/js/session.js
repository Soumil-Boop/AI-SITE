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

  if (typeof firebase === 'undefined') {
    window.SOS = { onSession: function(){}, signOut: function(){ window.location.replace(HOME); } };
    return;
  }
  if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(CONFIG);

  var auth = firebase.auth();
  var db   = (typeof firebase.firestore === 'function') ? firebase.firestore() : null;  // may be absent on light pages

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
    el.innerHTML =
      '<div class="acct-wrap">' +
        '<button class="acct-trigger" type="button">Hi, ' + esc(firstName(profile, user)) + ' ' + userIcon() + '</button>' +
        '<div class="acct-drop">' +
          '<a href="' + P + 'dashboard.html">My Dashboard</a>' +
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
      store('sos_name', null);
      auth.signOut().then(function(){ window.location.replace(HOME); })
                    .catch(function(){ window.location.replace(HOME); });
    }
  };

  auth.onAuthStateChanged(function(user){
    SOS.user = user;
    if (!user) {
      SOS.profile = null; store('sos_name', null);
      render(null, null);
      callbacks.forEach(function(cb){ try { cb(null, null); } catch(e){} });
      return;
    }
    if (db) {
      db.collection('users').doc(user.uid).get().then(function(snap){
        var profile = (snap && snap.exists) ? snap.data() : null;
        SOS.profile = profile;
        if (profile) {
          if (profile.name)       store('sos_name', profile.name);
          if (profile.curriculum) store('sos_curriculum', profile.curriculum);
          if (profile.grade)      store('sos_grade', profile.grade);
          if (profile.ageGroup)   store('sos_age', profile.ageGroup);
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
