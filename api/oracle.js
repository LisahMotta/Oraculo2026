const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL_CANDIDATES = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

function geminiErrorMessage(status, body) {
  if (status === 400) return 'Chave da API Gemini inválida. Verifique a variável GEMINI_API_KEY no Vercel.';
  if (status === 401 || status === 403) return 'Chave da API Gemini sem permissão. Verifique a variável GEMINI_API_KEY no Vercel.';
  if (status === 429) return 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.';
  if (status === 503) return 'Serviço Gemini temporariamente indisponível. Tente novamente em instantes.';
  return 'Erro na API Gemini (' + status + '). Tente novamente em instantes.';
}

async function callGemini(apiKey, model, systemPrompt, userMessage, temperature) {
  const url = GEMINI_BASE + '/' + model + ':generateContent?key=' + apiKey;
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
    for (const model of MODEL_CANDIDATES) {
      console.log('Tentando modelo Gemini:', model);
      const response = await callGemini(apiKey, model, systemPrompt, userMessage, 0.8);

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sem resposta do oráculo.';
        return res.status(200).json({ text });
      }

      lastStatus = response.status;
      lastBody = await response.text();
      console.error('Gemini error [' + model + '] ' + response.status + ':', lastBody);

      if (response.status === 400 || response.status === 401 || response.status === 403) break;
    }

    return res.status(500).json({ error: geminiErrorMessage(lastStatus, lastBody) });
  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
