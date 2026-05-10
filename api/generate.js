// /api/generate.js
// Vercel Serverless Function - Anthropic Claude API
// Per-submodule kvíz generálás a könyv tartalma alapján

export default async function handler(req, res) {
  // CORS / method
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Csak POST kérés engedélyezett' });
  }

  // API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY environment variable is missing');
    return res.status(500).json({ error: 'Az ANTHROPIC_API_KEY nincs beállítva a Vercel környezeti változók között.' });
  }

  // Body parsing - support both Vercel auto-parsed and raw JSON
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Érvénytelen JSON.' });
  }

  const {
    submoduleId,
    submoduleName,
    moduleName,
    context,
    count = 10
  } = body;

  if (!submoduleId || !submoduleName || !context) {
    return res.status(400).json({ error: 'Hiányzó paraméter: submoduleId, submoduleName vagy context.' });
  }

  const prompt = `Te a magyar közigazgatási alapvizsga tankönyv (Nemzeti Közszolgálati Egyetem, 15. kiadás 2026) szakértője vagy. Generálj ${count} kérdést kifejezetten az alábbi almodul tartalmából.

ALMODUL: ${submoduleId}. ${submoduleName}
MODUL: ${moduleName}

A KÖNYV ERRE VONATKOZÓ TARTALMA:
${context}

KÖVETELMÉNYEK:
- Pontosan ${count} kérdés
- Minden kérdéshez 4 válaszlehetőség, ebből pontosan 1 helyes
- A "correct" mező értéke 0–3 (a helyes válasz indexe a "answers" tömbben)
- A kérdések kizárólag a fenti könyvi tartalomra épüljenek
- Változatos nehézségi szint (egyszerű tényekre kérdezés, fogalmak alkalmazása, számok/dátumok visszakérdezése)
- Magyar nyelven, vizsgastílusban, egyértelmű és pontos megfogalmazással
- A "explanation" mező rövid, max. 2 mondatos magyarázat a könyv alapján

KIMENETI FORMÁTUM (TISZTA JSON, semmi más, semmilyen markdown vagy bevezető szöveg):

{
  "questions": [
    {
      "question": "A kérdés szövege?",
      "answers": ["A) válasz", "B) válasz", "C) válasz", "D) válasz"],
      "correct": 0,
      "explanation": "Rövid magyarázat a könyv alapján."
    }
  ]
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
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('Anthropic API error:', apiResponse.status, errorText);
      return res.status(502).json({
        error: `Anthropic API hiba: ${apiResponse.status}. Részletek a Vercel logokban.`
      });
    }

    const data = await apiResponse.json();
    const text = (data.content && data.content[0] && data.content[0].text) || '';

    // Robust JSON parsing — pull the first {…} block, fenced or not
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in API response:', text.substring(0, 500));
      return res.status(500).json({ error: 'Az AI válaszában nincs érvényes JSON.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('JSON parse error:', e.message, 'Raw:', jsonMatch[0].substring(0, 500));
      return res.status(500).json({ error: 'Sikertelen JSON parse: ' + e.message });
    }

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return res.status(500).json({ error: 'A válasz nem tartalmaz "questions" tömböt.' });
    }

    // Sanitize each question
    const cleanQuestions = parsed.questions
      .filter(q => q && q.question && Array.isArray(q.answers) && q.answers.length === 4 && typeof q.correct === 'number')
      .map(q => ({
        question: String(q.question).trim(),
        answers: q.answers.map(a => String(a).trim()),
        correct: Math.max(0, Math.min(3, parseInt(q.correct, 10) || 0)),
        explanation: q.explanation ? String(q.explanation).trim() : ''
      }));

    if (cleanQuestions.length === 0) {
      return res.status(500).json({ error: 'Egyetlen érvényes kérdés sem volt a válaszban.' });
    }

    return res.status(200).json({ questions: cleanQuestions });

  } catch (err) {
    console.error('Internal handler error:', err);
    return res.status(500).json({ error: 'Belső hiba: ' + err.message });
  }
}
