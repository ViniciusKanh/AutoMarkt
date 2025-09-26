# -*- coding: utf-8 -*-
import os
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from prompts import system_prompt, human_prompt
from providers import call_groq, call_openai, call_hf_inference, ProviderError

load_dotenv()  # carrega .env em dev

app = FastAPI(title="AutoMarkt API", version="1.0")

# CORS: ajuste a origem conforme seu domínio do GitHub Pages
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # em produção, troque para ["https://seu-usuario.github.io"]
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateIn(BaseModel):
    provider: Literal["groq", "openai", "hf"] = "groq"
    model: Optional[str] = None
    tema: str
    tipo: Literal["post", "slogan", "descricao", "artigo", "email"] = "post"
    idioma: Literal["pt", "en", "es", "fr"] = "pt"
    tom: Literal["profissional", "inspirador", "direto", "descontraido"] = "profissional"
    objetivo: Literal["awareness", "conversao", "engajamento", "educacao"] = "conversao"
    plataforma: str = "LinkedIn"
    publico: str = "decisores B2B"
    comprimento_texto: Literal["curto", "médio", "longo"] = "médio"
    incluir_cta: bool = True
    incluir_hashtags: bool = True
    incluir_emojis: bool = False
    keywords: str = ""
    max_tokens: int = 512
    temperature: float = 0.7
    seed: Optional[int] = None

class GenerateOut(BaseModel):
    text: str

@app.get("/health")
async def health():
    return {"ok": True, "provider_ready": any([os.getenv("GROQ_API_KEY"), os.getenv("OPENAI_API_KEY"), os.getenv("HF_API_TOKEN")])}

@app.post("/generate", response_model=GenerateOut)
async def generate(body: GenerateIn):
    # Validação do tema
    if not body.tema or len(body.tema.strip()) < 3:
        raise HTTPException(status_code=400, detail="Tema deve ter pelo menos 3 caracteres")
    
    # Validação de tokens
    if body.max_tokens < 50 or body.max_tokens > 2048:
        raise HTTPException(status_code=400, detail="max_tokens deve estar entre 50 e 2048")
    
    # Validação de temperatura
    if body.temperature < 0.0 or body.temperature > 2.0:
        raise HTTPException(status_code=400, detail="temperature deve estar entre 0.0 e 2.0")
    
    sys_msg = system_prompt(body.idioma)
    user_msg = human_prompt(
        tema=body.tema.strip(), tipo=body.tipo, idioma=body.idioma, tom=body.tom, objetivo=body.objetivo,
        plataforma=body.plataforma, publico=body.publico, comprimento_texto=body.comprimento_texto,
        incluir_cta=body.incluir_cta, incluir_hashtags=body.incluir_hashtags, incluir_emojis=body.incluir_emojis, 
        keywords=body.keywords.strip()
    )
    prompt = f"{sys_msg}\n\n{user_msg}"

    try:
        if body.provider == "groq":
            text = await call_groq(prompt, model=body.model or "llama-3.3-70b-versatile",
                                   max_tokens=body.max_tokens, temperature=body.temperature, seed=body.seed)
        elif body.provider == "openai":
            text = await call_openai(prompt, model=body.model or "gpt-4o-mini",
                                     max_tokens=body.max_tokens, temperature=body.temperature)
        else:
            text = await call_hf_inference(prompt, model=body.model or "mistralai/Mixtral-8x7B-Instruct-v0.1",
                                           max_new_tokens=body.max_tokens, temperature=body.temperature)
        
        # Validação básica da resposta
        if not text or len(text.strip()) < 10:
            raise HTTPException(status_code=500, detail="Resposta do modelo muito curta ou vazia")
            
        return {"text": text.strip()}
    except ProviderError as e:
        raise HTTPException(status_code=400, detail=f"Erro do provedor: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na geração: {str(e)}")

# Execução local:
# uvicorn app:app --reload --port 8000
