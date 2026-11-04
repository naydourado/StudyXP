# imagem da api StudyXP (usada no render e no docker compose)
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# nao roda como root
RUN useradd --create-home studyxp
USER studyxp

EXPOSE 8000

# aplica as migracoes e sobe a api; proxy-headers para ler o ip real atras do proxy do provedor
CMD alembic upgrade head && \
    uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips="*"
