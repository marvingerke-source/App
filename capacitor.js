// Native Integration – nur in der Capacitor-App aktiv, im Browser ein No-Op.
(function () {
  var Cap = window.Capacitor;
  if (!Cap || !Cap.Plugins) return;
  var P = Cap.Plugins;

  function applyStatusBar() {
    if (!P.StatusBar) return;
    var dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    // Dark-Hintergrund -> helle Statusleisten-Inhalte und umgekehrt.
    try { P.StatusBar.setStyle({ style: dark ? "LIGHT" : "DARK" }); } catch (e) {}
  }

  window.addEventListener("DOMContentLoaded", function () {
    applyStatusBar();
    if (P.SplashScreen) setTimeout(function () {
      try { P.SplashScreen.hide(); } catch (e) {}
    }, 300);
  });

  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  if (mq.addEventListener) mq.addEventListener("change", applyStatusBar);

  // Dezentes haptisches Feedback bei Tipp-Aktionen.
  document.addEventListener("click", function (e) {
    if (P.Haptics && e.target.closest && e.target.closest("[data-act]")) {
      try { P.Haptics.impact({ style: "LIGHT" }); } catch (err) {}
    }
  }, true);
})();
