FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Dipendenze (layer cache-friendly)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Codice
COPY . .

EXPOSE 8000

# In dev il comando viene sovrascritto da docker-compose (alembic + reload).
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
