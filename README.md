# Sollicitatiewebsite — Remi Gommans

Statische sollicitatiewebsite voor de functie **Coördinator Digitaal** bij De Bibliotheek Venlo.

## Pagina's
- `index.html` — Home
- `cv.html` — Curriculum Vitae
- `motivatiebrief.html` — Motivatiebrief
- `over-mij.html` — Over mij

## Kenmerken
- Professioneel, formeel ontwerp in bibliotheeksfeer (boekengroen + goud, serif-koppen).
- Geanimeerde achtergrond: zwevende stofdeeltjes, parallax-boekenkasten en een "leeslamp"-glow die de muis volgt (`<canvas>` + CSS).
- Eigen muiscursor met hover-uitvergroting en subtiele hover-effecten op knoppen, kaarten en links.
- Volledig responsive met mobiel menu.
- Respecteert `prefers-reduced-motion` en zware animaties zijn uitgeschakeld op touch-apparaten.
- Geen build-stap of framework nodig; enkel HTML/CSS/JS. Alleen webfonts worden extern geladen (Google Fonts, met systeem-fallbacks).

## Structuur
```
index.html, cv.html, motivatiebrief.html, over-mij.html
assets/
  css/style.css
  js/main.js
  img/remi-portrait.jpg, remi-avatar.jpg
  files/CV-Remi-Gommans.docx   (download)
```

## Publiceren
De site draait gratis op **GitHub Pages**; je Versio-domein kan er via DNS naar
wijzen. Volledige stap-voor-stap uitleg staat in **`DEPLOY.md`**.
Alle links zijn relatief, dus de site werkt zowel op de standaard Pages-URL
(`https://remidocc.github.io/Bibliotheek/`) als op een eigen (sub)domein.
