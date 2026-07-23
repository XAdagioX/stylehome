/* ============================================================
   REFERENCE ONLY — original design-system app.js from Claude Design.
   Kept for provenance. The live interaction layer is app.ts, which
   ports this UI logic and grafts in the real backend form submit
   (JSON -> /api/consultations, HEIC, base64 photos, gtag conversion).
   Do not import this file.
   ============================================================ */
(function () {
  "use strict";
  var icon = function (name) {
    var g = {
      image: '<path d="M3 3h18v18H3z" fill="none"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
      x: '<path d="M18 6 6 18M6 6l12 12"/>'
    };
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (g[name] || "") + "</svg>";
  };
  window.addEventListener("load", function () {
    var l = document.querySelector(".loader");
    if (l) { l.classList.add("is-hidden"); setTimeout(function () { l.remove(); }, 600); }
  });
})();
