# ViralCommerce AI — System Architecture

## Overview

ViralCommerce AI is a distributed, AI-powered platform that automatically discovers viral products across the internet, identifies suppliers, generates marketing assets, and optimizes ad campaigns — all on autopilot.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          VIRALCOMMERCE AI PLATFORM                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│  DATA INGESTION LAYER                                                    │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ TikTok Spider│  │ Instagram    │  │ YouTube      │  │ Pinterest  │  │
│  │ (Playwright) │  │ Spider       │  │ Spider       │  │ Spider     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│         └──────────────────┴──────────────────┴────────────────┘         │
│                                    │                                     │
│                         ┌──────────▼──────────┐                         │
│                         │   Kafka Stream       │                         │
│                         │  viral.videos.raw    │                         │
│                         └──────────┬──────────┘                         │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
┌──────────────────────────────────────────────────────────────────────────┐
│  AI PROCESSING LAYER                                                     │
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐  │
│  │ Virality Scorer │    │ Product Detector │    │ Trend Radar         │  │
│  │                 │    │                 │    │                     │  │
│  │ viral_score =   │    │ YOLOv8 Objects  │    │ Hashtag velocity    │  │
│  │ views×0.4 +     │    │ CLIP Embeddings │    │ Mention clustering  │  │
│  │ shares×0.3 +    │    │ Category mapping│    │ Growth acceleration │  │
│  │ comments×0.2 +  │    │                 │    │                     │  │
│  │ likes×0.1       │    └────────┬────────┘    └──────────┬──────────┘  │
│  └────────┬────────┘             │                        │             │
│           └──────────────────────┴───────────────────────┘             │
│                                    │                                    │
│                         ┌──────────▼──────────┐                        │
│                         │  viral.products.     │                        │
│                         │  detected (Kafka)    │                        │
│                         └──────────┬──────────┘                        │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
┌──────────────────────────────────────────────────────────────────────────┐
│  BUSINESS LOGIC LAYER                                                    │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ Supplier         │  │ Profit Analyzer  │  │ AI Marketing Gen     │  │
│  │ Discovery        │  │                  │  │                      │  │
│  │                  │  │ cost=$5          │  │ Claude claude-sonnet-4-6     │  │
│  │ AliExpress ─────►│  │ sale=$25         │  │                      │  │
│  │ Alibaba    ─────►│  │ margin=400%      │  │ Headlines, Hooks     │  │
│  │ CJ         ─────►│  │ ROI=400%         │  │ TikTok Scripts       │  │
│  └──────────────────┘  └──────────────────┘  │ Landing Pages        │  │
│                                               └──────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Campaign Optimizer                                               │   │
│  │                                                                  │   │
│  │ Launch 10 ads × $5 → Monitor ROAS → Kill losers → Scale winners │   │
│  │                                                                  │   │
│  │ Meta Ads ──────────────────────────────────────────────────────► │   │
│  │ Google Ads ────────────────────────────────────────────────────► │   │
│  │ TikTok Ads ────────────────────────────────────────────────────► │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
┌──────────────────────────────────────────────────────────────────────────┐
│  DATA STORAGE LAYER                                                      │
│                                                                          │
│  ┌──────────────┐    ┌───────────────┐    ┌────────────────────────┐   │
│  │ PostgreSQL   │    │ ClickHouse    │    │ Elasticsearch          │   │
│  │              │    │               │    │                        │   │
│  │ Core data:   │    │ Analytics:    │    │ Full-text search:      │   │
│  │ videos       │    │ video_metrics │    │ products index         │   │
│  │ products     │    │ ad_perf       │    │ videos index           │   │
│  │ suppliers    │    │ trend_events  │    │ CLIP vector search     │   │
│  │ campaigns    │    │ crawler_stats │    │                        │   │
│  │ ads          │    │               │    │                        │   │
│  │ users        │    │ 50B+ events   │    │                        │   │
│  └──────────────┘    └───────────────┘    └────────────────────────┘   │
│                                                                          │
│  ┌──────────────┐    ┌───────────────┐                                  │
│  │ Redis        │    │ pgvector      │                                   │
│  │              │    │               │                                   │
│  │ Cache        │    │ CLIP          │                                   │
│  │ Task queues  │    │ embeddings    │                                   │
│  │ Dedup filter │    │ similarity    │                                   │
│  │ Rate limits  │    │ search        │                                   │
│  └──────────────┘    └───────────────┘                                  │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
┌──────────────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                                      │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Next.js Dashboard (TailwindCSS)                                 │   │
│  │                                                                  │   │
│  │  Dashboard → Products → Trend Radar → Suppliers → Campaigns     │   │
│  │                                                                  │   │
│  │  Real-time viral score feeds                                     │   │
│  │  One-click: Import → Generate Ads → Find Supplier → Launch      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Module Breakdown

### 1. Viral Video Crawler Engine
- **Technology**: Scrapy + Playwright (JS rendering) + Redis (dedup) + Kafka (streaming)
- **Platforms**: TikTok, Instagram Reels, YouTube Shorts, Pinterest, Amazon, Temu, AliExpress
- **Scale**: 50 million videos/day via 50 Kubernetes pods
- **Data collected**: URL, views, likes, shares, comments, hashtags, captions, author metrics

### 2. Virality Detection AI
```
viral_score = (views_growth × 0.40)
            + (shares_ratio  × 0.30)
            + (comments_growth × 0.20)
            + (like_ratio    × 0.10)
```
- Velocity tracking (growth per hour)
- Trend acceleration (second derivative)
- Threshold: 70/100 = viral flag
- Processed as Kafka consumer in real-time

