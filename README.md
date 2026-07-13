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

## Publiceren onder remigommans.nl/bibliotheek
Alle links en verwijzingen zijn relatief, dus de site werkt onder elke submap.
Plaats de inhoud van deze map in de map `bibliotheek/` van je webhosting, zodat de
site bereikbaar is op `https://remigommans.nl/bibliotheek/`.
