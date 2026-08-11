#!/bin/bash
# Güvenli customer deploy scripti
# Kullanım: bash scripts/deploy-customer.sh
# Docker compose ile yönetir — asla manual docker stop/rm/run kullanma

set -e
COMPOSE_DIR="/opt/ecom"
cd "$COMPOSE_DIR"

echo "=== Customer Deploy Başlıyor ==="

echo "1/3 Git pull..."
git pull origin main

echo "2/3 Image build..."
docker compose build customer

echo "3/3 Container restart (--force-recreate --no-deps)..."
docker compose up -d --force-recreate --no-deps customer

echo "=== Deploy Tamamlandı ==="
docker ps --format "table {{.Names}}\t{{.Status}}" | grep customer
