# ============================
# 🚀 Fast DevOps Commands
# ============================

# Default goal
.DEFAULT_GOAL := help

# === CONFIG ===
COMPOSE_FILE := docker-compose.yml
PROJECT_NAME := backend-chatnary-nestjs
COMPOSE_DEV := docker-compose.dev.yml

# ============================
# 🟢 DEV MODE (HOT RELOAD)
# ============================

## 🚀 Start development mode (hot reload)
dev:
	@echo "🚀 Starting DEV (hot reload)..."
	docker compose -f $(COMPOSE_DEV) up --build
	@echo "⚡ DEV mode running!"

## 🔄 Rebuild dev containers (when adding new packages)
dev-rebuild:
	@echo "🔨 Rebuilding DEV containers..."
	docker compose -f $(COMPOSE_DEV) build --no-cache
	docker compose -f $(COMPOSE_DEV) up -d
	@echo "✅ DEV rebuild complete!"

## 🔄 Restart only the API dev container
dev-restart:
	@echo "♻ Restarting DEV API..."
	docker compose -f $(COMPOSE_DEV) restart api

## 🛑 Stop dev containers
dev-down:
	@echo "🛑 Stopping DEV containers..."
	docker compose -f $(COMPOSE_DEV) down

# === MAIN TASKS ===

## 🧱 Rebuild toàn bộ project (build nhanh, sạch rác)
rebuild:
	@echo "🧱 Cleaning & rebuilding project..."
	docker compose -f $(COMPOSE_FILE) build --pull --compress --parallel
	docker compose -f $(COMPOSE_FILE) up -d
	docker image prune -f
	@echo "✅ Done! Containers running."
	@docker compose -f $(COMPOSE_FILE) ps

## 🧼 Dọn rác toàn hệ thống (deep clean)
clean:
	@echo "🧹 Removing all containers, images, and volumes..."
	docker compose -f $(COMPOSE_FILE) down -v --remove-orphans
	docker system prune -af --volumes
	@echo "✅ Clean complete."

## 🐍 Restart API only
restart-api:
	@echo "♻️ Restarting API service..."
	docker compose -f $(COMPOSE_FILE) restart api
	@docker compose -f $(COMPOSE_FILE) logs -f api

## 📚 Chạy ingest thủ công
ingest:
	@echo "📘 Running ingest process manually..."
	docker compose -f $(COMPOSE_FILE) run --rm ingest

## 🔍 Xem log
logs:
	@docker compose -f $(COMPOSE_FILE) logs -f --tail=50

## 🔍 Trạng thái container
ps:
	@docker compose -f $(COMPOSE_FILE) ps

## 🆘 Hiển thị hướng dẫn
help:
	@echo ""
	@echo "✨ Available commands:"
	@echo ""
	@echo "📦 PRODUCTION:"
	@echo "  make rebuild      - Build + chạy lại toàn hệ thống (production)"
	@echo "  make clean        - Dọn sạch tất cả container, volume, image"
	@echo "  make restart-api  - Restart container API (production)"
	@echo ""
	@echo "🔧 DEVELOPMENT:"
	@echo "  make dev          - Chạy dev mode với hot reload"
	@echo "  make dev-rebuild  - Rebuild dev containers (khi cài package mới)"
	@echo "  make dev-restart  - Restart API dev container"
	@echo "  make dev-down     - Dừng tất cả dev containers"
	@echo ""
	@echo "📊 MONITORING:"
	@echo "  make logs         - Xem log realtime"
	@echo "  make ps           - Liệt kê container đang chạy"
	@echo ""
