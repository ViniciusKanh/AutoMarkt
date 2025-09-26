# AutoMarkt — Conteúdo estratégico, gerado por inteligência

AutoMarkt é um gerador de conteúdo orientado a marketing. Reúne uma interface web leve (HTML/CSS/JS) e uma API simples em Python (FastAPI), permitindo criar textos para redes sociais, slogans, descrições de produto, artigos e e-mails, com foco em praticidade: abrir o site, informar o tema e obter o conteúdo final em Markdown.

---

## Sumário

* [Visão geral](#visão-geral)
* [Principais funcionalidades](#principais-funcionalidades)
* [Arquitetura do projeto](#arquitetura-do-projeto)
* [Requisitos](#requisitos)
* [Como executar localmente](#como-executar-localmente)

  * [1) Backend (FastAPI)](#1-backend-fastapi)
  * [2) Frontend (GitHub Pages ou servidor local)](#2-frontend-github-pages-ou-servidor-local)
* [Variáveis de ambiente](#variáveis-de-ambiente)
* [Estrutura de pastas](#estrutura-de-pastas)
* [API](#api)

  * [Saúde do serviço](#saúde-do-serviço)
  * [Geração de conteúdo](#geração-de-conteúdo)
  * [Exemplos de requisição](#exemplos-de-requisição)
* [Personalização do front](#personalização-do-front)
* [Publicação do frontend no GitHub Pages](#publicação-do-frontend-no-github-pages)
* [Publicação do backend (Render/Railway)](#publicação-do-backend-renderrailway)
* [Boas práticas de segurança](#boas-práticas-de-segurança)
* [Solução de problemas](#solução-de-problemas)
* [Roadmap](#roadmap)
* [Licença](#licença)

---

## Visão geral

O repositório oferece um fluxo direto para produzir textos de marketing:

1. Interface web com tema escuro, animação de abertura e partículas.
2. Formulário com parâmetros de tom, objetivo, plataforma, público-alvo e palavras-chave.
3. Envio de uma requisição `POST /generate` ao backend.
4. Retorno em texto renderizado como Markdown, com botões para copiar e baixar.

O objetivo é facilitar a rotina de quem cria conteúdo, com foco em clareza e agilidade.

---

## Principais funcionalidades

* **Interface única** (`frontend/`) com:

  * Splash de abertura, partículas e micro-animações.
  * Campos para tema, tipo de conteúdo, idioma, tom, objetivo, plataforma e SEO.
  * Indicadores de **API** e **aceleração do navegador** (WebGPU/WASM).
  * Renderização **Markdown** (via `marked`), com botões para copiar Markdown, copiar HTML e baixar `.md`.
  * **Presets locais** (armazenados em `localStorage`) e atalho **Ctrl/⌘ + Enter**.

* **API simples** (`backend/`) com:

  * `GET /health` para verificação de disponibilidade.
  * `POST /generate` para gerar texto conforme os parâmetros enviados.
  * Suporte a provedores por variável de ambiente (ex.: Groq, OpenAI, Hugging Face Inference).
  * CORS configurável para permitir chamadas do GitHub Pages.

---

## Arquitetura do projeto

* **Frontend**: HTML estático + CSS + JavaScript (sem build).
* **Backend**: FastAPI + `httpx`.
* **Módulos principais**:

  * `backend/app.py` — inicialização do FastAPI, rotas e CORS.
  * `backend/providers.py` — integração com provedores e modelos.
  * `backend/prompts.py` — construção do prompt a partir dos campos.
  * `frontend/index.html`, `styles.css`, `script.js` — página, estilos e lógica do cliente.

---

## Requisitos

* **Backend**:

  * Python **3.10+**
  * Dependências listadas em `backend/requirements.txt`

* **Frontend**:

  * Navegador moderno
  * Opcional: servidor local simples para servir os arquivos (ex.: `python -m http.server`)

---

## Como executar localmente

### 1) Backend (FastAPI)

1. Acesse a pasta do backend:

   ```bash
   cd backend
   ```

2. Crie um ambiente virtual e instale dependências:

   ```bash
   python -m venv .venv
   .venv\Scripts\activate      # Windows
   # source .venv/bin/activate # Linux/macOS

   pip install -r requirements.txt
   ```

3. Prepare suas variáveis em um arquivo `.env` (detalhes abaixo) e inicie o servidor:

   ```bash
   uvicorn app:app --reload --port 8000
   ```

   Endereços úteis:

   * Saúde: `http://127.0.0.1:8000/health`
   * Docs interativas (Swagger): `http://127.0.0.1:8000/docs`

### 2) Frontend (GitHub Pages ou servidor local)

* **Servidor local**:

  ```bash
  cd frontend
  python -m http.server 8080
  # Abrir: http://127.0.0.1:8080
  ```

  No menu do cabeçalho, o indicador de API mostrará o status após o ping em `/health`.

* **Apontar o front para uma API diferente** (sem editar arquivos):
  Abra o console do navegador na página e defina:

  ```js
  localStorage.setItem('automarkt_api_base','https://SEU-BACKEND.onrender.com');
  location.reload();
  ```

---

## Variáveis de ambiente

O backend lê chaves por `.env` (arquivo **não** versionado) ou por variáveis do ambiente do sistema.

**Exemplo de `backend/.env.example` (placeholders seguros):**

```env
# Exemplos de variáveis (use valores reais somente no ambiente de execução)
GROQ_API_KEY=__DEFINA_NO_HOST__
OPENAI_API_KEY=
HF_API_TOKEN=
```

**Observações importantes:**

* Nunca publique chaves em repositório.
* Use sempre placeholders em `.env.example`.
* Em produção (Render/Railway), cadastre as chaves diretamente no painel da plataforma.

---

## Estrutura de pastas

```
AutoMarkt/
├─ backend/
│  ├─ app.py
│  ├─ providers.py
│  ├─ prompts.py
│  ├─ requirements.txt
│  └─ .env.example          # exemplo (sem segredos)
├─ frontend/
│  ├─ index.html
│  ├─ styles.css
│  └─ script.js
├─ examples/
│  ├─ prompt_exemplo.txt
│  └─ saida_exemplo.txt
├─ .github/workflows/
│  └─ pages.yml             # opcional: deploy do front no GitHub Pages
├─ .gitignore
└─ README.md
```

---

## API

### Saúde do serviço

**`GET /health`**
Retorna status de disponibilidade do backend e do provedor.

Exemplo de resposta:

```json
{
  "ok": true,
  "provider_ready": true
}
```

### Geração de conteúdo

**`POST /generate`**
Gera o texto com base nos campos enviados.

**Corpo (JSON):**

```json
{
  "provider": "groq",
  "model": "llama-3.3-70b-versatile",
  "tema": "analytics para e-commerce",
  "tipo": "post",
  "idioma": "pt",
  "tom": "profissional",
  "objetivo": "conversao",
  "plataforma": "LinkedIn",
  "publico": "decisores B2B",
  "comprimento_texto": "médio",
  "incluir_cta": true,
  "incluir_hashtags": true,
  "keywords": "funil, CAC, LTV",
  "max_tokens": 512,
  "temperature": 0.7,
  "seed": null
}
```

**Resposta (JSON):**

```json
{
  "text": "## Título...\n\nCorpo do conteúdo em Markdown..."
}
```

### Exemplos de requisição

**curl**

```bash
curl -X POST "http://127.0.0.1:8000/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "tema": "analytics para e-commerce",
    "tipo": "post",
    "idioma": "pt",
    "tom": "profissional",
    "objetivo": "conversao",
    "plataforma": "LinkedIn",
    "publico": "decisores B2B",
    "comprimento_texto": "médio",
    "incluir_cta": true,
    "incluir_hashtags": true,
    "keywords": "funil, CAC, LTV",
    "max_tokens": 512,
    "temperature": 0.7
  }'
```

**PowerShell**

```powershell
$body = @{
  provider="groq"
  model="llama-3.3-70b-versatile"
  tema="analytics para e-commerce"
  tipo="post"
  idioma="pt"
  tom="profissional"
  objetivo="conversao"
  plataforma="LinkedIn"
  publico="decisores B2B"
  comprimento_texto="médio"
  incluir_cta=$true
  incluir_hashtags=$true
  keywords="funil, CAC, LTV"
  max_tokens=512
  temperature=0.7
} | ConvertTo-Json
Invoke-RestMethod -Uri http://127.0.0.1:8000/generate -Method Post -ContentType "application/json" -Body $body
```

---

## Personalização do front

* **URL da API**: definida em `frontend/script.js` pela constante `API_BASE`.
  Sem editar arquivos, pode ser trocada via `localStorage` (conforme mostrado em [Como executar localmente](#2-frontend-github-pages-ou-servidor-local)).
* **Markdown**: a saída é renderizada com a biblioteca `marked`.
* **Layout/tema**: ajustes visuais em `styles.css`.
* **Animações**: o splash e as partículas estão integrados sem dependências complexas.

---

## Publicação do frontend no GitHub Pages

### Com GitHub Actions (recomendado)

Crie `.github/workflows/pages.yml` com:

```yaml
name: Deploy Frontend to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - '.github/workflows/pages.yml'

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to gh-pages
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          branch: gh-pages
          folder: frontend
```

Após o primeiro push:

* Em **Settings → Pages**, selecione **Branch: `gh-pages`**.
* A página ficará disponível em `https://SEU-USUARIO.github.io/AutoMarkt/`.

---

## Publicação do backend (Render/Railway)

Exemplo **Render**:

* **Root Directory**: `backend`
* **Build Command**: `pip install -r requirements.txt`
* **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
* **Environment Variables**:

  * `GROQ_API_KEY` (ou `OPENAI_API_KEY`, `HF_API_TOKEN`)

No `backend/app.py`, configure CORS para seu domínio do Pages:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://SEU-USUARIO.github.io"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Depois, no navegador (no site do Pages):

```js
localStorage.setItem('automarkt_api_base','https://SEU-BACKEND.onrender.com');
location.reload();
```

---

## Boas práticas de segurança

* **Nunca** versionar arquivos com chaves reais (`backend/.env` está no `.gitignore`).
* Manter `backend/.env.example` apenas com placeholders.
* Em caso de alerta de “Push Protection” no GitHub, remover o segredo do histórico antes de publicar novamente.
* Em produção, cadastrar as chaves **somente** nas variáveis de ambiente da plataforma de hospedagem.

---

## Solução de problemas

* **`/` retorna 404**: a raiz não possui rota. Usar `/health` e `/docs`.
* **`API: Indisponível` no cabeçalho**: verifique `HEALTH_URL`; confirme que o backend está online.
* **CORS no console**: conferir `allow_origins` no FastAPI com o domínio do Pages.
* **401/403 ao gerar**: revisar variáveis de ambiente (chaves ausentes/invalidas).
* **Mixed Content**: se o front estiver em HTTPS (Pages), o backend também precisa estar em HTTPS.
* **Texto “cortado”**: aumentar `max_tokens` (ex.: 512 ou 1024) e, se necessário, reenviar com o mesmo tema.
* **CRLF/LF no Windows**: usar `.gitattributes` para normalizar finais de linha.
* **Push Protection**: remover segredos do histórico; em seguida, `git push --force-with-lease` se optar por reescrever o histórico.

---

Sugestões podem ser enviadas por issues.

---

