# -*- coding: utf-8 -*-
import os
import httpx

class ProviderError(Exception):
    pass

# ---------- GROQ ----------
async def call_groq(prompt: str, model: str = "llama-3.3-70b-versatile",
                    max_tokens: int = 256, temperature: float = 0.7, seed: int | None = None) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ProviderError("GROQ_API_KEY não configurada.")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a marketing expert focused on SEO and persuasive writing."},
            {"role": "user",   "content": prompt}
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    if seed is not None:
        payload["seed"] = seed

    async with httpx.AsyncClient(timeout=90) as client:
        r = await client.post(url, json=payload, headers=headers)
        r.raise_for_status()
        j = r.json()
    return j["choices"][0]["message"]["content"].strip()

# ---------- OPENAI (opcional) ----------
async def call_openai(prompt: str, model: str = "gpt-4o-mini",
                      max_tokens: int = 256, temperature: float = 0.7) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ProviderError("OPENAI_API_KEY não configurada.")
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a marketing expert focused on SEO and persuasive writing."},
            {"role": "user",   "content": prompt}
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    async with httpx.AsyncClient(timeout=90) as client:
        r = await client.post(url, json=payload, headers=headers)
        r.raise_for_status()
        j = r.json()
    return j["choices"][0]["message"]["content"].strip()

# ---------- HUGGINGFACE INFERENCE (opcional) ----------
async def call_hf_inference(prompt: str, model: str = "mistralai/Mixtral-8x7B-Instruct-v0.1",
                            max_new_tokens: int = 256, temperature: float = 0.7) -> str:
    token = os.getenv("HF_API_TOKEN")
    if not token:
        raise ProviderError("HF_API_TOKEN não configurado.")
    url = f"https://api-inference.huggingface.co/models/{model}"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {"inputs": prompt, "parameters": {"max_new_tokens": max_new_tokens, "temperature": temperature}}
    async with httpx.AsyncClient(timeout=90) as client:
        r = await client.post(url, json=payload, headers=headers)
        r.raise_for_status()
        j = r.json()
    # Normaliza resposta
    if isinstance(j, list) and j and "generated_text" in j[0]:
        return j[0]["generated_text"].strip()
    return str(j)
