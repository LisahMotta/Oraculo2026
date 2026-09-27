const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'llama3-70b-8192',
];

function groqErrorMessage(status) {
  if (status === 401) return 'Chave da API Groq inválida ou expirada. Verifique a variável GROQ_API_KEY no Vercel.';
  if (status === 429) return 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.';
  if (status === 503) return 'Serviço Groq temporariamente indisponível. Tente novamente em instantes.';
  return 'Erro na API Groq (' + status + '). Tente novamente em instantes.';
}

async function callGroq(apiKey, messages) {
  let lastStatus = null;

  for (const model of GROQ_MODELS) {
    const payload = {
      model,
      max_completion_tokens: 4000,
      temperature: 0.8,
      messages,
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 404) {
      console.log('Modelo não encontrado, tentando próximo:', model);
      continue;
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq error [' + model + '] ' + response.status + ':', errText);
      lastStatus = response.status;
      if (response.status === 401 || response.status === 429) break;
      continue;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? 'Sem resposta do oráculo.';
  }

  throw new Error(lastStatus ? groqErrorMessage(lastStatus) : 'Nenhum modelo Groq disponível. Tente novamente em instantes.');
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

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: 'Minha pergunta: "' + question + '"\n\nAs cartas sorteadas foram: ' + cards.join(', ') + '.\n\nFaca a leitura completa usando estas cartas, integrando Taro, Astrologia e Cabala conforme as instrucoes.',
      },
    ];

    const text = await callGroq(apiKey, messages);
    return res.status(200).json({ text });
  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
