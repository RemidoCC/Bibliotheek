/* =========================================================
   Interacties: achtergrond-modes, cursor-halo, hovers,
   scroll-reveal, mobiel menu. Respecteert reduced-motion.
   Achtergrond kiezen via <body data-bg="network|aurora|letters">.
   ========================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  // Mode: ?bg=... in de URL wint (handig om te vergelijken), anders data-bg, anders network
  var urlMode = new URLSearchParams(window.location.search).get("bg");
  var allowed = { network: 1, aurora: 1, letters: 1 };
  var mode = (urlMode && allowed[urlMode]) ? urlMode
           : (document.body.getAttribute("data-bg") || "network");

  /* ---------- Mobiel menu ---------- */
  var toggle = document.querySelector(".nav__toggle");
  var links = document.querySelector(".nav__links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") links.classList.remove("open");
    });
  }

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.14 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Skill bars ---------- */
  var bars = document.querySelectorAll(".bar__fill");
  if (bars.length) {
    if ("IntersectionObserver" in window) {
      var bo = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.style.width = en.target.getAttribute("data-value") + "%";
            bo.unobserve(en.target);
          }
        });
      }, { threshold: 0.4 });
      bars.forEach(function (b) { bo.observe(b); });
    } else {
      bars.forEach(function (b) { b.style.width = b.getAttribute("data-value") + "%"; });
    }
  }

  /* Positie van de muis (globaal gedeeld) */
  var mx = window.innerWidth / 2, my = window.innerHeight / 2, hasMoved = false;
  var lamp = document.querySelector(".bg__lamp");

  /* ---------- Cursor-halo (native cursor blijft zichtbaar) ---------- */
  var ring = null;
  if (fine && !reduce) {
    ring = document.createElement("div");
    ring.className = "cursor-ring";
    document.body.appendChild(ring);

    var hoverSel = "a, button, .card, .map__row, .chip, .portrait-frame, input, textarea";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest && e.target.closest(hoverSel)) ring.classList.add("is-hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest(hoverSel)) ring.classList.remove("is-hover");
    });
    document.addEventListener("mousedown", function () { ring.classList.add("is-hover"); });
    document.addEventListener("mouseup", function () { ring.classList.remove("is-hover"); });
  }

  window.addEventListener("mousemove", function (e) {
    mx = e.clientX; my = e.clientY;
    if (!hasMoved) {
      hasMoved = true;
      if (ring) ring.classList.add("is-visible");
      if (lamp) lamp.style.opacity = "1";
    }
    if (lamp) lamp.style.transform = "translate3d(" + mx + "px," + my + "px,0)";
  }, { passive: true });

  if (reduce) return; // geen animatieloops bij reduced-motion

  var canvas = document.querySelector(".bg__canvas");
  var ctx = canvas ? canvas.getContext("2d") : null;
  var W = 0, H = 0;
  var rx = mx, ry = my; // vertraagde ringpositie

  function resize() {
    if (!canvas) return;
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    if (mode === "network") initNetwork();
    if (mode === "letters") initLetters();
  }

  /* =======================================================
     MODE 1 — Kennisnetwerk: verbonden punten, muis verbindt
     ======================================================= */
  var nodes = [];
  function initNetwork() {
    var count = Math.min(80, Math.floor(W * H / 26000));
    nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 1.0
      });
    }
  }
  function drawNetwork() {
    ctx.clearRect(0, 0, W, H);
    var linkDist = 140, mouseDist = 200;
    for (var i = 0; i < nodes.length; i++) {
      var p = nodes[i];
      // lichte aantrekking naar de muis
      if (hasMoved) {
        var dxm = mx - p.x, dym = my - p.y, dm = Math.hypot(dxm, dym);
        if (dm < mouseDist && dm > 1) {
          p.vx += (dxm / dm) * 0.02;
          p.vy += (dym / dm) * 0.02;
        }
      }
      p.vx *= 0.99; p.vy *= 0.99;
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      p.x = Math.max(0, Math.min(W, p.x));
      p.y = Math.max(0, Math.min(H, p.y));

      for (var j = i + 1; j < nodes.length; j++) {
        var q = nodes[j];
        var dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy);
        if (d < linkDist) {
          ctx.globalAlpha = (1 - d / linkDist) * 0.22;
          ctx.strokeStyle = "#c9a24b";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
      }
      // verbindingen naar de muis (duidelijk muis-effect)
      if (hasMoved) {
        var ddx = p.x - mx, ddy = p.y - my, dd = Math.hypot(ddx, ddy);
        if (dd < mouseDist) {
          ctx.globalAlpha = (1 - dd / mouseDist) * 0.5;
          ctx.strokeStyle = "#e7cf94";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my); ctx.stroke();
        }
      }
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = "#d9b968";
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* =======================================================
     MODE 2 — Aurora: zachte drijvende gloed (CSS-gestuurd)
     ======================================================= */
  function initAurora() {
    if (canvas) canvas.style.display = "none";
    var wrap = document.createElement("div");
    wrap.className = "bg__aurora";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = '<span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span><span class="blob b4"></span>';
    document.body.insertBefore(wrap, document.body.firstChild);
  }

  /* =======================================================
     MODE 3 — Zwevende letters/leestekens (bibliotheeksfeer)
     ======================================================= */
  var glyphs = [];
  var GLYPHSET = "abcdefghijklmnopqrstuvwxyz.,;:?!&§¶“”‘’—".split("");
  function initLetters() {
    var count = Math.min(55, Math.floor(W * H / 34000));
    glyphs = [];
    for (var i = 0; i < count; i++) {
      glyphs.push({
        x: Math.random() * W, y: Math.random() * H,
        ch: GLYPHSET[(Math.random() * GLYPHSET.length) | 0],
        size: Math.random() * 26 + 14,
        vy: -(Math.random() * 0.35 + 0.12),
        vx: (Math.random() - 0.5) * 0.2,
        a: Math.random() * 0.3 + 0.08,
        rot: (Math.random() - 0.5) * 0.6
      });
    }
  }
  function drawLetters() {
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    var tx = hasMoved ? (mx / W - 0.5) : 0;
    for (var i = 0; i < glyphs.length; i++) {
      var g = glyphs[i];
      g.y += g.vy;
      g.x += g.vx + tx * 0.6;
      if (g.y < -30) { g.y = H + 30; g.x = Math.random() * W; }
      if (g.x < -30) g.x = W + 30; else if (g.x > W + 30) g.x = -30;
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.rot);
      ctx.globalAlpha = g.a;
      ctx.fillStyle = "#e7cf94";
      ctx.font = "600 " + g.size + "px 'Cormorant Garamond', Georgia, serif";
      ctx.fillText(g.ch, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- Hoofd-lus ---------- */
  function frame() {
    // vertraagde cursor-halo
    if (ring) {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
    }
    if (ctx) {
      if (mode === "network") drawNetwork();
      else if (mode === "letters") drawLetters();
    }
    requestAnimationFrame(frame);
  }

  if (mode === "aurora") {
    initAurora();
  } else if (canvas) {
    resize();
    window.addEventListener("resize", resize);
  }
  requestAnimationFrame(frame);
})();
