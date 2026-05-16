// /api/verify.js
// Vercel Serverless Function - válasz hatályosság-ellenőrzés a Közigazgatási alapvizsga (NKE, 15. kiadás, 2026)
// alapján. Az AI a 22 almodul kontextusát kapja referenciaként.

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Csak POST kérés engedélyezett' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY environment variable is missing');
    return res.status(500).json({ error: 'Az ANTHROPIC_API_KEY nincs beállítva.' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Érvénytelen JSON.' });
  }

  const { question, providedAnswer, type, bookContext } = body;
  if (!question || !providedAnswer) {
    return res.status(400).json({ error: 'Hiányzó: question vagy providedAnswer.' });
  }

  const isTF = type === 'tf';

  const prompt = `Te a magyar Közigazgatási Alapvizsga tankönyv (NKE, 15. kiadás, 2026. február 1-i hatállyal) szakértő lektora vagy. Egy 2017-es vizsgakérdés-adatbázisból származó kérdést és választ kapsz. Ellenőrizd, hogy a megadott válasz a JELENLEG HATÁLYOS tankönyv és magyar jogszabályok szerint helyes-e.

REFERENCIA – a tankönyv kulcselemei almodulonként (összefoglaló):

${bookContext || '(nincs külön kontextus megadva – használd az általános tudásodat a magyar közigazgatási alapvizsga tananyagáról)'}

ELLENŐRZENDŐ KÉRDÉS:
${question}

MEGADOTT VÁLASZ AZ ADATBÁZISBAN${isTF ? ' (IGAZ/HAMIS típus)' : ''}:
${providedAnswer}

FELADAT:
1. Döntsd el: "helyes", "vitatható" vagy "helytelen" a megadott válasz a jelenleg hatályos tananyag szerint.
2. Adj rövid (1-3 mondat) magyarázatot a könyv vagy a vonatkozó jogszabály alapján.
3. Ha vitatható vagy helytelen: add meg, mit mond ma a könyv vagy a jog.

VÁLASZ FORMÁTUM (TISZTA JSON, nincs körítés, markdown, code fence vagy bevezetés):
{
  "verdict": "helyes" | "vitatható" | "helytelen",
  "explanation": "Rövid magyarázat a tankönyv vagy jogszabály alapján.",
  "currentAnswer": "Ha a megadott válasz nem helyes, ide írd a HELYESET. Egyébként hagyd üresen."
}`;

  try {
    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('Anthropic API error:', apiResponse.status, errorText);
      return res.status(502).json({ error: `Anthropic API hiba: ${apiResponse.status}` });
    }

    const data = await apiResponse.json();
    const text = (data.content && data.content[0] && data.content[0].text) || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON in verify response:', text.substring(0, 300));
      return res.status(500).json({ error: 'AI válaszában nincs JSON.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      return res.status(500).json({ error: 'JSON parse hiba: ' + e.message });
    }

    return res.status(200).json({
      verdict: (parsed.verdict || 'vitatható').toLowerCase(),
      explanation: parsed.explanation || '',
      currentAnswer: parsed.currentAnswer || ''
    });

  } catch (err) {
    console.error('verify.js internal error:', err);
    return res.status(500).json({ error: 'Belső hiba: ' + err.message });
  }
}
