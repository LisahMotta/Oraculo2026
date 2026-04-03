# 🔮 Oráculo Místico — Tarô · Astrologia · Cabala

App de leituras de Tarô integradas com Astrologia e Cabala, powered by Claude (Anthropic API).

## Deploy no Vercel

### 1. Criar repositório no GitHub

```bash
cd oraculo-tarot
git init
git add .
git commit -m "Oráculo Místico - deploy inicial"
git branch -M main
git remote add origin https://github.com/LisahMotta/oraculo-mistico.git
git push -u origin main
```

### 2. Conectar ao Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"Add New Project"**
3. Importe o repositório `oraculo-mistico`
4. Framework Preset: **Vite**
5. Clique em **Deploy**

### 3. Configurar variável de ambiente

1. No dashboard do Vercel, vá em **Settings → Environment Variables**
2. Adicione:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** sua chave da API Anthropic (sk-ant-...)
3. Clique em **Save**
4. Faça **Redeploy** (Deployments → ... → Redeploy)

## Estrutura

```
oraculo-tarot/
├── api/
│   └── oracle.js          # Serverless function (proxy da API)
├── src/
│   ├── App.jsx            # Componente principal
│   └── main.jsx           # Entry point
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── README.md
```

## Funcionalidades

- Tiragem de 3, 5 ou 7 cartas com animação flip 3D
- Leitura completa integrando Tarô + Astrologia + Cabala
- Sugestões de perguntas prontas
- Histórico de leituras (sessão)
- Campo de estrelas animado
- Design místico responsivo
