const MODEL_EXCLUDE = ['embedding', 'aqa', 'imagen', 'tts', 'whisper'];
const MODEL_PREFER = ['flash', 'pro'];

async function pickGeminiModel(apiKey) {
  try {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error('models list ' + res.status + ': ' + (err?.error?.message || res.statusText));
    }
    const data = await res.json();
    const names = (data.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => m.name.replace('models/', ''))
      .filter(name => !MODEL_EXCLUDE.some(x => name.toLowerCase().includes(x)));

    console.log('Modelos disponíveis para generateContent:', names);

    for (const pref of MODEL_PREFER) {
      const match = names.find(n => n.toLowerCase().includes(pref));
      if (match) return match;
    }
    return names[0] || null;
  } catch (e) {
    console.error('Erro ao listar modelos Gemini:', e.message);
    throw e;
  }
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

    let model;
    try {
      model = await pickGeminiModel(apiKey);
    } catch (e) {
      return res.status(500).json({ error: 'Falha ao listar modelos Gemini: ' + e.message });
    }

    if (!model) {
      return res.status(500).json({ error: 'Nenhum modelo Gemini disponível para sua chave. Verifique se GEMINI_API_KEY é uma chave válida do Google AI Studio (aistudio.google.com).' });
    }
    console.log('Usando modelo Gemini:', model);

    const userMessage = 'Minha pergunta: "' + question + '"\n\nAs cartas sorteadas foram: ' + cards.join(', ') + '.\n\nFaca a leitura completa usando estas cartas, integrando Taro, Astrologia e Cabala conforme as instrucoes.';
    const response = await callGemini(apiKey, model, systemPrompt, userMessage, 0.8);

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const detail = errBody?.error?.message || response.statusText;
      console.error('Gemini error [' + model + '] ' + response.status + ':', detail);
      return res.status(500).json({ error: 'Erro Gemini no modelo ' + model + ' (' + response.status + '): ' + detail });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sem resposta do oráculo.';
    return res.status(200).json({ text });
  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
