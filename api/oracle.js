const MODEL_CANDIDATES = [
  { model: 'gemini-2.0-flash', version: 'v1beta' },
  { model: 'gemini-1.5-flash', version: 'v1beta' },
  { model: 'gemini-1.5-flash', version: 'v1' },
  { model: 'gemini-1.5-pro', version: 'v1beta' },
  { model: 'gemini-1.0-pro', version: 'v1' },
];

async function callGemini(apiKey, version, model, systemPrompt, userMessage, temperature) {
  const url = 'https://generativelanguage.googleapis.com/' + version + '/models/' + model + ':generateContent?key=' + apiKey;
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { temperature },
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no Vercel. Acesse Settings → Environment Variables e adicione sua chave do Google AI Studio (aistudio.google.com).' });
  }

  try {
    const { question, cards, systemPrompt } = req.body;
    if (!question || !cards || !systemPrompt) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const userMessage = 'Minha pergunta: "' + question + '"\n\nAs cartas sorteadas foram: ' + cards.join(', ') + '.\n\nFaca a leitura completa usando estas cartas, integrando Taro, Astrologia e Cabala conforme as instrucoes.';

    let lastStatus = null;
    let lastBody = '';
    for (const { model, version } of MODEL_CANDIDATES) {
      console.log('Tentando:', version, model);
      const response = await callGemini(apiKey, version, model, systemPrompt, userMessage, 0.8);

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sem resposta do oráculo.';
        return res.status(200).json({ text });
      }

      lastStatus = response.status;
      lastBody = await response.text();
      console.error('Gemini error [' + version + '/' + model + '] ' + response.status + ':', lastBody);

      if (response.status === 400 || response.status === 401 || response.status === 403) break;
    }

    let errorMsg = 'Erro Gemini (' + lastStatus + ')';
    try {
      const parsed = JSON.parse(lastBody);
      const detail = parsed?.error?.message || parsed?.error?.status || '';
      if (detail) errorMsg += ': ' + detail;
    } catch (_) {}

    if (lastStatus === 400) errorMsg = 'Chave da API Gemini inválida. Verifique GEMINI_API_KEY no Vercel. Detalhe: ' + errorMsg;
    if (lastStatus === 401 || lastStatus === 403) errorMsg = 'Chave da API Gemini sem permissão. Verifique GEMINI_API_KEY no Vercel.';

    return res.status(500).json({ error: errorMsg });
  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
