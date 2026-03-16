"""
Scrapy crawler settings for ViralCommerce AI
"""
BOT_NAME = "viralcommerce_crawler"
SPIDER_MODULES = ["crawler.spiders"]
NEWSPIDER_MODULE = "crawler.spiders"

# Politeness
DOWNLOAD_DELAY = 1.5
RANDOMIZE_DOWNLOAD_DELAY = True
CONCURRENT_REQUESTS = 32
CONCURRENT_REQUESTS_PER_DOMAIN = 4
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 1
AUTOTHROTTLE_MAX_DELAY = 10
AUTOTHROTTLE_TARGET_CONCURRENCY = 8.0

# Retry
RETRY_ENABLED = True
RETRY_TIMES = 3
RETRY_HTTP_CODES = [429, 500, 502, 503, 504]

# Middlewares
DOWNLOADER_MIDDLEWARES = {
    "crawler.middlewares.rotate_useragent.RotateUserAgentMiddleware": 100,
    "crawler.middlewares.proxy_rotator.ProxyRotatorMiddleware": 200,
    "crawler.middlewares.playwright_middleware.PlaywrightMiddleware": 300,
    "scrapy.downloadermiddlewares.retry.RetryMiddleware": 550,
    "scrapy.downloadermiddlewares.httpcompression.HttpCompressionMiddleware": 590,
}

ITEM_PIPELINES = {
    "crawler.pipelines.dedup.DedupPipeline": 100,
    "crawler.pipelines.viral_score.ViralScorePipeline": 200,
    "crawler.pipelines.kafka_producer.KafkaProducerPipeline": 300,
    "crawler.pipelines.postgres.PostgresPipeline": 400,
}

# Playwright for JS-heavy pages
PLAYWRIGHT_BROWSER_TYPE = "chromium"
PLAYWRIGHT_LAUNCH_OPTIONS = {
    "headless": True,
    "args": ["--no-sandbox", "--disable-dev-shm-usage"],
}

# Kafka
KAFKA_BOOTSTRAP_SERVERS = "localhost:9092"
KAFKA_TOPIC_VIDEOS = "viral.videos.raw"

# Redis for dedup
REDIS_URL = "redis://localhost:6379/3"
DUPEFILTER_CLASS = "scrapy_redis.dupefilter.RFPDupeFilter"
SCHEDULER = "scrapy_redis.scheduler.Scheduler"
SCHEDULER_PERSIST = True

# Feed exports (optional)
FEED_EXPORT_ENCODING = "utf-8"
LOG_LEVEL = "INFO"