### 3. Product Detection Engine
- **YOLOv8**: Detects 80+ object classes in video frames
- **CLIP (ViT-B/32)**: 512-dim embeddings for visual similarity search
- **pgvector**: Approximate nearest neighbor search
- Processes video thumbnails (fast path) or full frames (deep path)

### 4. Supplier Discovery Engine
- Parallel search across AliExpress, Alibaba, CJ Dropshipping
- Automatic profit analysis with configurable markup
- Profit formula: `margin = (sale_price - total_cost) / sale_price × 100`

### 5. AI Marketing Generator
- **Model**: Claude claude-sonnet-4-6 (Anthropic)
- **Assets**: Headlines, hooks, TikTok scripts, Instagram captions, landing pages
- **Tone variants**: Engaging, trendy, persuasive, informative, aspirational
- **Languages**: Multi-language via prompt prefix

### 6. Campaign Optimizer
- Launch strategy: 10 ads × $5/day each
- Kill threshold: ROAS < 0.8 after $10 spend
- Scale threshold: ROAS > 2.5 → double budget
- Supported networks: Meta Ads, Google Ads, TikTok Ads

---

## API Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/token
GET    /api/v1/auth/me

GET    /api/v1/products/
GET    /api/v1/products/trending
GET    /api/v1/products/{id}
GET    /api/v1/products/{id}/suppliers
POST   /api/v1/products/{id}/find-suppliers
POST   /api/v1/products/{id}/generate-marketing
GET    /api/v1/products/{id}/viral-history

GET    /api/v1/videos/
GET    /api/v1/videos/viral
GET    /api/v1/videos/{id}

GET    /api/v1/campaigns/
POST   /api/v1/campaigns/
GET    /api/v1/campaigns/{id}
POST   /api/v1/campaigns/{id}/launch
POST   /api/v1/campaigns/{id}/optimize
POST   /api/v1/campaigns/{id}/pause
GET    /api/v1/campaigns/{id}/performance

GET    /api/v1/trends/hashtags
GET    /api/v1/trends/hashtags/top
POST   /api/v1/trends/hashtags/track
GET    /api/v1/trends/hashtag-velocity

GET    /api/v1/analytics/overview
GET    /api/v1/analytics/platform-stats
GET    /api/v1/analytics/viral-timeline
GET    /api/v1/analytics/category-breakdown
GET    /api/v1/analytics/ad-performance-summary

POST   /api/v1/crawler/jobs/start
GET    /api/v1/crawler/jobs
GET    /api/v1/crawler/stats
POST   /api/v1/crawler/hashtag-scan

POST   /api/v1/marketing/generate
POST   /api/v1/marketing/landing-page

GET    /api/v1/suppliers/
GET    /api/v1/suppliers/{id}
GET    /api/v1/suppliers/{id}/listings
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Backend API | Python 3.12, FastAPI, Uvicorn |
| Task Queue | Celery, Redis |
| Stream Processing | Apache Kafka, Confluent |
| Web Scraping | Scrapy, Playwright, cloudscraper |
| AI Vision | YOLOv8 (Ultralytics), CLIP (HuggingFace) |
| AI Language | Claude claude-sonnet-4-6 (Anthropic) |
| Primary DB | PostgreSQL 16 + pgvector |
| Analytics DB | ClickHouse 24.x |
| Search Engine | Elasticsearch 8.x |
| Cache | Redis 7.x |
| Frontend | Next.js 14, React 18, TailwindCSS |
| Charts | Recharts |
| State | TanStack Query, Zustand |
| Containers | Docker, Kubernetes |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus, Grafana, Sentry |

---

## Scaling Strategy

### Target: 50M videos/day

| Component | Pods | Throughput |
|-----------|------|-----------|
| Crawler | 50 | ~1M videos/hour |
| Virality Scorer | 10 | ~5M scores/hour |
| Product Detector | 20 | ~500K detections/hour |
| API | 3-20 (HPA) | ~10K req/sec |
| Celery Workers | 5-30 (HPA) | Background tasks |

### Database scaling
- **PostgreSQL**: Read replicas for API queries, primary for writes
- **ClickHouse**: Horizontal sharding by platform + date
- **Elasticsearch**: 3 shards, 1 replica per index
- **Kafka**: 12 partitions per topic for parallel consumption

---

## Quick Start

```bash
# 1. Clone and configure
cp .env.example .env
# Fill in ANTHROPIC_API_KEY and other required keys

# 2. Start all services
docker compose up -d

# 3. Initialize databases
docker compose exec api python -m backend.scripts.init_db

# 4. Start first crawl
curl -X POST http://localhost:8000/api/v1/crawler/jobs/start \
  -d "platform=tiktok&job_type=trending"

# 5. Open dashboard
open http://localhost:3000
```

### Service URLs (local)
| Service | URL |
|---------|-----|
| Dashboard | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/api/docs |
| Kafka UI | http://localhost:8080 |
| Flower (Celery) | http://localhost:5555 |

---

## Roadmap (Future Features)

1. **Auto Shopify Store Generation** — one-click store creation from viral product
2. **AI Video Ad Creation** — generate TikTok video ads with AI avatars
3. **AI Influencer Outreach** — auto-identify and contact relevant creators
4. **TikTok Shop Integration** — direct product listing on TikTok Shop
5. **Chrome Extension** — spot viral products while browsing
6. **White-label SaaS** — multi-tenant for agencies
