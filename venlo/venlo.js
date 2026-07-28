/* AI in de digitale leerlijn — Bibliotheek Venlo 2027
   Alle inhoud komt uit data/schermen.json en data/matrix.json.
   Drie modi via ?modus=presentatie (standaard) | lezen | print. */

(function () {
  "use strict";

  var params = new URLSearchParams(location.search);
  var modus = params.get("modus") || "presentatie";
  if (["presentatie", "lezen", "print"].indexOf(modus) === -1) modus = "presentatie";

  var app = document.getElementById("app");
  var teller = document.getElementById("teller");
  var klokEl = document.getElementById("klok");
  var overzicht = document.getElementById("overzicht");
  var overzichtGrid = document.getElementById("overzicht-grid");

  var data = null;      // schermen.json
  var matrix = null;    // matrix.json
  var brief = null;     // brief-voorbeeld.json
  var huidig = 0;       // actieve schermindex (presentatie)
  var schermEls = [];

  document.body.classList.add("modus-" + modus);
  var actieveLink = document.querySelector('.modus-toggle a[data-modus="' + (modus === "print" ? "lezen" : modus) + '"]');
  if (actieveLink) actieveLink.setAttribute("aria-current", "true");

  Promise.all([
    fetch("data/schermen.json").then(function (r) { return r.json(); }),
    fetch("data/matrix.json").then(function (r) { return r.json(); }),
    fetch("data/brief-voorbeeld.json").then(function (r) { return r.json(); })
  ]).then(function (res) {
    data = res[0];
    matrix = res[1];
    brief = res[2];
    render();
  }).catch(function (err) {
    app.innerHTML = "<p style='max-width:40em;margin:4em auto;'>Kon de inhoud niet laden (" +
      esc(String(err)) + "). Open de pagina via een webserver, niet als los bestand.</p>";
  });

  /* ---------- kleine hulpfuncties ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // Alleen **vet** en *cursief*; verder staat de tekst er letterlijk.
  function opmaak(s) {
    return esc(s)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  }

  function alinea(s) {
    return s.split(/\n\n+/).map(function (p) {
      return "<p>" + opmaak(p) + "</p>";
    }).join("");
  }

  // Genummerde kop in de vorm van het beleidsplan: "5 | De leerlijn"
  function schermkop(s) {
    return "<span class='scherm-nr'>" + s.nummer + "</span>" + opmaak(s.titel);
  }

  function el(tag, klas, html) {
    var n = document.createElement(tag);
    if (klas) n.className = klas;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }

  /* ---------- opbouw ---------- */

  function render() {
    app.textContent = "";
    schermEls = [];

    data.schermen.forEach(function (s, i) {
      var sec = el("section", "scherm");
      sec.id = "scherm-" + s.nummer;
      if (s.component) sec.setAttribute("data-component", s.component);
      var binnen = el("div", "scherm-inhoud");
      sec.appendChild(binnen);

      if (s.type === "titel") {
        sec.classList.add("scherm-titelpagina");
        binnen.appendChild(el("div", "titel-balk"));
        binnen.appendChild(el("h2", "", opmaak(s.titel)));
      } else if (s.component === "matrix") {
        bouwMatrix(binnen, s);
      } else {
        binnen.appendChild(el("h2", "", schermkop(s)));
      }

      if (s.component === "brief") bouwBriefvoorbeeld(binnen, s);
      else if (!s.component && s.type !== "titel") bouwBlokken(binnen, s.inhoud);
      if (s.type === "titel") bouwBlokken(binnen, s.inhoud);

      if (s.regie && s.regie.length && modus !== "print") {
        var r = el("aside", "regie");
        r.appendChild(el("p", "regie-label", "Regie (toets N)"));
        s.regie.forEach(function (t) { r.appendChild(el("p", "", opmaak(t))); });
        binnen.appendChild(r);
      }

      app.appendChild(sec);
      schermEls.push(sec);
    });

    if (modus !== "presentatie") bouwBijlage();
    if (modus === "print") bouwPrintCellen();

    if (modus === "presentatie") {
      var start = parseInt((location.hash || "").replace("#", ""), 10);
      huidig = isNaN(start) ? 0 : Math.min(Math.max(start - 1, 0), schermEls.length - 1);
      toonScherm(huidig);
      bouwOverzicht();
      document.addEventListener("keydown", opToets);
      // Handmatig aangepaste of gedeelde #-links moeten ook werken.
      window.addEventListener("hashchange", function () {
        var n = parseInt((location.hash || "").replace("#", ""), 10);
        if (!isNaN(n) && n - 1 !== huidig) toonScherm(n - 1);
      });
    } else {
      teller.hidden = true;
      document.addEventListener("keydown", function (e) {
        if (e.key.toLowerCase() === "n" && !inVeld(e)) document.body.classList.toggle("toon-regie");
      });
    }

    document.title = data.titel;
    if (modus === "print") {
      // Geef de layout even tijd en open dan het printdialoog.
      setTimeout(function () { window.print(); }, 400);
    }
  }

  function bouwBlokken(ouder, blokken) {
    var getallenWrap = null;
    (blokken || []).forEach(function (b) {
      if (b.type !== "getal") getallenWrap = null;
      switch (b.type) {
        case "subtitel":
          ouder.appendChild(el("p", "subtitel", opmaak(b.tekst)));
          break;
        case "byline":
          ouder.appendChild(el("p", "byline", opmaak(b.tekst)));
          break;
        case "paragraaf":
          ouder.appendChild(el("p", "", opmaak(b.tekst)));
          break;
        case "quote":
          if (b.kop) ouder.appendChild(el("p", "quote-kop", opmaak(b.kop)));
          var q = el("blockquote", b.groot ? "groot" : "");
          q.appendChild(el("p", "", opmaak(b.tekst)));
          ouder.appendChild(q);
          break;
        case "blok":
          var d = el("div", "blok");
          d.appendChild(el("h3", "", opmaak(b.kop)));
          d.innerHTML += alinea(b.tekst);
          ouder.appendChild(d);
          break;
        case "lijst":
          var l = el(b.geordend ? "ol" : "ul");
          b.items.forEach(function (it) { l.appendChild(el("li", "", opmaak(it))); });
          ouder.appendChild(l);
          break;
        case "getal":
          if (!getallenWrap) {
            getallenWrap = el("div", "getallen");
            ouder.appendChild(getallenWrap);
          }
          var g = el("div", "getal");
          g.appendChild(el("div", "getal-waarde", esc(b.waarde)));
          g.appendChild(el("div", "getal-tekst", opmaak(b.tekst)));
          getallenWrap.appendChild(g);
          break;
      }
    });
  }

  /* ---------- matrix: het bewegwijzeringsbord ---------- */

  var statusLabel = { bestaat: "bestaat", elders: "elders", leemte: "leemte", keuze: "bewust niets" };

  function bouwMatrix(ouder, scherm) {
    var kop = el("div", "matrix-kop");
    kop.appendChild(el("h2", "", schermkop(scherm)));

    var filter = el("button", "filter-toggle");
    filter.type = "button";
    filter.setAttribute("aria-pressed", "false");
    filter.innerHTML = '<span class="schakel" aria-hidden="true"></span>toon alleen wat er nu al is';
    kop.appendChild(filter);
    ouder.appendChild(kop);

    var scroller = el("div", "matrix-scroller");
    var bord = el("div", "matrix");
    bord.setAttribute("role", "grid");
    scroller.appendChild(bord);
    ouder.appendChild(scroller);

    // kopregel
    bord.appendChild(el("div", "kolomkop"));
    matrix.levensfases.forEach(function (f) {
      bord.appendChild(el("div", "kolomkop", esc(f.naam) + "<small>" + esc(f.toelichting) + "</small>"));
    });

    var detail = el("div", "cel-detail");
    detail.hidden = true;

    // rijen: trede 4 boven, trede 0 onder
    matrix.treden.slice().reverse().forEach(function (t) {
      var rk = el("div", "rijkop");
      rk.innerHTML =
        '<span class="trede-nr">trede ' + t.nr + "</span>" +
        '<div class="trede-naam">' + esc(t.naam) + "</div>" +
        '<div class="trede-vraag">' + esc(t.kernvraag) + "</div>";
      bord.appendChild(rk);

      matrix.levensfases.forEach(function (f) {
        var cel = matrix.cellen.find(function (c) {
          return c.trede === t.nr && c.levensfase === f.id;
        });
        var knop = el("button", "cel");
        knop.type = "button";
        knop.setAttribute("data-status", cel.status);
        knop.setAttribute("aria-expanded", "false");
        var binnen = "<span class='cel-label'>" + esc(f.naam) + "</span>" +
          "<span class='cel-status'>" + esc(statusLabel[cel.status]) + "</span>";
        if (cel.notitie && cel.status !== "keuze") {
          binnen += "<span class='cel-notitie'>" + esc(cel.notitie) + "</span>";
        }
        knop.innerHTML = binnen;
        knop.setAttribute("aria-label",
          "Trede " + t.nr + " " + t.naam + ", " + f.naam + ", status " + statusLabel[cel.status]);
        knop.addEventListener("click", function () {
          toonCelDetail(detail, bord, knop, cel, t, f);
        });
        bord.appendChild(knop);
      });
    });

    ouder.appendChild(detail);

    var legenda = el("div", "matrix-legenda");
    legenda.innerHTML =
      "<span><span class='legenda-vak bestaat'></span>bestaat</span>" +
      "<span><span class='legenda-vak elders'></span>elders — landelijk, over te nemen</span>" +
      "<span><span class='legenda-vak leemte'></span>leemte</span>";
    ouder.appendChild(legenda);

    filter.addEventListener("click", function () {
      var aan = filter.getAttribute("aria-pressed") === "true";
      filter.setAttribute("aria-pressed", String(!aan));
      bord.classList.toggle("gefilterd", !aan);
    });
  }

  function toonCelDetail(detail, bord, knop, cel, trede, fase) {
    var open = knop.getAttribute("aria-expanded") === "true";
    bord.querySelectorAll(".cel[aria-expanded='true']").forEach(function (c) {
      c.setAttribute("aria-expanded", "false");
    });
    if (open) { detail.hidden = true; return; }
    knop.setAttribute("aria-expanded", "true");

    var html = "<div class='detail-kop'><h3>Trede " + trede.nr + " · " + esc(trede.naam) +
      " × " + esc(fase.naam) + "</h3><span class='detail-status'>" + esc(statusLabel[cel.status]) +
      (cel.notitie && cel.status !== "keuze" ? " · " + esc(cel.notitie) : "") + "</span></div><dl>";
    if (cel.nu) html += "<dt>Nu</dt><dd>" + opmaak(cel.nu) + "</dd>";
    if (cel.leemte) html += "<dt>Leemte</dt><dd>" + opmaak(cel.leemte) + "</dd>";
    if (cel.plan2027) html += "<dt>2027</dt><dd>" + opmaak(cel.plan2027) + "</dd>";
    html += "</dl>";
    detail.innerHTML = html;

    if (cel.regie && modus !== "print") {
      var r = el("aside", "regie");
      r.appendChild(el("p", "regie-label", "Regie (toets N)"));
      r.appendChild(el("p", "", opmaak(cel.regie)));
      detail.appendChild(r);
    }

    var sluit = el("button", "detail-sluit", "sluiten");
    sluit.type = "button";
    sluit.addEventListener("click", function () {
      detail.hidden = true;
      knop.setAttribute("aria-expanded", "false");
    });
    detail.appendChild(sluit);
    detail.hidden = false;
    // 'nearest' schuift het minimum: het bord blijft in beeld tijdens het praten.
    detail.scrollIntoView({ block: "nearest" });
  }

  /* ---------- briefvoorbeeld (scherm 8) ---------- */

  function bouwBriefvoorbeeld(ouder, scherm) {
    var intro = scherm.inhoud.filter(function (b) { return !b.naOnder; });
    var onder = scherm.inhoud.filter(function (b) { return b.naOnder; });
    bouwBlokken(ouder, intro);

    var panelen = el("div", "brief-panelen");

    var links = el("div", "brief-paneel brief-voor");
    links.appendChild(el("h3", "", esc(brief.links.label)));
    links.appendChild(el("div", "brief-tekst", markeer(brief.links.tekst, brief.moeilijk)));
    panelen.appendChild(links);

    var rechts = el("div", "brief-paneel brief-na");
    rechts.appendChild(el("h3", "", esc(brief.rechts.label)));
    rechts.appendChild(el("div", "brief-tekst", esc(brief.rechts.tekst)));
    panelen.appendChild(rechts);

    ouder.appendChild(panelen);
    ouder.appendChild(vergelijking(brief.links.tekst, brief.rechts.tekst, brief.moeilijk));
    bouwBlokken(ouder, onder);

    // De woordenlijst is materiaal voor de presentator, niet voor de dia.
    if (brief.woordenlijst && brief.woordenlijst.length && modus !== "print") {
      var r = el("aside", "regie");
      r.appendChild(el("p", "regie-label", "Woorden die je moet uitleggen"));
      brief.woordenlijst.forEach(function (w) {
        r.appendChild(el("p", "", "<strong>" + esc(w.term) + "</strong> — " + esc(w.betekenis)));
      });
      ouder.appendChild(r);
    }
  }

  // Markeert de lastige passages in de originele brief. Escapen gebeurt eerst,
  // daarna pas markeren, zodat er nooit ruwe HTML doorheen glipt.
  function markeer(tekst, passages) {
    var uit = esc(tekst);
    (passages || []).forEach(function (p) {
      var doel = esc(p);
      var i = uit.indexOf(doel);
      if (i === -1) return;
      uit = uit.slice(0, i) + "<mark>" + doel + "</mark>" + uit.slice(i + doel.length);
    });
    return uit;
  }

  // Cijfers die de pagina zelf uitrekent, zodat ze blijven kloppen wanneer
  // de brieven in het JSON-bestand worden aangepast.
  function meet(tekst) {
    var body = tekst.split(/\n\n/).slice(1).join(" ");        // aanhef eraf
    // Afkortingen bevatten punten die geen zin afsluiten. Zonder deze stap
    // telt "12 maart jl." als zinseinde en lijkt de brief korter van stof.
    var veilig = body.replace(/\b(jl|e\.v|art|nr|bijv|d\.w\.z|o\.a|blz|incl|excl|ca)\./gi,
      function (m) { return m.replace(/\./g, ""); });
    var zinnen = veilig.split(/(?<=[.!?:])\s+/).filter(function (z) {
      return z.replace(/[^\wÀ-ÿ]/g, "").length > 1;
    });
    var woorden = body.split(/\s+/).filter(function (w) { return /[\wÀ-ÿ]/.test(w); });
    var langste = zinnen.reduce(function (m, z) {
      var n = z.split(/\s+/).filter(function (w) { return /[\wÀ-ÿ]/.test(w); }).length;
      return Math.max(m, n);
    }, 0);
    return {
      woorden: woorden.length,
      gemiddeld: zinnen.length ? Math.round(woorden.length / zinnen.length) : 0,
      langste: langste
    };
  }

  function vergelijking(voor, na, passages) {
    var a = meet(voor), b = meet(na);
    var rijen = [
      ["woorden", a.woorden, b.woorden],
      ["gemiddelde zinslengte", a.gemiddeld + " woorden", b.gemiddeld + " woorden"],
      ["langste zin", a.langste + " woorden", b.langste + " woorden"],
      ["woorden om uit te leggen", (passages || []).length, 0]
    ];
    var wrap = el("div", "vergelijking");
    wrap.appendChild(el("p", "vergelijking-kop", "Wat er feitelijk verandert"));
    var lijst = el("dl", "vergelijking-lijst");
    rijen.forEach(function (r) {
      // Paren in een div: geldig in HTML5 en laat de rij netjes afbreken
      // op smalle schermen in plaats van te overlappen.
      var paar = el("div", "v-paar");
      paar.appendChild(el("dt", "", esc(r[0])));
      paar.appendChild(el("dd", "",
        "<span class='v-voor'>" + esc(String(r[1])) + "</span>" +
        "<span class='v-pijl' aria-hidden='true'>→</span>" +
        "<span class='v-na'>" + esc(String(r[2])) + "</span>"));
      lijst.appendChild(paar);
    });
    wrap.appendChild(lijst);
    return wrap;
  }

  /* ---------- bijlage & print ---------- */

  function bouwBijlage() {
    if (!data.bijlage) return;
    var sec = el("section", "scherm bijlage");
    var binnen = el("div", "scherm-inhoud");
    binnen.appendChild(el("h2", "", opmaak(data.bijlage.titel)));
    data.bijlage.vragen.forEach(function (v) {
      binnen.appendChild(el("p", "vraag", opmaak(v.vraag)));
      binnen.appendChild(el("p", "antwoord", opmaak(v.antwoord)));
    });
    sec.appendChild(binnen);
    app.appendChild(sec);
  }

  function bouwPrintCellen() {
    var sec = el("section", "scherm print-cellen");
    var binnen = el("div", "scherm-inhoud");
    binnen.appendChild(el("h2", "", "De twintig cellen"));
    matrix.treden.forEach(function (t) {
      binnen.appendChild(el("h3", "", "Trede " + t.nr + " — " + esc(t.naam)));
      matrix.levensfases.forEach(function (f) {
        var cel = matrix.cellen.find(function (c) {
          return c.trede === t.nr && c.levensfase === f.id;
        });
        var d = el("div", "print-cel");
        d.appendChild(el("p", "print-cel-kop", esc(f.naam) + " · " + esc(statusLabel[cel.status]) +
          (cel.notitie && cel.status !== "keuze" ? " — " + esc(cel.notitie) : "")));
        if (cel.nu) d.appendChild(el("p", "", "<strong>Nu:</strong> " + opmaak(cel.nu)));
        if (cel.leemte) d.appendChild(el("p", "", "<strong>Leemte:</strong> " + opmaak(cel.leemte)));
        if (cel.plan2027) d.appendChild(el("p", "", "<strong>2027:</strong> " + opmaak(cel.plan2027)));
        binnen.appendChild(d);
      });
    });
    sec.appendChild(binnen);
    app.appendChild(sec);
  }

  /* ---------- presentatienavigatie ---------- */

  function toonScherm(i) {
    huidig = Math.min(Math.max(i, 0), schermEls.length - 1);
    schermEls.forEach(function (s, j) {
      s.classList.toggle("actief", j === huidig);
    });
    teller.textContent = (huidig + 1) + " / " + schermEls.length;
    history.replaceState(null, "", "#" + (huidig + 1));
    markeerOverzicht();
  }

  function inVeld(e) {
    var t = e.target;
    return t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.isContentEditable);
  }

  function opToets(e) {
    if (inVeld(e)) {
      if (e.key === "Escape") e.target.blur();
      return;
    }
    switch (e.key) {
      case "ArrowRight":
      case " ":
      case "PageDown":
        e.preventDefault();
        toonScherm(huidig + 1);
        break;
      case "ArrowLeft":
      case "PageUp":
        e.preventDefault();
        toonScherm(huidig - 1);
        break;
      case "Home":
        toonScherm(0);
        break;
      case "End":
        toonScherm(schermEls.length - 1);
        break;
      case "Escape":
        overzicht.hidden = !overzicht.hidden;
        break;
      default:
        var k = e.key.toLowerCase();
        if (k === "l") {
          location.href = "?modus=lezen#" + (huidig + 1);
        } else if (k === "n") {
          document.body.classList.toggle("toon-regie");
        } else if (k === "t") {
          if (e.shiftKey) klokOpNul();
          else klokStartStop();
        }
    }
  }

  /* ---------- Presentatieklok (toets T) ----------
     Oranje vanaf 15 minuten, rood vanaf 20. De tijd wordt berekend uit
     Date.now(), niet uit het aantal tikken: als de browser het tabblad
     vertraagt of de laptop even slaapt, blijft de klok kloppen. */

  var ORANJE_VANAF = 15 * 60 * 1000;
  var ROOD_VANAF = 20 * 60 * 1000;
  var klok = { loopt: false, opgebouwd: 0, sinds: 0, tik: null };

  function klokVerstreken() {
    return klok.opgebouwd + (klok.loopt ? Date.now() - klok.sinds : 0);
  }

  function klokToon() {
    var ms = klokVerstreken();
    var sec = Math.floor(ms / 1000);
    var mm = Math.floor(sec / 60);
    var ss = sec % 60;
    klokEl.textContent = mm + ":" + (ss < 10 ? "0" : "") + ss;
    klokEl.classList.toggle("klok-rood", ms >= ROOD_VANAF);
    klokEl.classList.toggle("klok-oranje", ms >= ORANJE_VANAF && ms < ROOD_VANAF);
    klokEl.classList.toggle("klok-pauze", !klok.loopt);
  }

  function klokStartStop() {
    if (klok.loopt) {
      klok.opgebouwd = klokVerstreken();
      klok.loopt = false;
      clearInterval(klok.tik);
      klok.tik = null;
    } else {
      klok.sinds = Date.now();
      klok.loopt = true;
      klok.tik = setInterval(klokToon, 250);
    }
    klokEl.hidden = false;
    klokToon();
  }

  function klokOpNul() {
    clearInterval(klok.tik);
    klok = { loopt: false, opgebouwd: 0, sinds: 0, tik: null };
    klokEl.hidden = true;
    klokEl.className = "klok";
  }

  function bouwOverzicht() {
    overzichtGrid.textContent = "";
    data.schermen.forEach(function (s, i) {
      var b = el("button", "", "<span class='ov-nr'>" + s.nummer + "</span>" + opmaak(s.titel));
      b.type = "button";
      b.addEventListener("click", function () {
        overzicht.hidden = true;
        toonScherm(i);
      });
      overzichtGrid.appendChild(b);
    });
  }

  function markeerOverzicht() {
    if (!overzichtGrid.children.length) return;
    Array.prototype.forEach.call(overzichtGrid.children, function (b, i) {
      b.setAttribute("aria-current", String(i === huidig));
    });
  }
})();
