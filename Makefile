# ============================
# 🚀 Fast DevOps Commands
# ============================

# Default goal
.DEFAULT_GOAL := help

# === CONFIG ===
COMPOSE_FILE := docker-compose.yml
PROJECT_NAME := backend-chatnary-nestjs
COMPOSE_DEV := docker-compose.dev.yml

# === WINDOWS OCR SETUP ===
GM_URL := https://sourceforge.net/projects/graphicsmagick/files/graphicsmagick-binaries/1.3.43/GraphicsMagick-1.3.43-Q16-win64-dll.exe/download
GS_URL := https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/gs10031/gs10031w64.exe
GM_PATH := /c/Program Files/GraphicsMagick-1.3.43-Q16
GS_PATH := /c/Program Files/gs/gs10.03.1/bin

# 1. make setup-ocr-win
# 2. make configure-ocr-path
# 3. make verify-ocr

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

# ============================
# 🖼️ WINDOWS OCR DEPENDENCIES
# ============================

## 🔧 Install GraphicsMagick + Ghostscript on Windows
setup-ocr-win:
	@echo "📦 Downloading GraphicsMagick..."
	@curl -L "$(GM_URL)" -o GraphicsMagick-installer.exe || echo "❌ GraphicsMagick download failed"
	@echo "📦 Downloading Ghostscript..."
	@powershell.exe -Command "Invoke-WebRequest -Uri '$(GS_URL)' -OutFile 'gs-installer.exe'" || echo "❌ Ghostscript download failed"
	@echo ""
	@echo "✅ Installers downloaded!"
	@echo "⚠️  Please run these installers manually:"
	@echo "   1. GraphicsMagick-installer.exe (tick 'Add to PATH')"
	@echo "   2. gs-installer.exe"
	@echo ""
	@echo "After installation, run: make configure-ocr-path"

## ⚙️ Configure OCR tools PATH
configure-ocr-path:
	@echo "🔧 Adding GraphicsMagick and Ghostscript to PATH..."
	@echo 'export PATH="$(GM_PATH):$$PATH"' >> ~/.bashrc
	@echo 'export PATH="$(GS_PATH):$$PATH"' >> ~/.bashrc
	@echo "✅ PATH configured in ~/.bashrc"
	@echo "⚠️  Run: source ~/.bashrc  (or restart terminal)"

## ✅ Verify OCR installation
verify-ocr:
	@echo "🔍 Verifying OCR dependencies..."
	@echo -n "GraphicsMagick: "
	@gm version | head -n 1 || echo "❌ Not found"
	@echo -n "Ghostscript: "
	@gswin64c --version || echo "❌ Not found"
	@echo ""
	@echo "✅ All OCR dependencies verified!"

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
	@echo "🖼️ WINDOWS OCR SETUP:"
	@echo "  make setup-ocr-win      - Download GraphicsMagick + Ghostscript installers"
	@echo "  make configure-ocr-path - Add OCR tools to PATH"
	@echo "  make verify-ocr         - Verify OCR dependencies installation"
	@echo ""
	@echo "📊 MONITORING:"
	@echo "  make logs         - Xem log realtime"
	@echo "  make ps           - Liệt kê container đang chạy"
	@echo ""
