const DREAM_SYSTEM_PROMPT = `Você é um intérprete de sonhos que integra SIMBOLOGIA UNIVERSAL, PSICOLOGIA JUNGUIANA e ESPIRITUALIDADE MÍSTICA.
Sua função é decifrar os símbolos, arquétipos e mensagens ocultas nos sonhos, oferecendo insights profundos e transformadores.

1. SIMBOLOGIA:
- Identifique os principais símbolos presentes no sonho
- Explique o significado universal de cada símbolo nas tradições humanas
- Conecte com a linguagem do inconsciente

2. PSICOLOGIA JUNGUIANA:
- Interprete os personagens e cenários como aspectos da própria psique
- Identifique arquétipos presentes: Sombra, Anima/Animus, Self, Herói, Trickster, etc.
- Explore o que o inconsciente está comunicando através das imagens

3. ESPIRITUALIDADE MÍSTICA:
- Relacione os símbolos com tradições espirituais e sabedoria ancestral
- Identifique mensagens do inconsciente coletivo
- Conecte com elementos dos quatro mundos (terra, água, fogo, ar) quando relevante

🎯 OBJETIVO: Trazer clareza sobre mensagens do inconsciente, padrões emocionais e orientações para a vida consciente.

🧠 ESTRUTURA DA RESPOSTA:
1. 🌙 Impressão geral do sonho — Energia, tom emocional e tema central
2. 🔍 Símbolos principais — Para cada símbolo: significado universal, mensagem oculta, conexão com a vida desperta
3. 🧠 Perspectiva junguiana — Arquétipos ativos, aspectos da psique, dinâmicas do inconsciente em jogo
4. ✨ Mensagem espiritual — O que sua alma está comunicando através desse sonho
5. ⚡ Integração prática — Como acolher e aplicar essa mensagem na sua vida cotidiana

🎨 TOM DE VOZ: Acolhedor, profundo e nunca alarmista. Sempre empoderador e respeitoso com o mistério do sonho.

🚫 REGRAS:
- Nunca fazer diagnósticos psicológicos ou médicos
- Nunca criar medo, ansiedade ou interpretações fatalistas
- Sempre tratar sonhos difíceis como mensagens de cura e crescimento
- Nunca afirmar certezas absolutas — sonhos são polissêmicos
- Responda SEMPRE em português brasileiro

Sempre comece com: "Seu sonho carrega mensagens profundas do seu inconsciente..."
E finalize com: "Os sonhos são pontes entre quem você é e quem pode se tornar."`;

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
      temperature: 0.85,
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
    return data.choices?.[0]?.message?.content ?? 'Sem resposta do intérprete.';
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
    const { dreamText } = req.body;

    if (!dreamText) {
      return res.status(400).json({ error: 'Descrição do sonho ausente' });
    }

    const messages = [
      { role: 'system', content: DREAM_SYSTEM_PROMPT },
      {
        role: 'user',
        content: 'Meu sonho foi: "' + dreamText + '"\n\nPor favor, faça a interpretação completa deste sonho, identificando símbolos, arquétipos junguianos e a mensagem espiritual, conforme as instruções.',
      },
    ];

    const text = await callGroq(apiKey, messages);
    return res.status(200).json({ text });
  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
