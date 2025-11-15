#!/bin/bash
# Production server startup script
# Usage: ./run_production.sh

# Set number of workers (adjust based on your server)
WORKERS=${UVICORN_WORKERS:-4}

# Set host and port
HOST=${HOST:-0.0.0.0}
PORT=${PORT:-8000}

# Run with uvicorn
uvicorn main:app \
    --host $HOST \
    --port $PORT \
    --workers $WORKERS \
    --timeout-keep-alive 30 \
    --log-level info
