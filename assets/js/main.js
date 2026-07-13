/* =========================================================
   Interacties: bibliotheek-achtergrond, muiscursor, hovers,
   scroll-reveal, mobiel menu. Respecteert reduced-motion.
   ========================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;

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

  if (reduce || !fine) return; // geen zware animatie op touch of bij reduced-motion

  /* ---------- Custom cursor ---------- */
  document.body.classList.add("has-cursor");
  var dot = document.createElement("div"); dot.className = "cursor-dot";
  var ring = document.createElement("div"); ring.className = "cursor-ring";
  var lamp = document.querySelector(".bg__lamp");
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  var mx = window.innerWidth / 2, my = window.innerHeight / 2;
  var rx = mx, ry = my;
  var tx = mx, ty = my; // targets voor parallax

  window.addEventListener("mousemove", function (e) {
    mx = e.clientX; my = e.clientY;
    tx = (mx / window.innerWidth - 0.5);
    ty = (my / window.innerHeight - 0.5);
    dot.style.transform = "translate3d(" + (mx - 3.5) + "px," + (my - 3.5) + "px,0)";
    if (lamp) lamp.style.transform = "translate3d(" + mx + "px," + my + "px,0)";
  }, { passive: true });

  // hover-uitvergroting op interactieve elementen
  var hoverSel = "a, button, .card, .map__row, .chip, .portrait-frame";
  document.querySelectorAll(hoverSel).forEach(function (el) {
    el.addEventListener("mouseenter", function () { ring.classList.add("is-hover"); });
    el.addEventListener("mouseleave", function () { ring.classList.remove("is-hover"); });
  });

  /* ---------- Parallax boekenkasten ---------- */
  var shelves = document.querySelector(".bg__shelves");

  /* ---------- Zwevende deeltjes (stofjes in het licht) ---------- */
  var canvas = document.querySelector(".bg__canvas");
  var ctx = canvas ? canvas.getContext("2d") : null;
  var W, H, particles = [];

  function resize() {
    if (!canvas) return;
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    var count = Math.min(90, Math.floor(W * H / 22000));
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 2.2 + 0.5,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(Math.random() * 0.35 + 0.08),
        a: Math.random() * 0.5 + 0.15,
        tw: Math.random() * Math.PI * 2
      });
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    // vloeiende parallax van de ring en kasten
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
    if (shelves) {
      shelves.style.transform = "translate3d(" + (-tx * 26) + "px," + (-ty * 18) + "px,0)";
    }

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx + tx * 0.4;
      p.y += p.vy;
      p.tw += 0.02;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      var alpha = p.a * (0.6 + 0.4 * Math.sin(p.tw));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(233,207,148," + alpha.toFixed(3) + ")";
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  if (canvas) {
    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(draw);
  }
})();
