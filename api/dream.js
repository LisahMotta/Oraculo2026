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
  return sortByPreference(names);
}

async function callGemini(apiKey, model, userMessage, temperature) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: DREAM_SYSTEM_PROMPT }] },
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
    const { dreamText } = req.body;
    if (!dreamText) {
      return res.status(400).json({ error: 'Descrição do sonho ausente' });
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

    const userMessage = 'Meu sonho foi: "' + dreamText + '"\n\nPor favor, faça a interpretação completa deste sonho, identificando símbolos, arquétipos junguianos e a mensagem espiritual, conforme as instruções.';

    let lastError = '';
    for (const model of models) {
      console.log('Tentando modelo:', model);
      const response = await callGemini(apiKey, model, userMessage, 0.85);

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sem resposta do intérprete.';
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
