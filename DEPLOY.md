# De site online zetten met GitHub Pages (gratis) + je Versio-domein

Je hebt alleen het **domein** bij Versio, geen webhosting. Dat is geen probleem:
we hosten de site gratis op **GitHub Pages** en laten je Versio-domein daarnaar
wijzen via één DNS-instelling. Versio blijft je domeinnaam beheren; de hosting
gebeurt bij GitHub.

Er staat al een workflow klaar (`.github/workflows/deploy.yml`) die de site
automatisch publiceert.

---

## Stap 1 — Zet de code op de `main`-branch
De workflow draait bij een push naar **`main`**. De site staat nu op de branch
`claude/job-application-website-in1etc`. Merge die naar `main` (via een Pull
Request op GitHub, of laat mij het doen), zodat GitHub Pages er iets mee kan.

## Stap 2 — Zet GitHub Pages aan
1. Ga in de repository naar **Settings → Pages**.
2. Bij **Build and deployment → Source** kies je **GitHub Actions**.
3. Push naar `main` (of start de workflow via **Actions → Deploy naar GitHub Pages → Run workflow**).
   Na ~1 minuut staat de site online op de standaard-URL:
   **https://remidocc.github.io/Bibliotheek/**

Dat is al een werkende, deelbare link — je hebt hiervoor géén domein nodig.

---

## Stap 3 (optioneel) — Je eigen domein koppelen
Wil je liever een nette eigen URL? Dan koppel je je Versio-domein aan GitHub Pages.
De aanbevolen keuze is een **subdomein**, bijvoorbeeld
**`bibliotheek.remigommans.nl`** — dat is het eenvoudigst en veiligst.

### A. Subdomein: bibliotheek.remigommans.nl (aanbevolen)
1. **Bij GitHub:** Settings → Pages → **Custom domain** → vul in
   `bibliotheek.remigommans.nl` → **Save**. Zet daarna **Enforce HTTPS** aan
   (kan even duren voordat dat aanvinkbaar is).
2. **Bij Versio:** log in op mijn.versio.nl → **Domeinnamen → remigommans.nl → DNS-beheer**.
   Voeg een **CNAME-record** toe:

   | Type  | Naam / Host   | Waarde / Wijst naar     | TTL     |
   |-------|---------------|-------------------------|---------|
   | CNAME | `bibliotheek` | `remidocc.github.io.`   | 3600    |

3. Wacht tot de DNS is doorgevoerd (meestal 15 min – enkele uren). Daarna staat
   de site op **https://bibliotheek.remigommans.nl**.

### B. Hoofddomein: remigommans.nl (alleen als je het hele domein hiervoor wilt gebruiken)
Dit richt je hele domein op deze site. Bij Versio DNS-beheer voeg je dan
**A-records** toe voor `@` naar de vier GitHub Pages IP-adressen:
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```
En optioneel een CNAME voor `www` naar `remidocc.github.io.`.
Bij GitHub vul je dan `remigommans.nl` in als Custom domain.

> Twijfel je? Kies **A (subdomein)**. Dan blijft je hoofddomein vrij voor ander gebruik.

---

## Wijzigingen doorvoeren
Elke keer dat er iets naar `main` wordt gepusht, publiceert GitHub de site
automatisch opnieuw. Je hoeft verder niets te doen.

## Belangrijk
- De custom-domeininstelling in GitHub maakt automatisch een `CNAME`-bestand aan
  in de repo. Verwijder dat niet.
- Werkt HTTPS nog niet meteen na het koppelen van het domein? Even geduld —
  GitHub maakt op de achtergrond een gratis certificaat aan.
