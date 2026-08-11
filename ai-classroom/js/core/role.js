/* ============================================================
   role.js — who is signed in, and where they belong

   Three pages decide, on their own, whether to show you the admin panel
   or the student dashboard: the sign-in page routes you after a
   password, the panel checks you are allowed in, and the dashboard
   bounces you out if you are not a student. Each of them worked it out
   separately, and each of them, when it could not work it out, fell
   through to the same place — the student dashboard.

   That fall-through is the bug. "I do not know what this person is" was
   being treated as "this person is a student", so anything that made a
   profile read fail — refused permissions, a slow network, a cache
   cleared by the browser — demoted an admin to a student for the length
   of a page load. From the far side of the screen it looks like the site
   quietly logging you out of your own panel.

   What this file adds is a memory that lasts exactly as long as the
   sign-in does. The session already lives in the tab rather than on the
   machine — close the tab and you are signed out — so the role is kept
   in the same place, stamped with the account it belongs to. Once a
   profile has been read and the answer was 'owner', that answer stands
   for the rest of the tab, and no later failure can take it away.

   It is not a permission. Nothing here decides what anybody may read;
   Firestore's rules do that, and they ask the database rather than the
   browser. All this decides is which page to show, which is why it is
   safe for it to live somewhere the person could edit: forging it gets
   you a panel with nothing in it.

   Loaded before the gate on each page, so the gate can ask.
   ============================================================ */
(function () {
  'use strict';

  /* 'admin' is the old name for 'owner' and is still in the database, so
     both belong here. Anything not on this list is a student. */
  var ADMIN_ROLES = ['owner', 'admin', 'schooladmin'];

  function lread(k)  { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function sread(k)  { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function swrite(k, v) {
    try { v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {}
  }

  function isAdmin(role) {
    for (var i = 0; i < ADMIN_ROLES.length; i++) if (ADMIN_ROLES[i] === role) return true;
    return false;
  }

  /* Called the moment a role has been read from the account itself. The
     uid travels with it: a tab that signs out and signs back in as
     somebody else must not inherit the last person's answer. */
  function lwrite(k, v) {
    try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {}
  }

  function remember(uid, role) {
    if (!uid || !role) return role || '';
    swrite('sos_tab_uid', uid);
    swrite('sos_tab_role', role);
    /* And on the machine, not only in the tab.

       sessionStorage dies with the tab, so a second tab, a restored window
       or a browser that clears it leaves nothing behind — and "nothing"
       was being read as "student". This flag is written the moment an
       account is confirmed to be an admin and is cleared by exactly two
       things: signing out, and a read that positively says this account is
       not an admin any more. A failed read cannot clear it. */
    if (isAdmin(role)) {
      lwrite('sos_admin_uid', uid);
      lwrite('sos_admin_role', role);
    }
    return role;
  }

  function forget() {
    swrite('sos_tab_uid', null);
    swrite('sos_tab_role', null);
    lwrite('sos_admin_uid', null);
    lwrite('sos_admin_role', null);
  }

  /* Has this account ever been confirmed an admin on this machine? Read by
     the dashboard before it paints anything. */
  function confirmedAdmin(uid) {
    return !!uid && lread('sos_admin_uid') === uid && isAdmin(lread('sos_admin_role'));
  }

  /* The best answer available without asking the network, or '' for
     genuinely unknown. The tab's own confirmed answer is preferred over
     the machine's cache, because the cache outlives the session and can
     belong to a sign-in that ended. Both are checked against the uid.

     '' is a real answer and must never be quietly rounded to 'student'. */
  function known(uid) {
    if (!uid) return '';
    if (sread('sos_tab_uid') === uid) {
      var tab = sread('sos_tab_role');
      if (tab) return tab;
    }
    // The machine-level admin flag outranks the general role cache, because
    // the cache is written on every ordinary page load and the flag is only
    // written when an account has actually been confirmed.
    if (lread('sos_admin_uid') === uid) {
      var flag = lread('sos_admin_role');
      if (flag) return flag;
    }
    if (lread('sos_uid') === uid) return lread('sos_role') || '';
    return '';
  }

  /* The page this person belongs on, or '' if that is not known yet.
     `inPages` is true for anything already inside /pages/. */
  function home(uid, inPages) {
    var role = known(uid);
    if (!role) return '';
    return (inPages ? '' : 'pages/') + (isAdmin(role) ? 'admin.html' : 'dashboard.html');
  }

  window.SOSRole = {
    roles:          ADMIN_ROLES,
    isAdmin:        isAdmin,
    remember:       remember,
    forget:         forget,
    known:          known,
    confirmedAdmin: confirmedAdmin,
    home:           home
  };
})();
