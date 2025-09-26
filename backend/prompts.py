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
        "artigo": {"pt": "artigo de blog", "en": "blog article", "es": "artículo de blog"},
        "email": {"pt": "email marketing", "en": "marketing email", "es": "email de marketing"},
    }
    task = tipo_map.get(tipo, {"pt": "texto curto de marketing", "en": "short marketing text", "es": "texto corto de marketing"})[idioma]

    # Estrutura melhorada para garantir títulos e organização
    base_pt = f"""
        Crie um {task} completo e bem estruturado sobre '{tema}' seguindo estas diretrizes:

        ESTRUTURA OBRIGATÓRIA:
        1. SEMPRE comece com um título atrativo e impactante (use ## para título principal)
        2. Desenvolva o conteúdo principal de forma envolvente e persuasiva
        3. {"Integre emojis relevantes DENTRO do texto de forma natural (não apenas no final)" if incluir_emojis else "NÃO use emojis"}
        4. {"Termine com uma chamada para ação (CTA) poderosa e específica que incentive a ação imediata" if incluir_cta else "NÃO inclua chamada para ação"}
        5. {"Finalize com 6-10 hashtags estratégicas e relevantes na última linha" if incluir_hashtags else "NÃO inclua hashtags"}

        ESPECIFICAÇÕES:
        - Plataforma: {plataforma}
        - Tom: {tom}
        - Público-alvo: {publico}
        - Comprimento: {comprimento_texto}
        - Objetivo: {objetivo}
        {f"- Palavras-chave obrigatórias (SEO): {keywords}" if keywords else ""}

        IMPORTANTE: 
        - Use formatação Markdown apropriada
        - O título deve ser cativante e otimizado para SEO
        - {"Emojis devem estar integrados naturalmente no texto, não concentrados no final" if incluir_emojis else ""}
        - {"O CTA deve ser específico, urgente e direcionado ao objetivo de {objetivo}" if incluir_cta else ""}
        - Retorne apenas o conteúdo final, sem aspas ou explicações adicionais
    """
    
    base_en = f"""
        Create a complete and well-structured {task} about '{tema}' following these guidelines:

        MANDATORY STRUCTURE:
        1. ALWAYS start with an attractive and impactful title (use ## for main title)
        2. Develop the main content in an engaging and persuasive way
        3. {"Integrate relevant emojis WITHIN the text naturally (not just at the end)" if incluir_emojis else "DO NOT use emojis"}
        4. {"End with a powerful and specific call to action (CTA) that encourages immediate action" if incluir_cta else "DO NOT include call to action"}
        5. {"Finish with 6-10 strategic and relevant hashtags on the last line" if incluir_hashtags else "DO NOT include hashtags"}

        SPECIFICATIONS:
        - Platform: {plataforma}
        - Tone: {tom}
        - Target audience: {publico}
        - Length: {comprimento_texto}
        - Goal: {objetivo}
        {f"- Mandatory keywords (SEO): {keywords}" if keywords else ""}

        IMPORTANT: 
        - Use appropriate Markdown formatting
        - The title should be captivating and SEO-optimized
        - {"Emojis should be naturally integrated into the text, not concentrated at the end" if incluir_emojis else ""}
        - {"The CTA should be specific, urgent and directed to the {objetivo} goal" if incluir_cta else ""}
        - Return only the final content, without quotes or additional explanations
    """
    
    base_es = f"""
        Crea un {task} completo y bien estructurado sobre '{tema}' siguiendo estas directrices:

        ESTRUCTURA OBLIGATORIA:
        1. SIEMPRE comienza con un título atractivo e impactante (usa ## para el título principal)
        2. Desarrolla el contenido principal de forma atractiva y persuasiva
        3. {"Integra emojis relevantes DENTRO del texto de forma natural (no solo al final)" if incluir_emojis else "NO uses emojis"}
        4. {"Termina con una llamada a la acción (CTA) poderosa y específica que incentive la acción inmediata" if incluir_cta else "NO incluyas llamada a la acción"}
        5. {"Finaliza con 6-10 hashtags estratégicos y relevantes en la última línea" if incluir_hashtags else "NO incluyas hashtags"}

        ESPECIFICACIONES:
        - Plataforma: {plataforma}
        - Tono: {tom}
        - Audiencia: {publico}
        - Longitud: {comprimento_texto}
        - Objetivo: {objetivo}
        {f"- Palabras clave obligatorias (SEO): {keywords}" if keywords else ""}

        IMPORTANTE: 
        - Usa formato Markdown apropiado
        - El título debe ser cautivador y optimizado para SEO
        - {"Los emojis deben estar integrados naturalmente en el texto, no concentrados al final" if incluir_emojis else ""}
        - {"El CTA debe ser específico, urgente y dirigido al objetivo de {objetivo}" if incluir_cta else ""}
        - Devuelve solo el contenido final, sin comillas o explicaciones adicionales
    """

    base = {"pt": base_pt, "en": base_en, "es": base_es}[idioma]
    return dedent(base).strip()
