# -*- coding: utf-8 -*-
from textwrap import dedent

SYSTEM_PT = "Você é um especialista em marketing digital com foco em SEO e escrita persuasiva."
SYSTEM_EN = "You are a digital marketing expert focused on SEO and persuasive writing."
SYSTEM_ES = "Eres un experto en marketing digital centrado en SEO y escritura persuasiva."

def system_prompt(idioma: str) -> str:
    if idioma == "en":
        return SYSTEM_EN
    if idioma == "es":
        return SYSTEM_ES
    return SYSTEM_PT

def human_prompt(
    tema: str, tipo: str, idioma: str, tom: str, objetivo: str,
    plataforma: str, publico: str, comprimento_texto: str,
    incluir_cta: bool, incluir_hashtags: bool, incluir_emojis: bool, keywords: str
) -> str:

    tipo_map = {
        "slogan": {"pt": "slogan publicitário conciso", "en": "concise advertising slogan", "es": "eslogan publicitario conciso"},
        "post":   {"pt": "post de rede social",          "en": "social media post",         "es": "publicación para redes sociales"},
        "descricao": {"pt": "descrição de produto objetiva", "en": "concise product description", "es": "descripción de producto objetiva"},
    }
    task = tipo_map.get(tipo, {"pt": "texto curto de marketing", "en": "short marketing text", "es": "texto corto de marketing"})[idioma]

    base_pt = f"""
        Escreva um texto com SEO otimizado sobre '{tema}'.
        Retorne apenas o texto final, sem aspas.
        Onde será publicado: {plataforma}.
        Tom: {tom}. Público-alvo: {publico}.
        Comprimento desejado: {comprimento_texto}. Objetivo: {objetivo}.
        {"Inclua uma chamada para ação clara." if incluir_cta else "Não inclua chamada para ação."}
        {"Inclua 6–10 hashtags relevantes ao final." if (incluir_hashtags and tipo == "post") else "Não inclua hashtags."}
        {"Inclua emojis relevantes ao final." if (incluir_emojis and tipo == "post") else ""}
        {f"Palavras-chave obrigatórias (SEO): {keywords}." if keywords else ""}
    """
    base_en = f"""
        Write an SEO-optimized text about '{tema}'.
        Return only the final text, without quotes.
        Where it will be published: {plataforma}.
        Tone: {tom}. Target audience: {publico}.
        Desired length: {comprimento_texto}. Goal: {objetivo}.
        {"Include a clear call to action." if incluir_cta else "Do not include a call to action."}
        {"Append 6–10 relevant hashtags at the end." if (incluir_hashtags and tipo == "post") else "Do not include hashtags."}
        {f"Mandatory keywords (SEO): {keywords}." if keywords else ""}
    """
    base_es = f"""
        Escribe un texto optimizado para SEO sobre '{tema}'.
        Devuelve solo el texto final, sin comillas.
        Dónde se publicará: {plataforma}.
        Tono: {tom}. Audiencia: {publico}.
        Longitud deseada: {comprimento_texto}. Objetivo: {objetivo}.
        {"Incluye un llamado a la acción claro." if incluir_cta else "No incluyas llamado a la acción."}
        {"Añade 6–10 hashtags relevantes al final." if (incluir_hashtags and tipo == "post") else "No incluyas hashtags."}
        {f"Palabras clave obligatorias (SEO): {keywords}." if keywords else ""}
    """

    base = {"pt": base_pt, "en": base_en, "es": base_es}[idioma]
    header = {"pt": f"Crie um {task}.", "en": f"Create a {task}.", "es": f"Crea un {task}."}[idioma]
    return dedent(header + "\n" + base).strip()
