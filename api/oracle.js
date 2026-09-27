const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'llama3-70b-8192',
];

async function callGroq(apiKey, body) {
  for (const model of GROQ_MODELS) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({ ...body, model }),
    });

    if (response.status === 404) continue;

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API error (' + model + '):', errText);
      throw new Error('Groq ' + response.status);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? 'Sem resposta do oraculo.';
  }
  throw new Error('Nenhum modelo Groq disponível no momento.');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY nao configurada no Vercel' });
  }

  try {
    const { question, cards, systemPrompt } = req.body;

    if (!question || !cards || !systemPrompt) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const text = await callGroq(apiKey, {
      max_tokens: 4000,
      temperature: 0.8,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: 'Minha pergunta: "' + question + '"\n\nAs cartas sorteadas foram: ' + cards.join(', ') + '.\n\nFaca a leitura completa usando estas cartas, integrando Taro, Astrologia e Cabala conforme as instrucoes.',
        },
      ],
    });

    return res.status(200).json({ text });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Não foi possível consultar o oráculo. Tente novamente em instantes.' });
  }
}
