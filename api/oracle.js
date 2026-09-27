const MODEL_EXCLUDE = ['embedding', 'aqa', 'imagen', 'tts', 'whisper'];

function sortByPreference(names) {
  const score = name => {
    if (name.includes('3.8')) return 100;
    if (name.includes('3.0') || name.includes('3-flash')) return 90;
    if (name.includes('2.0')) return 80;
    if (name.includes('flash')) return 70;
    if (name.includes('pro')) return 60;
    return 50;
  };
  return [...names].sort((a, b) => score(b) - score(a));
}

async function listGeminiModels(apiKey) {
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error('Falha ao listar modelos (' + res.status + '): ' + (err?.error?.message || res.statusText));
  }
  const data = await res.json();
  const names = (data.models || [])
    .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map(m => m.name.replace('models/', ''))
    .filter(name => !MODEL_EXCLUDE.some(x => name.toLowerCase().includes(x)));
  console.log('Modelos disponíveis:', names);
  return sortByPreference(names);
}

async function callGemini(apiKey, model, systemPrompt, userMessage, temperature) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;
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

    let models;
    try {
      models = await listGeminiModels(apiKey);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }

    if (!models.length) {
      return res.status(500).json({ error: 'Nenhum modelo Gemini disponível. Verifique se GEMINI_API_KEY é válida.' });
    }

    const userMessage = 'Minha pergunta: "' + question + '"\n\nAs cartas sorteadas foram: ' + cards.join(', ') + '.\n\nFaca a leitura completa usando estas cartas, integrando Taro, Astrologia e Cabala conforme as instrucoes.';

    let lastError = '';
    for (const model of models) {
      console.log('Tentando modelo:', model);
      const response = await callGemini(apiKey, model, systemPrompt, userMessage, 0.8);

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sem resposta do oráculo.';
        console.log('Sucesso com modelo:', model);
        return res.status(200).json({ text });
      }

      const errBody = await response.json().catch(() => ({}));
      lastError = errBody?.error?.message || response.statusText;
      console.error('Erro no modelo ' + model + ' (' + response.status + '):', lastError);

      if (response.status === 404) continue;
      break;
    }

    return res.status(500).json({ error: 'Nenhum modelo disponível: ' + lastError });
  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
