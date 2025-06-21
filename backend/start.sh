#!/bin/bash

# Navigate to backend directory
cd "$(dirname "$0")"

# Activate virtual environment
source venv/bin/activate

# Start the FastAPI server
echo "🚀 Starting FastAPI backend on http://localhost:8000"
uvicorn main:app --reload --host 0.0.0.0 --port 8000 