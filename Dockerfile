# Use Python 3.11 slim image as base
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
# FFmpeg is required for audio processing with pydub
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p uploads outputs

# Expose port (Render will set the PORT environment variable)
EXPOSE 10000

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Run the application with gunicorn
# Render automatically sets the PORT environment variable
CMD gunicorn app:app --bind 0.0.0.0:$PORT --workers 4 --timeout 120
