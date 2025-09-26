# backend/Dockerfile
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HOST=0.0.0.0 \
    PORT=7860

WORKDIR /app

# Dependências
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Código
COPY . .

# Subida do FastAPI na porta 7860 (padrão do HF Spaces)
CMD ["uvicorn","app:app","--host","0.0.0.0","--port","7860"]
