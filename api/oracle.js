// Padrões de preferência para modelos de texto (ordem de prioridade)
const MODEL_PREFERENCE = ['llama-4', 'llama4', 'llama-3', 'llama3', 'mixtral', 'gemma', 'qwen', 'deepseek'];
const MODEL_EXCLUDE = ['whisper', 'embed', 'tts', 'guard', 'tool'];

async function pickModel(apiKey) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': 'Bearer ' + apiKey },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const ids = (data.data || [])
      .map(m => m.id)
      .filter(id => !MODEL_EXCLUDE.some(x => id.toLowerCase().includes(x)));

    for (const pattern of MODEL_PREFERENCE) {
      const match = ids.find(id => id.toLowerCase().includes(pattern));
      if (match) return match;
    }
    return ids[0] || null;
  } catch (e) {
    console.error('Erro ao listar modelos Groq:', e.message);
    return null;
  }
}

function groqErrorMessage(status) {
  if (status === 401) return 'Chave da API Groq inválida ou expirada. Verifique a variável GROQ_API_KEY no Vercel.';
  if (status === 429) return 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.';
  if (status === 503) return 'Serviço Groq temporariamente indisponível. Tente novamente em instantes.';
  return 'Erro na API Groq (' + status + '). Tente novamente em instantes.';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY não configurada no Vercel. Acesse Settings → Environment Variables.' });
  }

  try {
    const { question, cards, systemPrompt } = req.body;
    if (!question || !cards || !systemPrompt) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const model = await pickModel(apiKey);
    if (!model) {
      return res.status(500).json({ error: 'Nenhum modelo de texto disponível no Groq. Tente novamente em instantes.' });
    }
    console.log('Usando modelo:', model);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model,
        temperature: 0.8,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: 'Minha pergunta: "' + question + '"\n\nAs cartas sorteadas foram: ' + cards.join(', ') + '.\n\nFaca a leitura completa usando estas cartas, integrando Taro, Astrologia e Cabala conforme as instrucoes.',
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq error [' + model + '] ' + response.status + ':', errText);
      return res.status(500).json({ error: groqErrorMessage(response.status) });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? 'Sem resposta do oráculo.';
    return res.status(200).json({ text });
  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
