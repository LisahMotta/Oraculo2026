import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `Você é um oráculo avançado que integra TARÔ, ASTROLOGIA e CABALA de forma simbólica, intuitiva e estratégica.
Sua função é oferecer leituras profundas, reflexivas e práticas, conectando três sistemas:

1. TARÔ:
- Interprete os arcanos maiores e menores com base em arquétipos, situação atual, conselhos e tendências
- Sempre explique a energia da carta de forma acessível e aplicável
- Sorteie as cartas aleatoriamente para a tiragem

2. ASTROLOGIA:
- Relacione cada carta com signos, planetas e casas astrológicas
- Traga a energia astrológica como complemento interpretativo

3. CABALA:
- Associe quando possível com Árvore da Vida (sefirot), caminhos espirituais e processos de evolução da alma
- Use linguagem simples, mas mantendo profundidade espiritual

🎯 OBJETIVO: Gerar clareza, consciência e direcionamento prático.

🧠 ESTRUTURA DA RESPOSTA:
1. 🔍 Contexto energético geral - Leitura intuitiva da situação
2. 🃏 Interpretação das cartas - Para cada carta: significado direto, influência astrológica, correspondência cabalística, aplicação prática
3. 🔗 Síntese integrada - Conecte TARÔ + ASTROLOGIA + CABALA, mostre o padrão oculto
4. ⚡ Conselho prático - O que fazer, o que evitar, como agir conscientemente
5. 🌱 Potencial futuro (sem determinismo)

🎨 TOM DE VOZ: Intuitivo, acolhedor e profundo. Nunca fatalista. Sempre empoderador.

🚫 REGRAS:
- Nunca afirmar certezas absolutas sobre o futuro
- Nunca incentivar dependência da leitura
- Sempre reforçar livre arbítrio
- Responda SEMPRE em português brasileiro

✨ TIPOS DE TIRAGEM:
Se o usuário não especificar, escolha automaticamente a melhor:
- 3 cartas → passado / presente / futuro
- 5 cartas → situação / desafio / conselho / ação / resultado
- 7 cartas → leitura completa espiritual e prática

Sempre comece com: "Vou me conectar com a energia da sua questão..."
E finalize com: "A energia mostra caminhos, mas quem decide é você."`;

const TAROT_CARDS = [
  "O Louco","O Mago","A Sacerdotisa","A Imperatriz","O Imperador",
  "O Hierofante","Os Enamorados","O Carro","A Força","O Eremita",
  "A Roda da Fortuna","A Justiça","O Enforcado","A Morte","A Temperança",
  "O Diabo","A Torre","A Estrela","A Lua","O Sol","O Julgamento","O Mundo"
];

const CARD_SYMBOLS = {
  "O Louco":"0","O Mago":"I","A Sacerdotisa":"II","A Imperatriz":"III",
  "O Imperador":"IV","O Hierofante":"V","Os Enamorados":"VI","O Carro":"VII",
  "A Força":"VIII","O Eremita":"IX","A Roda da Fortuna":"X","A Justiça":"XI",
  "O Enforcado":"XII","A Morte":"XIII","A Temperança":"XIV","O Diabo":"XV",
  "A Torre":"XVI","A Estrela":"XVII","A Lua":"XVIII","O Sol":"XIX",
  "O Julgamento":"XX","O Mundo":"XXI"
};

const CARD_GLYPHS = {
  "O Louco":"🃏","O Mago":"✨","A Sacerdotisa":"🌙","A Imperatriz":"🌿",
  "O Imperador":"👑","O Hierofante":"🔑","Os Enamorados":"💕","O Carro":"⚡",
  "A Força":"🦁","O Eremita":"🏔","A Roda da Fortuna":"☸","A Justiça":"⚖",
  "O Enforcado":"🔮","A Morte":"🦋","A Temperança":"🏺","O Diabo":"🔗",
  "A Torre":"⚡","A Estrela":"⭐","A Lua":"🌕","O Sol":"☀",
  "O Julgamento":"🎺","O Mundo":"🌍"
};

