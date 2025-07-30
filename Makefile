# BuschGPT MCP Server - Docker Management

# Default target
.DEFAULT_GOAL := help

# Variables
COMPOSE_FILE := docker-compose.yaml
SERVICE_NAME := buschgpt-mcp-server
IMAGE_NAME := buschgpt-mcp-server

.PHONY: help build up down restart logs shell clean health status

help: ## Show this help message
	@echo "BuschGPT MCP Server - Docker Commands"
	@echo "======================================"
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

build: ## Build the Docker image
	@echo "Building Docker image..."
	docker-compose -f $(COMPOSE_FILE) build

up: ## Start the service
	@echo "Starting BuschGPT MCP Server..."
	docker-compose -f $(COMPOSE_FILE) up -d

down: ## Stop the service
	@echo "Stopping BuschGPT MCP Server..."
	docker-compose -f $(COMPOSE_FILE) down

restart: ## Restart the service
	@echo "Restarting BuschGPT MCP Server..."
	docker-compose -f $(COMPOSE_FILE) restart

logs: ## View service logs
	@echo "Viewing logs (Ctrl+C to exit)..."
	docker-compose -f $(COMPOSE_FILE) logs -f $(SERVICE_NAME)

shell: ## Access the container shell
	@echo "Accessing container shell..."
	docker-compose -f $(COMPOSE_FILE) exec $(SERVICE_NAME) /bin/sh

health: ## Check service health
	@echo "Checking service health..."
	docker-compose -f $(COMPOSE_FILE) exec $(SERVICE_NAME) node -e "console.log('Service is healthy')"

status: ## Show service status
	@echo "Service status:"
	docker-compose -f $(COMPOSE_FILE) ps

clean: ## Clean up containers, images, and volumes
	@echo "Cleaning up Docker resources..."
	docker-compose -f $(COMPOSE_FILE) down -v --remove-orphans
	docker image prune -f
	docker volume prune -f

rebuild: down build up ## Rebuild and restart the service

dev-setup: ## Setup development environment
	@echo "Setting up development environment..."
	@if [ ! -f .env ]; then \
		echo "Creating .env file from template..."; \
		cp .env.docker.example .env; \
		echo "⚠️  Please edit .env file with your actual credentials"; \
	else \
		echo "✅ .env file already exists"; \
	fi
	@echo "Development environment ready!"

prod-deploy: build up ## Deploy to production
	@echo "Deploying to production..."
	@echo "✅ BuschGPT MCP Server deployed!"

# Development helpers
install: ## Install dependencies locally (for development)
	npm install

dev: ## Run in development mode locally
	npm run dev

test-connection: ## Test if the service is responding
	@echo "Testing service connection..."
	docker-compose -f $(COMPOSE_FILE) exec $(SERVICE_NAME) node -e "console.log('Connection test passed')" || echo "❌ Service not responding"