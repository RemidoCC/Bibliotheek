# De site publiceren op remigommans.nl/bibliotheek (Versio)

Je host je site bij **Versio**. Versio heeft geen ingebouwde "koppel met GitHub"-knop,
maar je kunt het op twee manieren doen. **Optie A** is het snelst voor één keer.
**Optie B** koppelt GitHub aan Versio, zodat elke wijziging automatisch live gaat.

De site is gemaakt met relatieve links, dus alles werkt zodra de bestanden in de
map `bibliotheek/` op je webruimte staan.

---

## Optie A — Handmatig uploaden (snelste, geen instellingen)

1. Download deze repository als ZIP (op GitHub: knop **Code → Download ZIP**) en pak hem uit.
2. Log in op **mijn.versio.nl** en open je hostingpakket.
3. Ga naar **Bestandsbeheer** (of gebruik FTP, zie hieronder) en open de map
   waarin je website staat — meestal `public_html` of `www`.
4. Maak daarin een map **`bibliotheek`** aan.
5. Upload de **inhoud** van de repo (dus `index.html`, `cv.html`, `motivatiebrief.html`,
   `over-mij.html` en de map `assets/`) in die `bibliotheek`-map.
   > Upload NIET de mappen `.git`, `.github` of de bestanden `README.md` / `DEPLOY-VERSIO.md` —
   > die horen niet op de webserver.
6. Klaar: de site staat op **https://remigommans.nl/bibliotheek/**

### FTP-gegevens vinden bij Versio
In je Versio-account onder **Hosting → (jouw pakket) → FTP-accounts** vind je:
- **Server / host** (bijv. `ftp.remigommans.nl`)
- **Gebruikersnaam**
- **Wachtwoord** (kun je hier instellen/resetten)

Met een gratis FTP-programma zoals **FileZilla** verbind je met die gegevens en
sleep je de bestanden naar `public_html/bibliotheek/`.

---

## Optie B — Automatisch publiceren via GitHub Actions

Hiermee zet GitHub de site automatisch op Versio zodra je iets pusht. Er staat al
een kant-en-klare workflow in `.github/workflows/deploy.yml`. Je hoeft alleen je
FTP-gegevens veilig als "secrets" in GitHub te zetten.

### Stap 1 — Zorg dat de code op de `main`-branch staat
De workflow draait bij een push naar **`main`**. Merge deze branch naar `main`
(bijv. via een Pull Request), of wijzig in `deploy.yml` de regel onder `branches:`
naar de branchnaam die jij gebruikt.

### Stap 2 — Secrets toevoegen in GitHub
Ga in de repository naar **Settings → Secrets and variables → Actions → New repository secret**
en voeg deze vier toe:

| Secret naam        | Waarde (uit je Versio FTP-account)                                   |
|--------------------|----------------------------------------------------------------------|
| `FTP_SERVER`       | je FTP-host, bijv. `ftp.remigommans.nl`                              |
| `FTP_USERNAME`     | je FTP-gebruikersnaam                                                 |
| `FTP_PASSWORD`     | je FTP-wachtwoord                                                     |
| `FTP_SERVER_DIR`   | de doelmap met slash aan het eind, bijv. `/public_html/bibliotheek/` |

> Het exacte pad bij `FTP_SERVER_DIR` verschilt per pakket. Vaak is het
> `/public_html/bibliotheek/` of `/domains/remigommans.nl/public_html/bibliotheek/`.
> Kijk in Bestandsbeheer/FileZilla welk pad naar je website leidt en plak `bibliotheek/` erachter.

### Stap 3 — Publiceren
Push een wijziging naar `main` (of start de workflow handmatig via het tabblad
**Actions → Deploy naar Versio → Run workflow**). GitHub uploadt dan automatisch
alleen de gewijzigde bestanden naar Versio.

---

## Let op: veiligheid
- Zet je FTP-wachtwoord **nooit** rechtstreeks in een bestand in de repo — gebruik
  altijd de GitHub Secrets uit Optie B.
- Gebruikt jouw Versio-pakket **FTPS** (FTP over TLS)? Dan werkt de workflow meestal
  gewoon; lukt het niet, laat het weten, dan zetten we in `deploy.yml` de optie
  `protocol: ftps` erbij.
