#!/bin/bash
set -e

BASE_DIR=/opt/services/gto
APP_DIR=$BASE_DIR/app
REPO_URL="https://github.com/Kim-Jiny/GTOPlaybook.git"
BRANCH="main"

mkdir -p "$APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
fi

echo "[check files]"
ls -al "$APP_DIR"

if [ -f "$APP_DIR/docker-compose.yml" ] || [ -f "$APP_DIR/compose.yaml" ]; then
  cd "$APP_DIR"
  docker compose up -d --build
elif [ -f "$APP_DIR/server/docker-compose.yml" ] || [ -f "$APP_DIR/server/compose.yaml" ]; then
  cd "$APP_DIR/server"
  docker compose up -d --build
else
  echo "No docker compose file found (app root / app/server)"
  exit 1
fi

if [ -f /opt/services/proxy/conf/gto.conf.off ]; then
  mv /opt/services/proxy/conf/gto.conf.off /opt/services/proxy/conf/gto.conf
fi

docker exec nginx nginx -s reload || true