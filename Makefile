.PHONY: up down dev logs test reset-db migrate seed build clean

# Start all services in production mode with single command
up:
	docker compose up --build -d

# Stop all containers
down:
	docker compose down

# Start in development mode with hot reload
dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Follow container logs
logs:
	docker compose logs -f app

# Run automated concurrency stress test against Docker environment
test:
	docker compose --profile test run --rm test

# Launch PgAdmin database management web UI at localhost:5050
tools:
	docker compose --profile tools up -d pgadmin

# Completely reset database (drops volume, re-applies migrations and seeds demo data)
reset-db:
	docker compose down -v
	docker compose up --build -d db migrate app

# Run migrations locally
migrate:
	npm run db:migrate

# Seed demo dataset locally
seed:
	npm run db:seed

# Local production build test
build:
	npm run build
