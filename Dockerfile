# EDU CARD AI — Production Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for compiling and SSL
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose standard application port
EXPOSE 8000

# Default environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Run FastAPI with Uvicorn
CMD ["sh", "-c", "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT}"]
