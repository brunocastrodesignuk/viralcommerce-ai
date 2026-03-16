# ViralCommerce AI — Developer Makefile
.PHONY: help install dev up down migrate crawl worker beat frontend test lint

PYTHON := python3
DOCKER  := docker compose

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Installation ──────────────────────────────────────────────────────────────

install: ## Install Python deps (backend) + Node deps (frontend)
	pip install -r backend/requirements.txt
	cd frontend && npm install

# ── Docker ────────────────────────────────────────────────────────────────────

up: ## Start all services (Docker Compose)
	$(DOCKER) up -d

down: ## Stop all services
	$(DOCKER) down

logs: ## Tail all service logs
	$(DOCKER) logs -f

up-infra: ## Start only infrastructure (postgres, redis, kafka, etc.)
	$(DOCKER) up -d postgres redis zookeeper kafka clickhouse elasticsearch

# ── Database ──────────────────────────────────────────────────────────────────

migrate: ## Run Alembic migrations
	alembic upgrade head

migrate-create: ## Create new migration (usage: make migrate-create MSG="add index")
	alembic revision --autogenerate -m "$(MSG)"

migrate-down: ## Rollback last migration
	alembic downgrade -1

# ── Backend ───────────────────────────────────────────────────────────────────

dev: ## Run FastAPI dev server
	uvicorn backend.main:create_app --factory --reload --host 0.0.0.0 --port 8000

worker: ## Run Celery worker
	celery -A backend.workers.celery_app worker --loglevel=info --concurrency=4

beat: ## Run Celery Beat scheduler
	celery -A backend.workers.celery_app beat --loglevel=info

flower: ## Run Flower task monitor (http://localhost:5555)
	celery -A backend.workers.celery_app flower --port=5555

# ── Crawlers ──────────────────────────────────────────────────────────────────

crawl-tiktok: ## Crawl TikTok trending
	cd crawler && scrapy crawl tiktok

crawl-instagram: ## Crawl Instagram trending
	cd crawler && scrapy crawl instagram

crawl-youtube: ## Crawl YouTube Shorts
	cd crawler && scrapy crawl youtube

crawl-amazon: ## Crawl Amazon best sellers
	cd crawler && scrapy crawl amazon

crawl-pinterest: ## Crawl Pinterest trending
	cd crawler && scrapy crawl pinterest

# ── Frontend ──────────────────────────────────────────────────────────────────

frontend: ## Run Next.js dev server
	node start-frontend.js dev

frontend-build: ## Build Next.js for production
	cd frontend && npm run build

# ── AI Services ───────────────────────────────────────────────────────────────

virality-scorer: ## Run Kafka consumer for viral scoring
	$(PYTHON) -m ai.virality.kafka_consumer

# ── Testing ───────────────────────────────────────────────────────────────────

test: ## Run backend tests
	pytest backend/tests/ -v --tb=short

test-coverage: ## Run tests with coverage report
	pytest backend/tests/ --cov=backend --cov-report=term-missing

# ── Linting ───────────────────────────────────────────────────────────────────

lint: ## Lint Python code
	ruff check backend/ ai/ crawler/
	mypy backend/ --ignore-missing-imports

format: ## Auto-format Python code
	ruff format backend/ ai/ crawler/

# ── Production ────────────────────────────────────────────────────────────────

build: ## Build all Docker images
	$(DOCKER) build

push: ## Push images to registry
	$(DOCKER) push

k8s-deploy: ## Deploy to Kubernetes
	kubectl apply -f infrastructure/k8s/

k8s-status: ## Check Kubernetes deployment status
	kubectl get pods,services,hpa -n viralcommerce
