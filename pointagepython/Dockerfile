FROM python:3.10-slim

WORKDIR /app

# Dépendances système requises par OpenCV/DeepFace
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Hugging Face Spaces route tout le trafic vers le port 7860
ENV PORT=7860
EXPOSE 7860

CMD ["python", "app.py"]