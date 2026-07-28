// Vercel serverless functie: herschrijft een brief naar B1-Nederlands.
// De API-sleutel blijft server-side (process.env.ANTHROPIC_API_KEY).
// Draait deze site op GitHub Pages, dan bestaat dit endpoint niet en
// gebruikt de pagina automatisch het opgeslagen antwoord.

const SYSTEEM =
  "Je herschrijft Nederlandse brieven van instanties naar taalniveau B1, " +
  "voor lezers die moeite hebben met lezen. Regels: korte zinnen (maximaal " +
  "15 woorden), alledaagse woorden, actieve vorm, spreek de lezer aan met u, " +
  "zet de belangrijkste boodschap bovenaan, gebruik een opsomming voor " +
  "bedragen en termijnen, en laat geen inhoudelijke informatie weg. " +
  "Antwoord met alleen de herschreven brief, zonder toelichting.";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Alleen POST" });
    return;
  }
  const brief = req.body && req.body.brief;
  if (!brief || typeof brief !== "string" || brief.length > 20000) {
    res.status(400).json({ error: "Geen geldige brief meegegeven" });
    return;
  }

  // Hard limiet van 15 seconden — daarna toont de pagina de fallback.
  const ctl = new AbortController();
  const wekker = setTimeout(() => ctl.abort(), 15000);

  try {
    const antwoord = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: ctl.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-5",
        // Ruim genoeg: max_tokens telt denkstappen en antwoord bij elkaar op.
        max_tokens: 4096,
        // Laag denkniveau — herschrijven is een omzetting, geen puzzel.
        // Scheelt seconden, en tijdens de presentatie telt elke seconde.
        output_config: { effort: "low" },
        system: SYSTEEM,
        messages: [
          {
            role: "user",
            content:
              "Herschrijf deze brief naar begrijpelijke taal (B1):\n\n" + brief,
          },
        ],
      }),
    });

    if (!antwoord.ok) {
      res.status(502).json({ error: "API-fout " + antwoord.status });
      return;
    }

    const json = await antwoord.json();
    if (json.stop_reason === "refusal") {
      res.status(502).json({ error: "Verzoek geweigerd" });
      return;
    }
    const tekst = (json.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    if (!tekst) {
      res.status(502).json({ error: "Leeg antwoord" });
      return;
    }
    res.status(200).json({ herschreven: tekst });
  } catch (err) {
    const timeout = err && err.name === "AbortError";
    res.status(timeout ? 504 : 500).json({
      error: timeout ? "Time-out na 15 seconden" : "Serverfout",
    });
  } finally {
    clearTimeout(wekker);
  }
};
