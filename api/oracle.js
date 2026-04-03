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

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 4000,
        temperature: 0.8,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: 'Minha pergunta: "' + question + '"\n\nAs cartas sorteadas foram: ' + cards.join(', ') + '.\n\nFaca a leitura completa usando estas cartas, integrando Taro, Astrologia e Cabala conforme as instrucoes.',
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API error:', errText);
      return res.status(response.status).json({ error: 'Erro na API Groq: ' + response.status });
    }

    const data = await response.json();
    const text = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : 'Sem resposta do oraculo.';

    return res.status(200).json({ text });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}