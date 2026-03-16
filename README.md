# 🔥 ViralCommerce AI

> AI-powered viral product discovery, supplier matching, marketing generation, and campaign optimization — fully automated.

---

## What It Does

ViralCommerce AI automatically:

1. **Scans** TikTok, Instagram, YouTube, Pinterest, Amazon for viral content
2. **Detects** products in viral videos using computer vision (YOLO + CLIP)
3. **Scores** virality in real-time using a multi-factor AI model
4. **Finds** suppliers on AliExpress, Alibaba, CJ Dropshipping with profit analysis
5. **Generates** ad copy, TikTok scripts, hooks, and landing pages with Claude AI
6. **Launches** and **auto-optimizes** campaigns on Meta, Google, and TikTok Ads
7. **Monitors** everything on a real-time dashboard

---

## Viral Score Formula

```
viral_score = (views_growth  × 0.40)
            + (shares_ratio  × 0.30)
            + (comments_rate × 0.20)
            + (likes_ratio   × 0.10)

Viral threshold: ≥ 70 / 100
```

---

## Profit Analysis Example

```
Supplier cost:  $5.00
Shipping cost:  $2.00
Total cost:     $7.00
Sale price:     $25.00
─────────────────────
Profit:         $18.00
Margin:         72%
ROI:            257%
```

---

## Campaign Strategy

```
Launch 10 ad variations × $5/day each
         ↓
Monitor ROAS every 6 hours
         ↓
ROAS < 0.8 → Kill ad (after $10 spend)
ROAS > 2.5 → Double budget
         ↓
Scale winners to $50, $100, $500/day
```

---

## Quick Start

```bash
# Prerequisites: Docker Desktop

# 1. Configure
cp .env.example .env
nano .env  # Add your ANTHROPIC_API_KEY

# 2. Launch everything
docker compose up -d

# 3. Open Dashboard
open http://localhost:3000

# 4. Read API docs
open http://localhost:8000/api/docs
```

---

## Project Structure

```
viralcommerce-ai/
├── backend/                    # FastAPI Python backend
│   ├── api/routes/             # REST API endpoints
│   ├── core/                   # Config, database connections
│   ├── services/
│   │   ├── crawler/            # Crawl orchestration
│   │   ├── supplier/           # Supplier discovery + profit
│   │   ├── marketing/          # AI content generation (Claude)
│   │   └── campaigns/          # Ad campaign optimizer
│   └── workers/                # Celery background workers
│
├── crawler/                    # Scrapy crawler framework
│   ├── spiders/                # TikTok, Instagram, YouTube spiders
│   ├── middlewares/            # Proxy rotation, user agent
│   └── pipelines/              # Viral scoring, Kafka, PostgreSQL
│
├── ai/
│   ├── virality/               # Viral score engine + Kafka consumer
│   ├── product_detection/      # YOLO + CLIP product detector
│   └── trend_radar/            # Hashtag trend monitoring
│
├── frontend/                   # Next.js 14 dashboard
│   └── src/
│       ├── app/                # Pages (dashboard, products, campaigns)
│       ├── components/         # UI components, charts, cards
│       └── lib/                # API client, types
│
├── database/
│   └── schemas/
│       ├── 001_init_postgresql.sql      # Core schema
│       ├── 002_clickhouse_analytics.sql # Analytics tables
│       └── 003_elasticsearch_mappings.json
│
├── infrastructure/
│   ├── docker/                 # Dockerfiles
│   ├── k8s/                    # Kubernetes manifests
│   └── monitoring/             # Prometheus, Grafana configs
│
├── docs/
│   └── ARCHITECTURE.md         # Full system architecture
├── docker-compose.yml          # Local dev stack
└── .env.example                # Environment template
```

---

## Tech Stack

| | Technology |
|---|---|
| **Backend** | Python 3.12, FastAPI, Celery |
| **AI Vision** | YOLOv8, CLIP (ViT-B/32) |
| **AI Language** | Claude claude-sonnet-4-6 (Anthropic) |
| **Crawler** | Scrapy, Playwright, Kafka |
| **Databases** | PostgreSQL + pgvector, ClickHouse, Elasticsearch |
| **Cache/Queue** | Redis |
| **Frontend** | Next.js 14, TailwindCSS, Recharts |
| **Infrastructure** | Docker, Kubernetes, HPA |
| **Monitoring** | Prometheus, Grafana, Sentry |

---

Built for **affiliate marketers**, **dropshippers**, **e-commerce sellers**, and **content creators**.

Scale from 0 to millions of users. Built like a Silicon Valley startup.