function formatResponse(text) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('## ') || line.startsWith('### ')) {
      const level = line.startsWith('### ') ? 3 : 2;
      const content = line.replace(/^#{2,3}\s+/, '');
      return <div key={i} className={level === 2 ? "resp-h2" : "resp-h3"}>{content}</div>;
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      return <div key={i} className="resp-bold">{line.replace(/\*\*/g, '')}</div>;
    }
    if (line.startsWith('- ')) {
      return <div key={i} className="resp-item">{line.replace(/^- /, '').replace(/\*\*/g, '').replace(/\*/g, '')}</div>;
    }
    if (line.startsWith('---')) return <hr key={i} className="resp-hr" />;
    if (line.trim() === '') return <div key={i} className="resp-spacer" />;
    const formatted = line.replace(/\*\*(.+?)\*\*/g, '⟨$1⟩').replace(/\*(.+?)\*/g, '⟨$1⟩');
    return <p key={i} className="resp-p">{formatted}</p>;
  });
}

function StarField() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    delay: Math.random() * 4,
    duration: Math.random() * 3 + 2,
  }));
  return (
    <div className="star-field">
      {stars.map(s => (
        <div key={s.id} className="star" style={{
          left: `${s.left}%`, top: `${s.top}%`,
          width: `${s.size}px`, height: `${s.size}px`,
          animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s`,
        }} />
      ))}
    </div>
  );
}

function CardReveal({ cards, onComplete }) {
  const [revealed, setRevealed] = useState([]);

  useEffect(() => {
    cards.forEach((_, i) => {
      setTimeout(() => {
        setRevealed(prev => [...prev, i]);
        if (i === cards.length - 1) {
          setTimeout(() => onComplete(), 1200);
        }
      }, i * 700);
    });
  }, []);

  return (
    <div className="card-reveal-container">
      <div className="cards-row">
        {cards.map((card, i) => (
          <div key={i} className={`tarot-card ${revealed.includes(i) ? 'revealed' : ''}`}>
            <div className="card-inner">
              <div className="card-back">
                <div className="card-back-pattern">
                  <div className="card-back-star">✦</div>
                </div>
              </div>
              <div className="card-front">
                <div className="card-numeral">{CARD_SYMBOLS[card] || ''}</div>
                <div className="card-glyph">{CARD_GLYPHS[card] || '🃏'}</div>
                <div className="card-name">{card}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingOracle() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const interval = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="oracle-loading">
      <div className="oracle-eye">𓂀</div>
      <p>Consultando o oráculo{dots}</p>
    </div>
  );
}

const SUGGESTED = [
  "Como estão minhas finanças este mês?",
  "Leitura geral sobre minha vida amorosa",
  "O que o universo quer me dizer agora?",
  "Orientação para minha carreira",
  "Bloqueios que preciso superar",
  "Energia espiritual do momento",
];

export default function App() {
  const [question, setQuestion] = useState('');
  const [spreadType, setSpreadType] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState(null);
  const [response, setResponse] = useState('');
  const [cardsReady, setCardsReady] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const responseRef = useRef(null);

  function pickCards(n) {
    const shuffled = [...TAROT_CARDS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  async function doReading(q) {
    if (!q.trim()) return;
    setError('');
    setResponse('');
    setCardsReady(false);

    let numCards = 5;
    if (spreadType === '3') numCards = 3;
    else if (spreadType === '5') numCards = 5;
    else if (spreadType === '7') numCards = 7;
    else {
      if (q.length < 30) numCards = 3;
      else if (q.length < 80) numCards = 5;
      else numCards = 7;
    }

    const selected = pickCards(numCards);
    setCards(selected);
    setLoading(true);

    try {
      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          cards: selected,
          systemPrompt: SYSTEM_PROMPT,
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.text);
      setHistory(prev => [{
        question: q, cards: selected, response: data.text,
        timestamp: new Date().toLocaleString('pt-BR')
      }, ...prev].slice(0, 10));
    } catch (err) {
      setError("Não foi possível consultar o oráculo. Verifique se a variável ANTHROPIC_API_KEY está configurada no Vercel.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (cardsReady && responseRef.current) {
      setTimeout(() => responseRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, [cardsReady]);

  function reset() {
    setQuestion(''); setCards(null); setResponse(''); setCardsReady(false); setError('');
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, #root { min-height: 100vh; background: #0a0a12; color: #d4c5a9; font-family: 'Cormorant Garamond', serif; }
        .oracle-app { min-height: 100vh; position: relative; overflow-x: hidden;
          background: radial-gradient(ellipse at 20% 0%, rgba(88,56,120,0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 100%, rgba(120,80,40,0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(20,15,40,0.9) 0%, #0a0a12 70%); }
        .star-field { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .star { position: absolute; background: #fff8e1; border-radius: 50%; animation: twinkle ease-in-out infinite alternate; }
        @keyframes twinkle { from { opacity: 0.1; transform: scale(0.8); } to { opacity: 0.9; transform: scale(1.2); } }
        .content { position: relative; z-index: 1; max-width: 780px; margin: 0 auto; padding: 40px 20px 60px; }
        .header { text-align: center; margin-bottom: 48px; animation: fadeDown 1s ease-out; }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .header-eye { font-size: 42px; display: block; margin-bottom: 8px; filter: drop-shadow(0 0 20px rgba(212,175,85,0.4)); }
        .header h1 { font-family: 'Cinzel Decorative', serif; font-size: 28px; font-weight: 700; color: #e8d5a3; letter-spacing: 6px; text-transform: uppercase; text-shadow: 0 0 30px rgba(212,175,85,0.3); }
        .header-sub { font-size: 15px; color: #8a7d6b; margin-top: 8px; font-style: italic; letter-spacing: 2px; }
        .divider { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 32px 0; color: #4a3f30; font-size: 12px; letter-spacing: 4px; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #4a3f30, transparent); }
        .question-section { animation: fadeUp 0.8s ease-out 0.3s both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .question-label { font-family: 'Cinzel Decorative', serif; font-size: 14px; color: #a89470; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 16px; text-align: center; }
        .textarea-wrap { position: relative; border: 1px solid #2a2235; border-radius: 12px; background: rgba(15,12,25,0.8); overflow: hidden; transition: border-color 0.3s; }
        .textarea-wrap:focus-within { border-color: #6b5a3e; box-shadow: 0 0 20px rgba(107,90,62,0.15); }
        .textarea-wrap textarea { width: 100%; padding: 20px; background: transparent; border: none; color: #d4c5a9; font-family: 'Cormorant Garamond', serif; font-size: 17px; line-height: 1.6; resize: none; outline: none; min-height: 100px; }
        .textarea-wrap textarea::placeholder { color: #4a3f30; font-style: italic; }
        .spread-row { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid #1a1525; flex-wrap: wrap; }
        .spread-btn { padding: 6px 14px; border-radius: 20px; border: 1px solid #2a2235; background: transparent; color: #7a6d58; font-family: 'Cormorant Garamond', serif; font-size: 13px; cursor: pointer; transition: all 0.3s; }
        .spread-btn:hover { border-color: #6b5a3e; color: #d4c5a9; }
        .spread-btn.active { background: rgba(107,90,62,0.2); border-color: #8a7340; color: #e8d5a3; }
        .consult-btn { display: block; width: 100%; margin-top: 20px; padding: 16px; background: linear-gradient(135deg, #3d2e1a, #2a1f10); border: 1px solid #6b5a3e; border-radius: 12px; color: #e8d5a3; font-family: 'Cinzel Decorative', serif; font-size: 16px; letter-spacing: 3px; cursor: pointer; transition: all 0.4s; text-transform: uppercase; }
        .consult-btn:hover:not(:disabled) { background: linear-gradient(135deg, #4d3e2a, #3a2f20); box-shadow: 0 0 30px rgba(212,175,85,0.15); transform: translateY(-1px); }
        .consult-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .suggestions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; justify-content: center; }
        .suggestion-chip { padding: 8px 16px; border-radius: 20px; border: 1px solid #1e1830; background: rgba(20,15,35,0.6); color: #7a6d58; font-family: 'Cormorant Garamond', serif; font-size: 14px; cursor: pointer; transition: all 0.3s; }
        .suggestion-chip:hover { border-color: #4a3f30; color: #d4c5a9; background: rgba(40,30,55,0.6); }
        .card-reveal-container { margin: 40px 0; overflow-x: auto; padding: 20px 0; }
        .cards-row { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
        .tarot-card { width: 100px; height: 160px; perspective: 600px; }
        .card-inner { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 0.8s cubic-bezier(0.4,0,0.2,1); }
        .tarot-card.revealed .card-inner { transform: rotateY(180deg); }
        .card-back, .card-front { position: absolute; inset: 0; border-radius: 10px; backface-visibility: hidden; display: flex; align-items: center; justify-content: center; }
        .card-back { background: linear-gradient(135deg, #1a1230, #2a1f40); border: 1px solid #3d2e55; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
        .card-back-pattern { width: 70%; height: 80%; border: 1px solid #4a3d60; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: repeating-conic-gradient(#2a2040 0% 25%, #1a1230 0% 50%) 50% / 12px 12px; }
        .card-back-star { font-size: 28px; color: #8a7340; text-shadow: 0 0 10px rgba(138,115,64,0.5); background: #1a1230; padding: 6px; border-radius: 50%; }
        .card-front { transform: rotateY(180deg); background: linear-gradient(160deg, #1a1525, #0f0c18); border: 1px solid #6b5a3e; flex-direction: column; gap: 4px; padding: 10px 6px; box-shadow: 0 4px 20px rgba(0,0,0,0.4), inset 0 0 30px rgba(107,90,62,0.05); }
        .card-numeral { font-family: 'Cinzel Decorative', serif; font-size: 13px; color: #8a7340; letter-spacing: 2px; }
        .card-glyph { font-size: 36px; filter: drop-shadow(0 0 8px rgba(212,175,85,0.2)); }
        .card-name { font-family: 'Cinzel Decorative', serif; font-size: 10px; color: #d4c5a9; text-align: center; letter-spacing: 1px; line-height: 1.2; }
        .oracle-loading { text-align: center; margin: 40px 0; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        .oracle-eye { font-size: 48px; margin-bottom: 12px; filter: drop-shadow(0 0 15px rgba(212,175,85,0.3)); }
        .oracle-loading p { color: #8a7d6b; font-style: italic; font-size: 16px; letter-spacing: 1px; }
        .response-section { margin-top: 32px; padding: 32px 24px; background: rgba(15,12,25,0.6); border: 1px solid #1e1830; border-radius: 16px; animation: fadeUp 0.6s ease-out; }
        .resp-h2 { font-family: 'Cinzel Decorative', serif; font-size: 18px; color: #e8d5a3; margin: 28px 0 14px; letter-spacing: 1px; border-bottom: 1px solid #2a2235; padding-bottom: 8px; }
        .resp-h2:first-child { margin-top: 0; }
        .resp-h3 { font-family: 'Cinzel Decorative', serif; font-size: 15px; color: #c4a96a; margin: 20px 0 10px; }
        .resp-bold { font-weight: 600; color: #c4a96a; margin: 10px 0 6px; }
        .resp-p { font-size: 16px; line-height: 1.75; margin: 6px 0; color: #c8b898; }
        .resp-item { padding-left: 20px; position: relative; margin: 6px 0; font-size: 15px; line-height: 1.6; color: #b8a888; }
        .resp-item::before { content: '◇'; position: absolute; left: 0; color: #6b5a3e; font-size: 10px; top: 4px; }
        .resp-hr { border: none; border-top: 1px solid #2a2235; margin: 24px 0; }
        .resp-spacer { height: 8px; }
        .error-msg { text-align: center; padding: 20px; color: #a85a5a; background: rgba(80,30,30,0.2); border: 1px solid #5a2a2a; border-radius: 12px; margin: 20px 0; font-size: 15px; }
        .new-reading-btn { display: block; margin: 32px auto 0; padding: 14px 40px; background: transparent; border: 1px solid #4a3f30; border-radius: 30px; color: #a89470; font-family: 'Cinzel Decorative', serif; font-size: 14px; letter-spacing: 2px; cursor: pointer; transition: all 0.3s; }
        .new-reading-btn:hover { border-color: #8a7340; color: #e8d5a3; box-shadow: 0 0 20px rgba(138,115,64,0.15); }
        .history-toggle { position: fixed; top: 16px; right: 16px; z-index: 10; background: rgba(15,12,25,0.9); border: 1px solid #2a2235; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #8a7d6b; font-size: 18px; transition: all 0.3s; }
        .history-toggle:hover { border-color: #6b5a3e; color: #e8d5a3; }
        .history-panel { position: fixed; top: 0; right: 0; width: min(360px, 90vw); height: 100vh; background: rgba(10,8,18,0.97); border-left: 1px solid #2a2235; z-index: 20; padding: 24px 20px; overflow-y: auto; animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .history-close { position: absolute; top: 16px; right: 16px; background: none; border: none; color: #7a6d58; font-size: 24px; cursor: pointer; }
        .history-title { font-family: 'Cinzel Decorative', serif; font-size: 16px; color: #e8d5a3; letter-spacing: 2px; margin-bottom: 24px; }
        .history-item { padding: 16px; border: 1px solid #1e1830; border-radius: 10px; margin-bottom: 12px; cursor: pointer; transition: border-color 0.3s; }
        .history-item:hover { border-color: #4a3f30; }
        .history-date { font-size: 12px; color: #5a5040; margin-bottom: 6px; }
        .history-q { font-size: 14px; color: #a89470; margin-bottom: 8px; font-style: italic; }
        .history-cards { display: flex; gap: 4px; flex-wrap: wrap; }
        .history-card-chip { padding: 3px 8px; background: rgba(107,90,62,0.15); border-radius: 10px; font-size: 11px; color: #8a7340; }
        .history-empty { color: #4a3f30; font-style: italic; text-align: center; margin-top: 40px; }
        @media (max-width: 600px) {
          .content { padding: 24px 14px 40px; }
          .header h1 { font-size: 20px; letter-spacing: 3px; }
          .tarot-card { width: 80px; height: 130px; }
          .card-glyph { font-size: 28px; }
          .card-name { font-size: 8px; }
          .cards-row { gap: 8px; }
          .response-section { padding: 20px 16px; }
          .suggestions { gap: 6px; }
          .suggestion-chip { font-size: 12px; padding: 6px 12px; }
        }
      `}</style>
      <div className="oracle-app">
        <StarField />
        {history.length > 0 && <button className="history-toggle" onClick={() => setShowHistory(true)}>☰</button>}
        {showHistory && (
          <div className="history-panel">
            <button className="history-close" onClick={() => setShowHistory(false)}>×</button>
            <div className="history-title">Leituras Anteriores</div>
            {history.length === 0 ? <div className="history-empty">Nenhuma leitura ainda</div> : (
              history.map((h, i) => (
                <div key={i} className="history-item" onClick={() => {
                  setCards(h.cards); setResponse(h.response); setCardsReady(true); setQuestion(h.question); setShowHistory(false);
                }}>
                  <div className="history-date">{h.timestamp}</div>
                  <div className="history-q">"{h.question}"</div>
                  <div className="history-cards">{h.cards.map((c, j) => <span key={j} className="history-card-chip">{c}</span>)}</div>
                </div>
              ))
            )}
          </div>
        )}
        <div className="content">
          <div className="header">
            <span className="header-eye">𓂀</span>
            <h1>Oráculo Místico</h1>
            <div className="header-sub">Tarô · Astrologia · Cabala</div>
          </div>
          {!cards && (
            <div className="question-section">
              <div className="question-label">Faça sua pergunta ao oráculo</div>
              <div className="textarea-wrap">
                <textarea value={question} onChange={e => setQuestion(e.target.value)}
                  placeholder="Escreva sua questão ou escolha uma sugestão abaixo..." rows={3}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doReading(question); } }} />
                <div className="spread-row">
                  {[['auto','Automática'],['3','3 cartas'],['5','5 cartas'],['7','7 cartas']].map(([val, label]) => (
                    <button key={val} className={`spread-btn ${spreadType === val ? 'active' : ''}`} onClick={() => setSpreadType(val)}>{label}</button>
                  ))}
                </div>
              </div>
              <button className="consult-btn" onClick={() => doReading(question)} disabled={!question.trim() || loading}>✦ Consultar o Oráculo ✦</button>
              <div className="divider">sugestões</div>
              <div className="suggestions">
                {SUGGESTED.map((s, i) => <button key={i} className="suggestion-chip" onClick={() => { setQuestion(s); doReading(s); }}>{s}</button>)}
              </div>
            </div>
          )}
          {cards && <CardReveal cards={cards} onComplete={() => setCardsReady(true)} />}
          {cards && loading && <LoadingOracle />}
          {error && <div className="error-msg">{error}</div>}
          {response && cardsReady && <div className="response-section" ref={responseRef}>{formatResponse(response)}</div>}
          {response && cardsReady && <button className="new-reading-btn" onClick={reset}>✦ Nova Leitura ✦</button>}
        </div>
      </div>
    </>
  );
}
