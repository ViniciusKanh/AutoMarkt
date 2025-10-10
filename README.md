# AutoMarkt — Conteúdo estratégico, gerado por inteligência

![Início](https://github.com/ViniciusKanh/AutoMarkt/blob/main/img/Inicio.png?raw=true)


O AutoMarkt é um gerador de conteúdo voltado a marketing. Une uma **interface web leve** (HTML/CSS/JS) e uma **API em Python (FastAPI)** para criar, de forma objetiva, textos para redes sociais, slogans, descrições de produto, artigos e e-mails. A utilização é direta: abrir o site, definir o tema e obter o resultado final em **Markdown**.

> **Front-end (prod):** [https://viniciuskanh.github.io/AutoMarkt/](https://viniciuskanh.github.io/AutoMarkt/)
> **Back-end (prod):** [https://viniciuskhan-automarkt-backend.hf.space](https://viniciuskhan-automarkt-backend.hf.space)
> **Docs da API (Swagger):** [https://viniciuskhan-automarkt-backend.hf.space/docs](https://viniciuskhan-automarkt-backend.hf.space/docs)

![Tela Inicial](https://github.com/ViniciusKanh/AutoMarkt/blob/main/img/Tela%20Inicial.gif?raw=true)


---

## Sumário

* [Visão geral](#visão-geral)
* [Demonstrações](#demonstrações)
* [Principais funcionalidades](#principais-funcionalidades)
* [Arquitetura](#arquitetura)
* [Requisitos](#requisitos)
* [Como executar localmente](#como-executar-localmente)

  * [1) Backend (FastAPI)](#1-backend-fastapi)
  * [2) Frontend (servidor local ou GitHub Pages)](#2-frontend-servidor-local-ou-github-pages)
* [Variáveis de ambiente (Backend)](#variáveis-de-ambiente-backend)
* [Estrutura de pastas](#estrutura-de-pastas)
* [API](#api)

  * [Saúde do serviço](#saúde-do-serviço)
  * [Geração de conteúdo](#geração-de-conteúdo)
  * [Exemplos de requisição](#exemplos-de-requisição)
* [Personalização do front](#personalização-do-front)
* [Publicação](#publicação)

  * [Frontend no GitHub Pages](#frontend-no-github-pages)
  * [Backend no Hugging Face Spaces (Docker)](#backend-no-hugging-face-spaces-docker)
* [Boas práticas de segurança](#boas-práticas-de-segurança)
* [Solução de problemas](#solução-de-problemas)
* [Contribuição](#contribuição)
* [Licença](#licença)

---

## Visão geral

Fluxo de uso:

1. A interface web apresenta um **formulário** com parâmetros essenciais (tema, tipo de conteúdo, idioma, tom, objetivo, plataforma, público e palavras-chave).
2. O front envia um `POST /generate` ao backend.
3. A API monta o prompt e delega a provedores configurados (Groq, OpenAI ou HF Inference).
4. O texto de volta é renderizado em **Markdown**, com opções para **copiar** ou **baixar**.

O foco é **praticidade** e **clareza** para a rotina de criação de conteúdo.

---

## Demonstrações

**Página inicial (screenshot):**
![Início](https://github.com/ViniciusKanh/AutoMarkt/blob/main/img/Inicio.png)

![Gerando Conteúdo](https://github.com/ViniciusKanh/AutoMarkt/blob/main/img/Gerando%20Conteudo.gif?raw=true)

---

## Principais funcionalidades

**Frontend (`/frontend`)**

* Tema escuro, **splash animado** e partículas.
* Campos para **tema, tipo, idioma, tom, objetivo, plataforma, público e SEO**.
* Indicadores de **status da API** e de **aceleração** (WebGPU/WebGL/CPU).
* Renderização **Markdown** via `marked`, com botões **Copiar MD**, **Copiar HTML** e **Download** `.md`.
* **Presets** armazenados em `localStorage`.
* Atalhos: **Ctrl/⌘ + Enter** (gerar) e **ESC** (limpar/fechar tela cheia).

**Backend (`/backend`)**

* FastAPI com:

  * `GET /health` (verificação de disponibilidade);
  * `POST /generate` (geração de texto);
  * `GET /` redireciona para `/docs`.
* Integração com **Groq**, **OpenAI** e **Hugging Face Inference** (selecionável).
* CORS configurável via `ALLOWED_ORIGINS` para autorizar o domínio do Pages.

---

## Arquitetura

* **Frontend**: HTML estático + CSS + JS (sem etapa de build).
* **Backend**: FastAPI + `httpx`, empacotado e executado em Docker no **Hugging Face Spaces**.
* **Módulos**:

  * `backend/app.py`: inicialização, rotas e CORS;
  * `backend/providers.py`: chamadas aos provedores;
  * `backend/prompts.py`: montagem do prompt a partir dos inputs;
  * `frontend/index.html`, `styles.css`, `script.js`: UI, estilos e integração com a API.

---

## Requisitos

**Backend**

* Python **3.10+** (execução local)
* Dependências: `backend/requirements.txt`

**Frontend**

* Navegador moderno
* Opcional: servidor local simples (`python -m http.server`)

---

## Como executar localmente

### 1) Backend (FastAPI)

```bash
cd backend

# Ambiente virtual
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
# source .venv/bin/activate

pip install -r requirements.txt

# Defina as variáveis (ver seção "Variáveis de ambiente")
# Exemplo: criar backend/.env a partir de backend/.env.example

# Inicie o servidor
uvicorn app:app --reload --port 8000

# Úteis:
#   http://127.0.0.1:8000/health
#   http://127.0.0.1:8000/docs
```

### 2) Frontend (servidor local ou GitHub Pages)

**Servidor local:**

```bash
cd frontend
python -m http.server 8080
# Abra: http://127.0.0.1:8080
```

**Apontar o front para uma API específica (sem editar arquivos):**
Abra o console do navegador (F12) na página e faça:

```js
// Backend local
localStorage.setItem('automarkt_api_base','http://127.0.0.1:8000');
location.reload();

// Backend em produção (HF Spaces)
localStorage.setItem('automarkt_api_base','https://viniciuskhan-automarkt-backend.hf.space');
location.reload();

// Também é possível usar querystring, ex.:
// https://seu-usuario.github.io/AutoMarkt/?api=https://viniciuskhan-automarkt-backend.hf.space
```

---

## Variáveis de ambiente (Backend)

O backend lê chaves via **variáveis de ambiente** (ou arquivo `.env` em desenvolvimento).

**`backend/.env.example` (placeholders):**

```env
# Apenas exemplos. Defina valores REAIS somente no ambiente de execução.
GROQ_API_KEY=__DEFINA_NO_HOST__
OPENAI_API_KEY=
HF_API_TOKEN=

# CORS: adicione os domínios autorizados (separados por vírgula)
ALLOWED_ORIGINS=https://viniciuskanh.github.io
```

**Observações:**

* **Não** publique segredos no repositório.
* Use placeholders em `.env.example`.
* Em produção (Hugging Face Spaces), cadastre as variáveis em **Settings → Variables** do Space.

---

## Estrutura de pastas

```
AutoMarkt/
├─ backend/
│  ├─ app.py
│  ├─ providers.py
│  ├─ prompts.py
│  ├─ requirements.txt
│  ├─ .env.example
│  └─ Dockerfile
├─ frontend/
│  ├─ index.html
│  ├─ styles.css
│  └─ script.js
├─ examples/
│  ├─ prompt_exemplo.txt
│  └─ saida_exemplo.txt
├─ .github/workflows/
│  └─ pages.yml
├─ .gitignore
└─ README.md
```

---

## API

### Saúde do serviço

`GET /health` — status do backend e disponibilidade de provedor:

```json
{
  "ok": true,
  "provider_ready": true
}
```

### Geração de conteúdo

`POST /generate` — gera o texto conforme parâmetros.

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
  "incluir_emojis": false,
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

Invoke-RestMethod -Uri http://127.0.0.1:8000/generate -Method Post `
  -ContentType "application/json" -Body $body
```

---

## Personalização do front

* **URL da API**: definida em tempo de execução.

  * `localStorage.setItem('automarkt_api_base','<SUA-API>')`
  * Ou querystring `?api=<SUA-API>`
* **Renderização**: saída em Markdown via `marked`.
* **Layout/tema**: ajustes em `frontend/styles.css`.
* **Efeitos**: splash e partículas nativas (sem build tool).

---

## Publicação

### Frontend no GitHub Pages

Workflow (`.github/workflows/pages.yml`):

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

Depois, em **Settings → Pages**, selecione **Branch: `gh-pages`**.

### Backend no Hugging Face Spaces (Docker)

O backend está hospedado em: **`ViniciusKhan/automarkt-backend`**
**URL pública:** [https://viniciuskhan-automarkt-backend.hf.space](https://viniciuskhan-automarkt-backend.hf.space)

**Pontos-chave do Space:**

* **Porta:** 7860 (o Space expõe essa porta)
* **Arquivo:** `backend/Dockerfile`
* **Comando:** `uvicorn app:app --host 0.0.0.0 --port 7860`
* **Variáveis:** `GROQ_API_KEY`, `OPENAI_API_KEY`, `HF_API_TOKEN`, `ALLOWED_ORIGINS`

Exemplo de `Dockerfile` (já no projeto):

```dockerfile
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HOST=0.0.0.0 \
    PORT=7860

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
CMD ["uvicorn","app:app","--host","0.0.0.0","--port","7860"]
```

---

## Boas práticas de segurança

* Nunca versionar chaves reais (`.env` está no `.gitignore`).
* Usar placeholders em `.env.example`.
* Ao publicar no GitHub, caso ocorra **Push Protection** por segredo detectado, remover o segredo do histórico e refazer o push.
* Em produção, manter as chaves apenas em **variáveis de ambiente** da plataforma.

---

## Solução de problemas

* **`/` retorna 404**: acesse `/docs` ou `/health`. (No Space, `/` já redireciona para `/docs`.)
* **Indicador “API Offline”**: verifique se o `/health` responde e se a URL em `automarkt_api_base` está correta.
* **CORS no console**: inclua o domínio do Pages em `ALLOWED_ORIGINS`.
* **Mixed Content**: front em HTTPS exige backend também em HTTPS.
* **Conteúdo cortado**: aumente `max_tokens` (ex.: 512/1024) e reenvie.
* **CRLF/LF no Windows**: normalize finais de linha via `.gitattributes`.
* **Timeout**: confirme tempo de resposta do `/generate` (e rede do host).

---

## Contribuição

* Abertura de **issues** com descrição objetiva e passos de reprodução.
* Sugestões de UX/UI, novos tipos de conteúdo e presets são bem-vindas.
* Pull Requests devem manter o padrão do projeto (simples, direto e com comentários claros).

---

## Licença

Definir conforme necessidade do repositório (ex.: MIT). Caso não haja um arquivo `LICENSE`, recomenda-se adicionar um.

---

**Links rápidos**

* Frontend (prod): [https://viniciuskanh.github.io/AutoMarkt/](https://viniciuskanh.github.io/AutoMarkt/)
* Backend (prod): [https://viniciuskhan-automarkt-backend.hf.space](https://viniciuskhan-automarkt-backend.hf.space)
* API Docs: [https://viniciuskhan-automarkt-backend.hf.space/docs](https://viniciuskhan-automarkt-backend.hf.space/docs)
---
