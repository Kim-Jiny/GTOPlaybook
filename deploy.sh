#!/bin/bash
set -e

DEPLOY_DIR="/opt/services/gto-playbook"

echo "=== GTOPlaybook Deploy ==="

cd "$DEPLOY_DIR"

echo "Pulling latest changes..."
git pull origin main

echo "Building and starting containers..."
docker compose build --no-cache
docker compose up -d

echo "Waiting for health check..."
sleep 5
curl -sf http://localhost:3010/health && echo " ✓ Server is healthy" || echo " ✗ Health check failed"

echo "=== Deploy complete ==="
