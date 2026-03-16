"""
Kafka Producer Pipeline — streams video items to Kafka for downstream processing
"""
import json
import logging
from datetime import datetime

from confluent_kafka import Producer


log = logging.getLogger(__name__)


class KafkaProducerPipeline:
    def __init__(self, bootstrap_servers: str, topic: str):
        self.bootstrap_servers = bootstrap_servers
        self.topic = topic
        self.producer: Producer | None = None

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            bootstrap_servers=crawler.settings.get("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
            topic=crawler.settings.get("KAFKA_TOPIC_VIDEOS", "viral.videos.raw"),
        )

    def open_spider(self, spider):
        self.producer = Producer({"bootstrap.servers": self.bootstrap_servers})
        log.info("Kafka producer initialized")

    def close_spider(self, spider):
        if self.producer:
            self.producer.flush(timeout=10)
        log.info("Kafka producer flushed and closed")

    def process_item(self, item, spider):
        if not self.producer:
            return item

        payload = {
            "platform": item.get("platform"),
            "external_id": item.get("external_id"),
            "url": item.get("url"),
            "title": item.get("title", ""),
            "caption": item.get("caption", ""),
            "hashtags": item.get("hashtags", []),
            "views": item.get("views", 0),
            "likes": item.get("likes", 0),
            "shares": item.get("shares", 0),
            "comments": item.get("comments", 0),
            "viral_score": item.get("viral_score", 0),
            "author_handle": item.get("author_handle", ""),
            "thumbnail_url": item.get("thumbnail_url", ""),
            "published_at": str(item.get("published_at", "")),
            "crawled_at": datetime.utcnow().isoformat(),
        }

        self.producer.produce(
            topic=self.topic,
            key=f"{item.get('platform')}:{item.get('external_id')}".encode(),
            value=json.dumps(payload).encode(),
            callback=self._delivery_callback,
        )
        self.producer.poll(0)
        return item

    @staticmethod
    def _delivery_callback(err, msg):
        if err:
            log.error(f"Kafka delivery failed: {err}")
